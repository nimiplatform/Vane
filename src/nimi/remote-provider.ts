import { randomUUID } from 'node:crypto';
import type { NimiElectronAppBusinessServices } from '@nimiplatform/kit/shell/electron/main';
import type { createVaneHost } from './host';
import { remoteDescriptors, VANE_INTEGRATION } from './remote-contract';
import type { VaneSettings } from './contracts';

type Upload = {
  owner: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
  received: number;
  touched: number;
  state: 'uploading' | 'indexing' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
};
type Response = { owner: string; bytes: Buffer; touched: number };
const supported = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);
const business = new Set<string>(remoteDescriptors.map((item) => item.name));

/** A shared, explicitly permitted Vane workspace. No arbitrary Runtime or file operations. */
// @nimi-authority: rule.nimi.runtime.integration.provider-lifetime
export class VaneRemoteProvider {
  private closed = false;
  private uploads = new Map<string, Upload>();
  private responses = new Map<string, Response>();
  private active = new Set<Promise<void>>();
  constructor(
    private services: NimiElectronAppBusinessServices,
    private host: ReturnType<typeof createVaneHost>,
  ) {
    void this.run();
  }
  close() {
    this.closed = true;
    this.uploads.clear();
    this.responses.clear();
  }
  private async run() {
    try {
      await this.services.integration.registerProvider({
        integrationId: VANE_INTEGRATION,
        displayName: 'Vane PC research workspace',
        skill:
          'Research, read and manage the existing PC Vane library. PC Vane owns research execution, its configured models and saved results. Browser disconnect never restarts work. Unfinished document and response transfers are private to the Runtime-verified consumer.',
        operations: remoteDescriptors,
      });
      while (!this.closed) {
        const batch = await this.services.integration.pollProvider({
          waitMs: 25000,
        });
        for (const call of batch.calls) {
          if (this.closed) return;
          // Independent reads/cancel stay available while a model-backed helper runs.
          if (this.active.size >= 8) await Promise.race(this.active);
          const work = (async () => {
            let resultJson = '{}',
              errorCode = '';
            try {
              resultJson = JSON.stringify(
                await this.respond(
                  call.consumerRef,
                  await this.dispatch(
                    call.consumerRef,
                    call.operation,
                    JSON.parse(call.inputJson),
                  ),
                ),
              );
            } catch (error) {
              resultJson = JSON.stringify({
                ok: false,
                error: error instanceof Error ? error.message : String(error),
              });
            }
            if (this.closed) return;
            try {
              await this.services.integration.completeProvider({
                callId: call.callId,
                resultJson,
                errorCode,
              });
            } catch (error) {
              if (!this.closed)
                console.warn(
                  'Vane result delivery unconfirmed:',
                  error instanceof Error ? error.message : String(error),
                );
            }
          })();
          this.active.add(work);
          void work.finally(() => this.active.delete(work));
        }
      }
    } catch (error) {
      if (!this.closed)
        console.warn(
          'Vane remote workspace unavailable:',
          error instanceof Error ? error.message : String(error),
        );
    }
  }
  private clean() {
    const limit = Date.now() - 30 * 60_000;
    for (const [id, row] of this.uploads)
      if (row.touched < limit && row.state !== 'indexing')
        this.uploads.delete(id);
    for (const [id, row] of this.responses)
      if (row.touched < limit) this.responses.delete(id);
  }
  private async respond(owner: string, value: unknown): Promise<unknown> {
    if (this.closed) throw new Error('The PC workspace closed.');
    const bytes = Buffer.from(JSON.stringify(value ?? null));
    if (bytes.length <= 128 * 1024) return { ok: true, value };
    this.clean();
    if (
      bytes.length > 32 * 1024 * 1024 ||
      [...this.responses.values()].reduce(
        (sum, row) => sum + row.bytes.length,
        0,
      ) +
        bytes.length >
        128 * 1024 * 1024
    )
      throw new Error(
        'This research response exceeds the current transfer limit. Open it in PC Vane.',
      );
    const id = randomUUID();
    this.responses.set(id, { owner, bytes, touched: Date.now() });
    return { ok: true, transfer: { id, size: bytes.length } };
  }
  private async dispatch(
    owner: string,
    operation: string,
    input: Record<string, any>,
  ): Promise<unknown> {
    if (this.closed || !owner || !business.has(operation))
      throw new Error('This Vane operation is unavailable.');
    if (operation === 'result.read') {
      const row = this.responses.get(input.id);
      if (
        !row ||
        row.owner !== owner ||
        !Number.isSafeInteger(input.offset) ||
        input.offset < 0 ||
        input.offset >= row.bytes.length
      )
        throw new Error('This response is unavailable. Reopen the saved chat.');
      row.touched = Date.now();
      const end = Math.min(input.offset + 65536, row.bytes.length);
      // The call result retains this delivered final chunk. A later read of
      // the saved chat can create a fresh response without repeating research.
      if (end === row.bytes.length) this.responses.delete(input.id);
      return {
        data: row.bytes.subarray(input.offset, end).toString('base64'),
        offset: input.offset,
        nextOffset: end,
        size: row.bytes.length,
      };
    }
    if (operation === 'research.read')
      return { updates: this.host.readResearch(input.runId) };
    if (operation === 'research.start')
      return this.host.execute(operation, { ...input, watchId: randomUUID() });
    if (operation === 'settings.get') {
      const settings = (await this.host.execute(operation, {})) as VaneSettings;
      return {
        ...settings,
        searxngURL: settings.searxngURL ? 'configured' : '',
      };
    }
    if (operation === 'settings.save') {
      const settings = (await this.host.execute(
        'settings.get',
        {},
      )) as VaneSettings;
      const saved = (await this.host.execute(operation, {
        ...input,
        searxngURL: settings.searxngURL,
      })) as VaneSettings;
      return { ...saved, searxngURL: saved.searxngURL ? 'configured' : '' };
    }
    if (operation === 'documents.upload') return this.upload(owner, input);
    return this.host.execute(operation, input);
  }
  private async upload(
    owner: string,
    input: Record<string, any>,
  ): Promise<unknown> {
    if (input.action === 'begin') {
      this.clean();
      if (
        !supported.has(input.mimeType) ||
        typeof input.fileName !== 'string' ||
        !input.fileName ||
        input.fileName.length > 255 ||
        !Number.isSafeInteger(input.size) ||
        input.size < 1 ||
        input.size > 20 * 1024 * 1024 ||
        this.uploads.size >= 40 ||
        [...this.uploads.values()].reduce(
          (sum, row) => sum + row.bytes.length,
          0,
        ) +
          input.size >
          100 * 1024 * 1024
      )
        throw new Error(
          'Choose a PDF, DOCX or text document up to 20 MiB; wait for other uploads to finish.',
        );
      const id = randomUUID();
      this.uploads.set(id, {
        owner,
        fileName: input.fileName,
        mimeType: input.mimeType,
        bytes: Buffer.alloc(input.size),
        received: 0,
        touched: Date.now(),
        state: 'uploading',
      });
      return { id };
    }
    const row = this.uploads.get(input.id);
    if (!row || row.owner !== owner)
      throw new Error('This document upload is unavailable.');
    row.touched = Date.now();
    if (input.action === 'read')
      return { state: row.state, result: row.result, error: row.error };
    if (row.state !== 'uploading')
      throw new Error(
        'This document is already being indexed. Read its existing result.',
      );
    if (input.action === 'append') {
      if (
        input.offset !== row.received ||
        typeof input.data !== 'string' ||
        input.data.length > 87384 ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
          input.data,
        )
      )
        throw new Error('Invalid document chunk.');
      const chunk = Buffer.from(input.data, 'base64');
      if (
        !chunk.length ||
        chunk.length > 65536 ||
        row.received + chunk.length > row.bytes.length
      )
        throw new Error('Document chunk exceeds the declared size.');
      chunk.copy(row.bytes, row.received);
      row.received += chunk.length;
      return { received: row.received };
    }
    if (input.action !== 'index' || row.received !== row.bytes.length)
      throw new Error('Finish uploading this document before indexing.');
    row.state = 'indexing';
    void Promise.resolve(
      this.host.execute('files.upload', {
        files: [
          { fileName: row.fileName, mimeType: row.mimeType, bytes: row.bytes },
        ],
      }),
    )
      .then(
        (result) => {
          row.result = result;
          row.state = 'completed';
        },
        (error) => {
          row.error = error instanceof Error ? error.message : String(error);
          row.state = 'failed';
        },
      )
      .finally(() => {
        row.bytes = Buffer.alloc(0);
        row.touched = Date.now();
      });
    return { state: row.state };
  }
}
