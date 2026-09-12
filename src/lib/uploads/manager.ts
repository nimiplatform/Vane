import { randomUUID } from 'node:crypto';
import { PDFParse } from 'pdf-parse';
import { CanvasFactory } from 'pdf-parse/worker';
import officeParser from 'officeparser';
import { splitText } from '../utils/splitText';
import { NimiEmbedding } from '../../nimi/llm';
import { identifier, readAssetJson, writeAssetJson } from '../../nimi/storage';
import { whileVaneActive } from '../../nimi/context';
import type { VaneFile } from '../../nimi/contracts';

const supported = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'] as const;
export type UploadedDocument = VaneFile & { mimeType: string; uploadedAt: string; sourcePath: string; chunkPaths: string[]; embeddingSpaceId: string };
type StoredChunk = { content: string; embedding: number[] };
export type FileInput = { fileName: string; mimeType: string; bytes: Uint8Array };

class UploadManager {
  constructor(private params: { embeddingModel: NimiEmbedding }) {}

  static async getFile(fileId: string): Promise<UploadedDocument> {
    return readAssetJson(`uploads/${identifier(fileId)}/manifest.json`);
  }

  static async getFileChunks(fileId: string): Promise<StoredChunk[]> {
    const file = await this.getFile(fileId);
    const parts = await Promise.all(file.chunkPaths.map((path) => readAssetJson<StoredChunk[]>(path)));
    return parts.flat();
  }

  private async extract(bytes: Uint8Array, mimeType: string): Promise<string> {
    if (mimeType === 'text/plain') return new TextDecoder().decode(bytes);
    if (mimeType === 'application/pdf') {
      const parser = new PDFParse({ data: bytes, CanvasFactory });
      try { return (await parser.getText()).text; }
      finally { await parser.destroy(); }
    }
    return (await officeParser.parseOffice(Buffer.from(bytes))).toText();
  }

  async processFiles(files: FileInput[]): Promise<VaneFile[]> {
    if (!Array.isArray(files) || files.length < 1 || files.length > 20) throw new Error('Choose between 1 and 20 documents.');
    const results: VaneFile[] = [];
    for (const input of files) {
      if (!(supported as readonly string[]).includes(input.mimeType)) throw new Error('Choose a PDF, DOCX or plain text document.');
      if (!(input.bytes instanceof Uint8Array) || !input.bytes.length || input.bytes.length > 20 * 1024 * 1024) throw new Error('Each document must be between 1 byte and 20 MiB.');
      const fileId = randomUUID();
      const fileExtension = input.mimeType === 'application/pdf' ? 'pdf' : input.mimeType === 'text/plain' ? 'txt' : 'docx';
      const sourcePath = `uploads/${fileId}/source.${fileExtension}`;
      const texts = splitText(await this.extract(input.bytes, input.mimeType), 512, 128).filter((text) => text.trim());
      if (!texts.length) throw new Error(`${input.fileName} contains no readable text.`);
      await whileVaneActive(({ services }) => services.storage.assets.write({ relativePath: sourcePath, body: input.bytes, mediaType: input.mimeType }));
      const chunkPaths: string[] = [];
      for (let start = 0; start < texts.length; start += 128) {
        const part = texts.slice(start, start + 128);
        const vectors = await this.params.embeddingModel.embedText(part);
        const chunkPath = `uploads/${fileId}/chunks-${start / 128}.json`;
        await writeAssetJson(chunkPath, part.map((content, index) => ({ content, embedding: vectors[index] })));
        chunkPaths.push(chunkPath);
      }
      const embeddingSpaceId = this.params.embeddingModel.spaceId;
      if (!embeddingSpaceId) throw new Error('The document has no embedding vector space.');
      const file: UploadedDocument = {
        fileId, fileName: input.fileName, fileExtension, mimeType: input.mimeType,
        uploadedAt: new Date().toISOString(), sourcePath, chunkPaths, embeddingSpaceId,
      };
      // The manifest is the only publication point. Interrupted parsing or
      // embedding never creates a visible, partially indexed document.
      await writeAssetJson(`uploads/${fileId}/manifest.json`, file);
      results.push({ fileId, fileName: input.fileName, fileExtension });
    }
    return results;
  }
}
export default UploadManager;
