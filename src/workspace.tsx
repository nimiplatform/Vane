import { HashRouter, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { ChatProvider } from './lib/hooks/useChat';
import Library from './app/library/page';
import Discover from './app/discover/page';
import SettingsPage from './nimi/settings-page';
import { DocumentSelectionTray } from './nimi/document-selection';
export function Workspace() {
  return (
    <HashRouter>
      <ChatProvider>
        <Sidebar>
          <DocumentSelectionTray />
          <Routes>
            <Route path="/" element={<ChatWindow />} />
            <Route path="/c/:chatId" element={<ChatWindow />} />
            <Route path="/library" element={<Library />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<p className="p-8">Page not found.</p>} />
          </Routes>
        </Sidebar>
      </ChatProvider>
    </HashRouter>
  );
}
