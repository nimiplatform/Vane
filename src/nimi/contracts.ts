import type { Block } from '../lib/types';
import type { SearchSources } from '../lib/agents/search/types';

export type VaneSettings = {
  searxngURL: string;
  systemInstructions: string;
  autoMediaSearch: boolean;
  showWeatherWidget: boolean;
  showNewsWidget: boolean;
  measurementUnit: 'metric' | 'imperial';
};

export const defaultSettings: VaneSettings = {
  searxngURL: '',
  systemInstructions: '',
  autoMediaSearch: false,
  showWeatherWidget: true,
  showNewsWidget: true,
  measurementUnit: 'metric',
};

export type VaneFile = {
  fileId: string;
  fileName: string;
  fileExtension: string;
};
export type ResearchStatus =
  'answering' | 'completed' | 'error' | 'canceled' | 'interrupted';
export type ResearchMessage = {
  chatId: string;
  messageId: string;
  backendId: string;
  query: string;
  createdAt: string;
  responseBlocks: Block[];
  status: ResearchStatus;
  errorMessage?: string;
};
export type ChatRecord = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  sources: SearchSources[];
  files: VaneFile[];
  messages: { messageId: string; body: string }[];
};
export type ResearchStart = {
  runId: string;
  chatId: string;
  messageId: string;
  query: string;
  sources: SearchSources[];
  fileIds: string[];
  mode: 'speed' | 'balanced' | 'quality';
  rewrite: boolean;
};
export type ResearchUpdate =
  | { type: 'block'; block: Block }
  | { type: 'updateBlock'; blockId: string; patch: unknown[] }
  | { type: 'researchComplete'; reason?: 'done' | 'budget' | 'no-search' }
  | { type: 'messageEnd' }
  | {
      type: 'error';
      data: string;
      status: 'error' | 'canceled' | 'interrupted';
    };
