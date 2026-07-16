import { atom } from 'jotai';

export interface BroadcastItem {
  objectId?: string;
  provider?: string;
  serviceCode?: string;
  streamDescription?: string;
  currentViewers?: number;
  totalViewers?: number;
  totalDiamonds?: number;
  totalLikes?: number;
  broadcasterLifetimeDiamonds?: number;
  viewerToken?: string;
  viewerTokenExpiration?: number;
  broadcasterToken?: string;
  token?: string;
  language?: string;
  createdAt?: string;
  updatedAt?: string;
  activeUntil?: {
    iso?: string;
    __type?: string;
  } | string;
  isActive?: boolean;
  isHidden?: boolean;
  isQuestionable?: boolean;
  broadcasterAge?: number;
  agoraAppId?: string;
  userDetails?: {
    objectId?: string;
    networkUserId?: string;
    displayName?: string;
    firstName?: string;
    username?: string;
    gender?: string;
    memberId?: number;
    profilePic?: {
      large?: string;
      square?: string;
    };
    location?: {
      country?: string;
      city?: string;
      state?: string;
    };
    birthDate?: {
      iso?: string;
      __type?: string;
    } | string;
  };
}

export interface LiveBroadcastsState {
  items: BroadcastItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  cursor: any | null;
  error: string | null;
}

export const liveBroadcastsStateAtom = atom<LiveBroadcastsState>({
  items: [],
  isLoading: true,
  isRefreshing: false,
  cursor: null,
  error: null
});
