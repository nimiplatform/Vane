import { randomUUID } from 'node:crypto';
import type {
  NimiElectronAppBusinessServices,
  NimiElectronCommandHandler,
  NimiElectronCommandHandlerInput,
} from '@nimiplatform/kit/shell/electron/main';
import z from 'zod';
import SearchAgent from '../lib/agents/search';
import SessionManager from '../lib/session';
import UploadManager, { type FileInput } from '../lib/uploads/manager';
import generateSuggestions from '../lib/agents/suggestions';
import searchImages from '../lib/agents/media/image';
import searchVideos from '../lib/agents/media/video';
import { inVaneContext, type VaneContext } from './context';
import { NimiEmbedding, NimiLLM } from './llm';
import {
  beginMessage,
  deleteChat,
  finishMessage,
  getChat,
  identifier,
  listChats,
  readSettings,
  saveSettings,
} from './storage';
import type { ResearchMessage, ResearchStart } from './contracts';
import { discover, homeWeather, testSearchService } from './search-service';

const id = z.string().regex(/^[A-Za-z0-9-]{1,80}$/);
const history = z
  .array(z.tuple([z.enum(['human', 'assistant']), z.string()]))
  .max(40);
const mediaInput = z
  .object({ query: z.string().min(1).max(16000), chatHistory: history })
  .strict();
const researchInput = z
  .object({
    runId: id,
    chatId: id,
    messageId: id,
    query: z.string().min(1).max(16000),
    sources: z.array(z.enum(['web', 'discussions', 'academic'])).max(3),
    fileIds: z.array(id).max(20),
    mode: z.enum(['speed', 'balanced', 'quality']),
    rewrite: z.boolean(),
    watchId: id,
  })
  .strict();
const chatHistory = (items: [string, string][]) =>
  items.map(([role, content]) => ({
    role: role === 'human' ? ('user' as const) : ('assistant' as const),
    content,
  }));
const messageText = (message: ResearchMessage) =>
  message.responseBlocks
    .filter((block) => block.type === 'text')
    .map((block) => block.data)
    .join('\n');

function researchErrorMessage(error: unknown): string {
  const reasonCode = (error as { reasonCode?: unknown } | null)?.reasonCode;
  switch (reasonCode) {
    case 'ai-model-not-found':
      return 'The selected model is unavailable for this Nimi connection. Choose an available model in Settings → AI models and try again.';
    case 'runtime-service-unavailable':
      return 'Nimi is unavailable. Start Nimi, then reopen Vane to try again.';
    case 'runtime-service-error-unclassified':
      return 'Nimi could not complete this request. Reopen Vane and try again.';
    case 'runtime-service-untrusted':
      return 'Vane received an incompatible response from Nimi. Use matching Nimi and Vane versions, then reopen the App.';
    default:
      return error instanceof Error ? error.message : String(error);
  }
}

export function createVaneHost() {
  let services: NimiElectronAppBusinessServices | undefined;
  let lifetime = new AbortController();
  let contextId = randomUUID();
  let closed = false;
  const runs = new Map<
    string,
    {
      controller: AbortController;
      chatId: string;
      phase: 'preparing' | 'running' | 'committing';
    }
  >();
  const observers = new Map<string, () => void>();
  const currentScope = (): VaneContext => {
    if (!services || closed)
      throw new Error('The Vane App Host is unavailable.');
    lifetime.signal.throwIfAborted();
    return { services, signal: lifetime.signal };
  };
  const disconnectObservers = () => {
    for (const stop of observers.values()) stop();
    observers.clear();
  };
  const invalidate = () => {
    lifetime.abort(new Error('Nimi context changed. Reopen Vane to continue.'));
    for (const run of runs.values()) run.controller.abort();
    runs.clear();
    disconnectObservers();
    SessionManager.clear();
    lifetime = new AbortController();
    contextId = randomUUID();
  };
  const watch = (
    runId: string,
    watchId: string,
    call: NimiElectronCommandHandlerInput,
  ) => {
    const session = SessionManager.getSession(runId);
    if (!session || !call.sendEvent)
      throw new Error(
        'Research is no longer available on this App Host. Reload its saved result.',
      );
    const key = `${runId}.${watchId}`;
    observers.get(key)?.();
    observers.set(
      key,
      session.subscribe((_event, update) =>
        call.sendEvent!(`vane.research.${key}`, update),
      ),
    );
  };
  const reconcile = async (chatId: string) => {
    const saved = await getChat(chatId);
    if (!saved) return null;
    for (const message of saved.messages) {
      if (message.status === 'answering' && !runs.has(message.backendId)) {
        message.status = 'interrupted';
        message.errorMessage =
          'The previous research session ended before completion. Start a new request to continue.';
        await finishMessage(message);
      }
    }
    return saved;
  };
  const commands: Record<string, NimiElectronCommandHandler> = {};
  const command = <T>(
    name: string,
    schema: z.ZodType<T>,
    action: (
      value: T,
      call: NimiElectronCommandHandlerInput,
      scope: VaneContext,
    ) => unknown,
  ) => {
    commands[`vane.${name}`] = (call) => {
      const envelope = z
        .object({ contextId: z.string(), input: z.unknown() })
        .strict()
        .parse(call.payload);
      if (envelope.contextId !== contextId)
        throw new Error('This Vane view is no longer active. Reopen the App.');
      const scope = currentScope();
      return inVaneContext(scope, () =>
        action(schema.parse(envelope.input), call, scope),
      );
    };
  };
  // This is only an App-view correlation value. Runtime independently admits
  // every SDK operation; it is never a Nimi account or authorization selector.
  commands['vane.initialize'] = () => {
    currentScope();
    return { contextId };
  };
  command('settings.get', z.object({}).strict(), () => readSettings());
  command(
    'settings.aiConfig.get',
    z.object({}).strict(),
    (_value, _call, scope) => scope.services.aiConfig.get(),
  );
  command('settings.aiConfig.overwrite', z.unknown(), (value, _call, scope) =>
    scope.services.aiConfig.overwrite(
      value as Parameters<typeof scope.services.aiConfig.overwrite>[0],
    ),
  );
  command('settings.aiConfig.options', z.unknown(), (value, _call, scope) =>
    scope.services.aiConfig.listOptions(
      value as Parameters<typeof scope.services.aiConfig.listOptions>[0],
    ),
  );
  command('settings.save', z.unknown(), (value) => saveSettings(value));
  command(
    'settings.testSearch',
    z.object({ url: z.string().max(2048) }).strict(),
    ({ url }) => testSearchService(url),
  );
  command('chats.list', z.object({}).strict(), () => listChats());
  command('chats.get', z.object({ chatId: id }).strict(), ({ chatId }) =>
    reconcile(chatId),
  );
  command(
    'chats.delete',
    z.object({ chatId: id }).strict(),
    async ({ chatId }) => {
      if ([...runs.values()].some((run) => run.chatId === chatId))
        throw new Error('Stop this chat’s research before deleting it.');
      await deleteChat(chatId);
      return { deleted: true };
    },
  );
  command(
    'files.upload',
    z
      .object({
        files: z
          .array(
            z
              .object({
                fileName: z.string().min(1).max(255),
                mimeType: z.string(),
                bytes: z.instanceof(Uint8Array),
              })
              .strict(),
          )
          .max(20),
      })
      .strict(),
    ({ files }) => {
      return new UploadManager({
        embeddingModel: new NimiEmbedding(),
      }).processFiles(files as FileInput[]);
    },
  );
  command('suggestions', z.object({ chatHistory: history }).strict(), (value) =>
    generateSuggestions(
      { chatHistory: chatHistory(value.chatHistory) },
      new NimiLLM(),
    ),
  );
  command('images', mediaInput, (value) =>
    searchImages(
      { query: value.query, chatHistory: chatHistory(value.chatHistory) },
      new NimiLLM(),
    ),
  );
  command('videos', mediaInput, (value) =>
    searchVideos(
      { query: value.query, chatHistory: chatHistory(value.chatHistory) },
      new NimiLLM(),
    ),
  );
  command(
    'discover',
    z
      .object({
        topic: z.enum(['tech', 'finance', 'art', 'sports', 'entertainment']),
        preview: z.boolean(),
      })
      .strict(),
    ({ topic, preview }) => discover(topic, preview),
  );
  command(
    'weather',
    z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        measureUnit: z.enum(['Metric', 'Imperial']),
      })
      .strict(),
    homeWeather,
  );
  command(
    'research.subscribe',
    z.object({ runId: id, watchId: id }).strict(),
    ({ runId, watchId }, call) => {
      watch(runId, watchId, call);
      return { subscribed: true };
    },
  );
  command(
    'research.unsubscribe',
    z.object({ runId: id, watchId: id }).strict(),
    ({ runId, watchId }) => {
      const key = `${runId}.${watchId}`;
      observers.get(key)?.();
      observers.delete(key);
      return { unsubscribed: true };
    },
  );
  command('research.cancel', z.object({ runId: id }).strict(), ({ runId }) => {
    const run = runs.get(runId);
    if (!run) return { accepted: false, state: 'not-running' };
    if (run.phase === 'committing')
      return { accepted: false, state: 'finishing' };
    run.controller.abort(new Error('Research canceled by the user.'));
    return { accepted: true, state: 'canceling' };
  });
  command('research.start', researchInput, async (input, call, parent) => {
    if (
      runs.has(input.runId) ||
      [...runs.values()].some((run) => run.chatId === input.chatId)
    )
      throw new Error('This chat already has active research.');
    const controller = new AbortController();
    const run = {
      controller,
      chatId: input.chatId,
      phase: 'preparing' as 'preparing' | 'running' | 'committing',
    };
    runs.set(input.runId, run);
    const scope = {
      services: parent.services,
      signal: AbortSignal.any([parent.signal, controller.signal]),
    };
    const session = SessionManager.createSession(input.runId, scope.signal);
    watch(input.runId, input.watchId, call);
    const message: ResearchMessage = {
      chatId: input.chatId,
      messageId: input.messageId,
      backendId: input.runId,
      query: input.query,
      responseBlocks: [],
      status: 'answering',
      createdAt: new Date().toISOString(),
    };
    let saved = false;
    try {
      const prepared = await inVaneContext(scope, async () => {
        await reconcile(input.chatId);
        const settings = await readSettings();
        if (input.sources.length && !settings.searxngURL)
          throw new Error(
            'Open Vane Settings and add a SearxNG search service, or turn off web sources for this request.',
          );
        const files = await Promise.all(
          input.fileIds.map((id) => UploadManager.getFile(identifier(id))),
        );
        const previous = await beginMessage(
          message,
          input.sources,
          files,
          input.rewrite,
        );
        saved = true;
        return { settings, previous };
      });
      run.phase = 'running';
      void inVaneContext(scope, async () => {
        try {
          const previous = prepared.previous
            .flatMap((item) => [
              { role: 'user' as const, content: item.query },
              ...(messageText(item)
                ? [{ role: 'assistant' as const, content: messageText(item) }]
                : []),
            ])
            .slice(-10);
          await new SearchAgent().searchAsync(session, {
            chatId: input.chatId,
            messageId: input.messageId,
            followUp: input.query,
            chatHistory: previous,
            config: {
              sources: input.sources,
              fileIds: input.fileIds,
              mode: input.mode,
              llm: new NimiLLM(),
              embedding: new NimiEmbedding(),
              systemInstructions: prepared.settings.systemInstructions,
            },
          });
          scope.signal.throwIfAborted();
          run.phase = 'committing';
          message.responseBlocks = session.getAllBlocks();
          message.status = 'completed';
          await inVaneContext(parent, () => finishMessage(message));
          parent.signal.throwIfAborted();
          session.finish('completed');
        } catch (error) {
          if (parent.signal.aborted) return;
          message.status = controller.signal.aborted ? 'canceled' : 'error';
          message.errorMessage = researchErrorMessage(error);
          message.responseBlocks = session.getAllBlocks();
          try {
            await inVaneContext(parent, () => finishMessage(message));
          } catch (saveError) {
            message.errorMessage += ` Saving this result was not confirmed. ${researchErrorMessage(saveError)}`;
          }
          session.finish(message.status, message.errorMessage);
        } finally {
          if (runs.get(input.runId) === run) runs.delete(input.runId);
        }
      });
      return { runId: input.runId, message };
    } catch (error) {
      runs.delete(input.runId);
      if (!parent.signal.aborted) {
        const reason = researchErrorMessage(error);
        if (saved)
          await inVaneContext(parent, () =>
            finishMessage({
              ...message,
              status: 'error',
              errorMessage: reason,
            }),
          );
        session.finish(
          controller.signal.aborted ? 'canceled' : 'error',
          reason,
        );
      }
      throw error;
    }
  });
  return {
    commands,
    bind: (value: NimiElectronAppBusinessServices) => {
      if (services) throw new Error('Vane services are already bound.');
      services = value;
    },
    invalidate,
    disconnectObservers,
    close: () => {
      closed = true;
      invalidate();
    },
  };
}
