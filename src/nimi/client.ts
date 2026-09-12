import type {
  NimiAIConfigSnapshot,
  NimiAIConfigOverwriteInput,
  NimiAIConfigOverwriteResult,
  NimiAIConfigOptionsQuery,
  NimiAIConfigOptionsResult,
} from '@nimiplatform/sdk/ai';
import { createNimiClient } from '@nimiplatform/sdk';
import {
  createNimiLocalAppStandardShellSurface,
  invoke,
  listenShell,
} from '@nimiplatform/kit/shell/renderer/bridge';
import type {
  ChatRecord,
  ResearchMessage,
  ResearchStart,
  ResearchUpdate,
  VaneFile,
  VaneSettings,
} from './contracts';

export const nimi = createNimiClient({
  localApp: { standardShell: createNimiLocalAppStandardShellSurface() },
});
// Never rebind this promise in the same document. Host invalidation reloads
// the document, so a late file-read or callback retains its old view context.
const context = invoke('vane.initialize', {}).then((value) => {
  const id = (value as { contextId?: unknown }).contextId;
  if (typeof id !== 'string' || !id)
    throw new Error('Vane Host did not supply a view context.');
  return id;
});
async function call<T>(command: string, input: unknown): Promise<T> {
  return invoke(`vane.${command}`, {
    contextId: await context,
    input,
  }) as Promise<T>;
}
async function observe(
  runId: string,
  watchId: string,
  listener: (update: ResearchUpdate) => void,
) {
  const unlisten = await listenShell(
    `vane.research.${runId}.${watchId}`,
    ({ payload }) => listener(payload as ResearchUpdate),
  );
  return () => {
    unlisten();
    void call('research.unsubscribe', { runId, watchId }).catch(
      () => undefined,
    );
  };
}
export const vane = {
  ready: () => context,
  aiConfig: {
    get: () => call<NimiAIConfigSnapshot>('settings.aiConfig.get', {}),
    overwrite: (input: NimiAIConfigOverwriteInput) =>
      call<NimiAIConfigOverwriteResult>('settings.aiConfig.overwrite', input),
    listOptions: (input: NimiAIConfigOptionsQuery) =>
      call<NimiAIConfigOptionsResult>('settings.aiConfig.options', input),
  },
  settings: {
    get: () => call<VaneSettings>('settings.get', {}),
    save: (value: VaneSettings) => call<VaneSettings>('settings.save', value),
    testSearch: (url: string) =>
      call<{ resultCount: number }>('settings.testSearch', { url }),
  },
  chats: {
    list: () => call<ChatRecord[]>('chats.list', {}),
    get: (chatId: string) =>
      call<{ chat: ChatRecord; messages: ResearchMessage[] } | null>(
        'chats.get',
        { chatId },
      ),
    delete: (chatId: string) =>
      call<{ deleted: true }>('chats.delete', { chatId }),
  },
  async upload(files: readonly File[]) {
    await context;
    const inputs = await Promise.all(
      files.map(async (file) => ({
        fileName: file.name,
        mimeType: file.type,
        bytes: new Uint8Array(await file.arrayBuffer()),
      })),
    );
    return call<VaneFile[]>('files.upload', { files: inputs });
  },
  suggestions: (chatHistory: [string, string][]) =>
    call<string[]>('suggestions', { chatHistory }),
  images: (query: string, chatHistory: [string, string][]) =>
    call<any[]>('images', { query, chatHistory }),
  videos: (query: string, chatHistory: [string, string][]) =>
    call<any[]>('videos', { query, chatHistory }),
  discover: (topic = 'tech', preview = false) =>
    call<any[]>('discover', { topic, preview }),
  weather: (input: {
    lat: number;
    lng: number;
    measureUnit: 'Metric' | 'Imperial';
  }) => call<any>('weather', input),
  research: {
    async start(
      input: ResearchStart,
      listener: (update: ResearchUpdate) => void,
    ) {
      const watchId = crypto.randomUUID();
      const stop = await observe(input.runId, watchId, listener);
      try {
        await call('research.start', { ...input, watchId });
        return stop;
      } catch (error) {
        stop();
        throw error;
      }
    },
    async subscribe(runId: string, listener: (update: ResearchUpdate) => void) {
      const watchId = crypto.randomUUID();
      const stop = await observe(runId, watchId, listener);
      try {
        await call('research.subscribe', { runId, watchId });
        return stop;
      } catch (error) {
        stop();
        throw error;
      }
    },
    cancel: (runId: string) =>
      call<{ accepted: boolean; state: string }>('research.cancel', { runId }),
  },
};
