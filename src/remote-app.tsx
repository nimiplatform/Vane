import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import {
  NimiAppSessionProvider,
  NimiAppAccessGate,
  NimiAccountControl,
  useNimiAppSession,
  type NimiAppScope,
  type NimiAppSession,
} from '@nimiplatform/kit/auth/app';
import {
  TooltipProvider,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
} from '@nimiplatform/kit/ui';
import { VaneClientProvider, type VaneClient } from './nimi/client-context';
import { createRemoteVane } from './nimi/remote-client';
import { setClientSettings } from './lib/config/clientRegistry';
import ThemeProvider from './components/theme/Provider';
import { Workspace } from './workspace';
import { DocumentSelectionProvider } from './nimi/document-selection';
import './app/globals.css';
import './remote.css';
function Account() {
  const { snapshot } = useNimiAppSession();
  return snapshot.identity.status === 'signed-in' ? (
    <Popover>
      <PopoverTrigger asChild>
        <Button tone="secondary" size="sm" aria-label="Account and connection">
          {snapshot.identity.user?.displayName || 'Nimi account'}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-4">
        <NimiAccountControl language="en" />
      </PopoverContent>
    </Popover>
  ) : null;
}
function ConnectedWorkspace({ scope }: { scope: NimiAppScope }) {
  const [client, setClient] = useState<VaneClient>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    setError('');
    void createRemoteVane(scope)
      .then(async (client) => {
        const settings = await client.settings.get();
        if (current) {
          setClientSettings(settings);
          setClient(client);
        }
      })
      .catch((error) => {
        if (current)
          setError(error instanceof Error ? error.message : String(error));
      });
    return () => {
      current = false;
    };
  }, [scope, attempt]);
  if (!client)
    return (
      <section className="vane-connect">
        <h1>Connect your research workspace</h1>
        <p>{error || 'Opening the PC Vane library…'}</p>
        {error && (
          <button onClick={() => setAttempt((value) => value + 1)}>
            Check PC workspace
          </button>
        )}
      </section>
    );
  return (
    <VaneClientProvider client={client}>
      <Workspace />
    </VaneClientProvider>
  );
}
function Content({
  persistentDocumentSelection,
}: {
  persistentDocumentSelection: boolean;
}) {
  const { snapshot } = useNimiAppSession();
  const scope =
    snapshot.runtime.status === 'connected'
      ? snapshot.runtime.scope
      : undefined;
  const content = (
    <NimiAppAccessGate title="Vane" language="en" externalAccountControl>
      {() =>
        scope ? <ConnectedWorkspace key={scope.viewKey} scope={scope} /> : null
      }
    </NimiAppAccessGate>
  );
  return persistentDocumentSelection &&
    snapshot.identity.status === 'signed-in' ? (
    <DocumentSelectionProvider
      key={snapshot.identity.viewKey}
      signal={snapshot.identity.signal}
    >
      {content}
    </DocumentSelectionProvider>
  ) : (
    content
  );
}
export function mountRemoteVane(
  session: NimiAppSession,
  persistentDocumentSelection = false,
) {
  document.body.classList.add('vane-remote');
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <ThemeProvider>
      <TooltipProvider>
        <NimiAppSessionProvider session={session}>
          <header className="vane-account">
            <strong>Vane</strong>
            <span>PC research workspace</span>
            <Account />
          </header>
          <p className="vane-note">
            Keep Vane open on your PC. Chats and documents are shared with that
            workspace. Disconnecting does not stop research.
          </p>
          <Content persistentDocumentSelection={persistentDocumentSelection} />
          <Toaster />
        </NimiAppSessionProvider>
      </TooltipProvider>
    </ThemeProvider>,
  );
  void session.start();
  return () => {
    root.unmount();
    session.dispose();
  };
}
