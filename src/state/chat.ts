import { atom } from 'jotai';
import type { ChatEmoticon } from '@/features/emoticons/types';

export interface Attachment {
  id: string;
  file: {
    id: string;
    url: string;
    mime_type: string;
    name: string;
    storage_path?: string;
    width?: number;
    height?: number;
    variants?: {
      image?: {
        original?: { url: string; width?: number; height?: number };
        small?: { url: string; width?: number; height?: number };
        medium?: { url: string; width?: number; height?: number };
        large?: { url: string; width?: number; height?: number };
        thumbnail?: { url: string; width?: number; height?: number };
        icon?: { url: string; width?: number; height?: number };
      };
      video?: {
        original?: { url: string; width?: number; height?: number };
        high?: { url: string; width?: number; height?: number };
        small?: { url: string; width?: number; height?: number };
        low?: { url: string; width?: number; height?: number };
        medium?: { url: string; width?: number; height?: number };
        large?: { url: string; width?: number; height?: number };
        thumbnail?: { url: string; width?: number; height?: number };
        icon?: { url: string; width?: number; height?: number };
        preview?: { url: string; width?: number; height?: number };
        poster?: { url: string; width?: number; height?: number };
      };
    };
  };
}

export interface ChatItem {
  peerId?: string;
  type?: string;
  participantCount?: number;
  description?: string;
  visibility?: string;
  publicUsername?: string;
  muted?: boolean;
  canManage?: boolean;
  pinnedMessageId?: string | null;
  pinnedMessageText?: string;
  id: string;
  chatId: string | null;
  name: string;
  username: string;
  emojis: string;
  avatar: string | null;
  avatarLetter: string | null;
  lastMessage: string;
  lastMessageId?: string | null;
  lastMessageOutgoing?: boolean;
  lastMessageRead?: boolean;
  lastTime: string;
  unread: number;
  online: boolean;
  verified: boolean;
  encrypted: boolean;
}

export interface ChatMessage {
  forwardedFrom?: { name: string; date: string };
  reply?: { id: string; text: string; sender: 'me' | 'other' };
  emoticon?: ChatEmoticon;
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
  viewOncePreview?: string;
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
