import { atom } from 'jotai';

export interface StoryUser {
  id: string | number;
  public_id?: string;
  username?: string;
  nickname?: string;
  name?: string;
  displayname?: string;
  display_name?: string;
  avatar?: unknown;
  cover?: unknown;
  [key: string]: unknown;
}

export interface StoryMedia {
  id?: string | number;
  file?: {
    url?: string;
    storage_path?: string;
    mime_type?: string;
    type?: string;
    name?: string;
    variants?: unknown;
    [key: string]: unknown;
  };
  url?: string;
  storage_path?: string;
  thumbnail?: string;
  small?: string;
  icon?: string;
  medium?: string;
  large?: string;
  high?: string;
  low?: string;
  preview?: string;
  poster?: string;
  original?: string;
  mime_type?: string;
  variants?: unknown;
  [key: string]: unknown;
}

export interface StoryItem {
  id: string | number;
  user_id: string | number;
  user?: StoryUser;
  media?: StoryMedia;
  is_expired?: boolean;
  created_at: string;
  [key: string]: unknown;
}

export type StoryCard = {
  id: number | string;
  name: string;
  avatar: string | null;
  cover: string | null;
  userCover?: string | null;
  isOwn?: boolean;
  hasStory?: boolean;
  storyId?: string;
  storyMedia?: StoryMedia;
  userId?: string | number;
  user?: StoryUser;
  created_at?: string;
};

export interface StoriesState {
  items: StoryCard[];
  isLoading: boolean;
  error: string | null;
}

export const storiesStateAtom = atom<StoriesState>({
  items: [],
  isLoading: true,
  error: null
});
