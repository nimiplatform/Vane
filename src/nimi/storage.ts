import { randomUUID } from 'node:crypto';
import z from 'zod';
import {
  defaultSettings,
  type VaneSettings,
  type ChatRecord,
  type ResearchMessage,
  type VaneFile,
} from './contracts';
import type { SearchSources } from '../lib/agents/search/types';
import { vaneContext, whileVaneActive } from './context';

const settingsSchema = z
  .object({
    searxngURL: z.string().max(2048),
    systemInstructions: z.string().max(16000),
    autoMediaSearch: z.boolean(),
    showWeatherWidget: z.boolean(),
    showNewsWidget: z.boolean(),
    measurementUnit: z.enum(['metric', 'imperial']),
  })
  .strict();
const mutations = new Map<string, Promise<unknown>>();

export const identifier = (value: string) =>
  z
    .string()
    .regex(/^[A-Za-z0-9-]{1,80}$/)
    .parse(value);
const chatPath = (id: string) => `chats/${identifier(id)}/manifest.json`;
const missing = (error: unknown) =>
  (error as { reasonCode?: string })?.reasonCode === 'not-found';

export async function readAssetJson<T>(relativePath: string): Promise<T> {
  return whileVaneActive(async ({ services, signal }) => {
    const asset = await services.storage.assets.read({ relativePath });
    const chunks: Uint8Array[] = [];
    for await (const chunk of asset.body) {
      signal.throwIfAborted();
      chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
  });
}

export function writeAssetJson(relativePath: string, value: unknown) {
  return whileVaneActive(({ services }) =>
    services.storage.assets.write({
      relativePath,
      body: Buffer.from(JSON.stringify(value)),
      mediaType: 'application/json',
      overwrite: true,
    }),
  );
}

export async function readSettings(): Promise<VaneSettings> {
  try {
    const result = await whileVaneActive(({ services }) =>
      services.storage.readJson('settings.json'),
    );
    return settingsSchema.parse(result.value);
  } catch (error) {
    if (missing(error)) return { ...defaultSettings };
    throw error;
  }
}

export async function saveSettings(value: unknown): Promise<VaneSettings> {
  const settings = settingsSchema.parse(value);
  if (settings.searxngURL) {
    const url = new URL(settings.searxngURL);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.hash ||
      url.search
    ) {
      throw new Error(
        'Enter an HTTP or HTTPS SearxNG base address without credentials, query or fragment.',
      );
    }
    settings.searxngURL = url.toString().replace(/\/$/, '');
  }
  await whileVaneActive(({ services }) =>
    services.storage.writeJson('settings.json', settings),
  );
  return settings;
}

async function serialized<T>(
  chatId: string,
  operation: () => Promise<T>,
): Promise<T> {
  const previous = mutations.get(chatId) ?? Promise.resolve();
  const current = previous
    .catch(() => undefined)
    .then(() => {
      vaneContext();
      return operation();
    });
  mutations.set(chatId, current);
  try {
    return await current;
  } finally {
    if (mutations.get(chatId) === current) mutations.delete(chatId);
  }
}

export async function listChats(): Promise<ChatRecord[]> {
  const chats: ChatRecord[] = [];
  let cursor: string | undefined;
  do {
    const page = await whileVaneActive(({ services }) =>
      services.storage.assets.list({ prefix: 'chats/', cursor, pageSize: 500 }),
    );
    for (const asset of page.assets) {
      if (/^chats\/[A-Za-z0-9-]+\/manifest\.json$/.test(asset.relativePath)) {
        chats.push(await readAssetJson<ChatRecord>(asset.relativePath));
      }
    }
    cursor = page.nextCursor || undefined;
  } while (cursor);
  return chats.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getChat(
  chatId: string,
): Promise<{ chat: ChatRecord; messages: ResearchMessage[] } | null> {
  let chat: ChatRecord;
  try {
    chat = await readAssetJson(chatPath(chatId));
  } catch (error) {
    if (missing(error)) return null;
    throw error;
  }
  const messages = await Promise.all(
    chat.messages.map((message) =>
      readAssetJson<ResearchMessage>(message.body),
    ),
  );
  return { chat, messages };
}

export async function beginMessage(
  message: ResearchMessage,
  sources: SearchSources[],
  files: VaneFile[],
  rewrite: boolean,
) {
  return serialized(message.chatId, async () => {
    const existing = await getChat(message.chatId);
    const now = new Date().toISOString();
    const chat: ChatRecord = existing?.chat ?? {
      id: message.chatId,
      title: message.query.slice(0, 160),
      createdAt: now,
      updatedAt: now,
      sources,
      files,
      messages: [],
    };
    if (existing?.messages.some((item) => item.status === 'answering'))
      throw new Error('This chat already has active research.');
    const index = chat.messages.findIndex(
      (item) => item.messageId === message.messageId,
    );
    if (index !== -1) {
      if (!rewrite) throw new Error('This message already exists.');
      chat.messages = chat.messages.slice(0, index);
    } else if (rewrite)
      throw new Error('The message to rewrite no longer exists.');
    if (chat.messages.length >= 2000)
      throw new Error('This chat is full. Start a new chat to continue.');
    chat.sources = sources;
    chat.files = files;
    // Publish the body first. The one manifest replacement makes it visible.
    const body = `chats/${identifier(message.chatId)}/messages/${identifier(message.messageId)}-${randomUUID()}.json`;
    await writeAssetJson(body, message);
    chat.messages.push({ messageId: message.messageId, body });
    chat.updatedAt = now;
    await writeAssetJson(chatPath(message.chatId), chat);
    return (existing?.messages ?? []).slice(
      0,
      index === -1 ? undefined : index,
    );
  });
}

export async function finishMessage(message: ResearchMessage) {
  await serialized(message.chatId, async () => {
    const existing = await getChat(message.chatId);
    if (!existing) throw new Error('The chat was removed.');
    const index = existing.chat.messages.findIndex(
      (item) => item.messageId === message.messageId,
    );
    if (
      index === -1 ||
      existing.messages[index].backendId !== message.backendId
    )
      throw new Error('Research was replaced; its result cannot be published.');
    const previousBody = existing.chat.messages[index].body;
    const body = `chats/${identifier(message.chatId)}/messages/${identifier(message.messageId)}-${randomUUID()}.json`;
    await writeAssetJson(body, message);
    existing.chat.messages[index] = { messageId: message.messageId, body };
    existing.chat.updatedAt = new Date().toISOString();
    await writeAssetJson(chatPath(message.chatId), existing.chat);
    // Old body removal is cleanup after the visible commit, not its condition.
    await whileVaneActive(({ services }) =>
      services.storage.assets.remove(previousBody),
    ).catch(() => undefined);
  });
}

export async function deleteChat(chatId: string) {
  await serialized(chatId, async () => {
    // Detach the visible manifest first. Orphan bodies are never list entries.
    await whileVaneActive(({ services }) =>
      services.storage.assets.remove(chatPath(chatId)),
    );
    let cursor: string | undefined;
    do {
      const page = await whileVaneActive(({ services }) =>
        services.storage.assets.list({
          prefix: `chats/${identifier(chatId)}/`,
          cursor,
          pageSize: 500,
        }),
      );
      for (const asset of page.assets)
        await whileVaneActive(({ services }) =>
          services.storage.assets.remove(asset.relativePath),
        );
      cursor = page.nextCursor || undefined;
    } while (cursor);
  });
}
