import type { NimiAppScope } from '@nimiplatform/kit/auth/app';
import type { VaneClient } from './client-context';
import type { ResearchUpdate, VaneFile, VaneSettings } from './contracts';
import { VANE_INTEGRATION } from './remote-contract';

function active<T>(value: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    if (signal.aborted) {
      void value.catch(() => undefined);
      reject(signal.reason);
      return;
    }
    signal.addEventListener('abort', abort, { once: true });
    void value.then(
      (result) => {
        signal.removeEventListener('abort', abort);
        resolve(result);
      },
      (error) => {
        signal.removeEventListener('abort', abort);
        reject(error);
      },
    );
  });
}
const pause = (ms: number, signal: AbortSignal) =>
  active(new Promise<void>((resolve) => setTimeout(resolve, ms)), signal);
const encode = (bytes: Uint8Array) => {
  let value = '';
  for (let i = 0; i < bytes.length; i += 8192)
    value += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(value);
};

/** Captures one admitted scope and one PC workspace; no callback can rebind itself. */
// @nimi-authority: rule.nimi.runtime.integration.uncertain-effect
export async function createRemoteVane(
  scope: NimiAppScope,
): Promise<VaneClient> {
  const api = scope.client.integration;
  const rows = (await active(api.listCatalog(), scope.signal)).filter(
    (row) =>
      row.integrationId === VANE_INTEGRATION &&
      row.available &&
      row.permittedOperations.includes('chats.list'),
  );
  if (rows.length !== 1)
    throw new Error(
      rows.length
        ? 'More than one Vane workspace is permitted. Keep the intended PC workspace permission in Home.'
        : 'Open Vane on your PC, then allow this App to use “Vane PC research workspace” in Home → Integrations.',
    );
  const targetRef = rows[0]!.targetRef;
  async function raw(
    operation: string,
    input: unknown,
    signal: AbortSignal,
  ): Promise<any> {
    signal.throwIfAborted();
    let result = await active(
      api.invoke({ targetRef, operation, inputJson: JSON.stringify(input) }),
      signal,
    );
    while (result.status === 'accepted') {
      await pause(250, signal);
      result = await active(api.getCall({ callId: result.callId }), signal);
    }
    if (result.status !== 'completed')
      throw new Error(
        `PC operation ${operation} was not confirmed (${result.errorCode || result.status}). Check Home permissions and reopen the original chat; no work was resubmitted.`,
      );
    const envelope = JSON.parse(result.resultJson);
    if (envelope.ok !== true)
      throw new Error(
        envelope.error || 'PC Vane could not complete this operation.',
      );
    return envelope;
  }
  async function call<T>(operation: string, input: unknown): Promise<T> {
    const signal = AbortSignal.any([
      scope.signal,
      AbortSignal.timeout(120_000),
    ]);
    const envelope = await raw(operation, input, signal);
    if (!envelope.transfer) return envelope.value as T;
    const { id, size } = envelope.transfer;
    if (
      typeof id !== 'string' ||
      !Number.isSafeInteger(size) ||
      size < 1 ||
      size > 32 * 1024 * 1024
    )
      throw new Error('Invalid PC response size.');
    const bytes = new Uint8Array(size);
    let offset = 0;
    while (offset < size) {
      const part = (await raw('result.read', { id, offset }, signal)).value;
      const chunk = Uint8Array.from(atob(part.data), (c) => c.charCodeAt(0));
      if (
        part.offset !== offset ||
        part.size !== size ||
        !chunk.length ||
        chunk.length > 65536 ||
        part.nextOffset !== offset + chunk.length ||
        part.nextOffset > size
      )
        throw new Error('Incomplete PC research response.');
      bytes.set(chunk, offset);
      offset = part.nextOffset;
    }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  }
  async function observe(
    runId: string,
    listener: (update: ResearchUpdate) => void,
  ) {
    let stopped = false;
    let researchCompleteSeen = false;
    const read = async () => {
      const snapshot = await call<{ updates: ResearchUpdate[] | null }>(
        'research.read',
        { runId },
      );
      if (stopped) return true;
      if (!snapshot.updates)
        throw new Error(
          'This live research is no longer available. Reopen the saved chat; it will not be restarted.',
        );
      for (const item of snapshot.updates) {
        if (item.type === 'researchComplete') {
          if (researchCompleteSeen) continue;
          researchCompleteSeen = true;
        }
        listener(item);
      }
      return snapshot.updates.some(
        (item) => item.type === 'messageEnd' || item.type === 'error',
      );
    };
    const done = await read();
    if (!done)
      void (async () => {
        try {
          while (!stopped) {
            await pause(1500, scope.signal);
            if (await read()) return;
          }
        } catch (error) {
          if (!stopped && !scope.signal.aborted)
            listener({
              type: 'error',
              status: 'interrupted',
              data: `Progress is unavailable; the PC may still be working. Reopen this chat to read its original result. ${error instanceof Error ? error.message : String(error)}`,
            });
        }
      })();
    return () => {
      stopped = true;
    };
  }
  const pcModels = async (): Promise<never> => {
    throw new Error(
      'Configure the research models in PC Vane → Settings → AI models.',
    );
  };
  return {
    kind: 'web',
    scopeKey: scope.viewKey,
    workspaceKey: targetRef,
    ready: async () => targetRef,
    aiConfig: { get: pcModels, overwrite: pcModels, listOptions: pcModels },
    settings: {
      get: () => call('settings.get', {}),
      save: (settings) => {
        const { searxngURL, ...preferences } = settings;
        return call<VaneSettings>('settings.save', preferences);
      },
      testSearch: async () => {
        throw new Error(
          'Test the configured service in PC Vane → Settings → Search.',
        );
      },
    },
    chats: {
      list: () => call('chats.list', {}),
      get: (chatId) => call('chats.get', { chatId }),
      delete: (chatId) => call('chats.delete', { chatId }),
    },
    async upload(files) {
      if (!files.length || files.length > 20)
        throw new Error('Choose between 1 and 20 documents.');
      if (files.some((file) => !file.size || file.size > 20 * 1024 * 1024))
        throw new Error('Each document must be between 1 byte and 20 MiB.');
      const result: VaneFile[] = [];
      for (const file of files) {
        const { id } = await call<{ id: string }>('documents.upload', {
          action: 'begin',
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        });
        const bytes = new Uint8Array(await file.arrayBuffer());
        scope.signal.throwIfAborted();
        for (let offset = 0; offset < bytes.length; offset += 65536)
          await call('documents.upload', {
            action: 'append',
            id,
            offset,
            data: encode(bytes.subarray(offset, offset + 65536)),
          });
        await call('documents.upload', { action: 'index', id });
        while (true) {
          const state = await call<{
            state: string;
            result?: VaneFile[];
            error?: string;
          }>('documents.upload', { action: 'read', id });
          if (state.state === 'completed') {
            if (!state.result) throw new Error('Document result missing.');
            result.push(...state.result);
            break;
          }
          if (state.state === 'failed')
            throw new Error(state.error || 'Document indexing failed.');
          await pause(1000, scope.signal);
        }
      }
      return result;
    },
    suggestions: (chatHistory) => call('suggestions', { chatHistory }),
    images: (query, chatHistory) => call('images', { query, chatHistory }),
    videos: (query, chatHistory) => call('videos', { query, chatHistory }),
    discover: (topic = 'tech', preview = false) =>
      call('discover', { topic, preview }),
    weather: (input) => call('weather', input),
    research: {
      start: async (input, listener) => {
        await call('research.start', input);
        return observe(input.runId, listener);
      },
      subscribe: observe,
      cancel: (runId) => call('research.cancel', { runId }),
    },
  };
}
