'use client';

import Navbar from './Navbar';
import Chat from './Chat';
import EmptyChat from './EmptyChat';
import { useChat } from '@/lib/hooks/useChat';
import SettingsButtonMobile from './Settings/SettingsButtonMobile';
import { Block } from '@/lib/types';
import Loader from './ui/Loader';

export type { ResearchMessage as Message } from '@/nimi/contracts';

export interface File {
  fileName: string;
  fileExtension: string;
  fileId: string;
}

export interface Widget {
  widgetType: string;
  params: Record<string, any>;
}

const ChatWindow = () => {
  const { hasError, errorMessage, notFound, messages, isReady } = useChat();

  if (hasError) {
    return (
      <div className="relative">
        <div className="absolute w-full flex flex-row items-center justify-end mr-5 mt-5">
          <SettingsButtonMobile />
        </div>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <p className="dark:text-white/70 text-black/70 text-sm">
            {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  return isReady ? (
    notFound ? (
      <p className="p-8">This chat was not found.</p>
    ) : (
      <div>
        {messages.length > 0 ? (
          <>
            <Navbar />
            <Chat />
          </>
        ) : (
          <EmptyChat />
        )}
      </div>
    )
  ) : (
    <div className="flex items-center justify-center min-h-screen w-full">
      <Loader />
    </div>
  );
};

export default ChatWindow;
