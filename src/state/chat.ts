import { atom } from 'jotai';

export interface Attachment {
  id: string;
  file: {
    id: string;
    url: string;
    mime_type: string;
    name: string;
    storage_path?: string;
    variants?: {
      image?: {
        original?: { url: string };
        small?: { url: string };
        medium?: { url: string };
        large?: { url: string };
        thumbnail?: { url: string };
        icon?: { url: string };
      };
      video?: {
        original?: { url: string };
        high?: { url: string };
        small?: { url: string };
        low?: { url: string };
        medium?: { url: string };
        large?: { url: string };
        thumbnail?: { url: string };
        icon?: { url: string };
        preview?: { url: string };
        poster?: { url: string };
      };
    };
  };
}

export interface ChatItem {
  id: string;
  chatId: string | null;
  name: string;
  username: string;
  emojis: string;
  avatar: string | null;
  avatarLetter: string | null;
  lastMessage: string;
  lastMessageId?: string | null;
  lastTime: string;
  unread: number;
  online: boolean;
  verified: boolean;
  encrypted: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  time: string;
  sender: 'me' | 'other';
  attachments?: Attachment[];
  createdAt?: string;
  expiresAt?: string | null;
  expiresInSeconds?: number | null;
  openedAt?: string | null;
  isDisappearing?: boolean;
  contentHidden?: boolean;
  clientId?: string;
  viewOnce?: boolean;
  viewedOnce?: boolean;
}

export interface ChatState {
  chatsList: ChatItem[];
  selectedChatId: string | null;
  messages: ChatMessage[];
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  isRefreshingMessages: boolean;
  error: string | null;
}

export const initialChatState: ChatState = {
  chatsList: [],
  selectedChatId: null,
  messages: [],
  isLoadingChats: false,
  isLoadingMessages: false,
  isRefreshingMessages: false,
  error: null
};

export const chatStateAtom = atom<ChatState>(initialChatState);
