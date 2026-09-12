import { createRoot } from 'react-dom/client';
import { useEffect, useState, type ReactNode } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { nimi, vane } from './nimi/client';
import { setClientSettings } from './lib/config/clientRegistry';
import ThemeProvider from './components/theme/Provider';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { ChatProvider } from './lib/hooks/useChat';
import Library from './app/library/page';
import Discover from './app/discover/page';
import SettingsPage from './nimi/settings-page';
import './app/globals.css';

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
          `Open Nimi and sign in to use Vane. ${auth.reasonCode}`,
        );
      await vane.ready();
      setClientSettings(await vane.settings.get());
      setState('ready');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
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
          setMessage(error instanceof Error ? error.message : String(error));
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
      <HashRouter>
        <ChatProvider>
          <Sidebar>
            <Routes>
              <Route path="/" element={<ChatWindow />} />
              <Route path="/c/:chatId" element={<ChatWindow />} />
              <Route path="/library" element={<Library />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route
                path="*"
                element={<p className="p-8">Page not found.</p>}
              />
            </Routes>
          </Sidebar>
        </ChatProvider>
      </HashRouter>
    </AppGate>
    <Toaster />
  </ThemeProvider>,
);
