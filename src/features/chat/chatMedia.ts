import { defaultServiceServerId, serviceURL } from '@/appSettings';
import { buildSafeURL } from '@/helpers/helpers';
import type { Attachment } from '@/state/chat';

export type ChatMediaKind = 'image' | 'video';

export interface ResolvedChatMedia {
  attachmentId: string;
  kind: ChatMediaKind;
  src: string;
  previewSrc: string;
  posterSrc?: string;
  name: string;
  mimeType: string;
  aspectRatio: number;
}

type VariantMap = Record<string, { url?: string; width?: number; height?: number } | undefined>;

const mediaAspectRatio = (file: Attachment['file'], variants: VariantMap | undefined): number => {
  const dimensions = [file, ...Object.values(variants || {})];
  for (const item of dimensions) {
    if (item?.width && item.height && Number.isFinite(item.width) && Number.isFinite(item.height) && item.width > 0 && item.height > 0) return item.width / item.height;
  }
  // Legacy messages lack dimensions. Reserve a stable frame even before fetch/decode.
  return 4 / 3;
};

const resolvePath = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('blob:') || path.startsWith('data:')) return path;
  return buildSafeURL(serviceURL[defaultServiceServerId], path);
};

const firstVariantUrl = (variants: VariantMap | undefined, order: string[]): string | null => {
  if (!variants) return null;
  for (const key of order) {
    const url = resolvePath(variants[key]?.url);
    if (url) return url;
  }
  return null;
};

export const resolveAttachmentFileUrl = (attachment: Attachment): string | null => {
  return resolvePath(attachment.file.url) || resolvePath(attachment.file.storage_path);
};

export const resolveChatMedia = (attachment: Attachment): ResolvedChatMedia | null => {
  const file = attachment.file;
  const mimeType = file.mime_type || '';
  const imageVariants = file.variants?.image as VariantMap | undefined;
  const videoVariants = file.variants?.video as VariantMap | undefined;
  const directUrl = resolveAttachmentFileUrl(attachment);

  if (mimeType.startsWith('image/')) {
    const src = firstVariantUrl(
      imageVariants,
      ['original', 'large', 'medium', 'small', 'thumbnail', 'icon'],
    ) || directUrl;
    if (!src) return null;

    return {
      attachmentId: attachment.id,
      kind: 'image',
      src,
      previewSrc: firstVariantUrl(
        imageVariants,
        ['medium', 'small', 'thumbnail', 'large', 'original', 'icon'],
      ) || src,
      name: file.name || 'Image',
      mimeType,
      aspectRatio: mediaAspectRatio(file, imageVariants),
    };
  }

  if (mimeType.startsWith('video/')) {
    const src = firstVariantUrl(
      videoVariants,
      ['original', 'high', 'medium', 'large', 'low', 'small', 'preview'],
    ) || directUrl;
    if (!src) return null;

    const posterSrc = firstVariantUrl(videoVariants, ['poster', 'thumbnail'])
      || firstVariantUrl(imageVariants, ['large', 'medium', 'small', 'thumbnail', 'original']);

    return {
      attachmentId: attachment.id,
      kind: 'video',
      src,
      previewSrc: posterSrc || src,
      posterSrc: posterSrc || undefined,
      name: file.name || 'Video',
      mimeType,
      aspectRatio: mediaAspectRatio(file, videoVariants),
    };
  }

  return null;
};

export const resolveChatMediaItems = (attachments?: Attachment[]): ResolvedChatMedia[] => (
  attachments?.map(resolveChatMedia).filter((item): item is ResolvedChatMedia => Boolean(item)) || []
);
