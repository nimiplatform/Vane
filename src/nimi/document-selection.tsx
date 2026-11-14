import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useChat } from '@/lib/hooks/useChat';
import { useVane } from './client-context';
import type { VaneFile } from './contracts';
import { toast } from 'sonner';

type SelectionIntent = {
  route: string;
  scope: string;
  workspace: string;
  attached: VaneFile[];
  sources: string[];
  mode: string;
  choosing?: boolean;
  restored?: boolean;
};
type Selection = {
  intent: SelectionIntent | null;
  selected: File[];
  choose(intent: SelectionIntent): void;
  restored(): void;
  take(): File[];
  discard(): void;
  text: Map<string, string>;
};
const Context = createContext<Selection | null>(null);
export const useDocumentSelection = () => useContext(Context);

// @nimi-authority: rule.nimi.platform.ui-design-system.remote-app-session
/** The verified identity owns only a local selection. No Runtime client or operation survives a scope change. */
export function DocumentSelectionProvider({
  signal,
  children,
}: {
  signal: AbortSignal;
  children: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [intent, setIntent] = useState<SelectionIntent | null>(null);
  const [selected, setSelected] = useState<File[]>([]);
  const text = useRef(new Map<string, string>());
  useEffect(() => {
    const clear = () => {
      setIntent(null);
      setSelected([]);
      text.current.clear();
      if (input.current) input.current.value = '';
    };
    if (signal.aborted) clear();
    signal.addEventListener('abort', clear, { once: true });
    return () => signal.removeEventListener('abort', clear);
  }, [signal]);
  useEffect(() => {
    const element = input.current;
    const canceled = () =>
      setIntent((value) => (value ? { ...value, choosing: false } : null));
    element?.addEventListener('cancel', canceled);
    return () => element?.removeEventListener('cancel', canceled);
  }, []);
  return (
    <Context.Provider
      value={{
        intent,
        selected,
        text: text.current,
        choose: (value) => {
          if (signal.aborted) return;
          setIntent({ ...value, choosing: true });
          setSelected([]);
          input.current?.click();
        },
        restored: () =>
          setIntent((value) => (value ? { ...value, restored: true } : null)),
        take: () => {
          const files = selected;
          setSelected([]);
          setIntent(null);
          return files;
        },
        discard: () => {
          setSelected([]);
          setIntent(null);
        },
      }}
    >
      <input
        ref={input}
        type="file"
        accept=".pdf,.docx,.txt"
        multiple
        hidden
        aria-label="Choose research documents"
        onChange={(event) => {
          if (!signal.aborted) {
            setSelected(Array.from(event.target.files || []));
            setIntent((value) =>
              value ? { ...value, choosing: false } : null,
            );
          }
          event.target.value = '';
        }}
      />
      {children}
    </Context.Provider>
  );
}

/** A composer draft is restored only for the file-selection journey, within the same verified identity. */
export function useDocumentComposerDraft(
  kind: string,
): [string, (value: string) => void] {
  const picker = useDocumentSelection(),
    vane = useVane(),
    location = useLocation();
  const key = location.pathname + '\0' + kind;
  const [value, setValue] = useState(() =>
    picker?.intent?.route === location.pathname &&
    picker.intent.scope !== vane.scopeKey
      ? picker.text.get(key) || ''
      : '',
  );
  return [
    value,
    (next) => {
      picker?.text.set(key, next);
      setValue(next);
    },
  ];
}

export function DocumentSelectionTray() {
  const picker = useDocumentSelection(),
    vane = useVane(),
    location = useLocation();
  const {
    files,
    fileIds,
    setFiles,
    setFileIds,
    setSources,
    setOptimizationMode,
    setUploadingFiles,
    isReady,
  } = useChat();
  const [busy, setBusy] = useState(false);
  const lifetime = useRef<AbortController>(undefined);
  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    return () => controller.abort();
  }, []);
  const intent = picker?.intent;
  const here = !!intent && intent.route === location.pathname;
  useEffect(() => {
    if (
      !picker ||
      !intent ||
      intent.restored ||
      !here ||
      !isReady ||
      intent.scope === vane.scopeKey
    )
      return;
    if (intent.workspace === vane.workspaceKey) {
      const missing = intent.attached.filter(
        (file) => !fileIds.includes(file.fileId),
      );
      if (missing.length) {
        setFiles([...files, ...missing]);
        setFileIds([...fileIds, ...missing.map((file) => file.fileId)]);
      }
    }
    setSources(intent.sources);
    setOptimizationMode(intent.mode);
    picker.restored();
  }, [
    picker,
    intent,
    here,
    isReady,
    vane.scopeKey,
    vane.workspaceKey,
    files,
    fileIds,
    setFiles,
    setFileIds,
    setSources,
    setOptimizationMode,
  ]);
  useEffect(() => {
    if (
      picker &&
      intent &&
      (intent.restored || intent.scope === vane.scopeKey) &&
      !intent.choosing &&
      !picker.selected.length &&
      !busy
    )
      picker.discard();
  }, [picker, intent, busy, vane.scopeKey]);
  const pending = here && !!picker?.selected.length;
  useEffect(() => {
    setUploadingFiles(busy || pending);
  }, [busy, pending, setUploadingFiles]);
  if (!picker || (!pending && !busy)) return null;
  const upload = async () => {
    const signal = lifetime.current?.signal;
    if (!signal || signal.aborted || busy) return;
    // This new, explicit action captures the current client once. A disconnect never retries it.
    const selected = picker.take();
    setBusy(true);
    try {
      const uploaded = await vane.upload(selected);
      if (!signal.aborted) {
        setFiles([...files, ...uploaded]);
        setFileIds([...fileIds, ...uploaded.map((file) => file.fileId)]);
      }
    } catch (error) {
      if (!signal.aborted)
        toast.error(
          error instanceof Error
            ? error.message
            : 'The documents could not be uploaded.',
        );
    } finally {
      if (!signal.aborted) setBusy(false);
    }
  };
  return (
    <section
      className="my-4 rounded-xl border border-light-200 bg-light-secondary p-4 text-black dark:border-dark-200 dark:bg-dark-secondary dark:text-white"
      aria-label="Selected documents"
    >
      {busy ? (
        <p role="status">Uploading and indexing documents on your PC…</p>
      ) : (
        <>
          <p className="font-medium">
            {picker.selected.length} document
            {picker.selected.length === 1 ? '' : 's'} selected
          </p>
          <ul className="my-2 break-words text-sm">
            {picker.selected.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
          <p className="text-sm text-black/60 dark:text-white/60">
            Upload and index these documents before asking about them.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void upload()}
              className="min-h-11 rounded-lg bg-sky-500 px-4 py-2 text-white"
            >
              Upload to PC
            </button>
            <button
              type="button"
              onClick={() => picker.discard()}
              className="min-h-11 rounded-lg border px-4 py-2"
            >
              Discard selection
            </button>
          </div>
        </>
      )}
    </section>
  );
}
