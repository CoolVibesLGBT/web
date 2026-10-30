import { getLocalizedContent, getSafeImageURLEx } from '@/helpers/helpers';
import { api } from '@/services/api';
import type { ChatItem } from '@/state/chat';

// Mirrors the Go backend's types.ChatGroupPreview (chat.group.list response).
export type PublicGroupPreview = {
  id: string;
  title: Record<string, string>;
  description?: Record<string, string>;
  visibility: string;
  public_username?: string;
  avatar?: { file?: { url?: string } };
  cover?: { file?: { url?: string } };
  hero?: { file?: { url?: string } };
  member_count: number;
};

/** Resolves the avatar/cover/hero preview image shown for a public group card. */
export function getPublicGroupImage(group: PublicGroupPreview): string | null {
  const media = group.avatar ?? group.cover ?? group.hero;
  return media?.file?.url ? getSafeImageURLEx(group.id, media, 'thumbnail') : null;
}

/** Builds the sidebar chat-list entry for a group the viewer just joined, mirroring the shape `chat.group.join`/`chat.group.preview` return under `chat`. */
export function buildGroupChatItem(chat: any, language: string, viewerId?: string): ChatItem {
  const title = String(getLocalizedContent(chat.title, language) || '');
  return {
    id: chat.id,
    chatId: chat.id,
    type: 'group',
    name: title,
    description: String(getLocalizedContent(chat.description, language) || ''),
    visibility: chat.visibility,
    publicUsername: chat.public_username,
    participantCount: chat.participants?.length,
    username: '',
    emojis: '',
    avatar: chat.avatar ? getSafeImageURLEx(chat.id, chat.avatar, 'thumbnail') : null,
    avatarLetter: title.charAt(0).toLocaleUpperCase(),
    lastMessage: '',
    lastTime: '',
    unread: 0,
    online: false,
    verified: false,
    encrypted: false,
    canManage: String(chat.creator_id) === String(viewerId),
  };
}

/**
 * `chat.fetch_chats` is capped at 20 rows per page server-side and has no
 * search parameter of its own, so anything beyond that first page — the only
 * page the sidebar's `chatsList` ever holds — is invisible to both membership
 * checks and the chat search box. This walks every page (capped at 25
 * round-trips, 100 rows each — comfortably above any realistic chat count),
 * handing each raw chat to `visit` so callers can either collect it or test
 * it against a search term.
 */
async function walkJoinedChats(visit: (chat: any) => void): Promise<void> {
  let cursor: string | undefined;
  for (let page = 0; page < 25; page++) {
    const response: any = await api.fetchChats({ limit: 100, ...(cursor ? { cursor } : {}) });
    const rows: any[] = Array.isArray(response?.chats) ? response.chats : [];
    for (const chat of rows) visit(chat);
    const nextCursor = typeof response?.cursor === 'string' && response.cursor ? response.cursor : undefined;
    if (!nextCursor || rows.length === 0) break;
    cursor = nextCursor;
  }
}

/** The complete set of group chat IDs/public usernames the viewer belongs to, independent of how much of the capped sidebar inbox has loaded. */
export async function fetchJoinedGroupIds(): Promise<{ ids: Set<string>; usernames: Set<string> }> {
  const ids = new Set<string>();
  const usernames = new Set<string>();
  await walkJoinedChats(chat => {
    if (chat?.type !== 'group' || !chat?.id) return;
    ids.add(String(chat.id));
    if (chat.public_username) usernames.add(String(chat.public_username));
  });
  return { ids, usernames };
}

/** Finds the viewer's own joined groups matching `query` by title or public username, beyond whatever the capped sidebar list already has cached. */
export async function searchJoinedGroupChats(query: string, language: string): Promise<any[]> {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];
  const matches: any[] = [];
  await walkJoinedChats(chat => {
    if (chat?.type !== 'group' || !chat?.id) return;
    const title = String(getLocalizedContent(chat.title, language) || '').toLocaleLowerCase();
    const username = String(chat.public_username || '').toLocaleLowerCase();
    if (title.includes(needle) || username.includes(needle)) matches.push(chat);
  });
  return matches;
}
