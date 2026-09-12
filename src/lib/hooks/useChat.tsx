import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { applyPatch } from 'rfc6902';
import { vane } from '@/nimi/client';
import type {
  ResearchMessage as Message,
  ResearchUpdate,
  VaneFile as File,
} from '@/nimi/contracts';
import type { Block } from '@/lib/types';
import type { Widget } from '@/components/ChatWindow';
import type { SearchSources } from '@/lib/agents/search/types';

export type { VaneFile as File } from '@/nimi/contracts';
export type Section = {
  message: Message;
  widgets: Widget[];
  parsedTextBlocks: string[];
  speechMessage: string;
  thinkingEnded: boolean;
  suggestions?: string[];
};
type ChatContext = {
  messages: Message[];
  sections: Section[];
  chatHistory: [string, string][];
  files: File[];
  fileIds: string[];
  sources: string[];
  chatId: string;
  optimizationMode: string;
  isMessagesLoaded: boolean;
  loading: boolean;
  notFound: boolean;
  messageAppeared: boolean;
  isReady: boolean;
  hasError: boolean;
  researchEnded: boolean;
  errorMessage: string;
  setResearchEnded: (value: boolean) => void;
  setOptimizationMode: (value: string) => void;
  setSources: (value: string[]) => void;
  setFiles: (value: File[]) => void;
  setFileIds: (value: string[]) => void;
  sendMessage: (
    message: string,
    messageId?: string,
    rewrite?: boolean,
  ) => Promise<void>;
  rewrite: (id: string) => void;
  cancel: () => Promise<void>;
};
const chatContext = createContext<ChatContext | null>(null);
const toHistory = (messages: Message[]): [string, string][] =>
  messages.flatMap((message): [string, string][] => {
    const text = message.responseBlocks
      .filter((block) => block.type === 'text')
      .map((block) => block.data)
      .join('\n');
    return [
      ['human', message.query],
      ...(text ? [['assistant', text] as [string, string]] : []),
    ];
  });

export function ChatProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [chatId, setChatId] = useState<string>(() => crypto.randomUUID());
  const chatIdRef = useRef(chatId);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef(messages);
  const [files, setFiles] = useState<File[]>([]);
  const [fileIds, setFileIds] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>(['web']);
  const [optimizationMode, setOptimizationMode] = useState('speed');
  const [loading, setLoading] = useState(false);
  const [isMessagesLoaded, setIsMessagesLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [researchEnded, setResearchEnded] = useState(false);
  const [messageAppeared, setMessageAppeared] = useState(false);
  const observer = useRef<(() => void) | null>(null);
  const view = useRef(0);
  const starting = useRef(false);
  const submittedQuery = useRef('');
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  const sections = useMemo<Section[]>(() => {
    return messages.map((msg) => {
      const textBlocks: string[] = [];
      let speechMessage = '';
      let thinkingEnded = false;
      let suggestions: string[] = [];

      const sourceBlocks = msg.responseBlocks.filter(
        (block): block is Block & { type: 'source' } => block.type === 'source',
      );
      const sources = sourceBlocks.flatMap((block) => block.data);

      const widgetBlocks = msg.responseBlocks
        .filter((b) => b.type === 'widget')
        .map((b) => b.data) as Widget[];

      msg.responseBlocks.forEach((block) => {
        if (block.type === 'text') {
          let processedText = block.data;
          const citationRegex = /\[([^\]]+)\]/g;
          const regex = /\[(\d+)\]/g;

          if (processedText.includes('<think>')) {
            const openThinkTag = processedText.match(/<think>/g)?.length || 0;
            const closeThinkTag =
              processedText.match(/<\/think>/g)?.length || 0;

            if (openThinkTag && !closeThinkTag) {
              processedText += '</think> <a> </a>';
            }
          }

          if (block.data.includes('</think>')) {
            thinkingEnded = true;
          }

          if (sources.length > 0) {
            processedText = processedText.replace(
              citationRegex,
              (_, capturedContent: string) => {
                const numbers = capturedContent
                  .split(',')
                  .map((numStr) => numStr.trim());

                const linksHtml = numbers
                  .map((numStr) => {
                    const number = parseInt(numStr);

                    if (isNaN(number) || number <= 0) {
                      return `[${numStr}]`;
                    }

                    const source = sources[number - 1];
                    const url = source?.metadata?.url;

                    if (url) {
                      return `<citation href="${url}">${numStr}</citation>`;
                    } else {
                      return ``;
                    }
                  })
                  .join('');

                return linksHtml;
              },
            );
            speechMessage += block.data.replace(regex, '');
          } else {
            processedText = processedText.replace(regex, '');
            speechMessage += block.data.replace(regex, '');
          }

          textBlocks.push(processedText);
        } else if (block.type === 'suggestion') {
          suggestions = block.data;
        }
      });

      return {
        message: msg,
        parsedTextBlocks: textBlocks,
        speechMessage,
        thinkingEnded,
        suggestions,
        widgets: widgetBlocks,
      };
    });
  }, [messages]);

  const update =
    (messageId: string, generation: number) => (data: ResearchUpdate) => {
      if (generation !== view.current) return;
      if (data.type === 'researchComplete') {
        setResearchEnded(true);
        if (data.reason === 'budget')
          toast.info(
            'Research reached the selected mode’s limit. The answer uses the sources gathered so far.',
          );
        return;
      }
      if (data.type === 'block' || data.type === 'updateBlock') {
        setMessageAppeared(true);
        setMessages((previous) =>
          previous.map((message) => {
            if (message.messageId !== messageId) return message;
            const blocks = structuredClone(message.responseBlocks);
            if (data.type === 'block') {
              const index = blocks.findIndex(
                (block) => block.id === data.block.id,
              );
              if (index === -1) blocks.push(data.block);
              else blocks[index] = data.block;
            } else {
              const block = blocks.find((entry) => entry.id === data.blockId);
              if (
                !block ||
                applyPatch(block, data.patch as any[]).some(Boolean)
              ) {
                throw new Error(
                  'Research progress could not be applied. Reopen the chat to reconnect.',
                );
              }
            }
            return { ...message, responseBlocks: blocks };
          }),
        );
        return;
      }
      setLoading(false);
      starting.current = false;
      setMessages((previous) =>
        previous.map((message) =>
          message.messageId === messageId
            ? {
                ...message,
                status: data.type === 'messageEnd' ? 'completed' : data.status,
                ...(data.type === 'error' ? { errorMessage: data.data } : {}),
              }
            : message,
        ),
      );
      if (data.type === 'messageEnd') {
        void vane.chats
          .get(chatIdRef.current)
          .then((saved) => {
            if (generation !== view.current || !saved) return;
            setMessages(saved.messages);
            void vane
              .suggestions(toHistory(saved.messages))
              .then((suggestions) => {
                if (generation !== view.current) return;
                setMessages((previous) =>
                  previous.map((message) =>
                    message.messageId === messageId
                      ? {
                          ...message,
                          responseBlocks: [
                            ...message.responseBlocks,
                            {
                              id: crypto.randomUUID(),
                              type: 'suggestion',
                              data: suggestions,
                            },
                          ],
                        }
                      : message,
                  ),
                );
              })
              .catch((error) => {
                if (generation === view.current)
                  toast.error(
                    `Related questions unavailable: ${error.message}`,
                  );
              });
          })
          .catch((error) => {
            if (generation === view.current) toast.error(error.message);
          });
      }
    };

  useEffect(() => {
    const routeId = /^\/c\/([A-Za-z0-9-]+)$/.exec(location.pathname)?.[1];
    if (routeId === chatIdRef.current && isMessagesLoaded) return;
    const generation = ++view.current;
    observer.current?.();
    observer.current = null;
    setMessages([]);
    setFiles([]);
    setFileIds([]);
    setLoading(false);
    starting.current = false;
    setNotFound(false);
    setErrorMessage('');
    setResearchEnded(false);
    setMessageAppeared(false);
    if (!routeId) {
      const nextId = crypto.randomUUID();
      chatIdRef.current = nextId;
      setChatId(nextId);
      setIsMessagesLoaded(true);
      return;
    }
    chatIdRef.current = routeId;
    setChatId(routeId);
    setIsMessagesLoaded(false);
    void vane.chats
      .get(routeId)
      .then(async (saved) => {
        if (generation !== view.current) return;
        if (!saved) {
          setNotFound(true);
          return;
        }
        setMessages(saved.messages);
        setFiles(saved.chat.files);
        setFileIds(saved.chat.files.map((file) => file.fileId));
        setSources(saved.chat.sources);
        const pending = saved.messages.find(
          (message) => message.status === 'answering',
        );
        if (pending) {
          setLoading(true);
          const stop = await vane.research.subscribe(
            pending.backendId,
            update(pending.messageId, generation),
          );
          if (generation !== view.current) stop();
          else observer.current = stop;
        }
      })
      .catch((error) => {
        if (generation === view.current) {
          setErrorMessage(error.message);
          setLoading(false);
        }
      })
      .finally(() => {
        if (generation === view.current) setIsMessagesLoaded(true);
      });
  }, [location.pathname]);
  useEffect(
    () => () => {
      view.current++;
      observer.current?.();
    },
    [],
  );

  const sendMessage = async (
    query: string,
    messageId: string = crypto.randomUUID(),
    rewrite = false,
  ) => {
    if (starting.current || loading || !query.trim()) return;
    starting.current = true;
    const generation = view.current;
    const runId = crypto.randomUUID();
    const id = chatIdRef.current;
    const message: Message = {
      chatId: id,
      messageId,
      backendId: runId,
      query,
      createdAt: new Date().toISOString(),
      status: 'answering',
      responseBlocks: [],
    };
    setMessages((previous) => {
      const index = rewrite
        ? previous.findIndex((item) => item.messageId === messageId)
        : -1;
      return [...(index < 0 ? previous : previous.slice(0, index)), message];
    });
    setLoading(true);
    setResearchEnded(false);
    setMessageAppeared(false);
    if (location.pathname !== `/c/${id}`)
      navigate(`/c/${id}`, { replace: true });
    observer.current?.();
    observer.current = null;
    try {
      const stop = await vane.research.start(
        {
          runId,
          chatId: id,
          messageId,
          query,
          rewrite,
          fileIds,
          sources: sources as SearchSources[],
          mode: optimizationMode as 'speed' | 'balanced' | 'quality',
        },
        update(messageId, generation),
      );
      if (generation !== view.current) stop();
      else observer.current = stop;
    } catch (error) {
      if (generation !== view.current) return;
      const reason = error instanceof Error ? error.message : String(error);
      toast.error(reason);
      setLoading(false);
      setMessages((previous) =>
        previous.map((item) =>
          item.messageId === messageId
            ? { ...item, status: 'error', errorMessage: reason }
            : item,
        ),
      );
    } finally {
      if (generation === view.current) starting.current = false;
    }
  };
  const rewrite = (id: string) => {
    const message = messagesRef.current.find((item) => item.messageId === id);
    if (message) void sendMessage(message.query, id, true);
  };
  const cancel = async () => {
    const current = messagesRef.current.find(
      (message) => message.status === 'answering',
    );
    if (!current) return;
    const result = await vane.research.cancel(current.backendId);
    if (!result.accepted && result.state === 'finishing')
      toast.info('The result is being saved.');
  };
  useEffect(() => {
    const query = new URLSearchParams(location.search).get('q');
    if (
      !isMessagesLoaded ||
      !query ||
      submittedQuery.current === location.search
    )
      return;
    submittedQuery.current = location.search;
    void sendMessage(query);
  }, [location.search, isMessagesLoaded]);

  return (
    <chatContext.Provider
      value={{
        messages,
        sections,
        chatHistory: toHistory(messages),
        files,
        fileIds,
        sources,
        chatId,
        optimizationMode,
        loading,
        isMessagesLoaded,
        notFound,
        messageAppeared,
        researchEnded,
        hasError: Boolean(errorMessage),
        errorMessage,
        isReady: isMessagesLoaded,
        setFiles,
        setFileIds,
        setSources,
        setOptimizationMode,
        setResearchEnded,
        sendMessage,
        rewrite,
        cancel,
      }}
    >
      {children}
    </chatContext.Provider>
  );
}
export function useChat() {
  const value = useContext(chatContext);
  if (!value) throw new Error('ChatProvider is required.');
  return value;
}
