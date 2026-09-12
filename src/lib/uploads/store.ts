import UploadManager from './manager';
import computeSimilarity from '../utils/computeSimilarity';
import type { Chunk } from '../types';
import type BaseEmbedding from '../models/base/embedding';

class UploadStore {
  constructor(private params: { embeddingModel: BaseEmbedding<any>; fileIds: string[] }) {}

  async query(queries: string[], topK: number): Promise<Chunk[]> {
    const vectors = await this.params.embeddingModel.embedText(queries);
    const spaceId = this.params.embeddingModel.spaceId;
    const records: { chunk: Chunk; embedding: number[] }[] = [];
    for (const fileId of this.params.fileIds) {
      const file = await UploadManager.getFile(fileId);
      if (!spaceId || file.embeddingSpaceId !== spaceId) throw new Error(`${file.fileName} was indexed with a different embedding model. Clear the old attachments and upload them again to rebuild the index.`);
      for (const item of await UploadManager.getFileChunks(fileId)) {
        records.push({ embedding: item.embedding, chunk: {
          content: item.content, metadata: { fileId, fileName: file.fileName, title: file.fileName, url: `file_id://${fileId}` },
        } });
      }
    }
    const scores = new Map<number, number>();
    for (const vector of vectors) {
      const ranked = records.map((record, index) => {
        if (record.embedding.length !== vector.length) throw new Error('Document vector dimensions do not match the current Nimi model. Rebuild the index.');
        return { index, score: computeSimilarity(vector, record.embedding) };
      }).sort((a, b) => b.score - a.score);
      ranked.forEach((item, rank) => scores.set(item.index, (scores.get(item.index) ?? 0) + item.score / (61 + rank)));
    }
    return [...scores.entries()].sort(([, a], [, b]) => b - a).slice(0, topK).map(([index]) => records[index].chunk);
  }

  static async getFileData(fileIds: string[]): Promise<{ fileName: string; initialContent: string }[]> {
    return Promise.all(fileIds.map(async (id) => {
      const file = await UploadManager.getFile(id);
      const chunks = await UploadManager.getFileChunks(id);
      return { fileName: file.fileName, initialContent: chunks.slice(0, 3).map((chunk) => chunk.content).join('\n---\n') };
    }));
  }
}
export default UploadStore;
