import { api } from '@/services/api';
import { Actions } from '@/services/actions';
import { normalizeEmoticon, type ChatEmoticon } from './types';

type Page = { documents: ChatEmoticon[]; nextOffset: string };
// tweb gifs.ts: coalesce pending searches and retain pages while the search is active.
const pages = new Map<string, Promise<Page>>();
export const appGifsManager = {
 searchGifs(query: string, nextOffset = '', retry = false): Promise<Page> {
  const key = JSON.stringify([query.trim(), nextOffset]);
  if (retry) pages.delete(key);
  const cached = pages.get(key); if (cached) return cached;
  const request = api.call(Actions.CMD_CHAT_GIFS_SEARCH, { method: 'POST', body: { query: query.trim(), offset: nextOffset } }).then(data => ({ documents: (data.documents || []).flatMap((item: unknown) => { const valid = normalizeEmoticon(item); return valid?.kind === 'gif' ? [valid] : []; }), nextOffset: data.nextOffset || '' })).catch(error => { pages.delete(key); throw error; });
  pages.set(key, request);
  while (pages.size > 32) pages.delete(pages.keys().next().value!);
  return request;
 },
};
