import { api } from '@/services/api';
import { Actions } from '@/services/actions';

export type Friend = { request_id: string; requester_id: string; recipient_id: string; status: string; user: { id: string; username: string; displayname: string; avatar?: { file?: { url?: string } } } };
export type Photo = { public_id: string; processing_status: string; file: { url?: string; variants?: { image?: { medium?: { url: string }; thumbnail?: { url: string } } } } };
export type PhotoAccess = { status: string; request_id?: string };
export type AccessRequest = { request_id: string; viewer_id: string; status: string; viewer: { username: string; displayname: string } };
const call = <T,>(action: typeof Actions[keyof typeof Actions], body: Record<string, unknown> = {}) => api.call<T>(action, { method: 'POST', body });
export const socialApi = {
 status: (user_id: string) => call<{ friendship: Friend | null }>(Actions.CMD_FRIEND_STATUS, { user_id }),
 request: (user_id: string) => call<{ friendship: Friend }>(Actions.CMD_FRIEND_REQUEST, { user_id }),
 change: (request_id: string, decision: 'accepted' | 'denied' | 'cancelled' | 'removed') => call<{ friendship: Friend }>(decision === 'cancelled' ? Actions.CMD_FRIEND_CANCEL : decision === 'removed' ? Actions.CMD_FRIEND_REMOVE : Actions.CMD_FRIEND_RESPOND, { request_id, decision }),
 friends: (scope: string, cursor?: string) => call<{ friendships: Friend[]; cursor?: string }>(scope === 'friends' ? Actions.CMD_FRIEND_FETCH : Actions.CMD_FRIEND_REQUESTS, { scope, cursor, limit: 30 }),
 photos: (owner_id: string, privateAlbum: boolean) => call<{ photos: Photo[]; count: number; access?: PhotoAccess }>(privateAlbum ? Actions.CMD_PRIVATE_PHOTOS_FETCH : Actions.CMD_PROFILE_PHOTOS_FETCH, { owner_id }),
 upload: (photos: File[], onProgress?: (progress: number | null) => void) => api.call<{ photos: Photo[] }>(Actions.CMD_PRIVATE_PHOTOS_UPLOAD, { method: 'POST', body: { 'photos[]': photos }, onUploadProgress: event => onProgress?.(event.total ? Math.min(100, Math.floor(event.loaded * 100 / event.total)) : null) }),
 move: (photo_id: string, privateAlbum: boolean) => call(Actions.CMD_PHOTOS_MOVE, { photo_id, destination: privateAlbum ? 'private_photo' : 'profile' }),
 delete: (photo_id: string) => call(Actions.CMD_PRIVATE_PHOTOS_DELETE, { photo_id }),
 requestPhotos: (owner_id: string) => call<{ access: PhotoAccess }>(Actions.CMD_PHOTO_ACCESS_REQUEST, { owner_id }),
 accessRequests: () => call<{ requests: AccessRequest[] }>(Actions.CMD_PHOTO_ACCESS_REQUESTS),
 respondPhotos: (request_id: string, decision: string) => call<{ access: PhotoAccess }>(Actions.CMD_PHOTO_ACCESS_RESPOND, { request_id, decision }),
 ownGrant: (viewer_id: string) => call<{ access: PhotoAccess }>(Actions.CMD_PHOTO_ACCESS_STATUS, { viewer_id }),
 setOwnGrant: (viewer_id: string, show: boolean) => call<{ access: PhotoAccess }>(show ? Actions.CMD_PHOTO_ACCESS_GRANT : Actions.CMD_PHOTO_ACCESS_REVOKE, { viewer_id }),
};
