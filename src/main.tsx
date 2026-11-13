import { createRoot } from 'react-dom/client';
import { useEffect, useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { nimi, vane } from './nimi/client';
import { setClientSettings } from './lib/config/clientRegistry';
import ThemeProvider from './components/theme/Provider';
import { VaneClientProvider } from './nimi/client-context';
import { Workspace } from './workspace';
import './app/globals.css';

function connectionErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message === 'runtime-service-unavailable'
    ? 'Nimi is unavailable. Open Nimi, then retry the connection.'
    : message;
}

function AppGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'ready' | 'unavailable'>(
    'loading',
  );
  const [message, setMessage] = useState('Connecting to Nimi…');
  const connect = async () => {
    setState('loading');
    try {
      const auth = await nimi.auth.status();
      if (!auth.sessionBound)
        throw new Error(
          'Open Nimi and sign in to use Vane.',
        );
      await vane.ready();
      setClientSettings(await vane.settings.get());
      setState('ready');
    } catch (error) {
      setMessage(connectionErrorMessage(error));
      setState('unavailable');
    }
  };
  useEffect(() => {
    void connect();
    const onFocus = () => {
      void nimi.auth
        .status()
        .then((auth) => {
          if (!auth.sessionBound) {
            setMessage('Open Nimi and sign in to continue using Vane.');
            setState('unavailable');
          }
        })
        .catch((error) => {
          setMessage(connectionErrorMessage(error));
          setState('unavailable');
        });
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);
  if (state === 'ready') return children;
  return (
    <main className="flex min-h-screen items-center justify-center p-8 text-black/80 dark:text-white/80">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">Vane</h1>
        <p className="text-sm">{message}</p>
        {state === 'unavailable' && (
          <button
            onClick={() => void connect()}
            className="rounded-lg bg-[#24A0ED] px-4 py-2 text-sm text-white"
          >
            Retry Nimi connection
          </button>
        )}
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <AppGate>
      <VaneClientProvider client={{...vane,kind:'desktop'}}><Workspace/></VaneClientProvider>
    </AppGate>
    <Toaster />
  </ThemeProvider>,
);
