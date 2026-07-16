import React, { useState, useRef, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate, useLocation } from '@/router';
import AuthWizard from '../features/auth/AuthWizard';
import ProfileScreen from './ProfileScreen';
import { api } from '../services/api';
import { Actions } from '../services/actions';
import {
  MessageCircle,
  Search,
  Send,
  MoreVertical,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  ArrowLeft,
  X,
  Settings,
  PlusSquare,
  Lock,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Image,
  Video,
  Timer,
  Eye,
  EyeOff,
  CircleAlert,
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { getSafeImageURLEx } from '../helpers/helpers';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';
import { useAtom } from 'jotai';
import { chatStateAtom, initialChatState, type Attachment, type ChatItem, type ChatMessage } from '@/state/chat';
import ChatMediaViewer from '@/features/chat/ChatMediaViewer';
import {
  resolveChatMedia,
  resolveChatMediaItems,
} from '@/features/chat/chatMedia';
import type { ResolvedChatMedia } from '@/features/chat/chatMedia';

type MessageExpirySeconds = 0 | 10 | 60 | 3600 | 86400 | 604800;

const MESSAGE_EXPIRY_OPTIONS: MessageExpirySeconds[] = [0, 10, 60, 3600, 86400, 604800];
const MESSAGE_EXPIRY_LABEL_KEYS: Record<MessageExpirySeconds, string> = {
  0: 'messages.expiry_permanent',
  10: 'messages.expiry_10_seconds',
  60: 'messages.expiry_1_minute',
  3600: 'messages.expiry_1_hour',
  86400: 'messages.expiry_24_hours',
  604800: 'messages.expiry_7_days',
};

interface BackendChatMessage {
  id?: string;
  public_id?: string | number;
  author_id?: string;
  contentable_id?: string;
  chat_id?: string;
  content?: Record<string, unknown> | string | null;
  text?: string | null;
  created_at?: string;
  expires_at?: string | null;
  expires_in_seconds?: number | string | null;
  opened_at?: string | null;
  is_disappearing?: boolean | number | string;
  content_hidden?: boolean | number | string;
  client_id?: string;
  view_once?: boolean | number | string;
  viewed_once?: boolean | number | string;
  attachments?: Attachment[];
  extras?: Record<string, unknown> | null;
}

interface ViewOnceSession {
  messageId: string;
  items: ResolvedChatMedia[];
}

interface NormalizeMessageOptions {
  fallbackId?: string;
  fallbackText?: string;
  fallbackTime?: string;
  fallbackSender?: 'me' | 'other';
}

const getMessageText = (message: BackendChatMessage, fallback = ''): string => {
  if (typeof message.content === 'string') return message.content;
  if (message.content && typeof message.content === 'object') {
    const localized = message.content.en
      || message.content.tr
      || Object.values(message.content).find((value) => typeof value === 'string' && value);
    if (typeof localized === 'string') return localized;
  }
  if (typeof message.text === 'string') return message.text;
  return fallback;
};

const getMessageExpiresAt = (message: BackendChatMessage): string | null => {
  const value = message.expires_at ?? message.extras?.expires_at;
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;
};

const getMessageOpenedAt = (message: BackendChatMessage): string | null => {
  const value = message.opened_at ?? message.extras?.opened_at;
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;
};

const getMessageExpirySeconds = (message: BackendChatMessage): number | null => {
  const value = message.expires_in_seconds ?? message.extras?.expires_in_seconds;
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
};

const getBooleanValue = (value: unknown): boolean => (
  value === true || value === 1 || value === '1' || value === 'true'
);

const getViewOnceAttachments = (payload: unknown): Attachment[] => {
  const attachments: Attachment[] = [];
  const visited = new Set<unknown>();

  const collect = (value: unknown) => {
    if (!value || typeof value !== 'object' || visited.has(value)) return;
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }

    const record = value as Record<string, unknown>;
    const rawFile = record.file && typeof record.file === 'object'
      ? record.file as Record<string, unknown>
      : null;
    const fileRecord = rawFile || record;
    const rawUrl = fileRecord.url ?? fileRecord.storage_path;
    const rawMimeType = fileRecord.mime_type ?? fileRecord.mimeType;
    const rawBase64 = fileRecord.data_base64;
    const rawVariants = fileRecord.variants;
    const looksLikeAttachment = Boolean(rawFile)
      || typeof rawUrl === 'string'
      || typeof rawBase64 === 'string'
      || (rawVariants !== null && typeof rawVariants === 'object');

    if (looksLikeAttachment) {
      const attachmentId = String(record.id ?? `view-once-attachment-${attachments.length}`);
      const fileId = String(fileRecord.id ?? `view-once-file-${attachments.length}`);
      const mimeType = typeof rawMimeType === 'string' && rawMimeType
        ? rawMimeType
        : 'image/jpeg';
      const resolvedUrl = typeof rawBase64 === 'string' && rawBase64
        ? rawBase64.startsWith('data:') ? rawBase64 : `data:${mimeType};base64,${rawBase64}`
        : typeof fileRecord.url === 'string' ? fileRecord.url : '';
      const name = typeof fileRecord.name === 'string' && fileRecord.name
        ? fileRecord.name
        : 'View-once photo';
      attachments.push({
        id: attachmentId,
        file: {
          id: fileId,
          url: resolvedUrl,
          storage_path: typeof fileRecord.storage_path === 'string' ? fileRecord.storage_path : undefined,
          mime_type: mimeType,
          name,
          variants: rawVariants && typeof rawVariants === 'object'
            ? rawVariants as Attachment['file']['variants']
            : undefined,
        },
      });
      return;
    }

    ['data', 'message', 'attachment', 'attachments', 'media'].forEach((key) => collect(record[key]));
  };

  collect(payload);
  return attachments;
};

const getOpenedMessage = (payload: unknown): BackendChatMessage | null => {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const nestedMessage = record.message;
  if (nestedMessage && typeof nestedMessage === 'object') {
    return nestedMessage as BackendChatMessage;
  }
  const nestedData = record.data;
  if (nestedData && typeof nestedData === 'object') {
    return getOpenedMessage(nestedData);
  }
  if (
    'id' in record
    || 'public_id' in record
    || 'content' in record
    || 'attachments' in record
    || 'expires_at' in record
  ) {
    return record as BackendChatMessage;
  }
  return null;
};

const normalizeChatMessage = (
  message: BackendChatMessage,
  currentUserId: string,
  options: NormalizeMessageOptions = {},
): ChatMessage => {
  const createdAt = typeof message.created_at === 'string' ? message.created_at : undefined;
  const viewOnce = getBooleanValue(message.view_once ?? message.extras?.view_once);
  const contentHidden = getBooleanValue(message.content_hidden ?? message.extras?.content_hidden);
  const openedAt = getMessageOpenedAt(message);
  const expiresInSeconds = getMessageExpirySeconds(message);
  const rawExpiresAt = getMessageExpiresAt(message);
  const sender: ChatMessage['sender'] = message.author_id
    ? (String(message.author_id) === String(currentUserId) ? 'me' : 'other')
    : options.fallbackSender || 'other';
  const isDisappearing = getBooleanValue(message.is_disappearing ?? message.extras?.is_disappearing)
    || expiresInSeconds !== null
    || rawExpiresAt !== null;
  const time = createdAt && Number.isFinite(Date.parse(createdAt))
    ? new Date(createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : options.fallbackTime || '00:00';
  const rawId = message.id ?? message.public_id ?? options.fallbackId ?? `message-${Date.now()}`;

  return {
    id: String(rawId),
    text: contentHidden && sender === 'other'
      ? ''
      : getMessageText(message, options.fallbackText),
    time,
    sender,
    // View-once media URLs must only live in the short-lived viewer session.
    attachments: !viewOnce
      && !(contentHidden && sender === 'other')
      && Array.isArray(message.attachments)
      ? message.attachments
      : undefined,
    createdAt,
    expiresAt: openedAt ? rawExpiresAt : null,
    expiresInSeconds,
    openedAt,
    isDisappearing,
    contentHidden,
    clientId: typeof (message.client_id ?? message.extras?.client_id) === 'string'
      ? String(message.client_id ?? message.extras?.client_id)
      : undefined,
    viewOnce,
    viewedOnce: getBooleanValue(message.viewed_once ?? message.extras?.viewed_once),
  };
};

const isMessageExpired = (message: ChatMessage, now = Date.now()): boolean => {
  if (!message.expiresAt) return false;
  const expiresAt = Date.parse(message.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt <= now;
};

const getAttachmentSignature = (message: ChatMessage): string => (
  (message.attachments || []).map((attachment) => attachment.file.mime_type || '').join('|')
);

interface MessageItemProps {
  msg: ChatMessage;
  theme: 'dark' | 'light';
  nowMs: number;
  onContextMenu: (point: { clientX: number; clientY: number }, id: string) => void;
  onMediaOpen: (messageId: string, attachmentId: string) => void;
  onMessageOpen: (messageId: string) => void;
  isMessageOpening: boolean;
  hasViewOnceOpenError: boolean;
}

interface ViewOnceMessageCardProps {
  messageId: string;
  theme: 'dark' | 'light';
  isMe: boolean;
  isViewed: boolean;
  isOpening: boolean;
  hasOpenError: boolean;
  onOpen: () => void;
}

const ViewOnceMessageCard: React.FC<ViewOnceMessageCardProps> = ({
  messageId,
  theme,
  isMe,
  isViewed,
  isOpening,
  hasOpenError,
  onOpen,
}) => {
  const { t } = useTranslation('common');
  const state = hasOpenError
    ? 'error'
    : isViewed
      ? 'viewed'
      : isMe
        ? 'sent'
        : isOpening
          ? 'opening'
          : 'unopened';
  const isActionable = state === 'unopened' || state === 'opening';
  const title = state === 'error'
    ? t('messages.view_once_unavailable')
    : state === 'viewed'
      ? t('messages.view_once_viewed')
      : state === 'sent'
        ? t('messages.view_once_sent')
        : state === 'opening'
          ? t('messages.view_once_loading')
          : t('messages.view_once_open');
  const description = state === 'error'
    ? t('messages.view_once_unavailable_description')
    : state === 'viewed'
      ? t('messages.view_once_viewed_description')
      : t('messages.view_once_description');
  const statusLabel = state === 'error'
    ? t('messages.view_once_status_error')
    : state === 'viewed'
      ? t('messages.view_once_status_viewed')
      : state === 'sent'
        ? t('messages.view_once_status_sent')
        : t('messages.view_once_label');
  const StateIcon = state === 'error'
    ? CircleAlert
    : state === 'viewed'
      ? EyeOff
      : state === 'opening'
        ? RefreshCw
        : Eye;
  const surfaceClass = state === 'error'
    ? isMe
      ? 'border-rose-200/30 bg-rose-950/20 text-white'
      : theme === 'dark'
        ? 'border-rose-400/20 bg-gradient-to-br from-rose-950/60 via-zinc-900/95 to-zinc-900/95 text-zinc-100'
        : 'border-rose-200 bg-gradient-to-br from-rose-50 via-white to-white text-slate-900'
    : isMe
      ? 'border-white/25 bg-white/[0.13] text-white'
      : theme === 'dark'
        ? 'border-white/10 bg-gradient-to-br from-sky-400/[0.12] via-zinc-900/95 to-zinc-900/95 text-zinc-100'
        : 'border-sky-100 bg-gradient-to-br from-sky-50 via-white to-white text-slate-900';
  const iconClass = state === 'error'
    ? isMe
      ? 'bg-rose-300/20 text-rose-50 ring-rose-100/25'
      : theme === 'dark'
        ? 'bg-rose-400/10 text-rose-300 ring-rose-400/15'
        : 'bg-rose-100 text-rose-600 ring-rose-200'
    : isMe
      ? 'bg-white/20 text-white ring-white/25'
      : theme === 'dark'
        ? 'bg-sky-400/10 text-sky-300 ring-sky-400/15'
        : 'bg-sky-100 text-sky-700 ring-sky-200';
  const secondaryTextClass = isMe
    ? 'text-white/70'
    : theme === 'dark' ? 'text-zinc-400' : 'text-slate-500';

  const content = (
    <>
      <span
        className={`pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl ${state === 'error'
          ? 'bg-rose-400/15'
          : 'bg-sky-400/15'
          }`}
        aria-hidden="true"
      />
      <span
        className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ${iconClass}`}
        aria-hidden="true"
      >
        <StateIcon className={`h-6 w-6 ${state === 'opening' ? 'animate-spin' : ''}`} />
        {(state === 'unopened' || state === 'sent') && (
          <span className={`absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border px-1 text-[10px] font-black shadow-sm ${isMe
            ? 'border-sky-500 bg-white text-sky-700'
            : theme === 'dark'
              ? 'border-zinc-900 bg-sky-400 text-zinc-950'
              : 'border-white bg-sky-600 text-white'
            }`}>
            1
          </span>
        )}
      </span>

      <span className="relative min-w-0 flex-1 text-left">
        <span className={`mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] ${state === 'error'
          ? isMe ? 'text-rose-100/80' : theme === 'dark' ? 'text-rose-300/80' : 'text-rose-600'
          : secondaryTextClass
          }`}>
          {statusLabel}
        </span>
        <span className="block text-sm font-bold leading-tight">{title}</span>
        <span className={`mt-1 block text-[11px] font-medium leading-snug ${secondaryTextClass}`}>
          {description}
        </span>
      </span>

      {state === 'unopened' && (
        <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isMe
          ? 'bg-white/15 text-white'
          : theme === 'dark' ? 'bg-white/[0.06] text-sky-300' : 'bg-sky-100 text-sky-700'
          }`} aria-hidden="true">
          <Eye className="h-4 w-4" />
        </span>
      )}
    </>
  );

  const sharedClassName = `relative flex w-[clamp(13.5rem,70vw,17rem)] max-w-full items-center gap-3 overflow-hidden rounded-[20px] border p-3.5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.6)] ${surfaceClass}`;
  const accessibleLabel = `${title}. ${description}`;

  if (isActionable) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onOpen();
        }}
        disabled={isOpening}
        aria-label={accessibleLabel}
        aria-busy={isOpening}
        data-view-once-message={messageId}
        data-view-once-state={state}
        className={`${sharedClassName} transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-28px_rgba(14,165,233,0.8)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:cursor-wait disabled:hover:translate-y-0 ${isMe
          ? 'focus-visible:ring-offset-sky-600'
          : theme === 'dark' ? 'focus-visible:ring-offset-zinc-950' : 'focus-visible:ring-offset-white'
          }`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      role={state === 'error' ? 'status' : 'group'}
      aria-label={accessibleLabel}
      aria-live={state === 'error' ? 'polite' : undefined}
      data-view-once-message={messageId}
      data-view-once-state={state}
      className={sharedClassName}
    >
      {content}
    </div>
  );
};

const MessageItem: React.FC<MessageItemProps> = ({
  msg,
  theme,
  nowMs,
  onContextMenu,
  onMediaOpen,
  onMessageOpen,
  isMessageOpening,
  hasViewOnceOpenError,
}) => {
  const [isPressed, setIsPressed] = React.useState(false);
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMe = msg.sender === 'me';
  const isHiddenDisappearing = Boolean(
    msg.isDisappearing && msg.contentHidden && !isMe && !msg.viewOnce,
  );
  const { t } = useTranslation('common');
  const expiresAtMs = msg.expiresAt ? Date.parse(msg.expiresAt) : Number.NaN;
  const remainingSeconds = Number.isFinite(expiresAtMs)
    ? Math.max(0, Math.ceil((expiresAtMs - nowMs) / 1000))
    : null;
  const countdown = remainingSeconds === null
    ? null
    : (() => {
      const days = Math.floor(remainingSeconds / 86400);
      const hours = Math.floor((remainingSeconds % 86400) / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds % 60;
      const clock = hours > 0
        ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      return days > 0 ? `${t('messages.days_short', { count: days })} ${clock}` : clock;
    })();

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPressed(true);
    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;
    longPressTimer.current = setTimeout(() => {
      setIsPressed(false);
      onContextMenu({ clientX, clientY }, msg.id);
    }, 400); // 400ms for slightly snappier opening
  };

  const cancelLongPress = () => {
    setIsPressed(false);
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  return (
    <div
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`}
      onTouchStart={handleTouchStart}
      onTouchEnd={cancelLongPress}
      onTouchMove={cancelLongPress}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu({ clientX: e.clientX, clientY: e.clientY }, msg.id);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {/* Message Bubble */}
      <motion.div
        animate={{ scale: isPressed ? 0.96 : 1, opacity: isPressed ? 0.9 : 1 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        style={{
          transformOrigin: isMe ? 'right center' : 'left center',
          borderRadius: isMe
            ? '18px 18px 4px 18px'
            : '18px 18px 18px 4px',
        }}
        className={`${msg.viewOnce
          ? 'max-w-[88%] px-2.5 py-2 sm:max-w-sm'
          : 'max-w-[78%] px-4 py-2.5 sm:max-w-xs md:max-w-sm'
          } shadow-[0_18px_45px_-24px_rgba(15,23,42,0.35)] relative border backdrop-blur-2xl ${theme === 'dark'
          ? isMe ? 'bg-sky-500/95 text-white border-sky-300/20 shadow-sky-950/30' : 'bg-zinc-900/80 text-zinc-100 border-white/10'
          : isMe ? 'bg-sky-600 text-white border-sky-500/40 shadow-sky-500/20' : 'bg-white/[0.85] text-slate-900 border-white/70'
          }`}
      >
        {msg.viewOnce && (
          <div className="mb-2">
            <ViewOnceMessageCard
              messageId={msg.id}
              theme={theme}
              isMe={isMe}
              isViewed={Boolean(msg.viewedOnce)}
              isOpening={isMessageOpening}
              hasOpenError={hasViewOnceOpenError}
              onOpen={() => onMessageOpen(msg.id)}
            />
          </div>
        )}

        {isHiddenDisappearing && (
          <div className={`mb-2 min-w-[190px] overflow-hidden rounded-2xl border p-2 ${theme === 'dark'
            ? 'border-white/10 bg-white/[0.05]'
            : 'border-white/80 bg-white/65'
            }`}>
            <div className={`mb-2 flex items-center gap-2 rounded-xl px-3 py-3 backdrop-blur-2xl ${theme === 'dark'
              ? 'bg-gradient-to-r from-white/[0.08] to-white/[0.03] text-zinc-300'
              : 'bg-gradient-to-r from-slate-100/90 to-white/70 text-slate-600'
              }`}>
              <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="text-xs font-semibold">{t('messages.hidden_disappearing_message')}</span>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onMessageOpen(msg.id);
              }}
              disabled={isMessageOpening}
              aria-label={isMessageOpening
                ? t('messages.opening_disappearing_message')
                : t('messages.open_disappearing_message')}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-wait ${theme === 'dark'
                ? 'bg-sky-400 text-zinc-950 hover:bg-sky-300'
                : 'bg-sky-600 text-white hover:bg-sky-700'
                }`}
            >
              {isMessageOpening ? (
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{isMessageOpening
                ? t('messages.opening_disappearing_message')
                : t('messages.open_disappearing_message')}</span>
            </button>
          </div>
        )}

        {/* Media Files */}
        {!msg.viewOnce && !isHiddenDisappearing && msg.attachments && msg.attachments.length > 0 && (
          <div className={`mb-2 flex max-w-[240px] flex-wrap gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {msg.attachments.map((attachment, idx) => {
              const file = attachment.file;
              const media = resolveChatMedia(attachment);
              const isImage = media?.kind === 'image';
              const isVideo = media?.kind === 'video';
              const thumbSizeClass = msg.attachments?.length === 1 && !msg.text ? 'h-[108px] w-[108px]' : 'h-[72px] w-[72px]';
              const thumbClass = `${thumbSizeClass} group/media relative shrink-0 overflow-hidden rounded-full border shadow-[0_16px_40px_-22px_rgba(15,23,42,0.65)] transition-transform duration-200 hover:scale-[1.03] ${isMe ? 'border-white/35 bg-white/18' : theme === 'dark' ? 'border-white/12 bg-white/8' : 'border-white/80 bg-slate-100/80'}`;

              return (
                <React.Fragment key={attachment.id || idx}>
                  {isImage && media ? (
                    <button
                      type="button"
                      onClick={() => onMediaOpen(msg.id, media.attachmentId)}
                      className={thumbClass}
                      title={file.name}
                      aria-label={t('messages.open_image', { name: file.name })}
                    >
                      <img
                        src={media.previewSrc}
                        alt={file.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover/media:scale-110"
                      />
                      <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/30" />
                    </button>
                  ) : isVideo && media ? (
                    <button
                      type="button"
                      onClick={() => onMediaOpen(msg.id, media.attachmentId)}
                      className={thumbClass}
                      title={file.name}
                      aria-label={t('messages.open_video', { name: file.name })}
                    >
                      {media.posterSrc ? (
                        <img
                          src={media.posterSrc}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <video
                          src={media.src}
                          muted
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-cover"
                        />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/28">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow-lg">
                          <Video className="h-4 w-4" />
                        </span>
                      </span>
                      <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/30" />
                    </button>
                  ) : (
                    <div
                      className={`flex max-w-[220px] items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 ${isMe ? 'border-white/30 bg-white/16' : theme === 'dark' ? 'border-white/10 bg-white/8' : 'border-white/80 bg-slate-100/85'}`}
                      title={file.name}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isMe ? 'bg-white/22 text-white' : theme === 'dark' ? 'bg-white/10 text-zinc-200' : 'bg-white text-slate-600'}`}>
                        <Paperclip className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className={`truncate text-xs font-semibold ${isMe ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{file.name}</p>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Text Content */}
        {!isHiddenDisappearing && msg.text && (
          <div className="text-sm leading-relaxed mb-1 whitespace-pre-wrap break-words">
            {msg.text}
          </div>
        )}

        {/* Time and Status */}
        <div className={`flex items-center ${isMe ? 'justify-end' : ''} mt-1 gap-1`}>
          {countdown !== null && (
            <span
              className={`mr-1 inline-flex items-center gap-1 text-[10px] font-semibold ${isMe ? 'text-white/80' : theme === 'dark' ? 'text-amber-300' : 'text-amber-700'}`}
              title={t('messages.disappearing_message')}
            >
              <Timer className="h-3 w-3" />
              {countdown}
            </span>
          )}
          {isMe && msg.isDisappearing && !msg.openedAt && !msg.viewOnce && (
            <span
              className="mr-1 inline-flex items-center gap-1 text-[10px] font-semibold text-white/80"
              title={t('messages.waiting_to_open')}
            >
              <Timer className="h-3 w-3" />
              {t('messages.waiting_to_open')}
            </span>
          )}
          <span className={`text-[10px] ${isMe
            ? 'text-white/70'
            : theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'
            }`}>{msg.time}</span>
          {isMe && <CheckCheck className="w-3 h-3 text-white/70" />}
        </div>
      </motion.div>
    </div>
  );
};

interface SelectedMediaThumbnailProps {
  file: File;
  kind: 'image' | 'video';
  index: number;
  theme: 'dark' | 'light';
  onRemove: (index: number) => void;
  removeLabel: string;
}

const SelectedMediaThumbnail: React.FC<SelectedMediaThumbnailProps> = ({
  file,
  kind,
  index,
  theme,
  onRemove,
  removeLabel,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (kind !== 'image') return;
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, kind]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.04, 0.16) }}
      className="group relative h-[68px] w-[68px] shrink-0 overflow-visible"
      title={file.name}
    >
      <div className={`h-full w-full overflow-hidden rounded-full border shadow-[0_16px_40px_-24px_rgba(15,23,42,0.75)] ${theme === 'dark' ? 'border-white/12 bg-white/10' : 'border-white/85 bg-white/70'}`}>
        {kind === 'image' && previewUrl ? (
          <img
            src={previewUrl}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-800 to-sky-950">
            {kind === 'video' ? <Video className="h-6 w-6 text-white" /> : <Image className="h-6 w-6 text-white" />}
          </div>
        )}
      </div>
      <motion.button
        type="button"
        onClick={() => onRemove(index)}
        aria-label={removeLabel}
        className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/70 bg-slate-950 text-white shadow-lg transition-transform duration-150 hover:scale-105"
        whileTap={{ scale: 0.9 }}
      >
        <X className="h-3.5 w-3.5" />
      </motion.button>
      {kind === 'video' && (
        <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border border-white/70 bg-white text-slate-950 shadow-md">
          <Video className="h-3.5 w-3.5" />
        </span>
      )}
    </motion.div>
  );
};


const MessagesScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const { setShowBottomBar } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('common');
  const [chatState, setChatState] = useAtom(chatStateAtom);
  const chatsList = chatState.chatsList;
  const selectedChat = chatState.selectedChatId;
  const messages = chatState.messages;
  const isLoadingChats = chatState.isLoadingChats;
  const isLoadingMessages = chatState.isLoadingMessages;
  const isRefreshingMessages = chatState.isRefreshingMessages;
  const chatsMutationVersionRef = useRef(0);
  const chatsRefreshRequestRef = useRef(0);
  const refreshChatsRef = useRef<(() => Promise<void>) | null>(null);
  const setChatsList = useCallback((updater: ChatItem[] | ((prev: ChatItem[]) => ChatItem[])) => {
    chatsMutationVersionRef.current += 1;
    setChatState(prev => ({
      ...prev,
      chatsList: typeof updater === 'function' ? (updater as (prev: ChatItem[]) => ChatItem[])(prev.chatsList) : updater
    }));
  }, [setChatState]);
  const setSelectedChat = useCallback((value: string | null) => {
    setChatState(prev => ({ ...prev, selectedChatId: value }));
  }, [setChatState]);
  const setMessages = useCallback((updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setChatState(prev => ({
      ...prev,
      messages: typeof updater === 'function' ? (updater as (prev: ChatMessage[]) => ChatMessage[])(prev.messages) : updater
    }));
  }, [setChatState]);
  const setIsLoadingChats = useCallback((value: boolean) => {
    setChatState(prev => ({ ...prev, isLoadingChats: value }));
  }, [setChatState]);
  const setIsLoadingMessages = useCallback((value: boolean) => {
    setChatState(prev => ({ ...prev, isLoadingMessages: value }));
  }, [setChatState]);
  const setIsRefreshingMessages = useCallback((value: boolean) => {
    setChatState(prev => ({ ...prev, isRefreshingMessages: value }));
  }, [setChatState]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups' | 'unencrypted'>('all');
  const [message, setMessage] = useState('');
  const [messageExpirySeconds, setMessageExpirySeconds] = useState<MessageExpirySeconds>(0);
  const [viewOnceEnabled, setViewOnceEnabled] = useState(false);
  const [countdownNow, setCountdownNow] = useState(() => Date.now());
  const [activeMedia, setActiveMedia] = useState<{ messageId: string; attachmentId: string } | null>(null);
  const [viewOnceSession, setViewOnceSession] = useState<ViewOnceSession | null>(null);
  const [openingMessageIds, setOpeningMessageIds] = useState<Set<string>>(() => new Set());
  const [viewOnceOpenErrorIds, setViewOnceOpenErrorIds] = useState<Set<string>>(() => new Set());
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const viewOnceImageInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [inputHeight, setInputHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [messageMenuPosition, setMessageMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [resolvedMessageMenuPosition, setResolvedMessageMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const messageMenuRef = useRef<HTMLDivElement>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [openChatItemMenu, setOpenChatItemMenu] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const { socket } = useSocket();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const typingIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentChatRoomRef = useRef<string | null>(null); // Track current joined chat room
  const optimisticObjectUrlsRef = useRef<Map<string, string[]>>(new Map());
  const messageOpenRequestsRef = useRef<Set<string>>(new Set());

  const closeMediaViewer = useCallback(() => {
    setActiveMedia(null);
    setViewOnceSession(null);
  }, []);

  const openMediaViewer = useCallback((messageId: string, attachmentId: string) => {
    setViewOnceSession(null);
    setActiveMedia({ messageId, attachmentId });
  }, []);

  useEffect(() => {
    const hasExpiringMessages = messages.some((chatMessage) => Boolean(chatMessage.expiresAt));
    if (!hasExpiringMessages) return;

    setCountdownNow(Date.now());
    const intervalId = window.setInterval(() => setCountdownNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [messages]);

  useEffect(() => {
    const expirationTimes = messages
      .map((chatMessage) => chatMessage.expiresAt ? Date.parse(chatMessage.expiresAt) : Number.NaN)
      .filter(Number.isFinite);
    if (expirationTimes.length === 0) return;

    const nextExpiration = Math.min(...expirationTimes);
    const timeoutId = window.setTimeout(() => {
      const now = Date.now();
      const expiredIds = new Set(
        messages.filter((chatMessage) => isMessageExpired(chatMessage, now)).map((chatMessage) => chatMessage.id),
      );
      if (expiredIds.size === 0) return;

      setMessages((prev) => {
        const next = prev.filter((chatMessage) => !expiredIds.has(chatMessage.id));
        return next.length === prev.length ? prev : next;
      });
      setActiveMedia((current) => current && expiredIds.has(current.messageId) ? null : current);
      setViewOnceSession((current) => current && expiredIds.has(current.messageId) ? null : current);
      void refreshChatsRef.current?.();
    }, Math.max(0, nextExpiration - Date.now() + 50));

    return () => window.clearTimeout(timeoutId);
  }, [messages, setMessages]);

  useEffect(() => {
    if (!activeMedia) return;
    const activeMessage = messages.find((chatMessage) => chatMessage.id === activeMedia.messageId);
    const attachmentStillExists = activeMessage?.attachments?.some(
      (attachment) => attachment.id === activeMedia.attachmentId,
    );
    if (!activeMessage || !attachmentStillExists || isMessageExpired(activeMessage)) {
      setActiveMedia(null);
    }
  }, [activeMedia, messages]);

  useEffect(() => {
    if (!viewOnceSession) return;
    const sessionMessage = messages.find((chatMessage) => chatMessage.id === viewOnceSession.messageId);
    if (!sessionMessage || isMessageExpired(sessionMessage)) {
      setViewOnceSession(null);
    }
  }, [messages, viewOnceSession]);

  useEffect(() => {
    setActiveMedia(null);
    setViewOnceSession(null);
    setOpeningMessageIds(new Set());
    setViewOnceOpenErrorIds(new Set());
    setSelectedImages([]);
    setSelectedVideos([]);
    setViewOnceEnabled(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (viewOnceImageInputRef.current) viewOnceImageInputRef.current.value = '';
  }, [selectedChat]);

  useEffect(() => {
    const referencedBlobUrls = new Set<string>();
    messages.forEach((chatMessage) => {
      chatMessage.attachments?.forEach((attachment) => {
        const url = attachment.file.url;
        if (url?.startsWith('blob:')) referencedBlobUrls.add(url);
      });
    });

    optimisticObjectUrlsRef.current.forEach((urls, tempMessageId) => {
      if (urls.some((url) => referencedBlobUrls.has(url))) return;
      urls.forEach((url) => URL.revokeObjectURL(url));
      optimisticObjectUrlsRef.current.delete(tempMessageId);
    });
  }, [messages]);

  useEffect(() => () => {
    optimisticObjectUrlsRef.current.forEach((urls) => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    });
    optimisticObjectUrlsRef.current.clear();
  }, []);

  // Handle socket messages
  useEffect(() => {
    if (!socket || !user?.id) return;


    const handleSocketMessage = (msg: string | object | unknown[]) => {
      const updateChatListFromMessage = (
        chatUuid: string | undefined,
        messageId: string,
        messageTextForList: string,
        messageTimeForList: string,
        isFromCurrentUser: boolean
      ) => {
        if (!chatUuid) return;

        setChatsList(prev => {
          const idx = prev.findIndex(chat => chat.chatId === chatUuid);
          if (idx === -1) {
            return prev;
          }

          const chat = prev[idx];
          const isChatOpen = selectedChatRef.current ? prev[idx].id === selectedChatRef.current : false;
          const unreadCount = isFromCurrentUser
            ? chat.unread
            : isChatOpen
              ? 0
              : (chat.unread || 0) + 1;

          const updatedChat = {
            ...chat,
            lastMessageId: messageId,
            lastMessage: messageTextForList,
            lastTime: messageTimeForList,
            unread: unreadCount,
          };

          const updatedList = [...prev];
          updatedList.splice(idx, 1);
          updatedList.unshift(updatedChat);
          return updatedList;
        });
      };

      try {
        // Handle array format: ["chat_id", "json_string"]
        let messageData: unknown;
        if (Array.isArray(msg)) {
          // If it's an array, the second element is the JSON string
          if (msg.length > 1 && typeof msg[1] === 'string') {
            messageData = JSON.parse(msg[1]);
          } else {
            // If array format is different, try to parse the whole array
            messageData = msg;
          }
        } else if (typeof msg === 'string') {
          // Parse message if it's a string
          messageData = JSON.parse(msg);
        } else {
          // Already an object
          messageData = msg;
        }

        const typedData = messageData as {
          action: string;
          message?: BackendChatMessage;
          data?: BackendChatMessage | Record<string, unknown>;
          chat_id?: string;
          message_id?: string;
          opened_by?: string;
          expired_at?: string;
        };
        const action = typedData?.action;

        if (action === Actions.CMD_MESSAGE_OPENED) {
          const openedMessage = getOpenedMessage(messageData);
          const nestedData = typedData.data && typeof typedData.data === 'object'
            ? typedData.data as Record<string, unknown>
            : undefined;
          const openedMessageId = String(
            openedMessage?.id
            ?? openedMessage?.public_id
            ?? typedData.message_id
            ?? nestedData?.message_id
            ?? '',
          );
          const openedBy = String(typedData.opened_by ?? nestedData?.opened_by ?? '');

          if (openedMessageId) {
            const openedAt = openedMessage ? getMessageOpenedAt(openedMessage) : null;
            const expiresAt = openedMessage ? getMessageExpiresAt(openedMessage) : null;
            setMessages((prev) => prev.map((chatMessage) => (
              chatMessage.id === openedMessageId
                ? {
                  ...chatMessage,
                  isDisappearing: chatMessage.isDisappearing || Boolean(expiresAt),
                  openedAt: openedAt || chatMessage.openedAt || (expiresAt ? new Date().toISOString() : null),
                  expiresAt: expiresAt || chatMessage.expiresAt,
                  viewedOnce: chatMessage.viewOnce
                    && (chatMessage.sender === 'me' || openedBy === String(user.id))
                    ? true
                    : chatMessage.viewedOnce,
                }
                : chatMessage
            )));
          }
          return;
        }

        if (action === Actions.CMD_MESSAGE_EXPIRED) {
          const nestedData = typedData.data && typeof typedData.data === 'object'
            ? typedData.data as Record<string, unknown>
            : undefined;
          const expiredMessageId = typedData.message_id || String(nestedData?.message_id || '');

          if (expiredMessageId) {
            setMessages((prev) => {
              const next = prev.filter((chatMessage) => chatMessage.id !== expiredMessageId);
              return next.length === prev.length ? prev : next;
            });
            setActiveMedia((current) => current?.messageId === expiredMessageId ? null : current);
            setViewOnceSession((current) => current?.messageId === expiredMessageId ? null : current);
            void refreshChatsRef.current?.();
          }
          return;
        }

        const message = (typedData?.message || typedData?.data) as BackendChatMessage | undefined;


        // Only process messages for the current chat
        if (action === Actions.CMD_SEND_MESSAGE && message) {
          // Get current chat and selectedChat from refs (always use latest values)
          const currentSelectedChat = selectedChatRef.current;
          const currentChat = (chatsListRef.current as ChatItem[]).find((chat: ChatItem) => chat.id === currentSelectedChat);

          // Check if message belongs to current chat
          const messageChatId = message.contentable_id || message.chat_id;


          // Determine if message is from current user
          const fallbackTime = new Date().toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const newMessage = normalizeChatMessage(message, String(user.id), {
            fallbackId: `socket-${Date.now()}`,
            fallbackTime,
          });
          const isFromMe = newMessage.sender === 'me';
          const listPreview = newMessage.viewOnce
            ? t('messages.view_once_photo')
            : newMessage.isDisappearing && newMessage.contentHidden
              ? t('messages.hidden_disappearing_message')
              : newMessage.text || (newMessage.attachments?.some(
                (attachment) => attachment.file.mime_type?.startsWith('image/'),
              ) ? t('messages.photo') : t('messages.media'));

          updateChatListFromMessage(
            messageChatId,
            newMessage.id,
            listPreview,
            newMessage.time,
            isFromMe,
          );

          // If the message belongs to a different chat than the currently open one,
          // update the chat list but don't mutate the currently viewed message list.
          if (
            currentSelectedChat &&
            currentChat?.chatId &&
            messageChatId &&
            messageChatId !== currentChat.chatId
          ) {
            return;
          }

          // Hide typing indicator when a new message arrives (from other user)
          if (!isFromMe) {
            setOtherUserTyping(false);
            if (typingIndicatorTimeoutRef.current) {
              clearTimeout(typingIndicatorTimeoutRef.current);
              typingIndicatorTimeoutRef.current = null;
            }
          }

          // Add message to UI (avoid duplicates by checking if message ID already exists)
          // Also check if this is a duplicate of a recently sent message (to avoid duplicates from optimistic updates)
          setMessages(prev => {
            // Check if message already exists by ID
            const existsById = prev.some(m => m.id === newMessage.id);
            if (existsById) {
              return prev;
            }

            // If message is from current user, check for duplicate content (optimistic update)
            // This prevents duplicate messages when we send a message optimistically and then receive it from socket
            if (isFromMe) {
              const optimisticMessages = prev.filter((chatMessage) => (
                chatMessage.sender === 'me' && chatMessage.id.startsWith('temp-')
              ));
              const matchingByClientId = newMessage.clientId
                ? optimisticMessages.find((chatMessage) => (
                  chatMessage.clientId === newMessage.clientId
                  || chatMessage.id === newMessage.clientId
                ))
                : undefined;
              const matchingViewOnceMessage = newMessage.viewOnce
                ? optimisticMessages.find((chatMessage) => (
                  chatMessage.viewOnce && chatMessage.text === newMessage.text
                ))
                : undefined;
              const matchingByContent = newMessage.text
                ? optimisticMessages.find((chatMessage) => chatMessage.text === newMessage.text)
                : optimisticMessages.find((chatMessage) => (
                  chatMessage.text === ''
                  && getAttachmentSignature(chatMessage) === getAttachmentSignature(newMessage)
                ));
              const matchingMessage = matchingByClientId || matchingViewOnceMessage || matchingByContent;

              if (matchingMessage) {
                return prev.map((chatMessage) =>
                  chatMessage.id === matchingMessage.id
                    ? {
                      ...chatMessage,
                      ...newMessage,
                      text: newMessage.contentHidden && !newMessage.text
                        ? chatMessage.text
                        : newMessage.text,
                      attachments: newMessage.viewOnce
                        ? undefined
                        : newMessage.attachments || chatMessage.attachments,
                    }
                    : chatMessage
                );
              }
            }

            // Add new message and sort by time
            const updated = [...prev, newMessage];
            // Sort messages by time (if we have timestamps, otherwise keep order)
            return updated;
          });
        } else if (action === Actions.CMD_TYPING) {
          // Handle typing indicator from socket
          const typingData = messageData as any;
          const typingChatId = typingData?.chatID || typingData?.chat_id;
          const isTypingActive = typingData?.typing === true;
          const typingUserId = typingData?.userID || typingData?.user_id;

          // Get current chat and selectedChat from refs (always use latest values)
          const currentSelectedChat = selectedChatRef.current;
          const currentChat = (chatsListRef.current as ChatItem[]).find((chat: ChatItem) => chat.id === currentSelectedChat);


          // Only show typing indicator if it's for the current chat and from the other user
          if (currentSelectedChat &&
            currentChat?.chatId &&
            typingChatId === currentChat.chatId &&
            typingUserId !== user?.id) {

            // Clear any existing timeout
            if (typingIndicatorTimeoutRef.current) {
              clearTimeout(typingIndicatorTimeoutRef.current);
              typingIndicatorTimeoutRef.current = null;
            }

            if (isTypingActive) {
              // Show typing indicator
              setOtherUserTyping(true);

              // Set timeout to hide typing indicator after 3 seconds of inactivity
              typingIndicatorTimeoutRef.current = setTimeout(() => {
                setOtherUserTyping(false);
                typingIndicatorTimeoutRef.current = null;
              }, 3000);
            } else {
              // If typing is false, hide immediately
              setOtherUserTyping(false);
            }
            }
        }
      } catch (error) {
        console.error('Error processing socket message:', error);
      }
    };

    const onConnect = () => {
      if (user?.public_id) {
        const savedToken = localStorage.getItem("authToken")
        if (savedToken) {
          socket.emit('auth', savedToken);
        }
      }
    };

    onConnect()


    socket.on('connect', onConnect);
    // Listen for socket messages
    socket.on('message', handleSocketMessage);
    socket.on('chat', handleSocketMessage);

    // Cleanup: remove event listener when component unmounts or dependencies change
    return () => {
      socket.off('connect', onConnect);
      socket.off('message', handleSocketMessage);
      socket.off('chat', handleSocketMessage);

      // Leave chat room on cleanup
      if (currentChatRoomRef.current) {
        const leaveMessage = { chat_id: currentChatRoomRef.current }
        socket.emit('leave', JSON.stringify(leaveMessage));
        currentChatRoomRef.current = null;
      }

      // Clear typing timeout on cleanup
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      // Clear typing indicator timeout on cleanup
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current);
        typingIndicatorTimeoutRef.current = null;
      }
    };
  }, [setChatsList, setMessages, socket, t, user?.id, user?.public_id]);


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current);
        typingIndicatorTimeoutRef.current = null;
      }
    };
  }, []);

  // Calculate header height
  useEffect(() => {
    if (isMobile && headerRef.current && selectedChat) {
      const updateHeaderHeight = () => {
        if (headerRef.current) {
          // Include main app header height (56px on mobile)
          const mainHeaderHeight = 56;
          const chatHeaderHeight = headerRef.current.offsetHeight;
          setHeaderHeight(mainHeaderHeight + chatHeaderHeight);
        }
      };
      // Use requestAnimationFrame for accurate measurement
      requestAnimationFrame(() => {
        updateHeaderHeight();
      });
      window.addEventListener('resize', updateHeaderHeight);
      const observer = new MutationObserver(() => {
        requestAnimationFrame(updateHeaderHeight);
      });
      if (headerRef.current) {
        observer.observe(headerRef.current, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class']
        });
      }
      return () => {
        window.removeEventListener('resize', updateHeaderHeight);
        observer.disconnect();
      };
    } else if (!isMobile || !selectedChat) {
      setHeaderHeight(0);
    }
  }, [isMobile, selectedChat]);

  // Calculate input height for mobile padding
  useEffect(() => {
    if (isMobile && inputContainerRef.current && selectedChat) {
      const updateHeight = () => {
        if (inputContainerRef.current) {
          // Get the actual height including padding
          const inputContainerHeight = inputContainerRef.current.offsetHeight;
          setInputHeight(inputContainerHeight);
        }
      };
      // Use requestAnimationFrame for accurate measurement
      requestAnimationFrame(() => {
        updateHeight();
      });
      window.addEventListener('resize', updateHeight);
      // Use MutationObserver to watch for height changes (emoji picker, file preview)
      const observer = new MutationObserver(() => {
        requestAnimationFrame(updateHeight);
      });
      if (inputContainerRef.current) {
        observer.observe(inputContainerRef.current, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class']
        });
      }
      return () => {
        window.removeEventListener('resize', updateHeight);
        observer.disconnect();
      };
    } else if (!isMobile || !selectedChat) {
      setInputHeight(0);
    }
  }, [isMobile, selectedChat, selectedImages, selectedVideos, showEmojiPicker]);

  React.useEffect(() => {
    if (!selectedChat && isMobile) {
      setShowSidebar(true);
    }
    if (selectedChat && isMobile) {
      setShowSidebar(false);
    }
  }, [selectedChat, isMobile]);

  // Handle navigation state to open chat from MatchScreen
  React.useEffect(() => {
    const state = location.state as { openChat?: string; userId?: string; publicId?: number; username?: string } | null;
    if (state?.openChat || state?.userId || state?.publicId) {
      // Find chat by chat ID, username, or user ID
      setChatsList(prev => {
        const chatToOpen = prev.find(chat => {
          // First try to find by real chat ID (from newly created chat)
          if (state.openChat && (chat.chatId === state.openChat || chat.id === state.openChat)) {
            return true;
          }
          // Then try username
          if (state.username && chat.username === state.username) {
            return true;
          }
          // Then try user ID
          if (state.userId && chat.id === state.userId) {
            return true;
          }
          return false;
        });

        if (chatToOpen) {
          setSelectedChat(chatToOpen.id);
          setShowSidebar(false);
          return prev;
        } else {
          // Chat doesn't exist in list, create a temporary entry
          // state.openChat must be the real chat ID from backend (from MatchScreen)
          if (!state.openChat) {
            console.error('Cannot create chat entry without chat ID');
            return prev;
          }

          const realChatId = state.openChat; // Real chat ID from backend
          const displayId = state.userId || state.openChat || `temp-${Date.now()}`;
          const chatName = state.username || state.openChat || 'User';
          const newChat = {
            id: displayId,
            chatId: realChatId, // Real chat ID from backend - required for sending messages
            name: chatName,
            username: state.username || chatName.toLowerCase(),
            emojis: '',
            avatar: null as null,
            avatarLetter: chatName.charAt(0).toUpperCase(),
            lastMessage: '',
            lastTime: 'now',
            unread: 0,
            online: true,
            verified: false,
            encrypted: false
          };

          // Add to chat list if not already present
          if (!prev.find(c => c.id === displayId || c.chatId === realChatId)) {
            setSelectedChat(displayId);
            setShowSidebar(false);
            return [newChat, ...prev];
          }
          return prev;
        }
      });

      // Clear navigation state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const refreshChats = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    const requestId = ++chatsRefreshRequestRef.current;
    const mutationVersionAtStart = chatsMutationVersionRef.current;

    try {
      setIsLoadingChats(true);
      const response = (await api.fetchChats()) as any;

      if (requestId !== chatsRefreshRequestRef.current) {
        return;
      }
      if (mutationVersionAtStart !== chatsMutationVersionRef.current) {
        // A socket/local list mutation happened while this request was in flight.
        // Discard this snapshot and refetch from the newer local baseline.
        void refreshChatsRef.current?.();
        return;
      }

      if (response?.chats && Array.isArray(response.chats)) {
        const mappedChats = (response.chats as any[]).map((chat: any) => {
          // For private chats, find the other participant (not current user)
          const otherParticipant = chat.participants?.find(
            (p: any) => p.user_id !== user.id
          );

          // Find current user's participant to get unread_count
          const currentUserParticipant = chat.participants?.find(
            (p: any) => p.user_id === user.id
          );

          const otherUser = otherParticipant?.user;
          const displayName = otherUser?.displayname || otherUser?.username || 'Unknown';
          const username = otherUser?.username || '';
          const avatar = getSafeImageURLEx(otherUser?.public_id, otherUser?.avatar, "thumbnail");
          const avatarLetter = displayName.charAt(0).toUpperCase();

          // Format last message time
          let lastTime = 'now';
          if (chat.last_message?.created_at) {
            const messageDate = new Date(chat.last_message.created_at);
            const now = new Date();
            const diffMs = now.getTime() - messageDate.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) {
              lastTime = 'now';
            } else if (diffMins < 60) {
              lastTime = `${diffMins} dk`;
            } else if (diffHours < 24) {
              lastTime = `${diffHours} sa`;
            } else if (diffDays < 7) {
              lastTime = `${diffDays} g`;
            } else {
              lastTime = messageDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
            }
          }

          // Parse last message content - handle both object format {en: "...", tr: "..."} and string format
          let lastMessageText = '';
          if (getBooleanValue(chat.last_message?.view_once)) {
            lastMessageText = t('messages.view_once_photo');
          } else if (
            getBooleanValue(chat.last_message?.is_disappearing)
            && getBooleanValue(chat.last_message?.content_hidden)
          ) {
            lastMessageText = t('messages.hidden_disappearing_message');
          } else if (chat.last_message?.content) {
            if (typeof chat.last_message.content === 'string') {
              lastMessageText = chat.last_message.content;
            } else if (typeof chat.last_message.content === 'object') {
              // Try to get content in preferred language (en first, then tr, then any available)
              lastMessageText = chat.last_message.content.en ||
                chat.last_message.content.tr ||
                Object.values(chat.last_message.content as Record<string, any>).find((v: any) => v && typeof v === 'string') ||
                '';
            }
          }
          if (!lastMessageText && Array.isArray(chat.last_message?.attachments)) {
            lastMessageText = chat.last_message.attachments.some(
              (attachment: Attachment) => attachment.file?.mime_type?.startsWith('image/'),
            ) ? t('messages.photo') : t('messages.media');
          }

          return {
            id: otherUser?.id || chat.id, // Use user ID for display, fallback to chat ID
            chatId: chat.id, // Real chat ID from backend (UUID)
            name: displayName,
            username: username,
            emojis: '',
            avatar: avatar,
            avatarLetter: avatar ? null : avatarLetter,
            lastMessageId: chat.last_message?.id || null,
            lastMessage: lastMessageText,
            lastTime: lastTime,
            unread: currentUserParticipant?.unread_count || 0,
            online: false, // TODO: Get online status from backend if available
            verified: false, // TODO: Get verified status from backend if available
            encrypted: chat.type !== 'private', // Assume group/channel chats are encrypted
          };
        });

        setChatsList(mappedChats);
      }
    } catch (error) {
      if (requestId === chatsRefreshRequestRef.current) {
        console.error('Error fetching chats:', error);
      }
    } finally {
      if (requestId === chatsRefreshRequestRef.current) {
        setIsLoadingChats(false);
      }
    }
  }, [isAuthenticated, setChatsList, setIsLoadingChats, t, user?.id]);

  useLayoutEffect(() => {
    refreshChatsRef.current = refreshChats;
    return () => {
      if (refreshChatsRef.current === refreshChats) refreshChatsRef.current = null;
    };
  }, [refreshChats]);

  // Fetch chats from backend
  useEffect(() => {
    refreshChats();
  }, [refreshChats]);

  // Ensure bottom bar is visible when component first mounts (chat list view)
  React.useEffect(() => {
    setShowBottomBar(true);
  }, [setShowBottomBar]);

  // Show/hide bottom bar based on selectedChat state
  React.useEffect(() => {
    // Show bottom bar if chat list is visible (no selected chat), hide if in chat view
    setShowBottomBar(!selectedChat);
    return () => {
      // Show bottom bar when leaving messages screen
      setShowBottomBar(true);
    };
  }, [selectedChat, setShowBottomBar]);

  useEffect(() => {
    return () => {
      setChatState(initialChatState);
    };
  }, [setChatState]);

  // Group chats - will be used in future
  // const groupChats = [
  //   {
  //     id: 'taiwan',
  //     name: 'Taiwan Pride Community',
  //     flag: '🇹🇼',
  //     members: 1247,
  //     lastMessage: 'Happy Pride everyone! 🏳️‍🌈',
  //     lastTime: '2m',
  //     unread: 3,
  //     online: 89,
  //     pinned: true
  //   },
  //   {
  //     id: 'thailand',
  //     name: 'Thailand LGBTQ+ Network',
  //     flag: '🇹🇭',
  //     members: 892,
  //     lastMessage: 'Great event yesterday!',
  //     lastTime: '15m',
  //     unread: 0,
  //     online: 45,
  //     pinned: false
  //   },
  //   {
  //     id: 'turkey',
  //     name: 'Türkiye Pride Community',
  //     flag: '🇹🇷',
  //     members: 2156,
  //     lastMessage: 'Supporting each other! 💪',
  //     lastTime: '1h',
  //     unread: 7,
  //     online: 156,
  //     pinned: true
  //   },
  //   {
  //     id: 'japan',
  //     name: 'Japan Rainbow Network',
  //     flag: '🇯🇵',
  //     members: 678,
  //     lastMessage: 'Beautiful day for celebration!',
  //     lastTime: '2h',
  //     unread: 0,
  //     online: 34,
  //     pinned: false
  //   },
  //   {
  //     id: 'china',
  //     name: 'China Pride Alliance',
  //     flag: '🇨🇳',
  //     members: 1890,
  //     lastMessage: 'Love is love! ❤️',
  //     lastTime: '3h',
  //     unread: 12,
  //     online: 203,
  //     pinned: false
  //   }
  // ];

  // Use ref to access current chatsList in socket handler
  const chatsListRef = useRef(chatsList);

  // Use ref to access current selectedChat in socket handler
  const selectedChatRef = useRef(selectedChat);

  // Update refs when they change
  useEffect(() => {
    chatsListRef.current = chatsList;
  }, [chatsList]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '💯', '✨', '🏳️‍🌈', '💪', '😍', '🤔', '😭', '😡', '🤗', '👏', '🙏', '💖', '💕', '💔', '😎', '🤩', '😴', '🤯', '🥳', '😇', '🤠', '👻', '🤖', '👽', '👾'];

  const selectedPrivateChat = chatsList.find(chat => chat.id === selectedChat);

  // Messages state - Backend format: attachments array

  // Fetch messages function (can be called manually or automatically)
  const fetchMessages = useCallback(async (showRefreshing = false) => {
    if (!selectedChat || !user?.id) {
      setMessages([]);
      return;
    }

    // Find the selected chat to get the real chat ID
    const currentChat = chatsList.find(chat => chat.id === selectedChat);

    if (!currentChat?.chatId) {
      console.error('Cannot fetch messages - chat ID not found', { selectedChat, currentChat });
      setMessages([]);
      return;
    }

    const realChatId = currentChat.chatId;

    // Validate that chatId is a UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(realChatId)) {
      console.error('Invalid chat ID format - cannot fetch messages', { chatId: realChatId });
      setMessages([]);
      return;
    }

    try {
      if (showRefreshing) {
        setIsRefreshingMessages(true);
      } else {
        setIsLoadingMessages(true);
      }
      const response = (await api.fetchMessages(realChatId)) as { messages: BackendChatMessage[] };
      if (response?.messages && Array.isArray(response.messages)) {
        const mappedMessages = response.messages
          .map((msg) => normalizeChatMessage(msg, String(user.id)))
          .filter((chatMessage) => !isMessageExpired(chatMessage));

        // Sort messages by created_at (oldest first)
        mappedMessages.sort((a: ChatMessage, b: ChatMessage) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

        setMessages(mappedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
      setIsRefreshingMessages(false);
    }
     
  }, [selectedChat, user?.id]); // chatsList removed from deps to avoid refetch whenever chat list updates

  // Join chat room when chat is selected
  React.useEffect(() => {
    if (!socket || !selectedChat || !user?.id) {
      // Leave current chat room if chat is deselected
      if (socket && currentChatRoomRef.current) {
        const leaveMessage = { chat_id: currentChatRoomRef.current }
        socket.emit('leave', JSON.stringify(leaveMessage));
        currentChatRoomRef.current = null;
      }
      return;
    }

    // Find the selected chat to get the real chat ID
    const currentChat = chatsList.find(chat => chat.id === selectedChat);
    const realChatId = currentChat?.chatId;

    if (!realChatId) {
      console.warn('Cannot join chat room - chat ID not found', { selectedChat, currentChat });
      return;
    }

    // Validate that chatId is a UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(realChatId)) {
      console.warn('Cannot join chat room - invalid chat ID format', { chatId: realChatId });
      return;
    }

    // Leave previous chat room if exists and different
    if (currentChatRoomRef.current && currentChatRoomRef.current !== realChatId) {
      const leaveMessage = { chat_id: currentChatRoomRef.current }
      socket.emit('leave', JSON.stringify(leaveMessage));
    }

    // Join new chat room
    if (currentChatRoomRef.current !== realChatId) {
      const joinMessage = { chat_id: realChatId }
      socket.emit('join', JSON.stringify(joinMessage));
      currentChatRoomRef.current = realChatId;
    }
  }, [socket, selectedChat, chatsList, user?.id]);

  // Fetch messages only when the selected chat or user changes, NOT when fetchMessages ref changes.
  // Previously depended on [fetchMessages] which re-ran every time chatsList changed (e.g. on send).
  useEffect(() => {
    if (selectedChat && user?.id) {
      fetchMessages();
    }
     
  }, [selectedChat, user?.id]);


  // Handle refresh messages
  const handleRefreshMessages = () => {
    if (!isRefreshingMessages && !isLoadingMessages) {
      fetchMessages(true);
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId: string, forAll: boolean) => {
    const currentChat = chatsList.find(chat => chat.id === selectedChat);
    if (!currentChat?.chatId) return;

    try {
      if (forAll) {
        await api.deleteMessageForAll(currentChat.chatId, messageId);
      } else {
        await api.deleteMessageForMe(currentChat.chatId, messageId);
      }
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setActiveMedia((current) => current?.messageId === messageId ? null : current);
      setViewOnceSession((current) => current?.messageId === messageId ? null : current);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
    setSelectedMessageId(null);
    setMessageMenuPosition(null);
  };

  // Handle message context menu (long press / right click)
  const handleMessageContextMenu = (point: { clientX: number; clientY: number }, messageId: string) => {
    setSelectedMessageId(messageId);
    setResolvedMessageMenuPosition(null);
    const x = Number.isFinite(point.clientX) ? point.clientX : window.innerWidth / 2;
    const y = Number.isFinite(point.clientY) ? point.clientY : window.innerHeight / 2;

    setMessageMenuPosition({ x, y });
  };

  const closeMessageContextMenu = useCallback(() => {
    setSelectedMessageId(null);
    setMessageMenuPosition(null);
    setResolvedMessageMenuPosition(null);
  }, []);

  const updateMessageContextMenuPosition = useCallback(() => {
    const menu = messageMenuRef.current;
    if (!menu || !messageMenuPosition) return;

    const viewport = window.visualViewport;
    const viewportLeft = viewport?.offsetLeft ?? 0;
    const viewportTop = viewport?.offsetTop ?? 0;
    const viewportWidth = viewport?.width ?? window.innerWidth;
    const viewportHeight = viewport?.height ?? window.innerHeight;
    const viewportRight = viewportLeft + viewportWidth;
    const viewportBottom = viewportTop + viewportHeight;
    const margin = 12;
    const gap = 8;
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;

    const minLeft = viewportLeft + margin;
    const maxLeft = Math.max(minLeft, viewportRight - menuWidth - margin);
    const preferredLeft = messageMenuPosition.x - menuWidth / 2;
    const left = Math.min(Math.max(preferredLeft, minLeft), maxLeft);

    const belowTop = messageMenuPosition.y + gap;
    const aboveTop = messageMenuPosition.y - menuHeight - gap;
    const preferredTop = belowTop + menuHeight <= viewportBottom - margin ? belowTop : aboveTop;
    const minTop = viewportTop + margin;
    const maxTop = Math.max(minTop, viewportBottom - menuHeight - margin);
    const top = Math.min(Math.max(preferredTop, minTop), maxTop);

    setResolvedMessageMenuPosition({ x: left, y: top });
  }, [messageMenuPosition]);

  useLayoutEffect(() => {
    if (!selectedMessageId || !messageMenuPosition) return;

    updateMessageContextMenuPosition();
    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(updateMessageContextMenuPosition);
    if (messageMenuRef.current) resizeObserver?.observe(messageMenuRef.current);
    window.addEventListener('resize', updateMessageContextMenuPosition);
    window.visualViewport?.addEventListener('resize', updateMessageContextMenuPosition);
    window.visualViewport?.addEventListener('scroll', updateMessageContextMenuPosition);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateMessageContextMenuPosition);
      window.visualViewport?.removeEventListener('resize', updateMessageContextMenuPosition);
      window.visualViewport?.removeEventListener('scroll', updateMessageContextMenuPosition);
    };
  }, [messageMenuPosition, selectedMessageId, updateMessageContextMenuPosition]);

  // Close message menu on scroll or outside tap
  React.useEffect(() => {
    const handleClickOutside = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.message-context-menu') && selectedMessageId) {
        closeMessageContextMenu();
      }
    };
    const handleScroll = () => closeMessageContextMenu();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMessageContextMenu();
    };

    if (selectedMessageId) {
      const listenerTimer = window.setTimeout(() => {
        document.addEventListener('pointerdown', handleClickOutside);
      }, 0);
      document.addEventListener('scroll', handleScroll, true);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        window.clearTimeout(listenerTimer);
        document.removeEventListener('pointerdown', handleClickOutside);
        document.removeEventListener('scroll', handleScroll, true);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [closeMessageContextMenu, selectedMessageId]);

  React.useEffect(() => {
    if (resolvedMessageMenuPosition) {
      messageMenuRef.current?.focus({ preventScroll: true });
    }
  }, [resolvedMessageMenuPosition]);

  // Handle chat deletion
  const handleDeleteChat = async (chatId: string, forAll: boolean) => {
    const chat = chatsList.find(c => c.id === chatId);
    if (!chat?.chatId) return;

    try {
      if (forAll) {
        await api.deleteChatForAll(chat.chatId);
      } else {
        await api.deleteChatForMe(chat.chatId);
      }

      if (selectedChat === chatId) {
        setSelectedChat(null);
      }
      setChatsList(prev => prev.filter(c => c.id !== chatId));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
    setOpenChatItemMenu(null);
    setShowChatMenu(false);
  };

  // Clear chat history
  const handleClearChatHistory = async (chatId: string, forAll: boolean) => {
    const chat = chatsList.find(c => c.id === chatId);
    if (!chat?.chatId) return;

    try {
      if (forAll) {
        await api.clearChatHistoryForAll(chat.chatId);
      } else {
        await api.clearChatHistoryForMe(chat.chatId);
      }

      if (selectedChat === chatId) {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
    setShowChatMenu(false);
    setOpenChatItemMenu(null);
  };

  // Close chat menu on outside click
  React.useEffect(() => {
    const handleClickOutside = () => {
      setShowChatMenu(false);
    };
    if (showChatMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showChatMenu]);

  // Close chat item menu on outside click
  React.useEffect(() => {
    const handleClickOutside = () => {
      setOpenChatItemMenu(null);
    };
    if (openChatItemMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openChatItemMenu]);

  const handleMessageOpen = useCallback(async (messageId: string) => {
    if (messageOpenRequestsRef.current.has(messageId)) return;

    const targetMessage = messages.find((chatMessage) => chatMessage.id === messageId);
    const currentChat = chatsList.find((chat) => chat.id === selectedChat);
    const canOpenViewOnce = Boolean(
      targetMessage?.viewOnce && !targetMessage.viewedOnce && targetMessage.sender === 'other',
    );
    const canOpenDisappearing = Boolean(
      targetMessage?.isDisappearing
      && targetMessage.contentHidden
      && !targetMessage.viewOnce
      && targetMessage.sender === 'other',
    );
    if (
      !targetMessage
      || (!canOpenViewOnce && !canOpenDisappearing)
      || isMessageExpired(targetMessage)
      || !currentChat?.chatId
    ) {
      return;
    }

    const selectedChatAtRequest = selectedChat;
    const markAsConsumed = () => {
      setMessages((prev) => prev.map((chatMessage) => (
        chatMessage.id === messageId
          ? { ...chatMessage, viewedOnce: true, attachments: undefined }
          : chatMessage
      )));
    };

    messageOpenRequestsRef.current.add(messageId);
    setOpeningMessageIds((current) => new Set(current).add(messageId));
    setViewOnceOpenErrorIds((current) => {
      if (!current.has(messageId)) return current;
      const next = new Set(current);
      next.delete(messageId);
      return next;
    });

    try {
      const response = await api.openMessage(currentChat.chatId, messageId);
      const openedPayload = getOpenedMessage(response);

      if (targetMessage.viewOnce) {
        const resolvedItems = resolveChatMediaItems(getViewOnceAttachments(response))
          .filter((item) => item.kind === 'image');
        const uniqueItems = Array.from(
          new Map(resolvedItems.map((item) => [item.src, item])).values(),
        );

        // The secure base64 DTO only lives inside this viewer session.
        markAsConsumed();
        if (openedPayload) {
          const normalizedOpenedMessage = normalizeChatMessage(openedPayload, String(user.id), {
            fallbackId: messageId,
            fallbackTime: targetMessage.time,
            fallbackSender: 'other',
          });
          const openedAt = normalizedOpenedMessage.openedAt || new Date().toISOString();
          const expiresAt = normalizedOpenedMessage.expiresAt || getMessageExpiresAt(openedPayload);
          setMessages((prev) => prev.map((chatMessage) => (
            chatMessage.id === messageId
              ? {
                ...chatMessage,
                openedAt,
                expiresAt,
                expiresInSeconds: normalizedOpenedMessage.expiresInSeconds ?? chatMessage.expiresInSeconds,
                viewedOnce: true,
                attachments: undefined,
              }
              : chatMessage
          )));
        }
        setActiveMedia(null);

        if (
          uniqueItems.length > 0
          && selectedChatRef.current === selectedChatAtRequest
        ) {
          setViewOnceSession({ messageId, items: uniqueItems });
        } else if (uniqueItems.length === 0) {
          setViewOnceOpenErrorIds((current) => new Set(current).add(messageId));
        }
      } else if (openedPayload) {
        const normalizedOpenedMessage = normalizeChatMessage(openedPayload, String(user.id), {
          fallbackId: messageId,
          fallbackTime: targetMessage.time,
          fallbackSender: 'other',
        });
        const openedAt = normalizedOpenedMessage.openedAt || new Date().toISOString();
        const expiresAt = normalizedOpenedMessage.expiresAt || getMessageExpiresAt(openedPayload);

        setMessages((prev) => prev.map((chatMessage) => (
          chatMessage.id === messageId
            ? {
              ...chatMessage,
              ...normalizedOpenedMessage,
              id: chatMessage.id,
              sender: chatMessage.sender,
              contentHidden: false,
              isDisappearing: true,
              openedAt,
              expiresAt,
            }
            : chatMessage
        )));
      } else {
        throw new Error('Open response did not include the revealed message');
      }
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (targetMessage.viewOnce) {
        // A lost response can still mean that the server consumed the photo.
        markAsConsumed();
        setViewOnceSession((current) => current?.messageId === messageId ? null : current);
        setViewOnceOpenErrorIds((current) => new Set(current).add(messageId));
        console.warn('View-once photo is no longer available', { messageId, status });
      } else if (status === 410) {
        setMessages((prev) => prev.filter((chatMessage) => chatMessage.id !== messageId));
        void refreshChatsRef.current?.();
      } else {
        console.warn('Disappearing message could not be opened', { messageId, status });
        if (status === 409) void fetchMessages(true);
      }
    } finally {
      messageOpenRequestsRef.current.delete(messageId);
      setOpeningMessageIds((current) => {
        if (!current.has(messageId)) return current;
        const next = new Set(current);
        next.delete(messageId);
        return next;
      });
    }
  }, [chatsList, fetchMessages, messages, selectedChat, setMessages, user?.id]);

  const handleSendMessage = async () => {
    const totalMedia = selectedImages.length + selectedVideos.length;
    if (!selectedChat || (!message.trim() && totalMedia === 0)) {
      return;
    }
    if (viewOnceEnabled && !hasValidViewOncePhoto) {
      viewOnceImageInputRef.current?.click();
      return;
    }

    // Find the selected chat to get the real chat ID
    const currentChat = chatsList.find(chat => chat.id === selectedChat);

    // Only use chatId field, never use id as fallback (id can be username or user ID)
    if (!currentChat?.chatId) {
      console.error('Chat ID not found - chat must be created first', { selectedChat, currentChat });
      return;
    }

    const realChatId = currentChat.chatId;

    // Validate that chatId is a UUID format (not a username or user ID)
    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 characters with hyphens)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(realChatId)) {
      console.error('Invalid chat ID format - must be UUID', {
        chatId: realChatId,
        selectedChat,
        currentChat
      });
      return;
    }

    // Ensure we're joined to the chat room before sending message
    if (socket && currentChatRoomRef.current !== realChatId) {

      const joinMessage = { chat_id: realChatId }
      socket.emit('join', JSON.stringify(joinMessage));
      currentChatRoomRef.current = realChatId;
      // Small delay to ensure join is processed (though emit is fire-and-forget)
      await new Promise(resolve => setTimeout(resolve, 100));
    }


    const messageText = message.trim();
    // Store files before clearing state
    const imagesToSend = [...selectedImages];
    const videosToSend = [...selectedVideos];
    const allFiles = [...selectedImages, ...selectedVideos];
    const viewOnceForSend = viewOnceEnabled
      && imagesToSend.length === 1
      && videosToSend.length === 0;
    const optimisticCreatedAt = new Date();
    const tempMessageId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Create temporary attachments for optimistic update (will be replaced by backend response)
    const createdObjectUrls: string[] = [];
    const tempAttachments: Attachment[] | undefined = allFiles.length > 0
      ? allFiles.map((file, idx) => {
        const objectUrl = viewOnceForSend ? '' : URL.createObjectURL(file);
        if (objectUrl) createdObjectUrls.push(objectUrl);
        return {
          id: `temp-attachment-${tempMessageId}-${idx}`,
          file: {
            id: `temp-file-${tempMessageId}-${idx}`,
            url: objectUrl,
            mime_type: file.type,
            name: file.name,
            variants: !objectUrl
              ? undefined
              : file.type.startsWith('image/')
              ? {
                image: {
                  original: { url: objectUrl },
                },
              }
              : {
                video: {
                  original: { url: objectUrl },
                },
              },
          },
        };
      })
      : undefined;

    // Optimistically update UI
    const newMessage: ChatMessage = {
      id: tempMessageId,
      text: messageText,
      time: optimisticCreatedAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      sender: 'me' as const,
      attachments: tempAttachments,
      createdAt: optimisticCreatedAt.toISOString(),
      expiresAt: null,
      expiresInSeconds: messageExpirySeconds > 0 ? messageExpirySeconds : null,
      openedAt: null,
      isDisappearing: messageExpirySeconds > 0,
      contentHidden: false,
      clientId: tempMessageId,
      viewOnce: viewOnceForSend,
      viewedOnce: false,
    };
    if (createdObjectUrls.length > 0) {
      optimisticObjectUrlsRef.current.set(tempMessageId, createdObjectUrls);
    }

    // Add message to UI immediately
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setSelectedImages([]);
    setSelectedVideos([]);
    setViewOnceEnabled(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (viewOnceImageInputRef.current) viewOnceImageInputRef.current.value = '';
    setShowEmojiPicker(false);

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Hide other user typing indicator when we send a message
    setOtherUserTyping(false);
    if (typingIndicatorTimeoutRef.current) {
      clearTimeout(typingIndicatorTimeoutRef.current);
      typingIndicatorTimeoutRef.current = null;
    }

    // Send message to API
    try {
      const response = await api.sendMessage({
        chat_id: realChatId, // Use real chat ID from backend
        content: messageText,
        images: imagesToSend.length > 0 ? imagesToSend : undefined,
        videos: videosToSend.length > 0 ? videosToSend : undefined,
        expires_in_seconds: messageExpirySeconds,
        client_id: tempMessageId,
        view_once: viewOnceForSend ? true : undefined,
      }) as {
        message_id?: string;
        id?: string;
        message?: BackendChatMessage;
      };

      const resolvedMessage = response?.message;

      if (resolvedMessage) {
        const normalizedMessage = normalizeChatMessage(resolvedMessage, String(user.id), {
          fallbackId: response.message_id || response.id || tempMessageId,
          fallbackText: messageText,
          fallbackTime: newMessage.time,
          fallbackSender: 'me',
        });
        const resolvedChatMessage: ChatMessage = {
          ...newMessage,
          ...normalizedMessage,
          attachments: normalizedMessage.viewOnce || viewOnceForSend
            ? undefined
            : normalizedMessage.attachments || newMessage.attachments,
          expiresAt: normalizedMessage.expiresAt ?? newMessage.expiresAt,
          expiresInSeconds: normalizedMessage.expiresInSeconds ?? newMessage.expiresInSeconds,
          isDisappearing: normalizedMessage.isDisappearing || newMessage.isDisappearing,
          viewOnce: normalizedMessage.viewOnce || viewOnceForSend,
        };

        setMessages((prev) => {
          const optimisticMessage = prev.find(msg => msg.id === tempMessageId);
          if (optimisticMessage) {
            return prev.map((msg) =>
              msg.id === tempMessageId
                ? resolvedChatMessage
                : msg
            );
          }

          const existingMessage = prev.find((msg) => msg.id === resolvedChatMessage.id);
          if (existingMessage) {
            return prev.map((msg) => msg.id === resolvedChatMessage.id
              ? { ...msg, ...resolvedChatMessage }
              : msg);
          }
          return isMessageExpired(resolvedChatMessage) ? prev : [...prev, resolvedChatMessage];
        });
      } else if (response?.message_id || response?.id) {
        // Fallback: update only the ID if full message payload isn't provided
        setMessages((prev) => {
          const optimisticMessage = prev.find(msg => msg.id === tempMessageId);
          if (optimisticMessage) {
            return prev.map((msg) =>
              msg.id === tempMessageId
                ? {
                  ...msg,
                  id: response.message_id || response.id || msg.id,
                  attachments: viewOnceForSend ? undefined : msg.attachments,
                }
                : msg
            );
          } else {
            // If optimistic message doesn't exist, check if we need to add it
            const newId = response.message_id || response.id;
            if (newId) {
              const exists = prev.some(m => m.id === newId);
              if (!exists && (messageText || (tempAttachments?.length || 0) > 0)) {
                return [...prev, {
                  ...newMessage,
                  id: newId,
                  attachments: viewOnceForSend ? undefined : newMessage.attachments,
                }];
              }
            }
            return prev;
          }
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove message from UI if API call failed
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      // Optionally show error message to user
    }
  };

  const handleTyping = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Send typing indicator to server on every keystroke
    if (!selectedChat || !value.trim()) {
      // Clear typing timeout if message is empty
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      return;
    }

    // Find the selected chat to get the real chat ID
    const currentChat = chatsList.find(chat => chat.id === selectedChat);

    if (!currentChat?.chatId) {
      return;
    }

    const realChatId = currentChat.chatId;

    // Validate that chatId is a UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(realChatId)) {
      return;
    }

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Send typing indicator on every keystroke (with minimal debounce to avoid too many API calls)
    const now = Date.now();
    if (now - lastTypingSentRef.current < 300) {
      // If sent less than 300ms ago, debounce slightly
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingIndicator(realChatId);
      }, 300);
    } else {
      // Send immediately if enough time has passed
      handleTypingIndicator(realChatId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter key to send message
    if (e.key === 'Enter') {
      handleSendMessage();
      return;
    }

    // For other keys, trigger typing indicator immediately
    // This ensures typing indicator is sent on every keypress
    if (selectedChat) {
      const currentChat = chatsList.find(chat => chat.id === selectedChat);

      if (currentChat?.chatId) {
        const realChatId = currentChat.chatId;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(realChatId)) {
          // Clear any existing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }

          // Send typing indicator immediately on keypress
          const now = Date.now();
          if (now - lastTypingSentRef.current >= 300) {
            // If enough time has passed, send immediately
            handleTypingIndicator(realChatId);
          } else {
            // Otherwise, schedule it
            typingTimeoutRef.current = setTimeout(() => {
              handleTypingIndicator(realChatId);
            }, 300 - (now - lastTypingSentRef.current));
          }
        }
      }
    }
  };

  const handleTypingIndicator = async (chatId: string) => {
    try {
      await api.sendTyping(chatId);
      lastTypingSentRef.current = Date.now();
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  };

  const handleChatSelect = (chatId: string) => {
    setActiveMedia(null);
    setViewOnceSession(null);
    setSelectedImages([]);
    setSelectedVideos([]);
    setViewOnceEnabled(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (viewOnceImageInputRef.current) viewOnceImageInputRef.current.value = '';
    // Find the chat to get the real chat ID
    const chat = chatsList.find(c => c.id === chatId);
    const realChatId = chat?.chatId;

    // Leave previous chat room if exists
    if (socket && currentChatRoomRef.current && currentChatRoomRef.current !== realChatId) {
      const leaveMessage = { chat_id: currentChatRoomRef.current }
      socket.emit('leave', JSON.stringify(leaveMessage));
      currentChatRoomRef.current = null;
    }

    // Join new chat room if chat ID is valid
    if (socket && realChatId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(realChatId)) {
        const joinMessage = { chat_id: realChatId }
        socket.emit('join', JSON.stringify(joinMessage));
        currentChatRoomRef.current = realChatId;
      }
    }

    setSelectedChat(chatId);
    setShowSidebar(false);
    // Reset typing indicator when switching chats
    if (typingIndicatorTimeoutRef.current) {
      clearTimeout(typingIndicatorTimeoutRef.current);
      typingIndicatorTimeoutRef.current = null;
    }
    setOtherUserTyping(false);
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (viewOnceEnabled) {
      const selectedPhoto = imageFiles[0];
      if (selectedPhoto) {
        setSelectedImages([selectedPhoto]);
        setSelectedVideos([]);
      }
    } else {
      setSelectedImages(prev => [...prev, ...imageFiles]);
    }
    e.target.value = '';
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    setSelectedVideos(prev => [...prev, ...videoFiles]);
    if (videoFiles.length > 0) setViewOnceEnabled(false);
    e.target.value = '';
  };

  const handleViewOnceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedPhoto = Array.from(e.target.files || [])
      .find((file) => file.type.startsWith('image/'));
    e.target.value = '';
    if (!selectedPhoto) return;

    setSelectedImages([selectedPhoto]);
    setSelectedVideos([]);
    setViewOnceEnabled(true);
  };

  const removeImage = (index: number) => {
    const nextImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(nextImages);
  };

  const removeVideo = (index: number) => {
    const nextVideos = selectedVideos.filter((_, i) => i !== index);
    setSelectedVideos(nextVideos);
    if (nextVideos.length > 0 || selectedImages.length !== 1) {
      setViewOnceEnabled(false);
    }
  };

  const hasValidViewOncePhoto = selectedImages.length === 1 && selectedVideos.length === 0;

  const handleViewOnceToggle = () => {
    setViewOnceEnabled(enabled => !enabled);
  };

  const activeViewerMessage = useMemo(
    () => activeMedia ? messages.find((chatMessage) => chatMessage.id === activeMedia.messageId) : undefined,
    [activeMedia, messages],
  );
  const activeViewerItems = useMemo(
    () => resolveChatMediaItems(activeViewerMessage?.attachments),
    [activeViewerMessage],
  );
  const activeViewerIndex = activeMedia
    ? activeViewerItems.findIndex((item) => item.attachmentId === activeMedia.attachmentId)
    : -1;
  const displayedViewerItems = viewOnceSession?.items || activeViewerItems;
  const displayedViewerIndex = viewOnceSession ? 0 : activeViewerIndex;
  const displayedViewerKey = viewOnceSession
    ? `view-once-${viewOnceSession.messageId}`
    : activeMedia ? `${activeMedia.messageId}-${activeMedia.attachmentId}` : null;

  // If not authenticated, show inline auth wizard
  if (!isAuthenticated) {
    return (
      <div className="skyline-page-scroll w-full">
        <div className="mx-auto flex min-h-full w-full max-w-5xl items-center justify-center px-4 pb-8 pt-24 md:pt-28">
          <div className="w-full max-w-lg">
            <AuthWizard
              isOpen={true}
              onClose={() => {
                // If user closes auth wizard, navigate to home
                navigate('/');
              }}
              mode="inline"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden px-1 pb-8 pt-24 md:px-2 md:pt-28">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-row overflow-hidden">
        <div
          className={`flex flex-row h-full w-full flex-1 min-h-0 overflow-hidden border backdrop-blur-3xl shadow-[0_36px_120px_-48px_rgba(15,23,42,0.45)] ${theme === 'dark'
            ? 'cv-card-surface-soft rounded-[36px] border-white/10'
            : 'rounded-[36px] border-white/70 bg-white/70'
            }`}
          style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'row' }}
        >
          {/* Sidebar - Responsive Design */}
          <div className={`absolute lg:relative inset-0 z-40 lg:z-auto w-full lg:w-[360px] lg:flex-shrink-0 border-r flex flex-col h-full overflow-hidden backdrop-blur-3xl ${theme === 'dark' ? 'cv-card-surface-solid border-white/10' : 'border-white/70 bg-white/80'
            } ${showSidebar ? 'flex' : 'hidden lg:flex'}`}>
            <div className={`flex-shrink-0 z-50 border-b px-3 py-3 ${theme === 'dark'
              ? 'cv-card-surface-soft border-white/10 backdrop-blur-2xl'
              : 'border-white/70 bg-white/75 backdrop-blur-2xl'
              }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="sky-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.28em] text-sky-600">
                      {t('messages.chat')}
                    </p>
                    <h1 className={`mt-0.5 truncate text-lg font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-950'
                      }`}>{chatsList.length}</h1>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                <motion.button
                  whileHover={{ scale: isLoadingChats ? 1 : 1.05 }}
                  whileTap={{ scale: isLoadingChats ? 1 : 0.95 }}
                  onClick={refreshChats}
                  disabled={isLoadingChats}
                  aria-label={t('messages.refresh', { defaultValue: 'Yenile' })}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${isLoadingChats ? 'opacity-60 cursor-not-allowed' : ''} ${theme === 'dark' ? 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white' : 'bg-white/80 text-slate-600 hover:bg-sky-50 hover:text-slate-950'
                    }`}
                >
                    <RefreshCw className={`h-4 w-4 ${isLoadingChats ? 'animate-spin' : ''}`} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${theme === 'dark' ? 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white' : 'bg-white/80 text-slate-600 hover:bg-sky-50 hover:text-slate-950'
                    }`}
                >
                    <Settings className="h-4 w-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${theme === 'dark' ? 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white' : 'bg-white/80 text-slate-600 hover:bg-sky-50 hover:text-slate-950'
                    }`}
                >
                    <PlusSquare className="h-4 w-4" />
                </motion.button>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 flex-shrink-0">
              {/* Search */}
              <div className="relative mb-3 sm:mb-4 z-20">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 z-10 ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'
                  }`} />
                <input
                  type="text"
                  placeholder={t('messages.search')}
                  className={`relative w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-full border text-sm z-10 outline-none transition-all focus:ring-2 ${theme === 'dark'
                    ? 'bg-white/[0.08] border-white/10 text-white placeholder-zinc-500 focus:ring-sky-500/20'
                    : 'bg-white/[0.85] border-white/80 text-slate-900 placeholder-slate-500 focus:ring-sky-500/20'
                    }`}
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar flex-nowrap relative z-20">
                <motion.button
                  onClick={() => setActiveFilter('all')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${activeFilter === 'all'
                    ? theme === 'dark'
                      ? 'bg-sky-500 text-white shadow-[0_10px_24px_-16px_rgba(14,165,233,0.9)]'
                      : 'bg-sky-600 text-white shadow-[0_10px_24px_-16px_rgba(2,132,199,0.9)]'
                    : theme === 'dark'
                      ? 'bg-white/[0.08] text-zinc-400 hover:bg-white/[0.12]'
                      : 'bg-white/70 text-slate-600 hover:bg-white'
                    }`}
                >
                  {t('messages.all')}
                </motion.button>
                <motion.button
                  onClick={() => setActiveFilter('unread')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${activeFilter === 'unread'
                    ? theme === 'dark'
                      ? 'bg-sky-500 text-white shadow-[0_10px_24px_-16px_rgba(14,165,233,0.9)]'
                      : 'bg-sky-600 text-white shadow-[0_10px_24px_-16px_rgba(2,132,199,0.9)]'
                    : theme === 'dark'
                      ? 'bg-white/[0.08] text-zinc-400 hover:bg-white/[0.12]'
                      : 'bg-white/70 text-slate-600 hover:bg-white'
                    }`}
                >
                  {t('messages.unread')}
                </motion.button>
                <motion.button
                  onClick={() => setActiveFilter('groups')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${activeFilter === 'groups'
                    ? theme === 'dark'
                      ? 'bg-sky-500 text-white shadow-[0_10px_24px_-16px_rgba(14,165,233,0.9)]'
                      : 'bg-sky-600 text-white shadow-[0_10px_24px_-16px_rgba(2,132,199,0.9)]'
                    : theme === 'dark'
                      ? 'bg-white/[0.08] text-zinc-400 hover:bg-white/[0.12]'
                      : 'bg-white/70 text-slate-600 hover:bg-white'
                    }`}
                >
                  {t('messages.groups')}
                </motion.button>
                <motion.button
                  onClick={() => setActiveFilter('unencrypted')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${activeFilter === 'unencrypted'
                    ? theme === 'dark'
                      ? 'bg-sky-500 text-white shadow-[0_10px_24px_-16px_rgba(14,165,233,0.9)]'
                      : 'bg-sky-600 text-white shadow-[0_10px_24px_-16px_rgba(2,132,199,0.9)]'
                    : theme === 'dark'
                      ? 'bg-white/[0.08] text-zinc-400 hover:bg-white/[0.12]'
                      : 'bg-white/70 text-slate-600 hover:bg-white'
                    }`}
                >
                  {t('messages.unencrypted')}
                </motion.button>
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
              {isLoadingChats ? (
                <div className="p-3 sm:p-4 space-y-3" aria-busy="true">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center space-x-3 p-3 sm:p-4 rounded-3xl border ${theme === 'dark' ? 'bg-white/[0.06] border-white/[0.08]' : 'bg-white/70 border-white/80'}`}
                    >
                      <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full animate-pulse ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />
                      <div className="flex-1 space-y-2">
                        <div className={`h-3 w-40 rounded animate-pulse ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />
                        <div className={`h-3 w-28 rounded animate-pulse ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />
                      </div>
                      <div className={`h-3 w-10 rounded animate-pulse ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />
                    </div>
                  ))}
                </div>
              ) : chatsList.filter((chat: ChatItem) => {
                if (activeFilter === 'all') return true;
                if (activeFilter === 'unread') return chat.unread > 0;
                if (activeFilter === 'unencrypted') return !chat.encrypted;
                return true;
              }).length === 0 ? (
                <div className={`flex items-center justify-center h-full text-center p-8 ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>
                  {t('messages.no_chats_found')}
                </div>
              ) : chatsList.filter((chat: ChatItem) => {
                if (activeFilter === 'all') return true;
                if (activeFilter === 'unread') return chat.unread > 0;
                if (activeFilter === 'unencrypted') return !chat.encrypted;
                return true;
              }).map((chat: ChatItem) => (
                <div
                  key={chat.id}
                  className={`group/item mx-2 mb-2 rounded-[28px] p-3 sm:p-4 cursor-pointer transition-all border relative ${theme === 'dark' ? 'border-white/[0.08]' : 'border-white/70'
                    } ${selectedChat === chat.id
                      ? theme === 'dark'
                        ? 'bg-sky-500/[0.14] border-sky-400/20 shadow-[0_18px_45px_-30px_rgba(14,165,233,0.65)]'
                        : 'bg-white/[0.92] border-sky-100 shadow-[0_18px_45px_-32px_rgba(2,132,199,0.55)]'
                      : theme === 'dark'
                        ? 'bg-white/[0.03] hover:bg-white/[0.07]'
                        : 'bg-white/[0.42] hover:bg-white/[0.78]'
                    }`}
                  onClick={() => handleChatSelect(chat.id)}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="relative flex-shrink-0">
                      {chat.avatar ? (
                        <img
                          src={chat.avatar}
                          alt={chat.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-lg font-bold ${theme === 'dark' ? 'bg-zinc-900 text-white border border-white/10' : 'bg-slate-950 text-white'
                          }`}>
                          {chat.avatarLetter || chat.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {!chat.encrypted && (
                        <Lock className={`absolute -bottom-1 left-0 w-3 h-3 ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'
                          }`} />
                      )}
                      {chat.online && (
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 rounded-full ${theme === 'dark' ? 'bg-sky-400 border-zinc-950' : 'bg-sky-500 border-white'
                          }`}></div>
                      )}
                      {chat.verified && (
                        <Check className={`absolute -top-1 -right-1 w-4 h-4 ${theme === 'dark' ? 'text-sky-300' : 'text-sky-600'
                          }`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0 flex-1">
                          <h3 className={`font-semibold truncate text-sm sm:text-base ${theme === 'dark' ? 'text-white' : 'text-slate-950'
                            }`}>{chat.name}</h3>
                          {chat.emojis && (
                            <span className="ml-1 text-xs sm:text-sm">{chat.emojis}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                          <span className={`text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'
                            }`}>{chat.lastTime}</span>
                          {chat.unread === 0 && (
                            <CheckCheck className={`w-3 h-3 ${theme === 'dark' ? 'text-sky-300' : 'text-sky-600'
                              }`} />
                          )}
                        </div>
                      </div>
                      <div className="mt-1">
                        {selectedChat === chat.id && otherUserTyping ? (
                          <p className={`text-xs sm:text-sm truncate text-green-500 font-medium`}>
                            {t('messages.typing')}
                          </p>
                        ) : (
                          (chat.lastMessage || '').split('\n').slice(0, 2).map((line: string, idx: number) => (
                            <p key={idx} className={`text-xs sm:text-sm truncate ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'
                              }`}>{line}</p>
                          ))
                        )}
                      </div>
                      {chat.unread > 0 && (
                        <div className="flex justify-end mt-1 sm:mt-2">
                          <span className={`text-white text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-sky-400 text-zinc-950' : 'bg-sky-600 text-white'
                            }`}>
                            {chat.unread}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* More Menu Button */}
                  <div className="absolute top-2 right-2">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenChatItemMenu(openChatItemMenu === chat.id ? null : chat.id);
                      }}
                      className={`p-1.5 rounded-full transition-colors ${theme === 'dark'
                        ? 'hover:bg-white/10 text-zinc-400'
                        : 'hover:bg-sky-50 text-slate-500'
                        }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </motion.button>
                    <AnimatePresence>
                      {openChatItemMenu === chat.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -5 }}
                          transition={{ duration: 0.15 }}
                          className={`absolute right-0 top-full mt-1 rounded-2xl shadow-2xl border z-50 p-1 backdrop-blur-2xl ${theme === 'dark'
                            ? 'bg-zinc-900/[0.92] border-white/10'
                            : 'bg-white/[0.92] border-white/70'
                            }`}
                          style={{ minWidth: '140px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleClearChatHistory(chat.id, false)}
                            className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2.5 rounded-lg transition-colors ${theme === 'dark'
                              ? 'text-gray-200 hover:bg-white/10'
                              : 'text-gray-700 hover:bg-black/5'
                              }`}
                          >
                            <RefreshCw className="w-4 h-4 opacity-70" />
                            Clear History for Me
                          </button>
                          <button
                            onClick={() => handleClearChatHistory(chat.id, true)}
                            className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2.5 rounded-lg transition-colors ${theme === 'dark'
                              ? 'text-gray-200 hover:bg-white/10'
                              : 'text-gray-700 hover:bg-black/5'
                              }`}
                          >
                            <RefreshCw className="w-4 h-4 opacity-70" />
                            Clear History for All
                          </button>
                          <div className={`my-1 h-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />
                          <button
                            onClick={() => handleDeleteChat(chat.id, false)}
                            className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2.5 rounded-lg transition-colors ${theme === 'dark'
                              ? 'text-gray-200 hover:bg-white/10'
                              : 'text-gray-700 hover:bg-black/5'
                              }`}
                          >
                            <Trash2 className="w-4 h-4 opacity-70" />
                            Delete for Me
                          </button>
                          <button
                            onClick={() => handleDeleteChat(chat.id, true)}
                            className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2.5 rounded-lg transition-colors ${theme === 'dark'
                              ? 'text-red-400 hover:bg-red-500/10'
                              : 'text-red-600 hover:bg-red-50'
                              }`}
                          >
                            <Trash2 className="w-4 h-4 opacity-70" />
                            Delete for All
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <AnimatePresence mode="wait">
            {selectedChat ? (
              <motion.div
                key={`chat-view-${selectedChat}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{
                  duration: 0.2,
                  ease: 'easeOut'
                }}
                className="flex-1 flex flex-col min-h-0 min-w-0 relative z-10 h-full"
                style={{
                  flex: '1 1 auto',
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',

                }}
              >
                {/* Chat Header */}
                <div
                  ref={headerRef}
                  className={`flex-shrink-0 z-30 p-3 sm:p-4 border-b ${theme === 'dark'
                    ? 'cv-card-surface-soft border-white/10 backdrop-blur-2xl'
                    : 'border-white/70 bg-white/75 backdrop-blur-2xl'
                    }`}
                  style={{
                    flexGrow: 0,
                    flexShrink: 0,
                    flexBasis: 'auto'
                  }}
                >
                  <div className="flex flex-row gap-2 items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      {/* Mobile back button */}
                      <motion.button
                        onClick={() => {
                          setSelectedChat(null);
                          setShowSidebar(true);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`lg:hidden p-2 rounded-full flex-shrink-0 mr-1 transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-sky-50'}`}
                      >
                        <ArrowLeft className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} />
                      </motion.button>

                      {selectedPrivateChat ? (
                        <motion.button
                          onClick={() => {
                            setShowProfile(!showProfile);
                          }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 cursor-pointer"
                        >
                          <div className="relative flex-shrink-0">
                            {selectedPrivateChat.avatar ? (
                              <img
                                src={selectedPrivateChat.avatar}
                                alt={selectedPrivateChat.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold ${theme === 'dark' ? 'bg-zinc-900 text-white border border-white/10' : 'bg-slate-950 text-white'
                                }`}>
                                {selectedPrivateChat.avatarLetter || selectedPrivateChat.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <div className="flex items-center gap-1">
                              <h2 className={`font-semibold truncate text-base ${theme === 'dark' ? 'text-white' : 'text-slate-950'
                                }`}>{selectedPrivateChat.name}</h2>
                              {selectedPrivateChat.emojis && (
                                <span className="text-base">{selectedPrivateChat.emojis}</span>
                              )}
                              {selectedPrivateChat.verified && (
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${theme === 'dark' ? 'bg-sky-300' : 'bg-sky-600'
                                  }`}>
                                  <Check className={`w-2.5 h-2.5 ${theme === 'dark' ? 'text-zinc-950' : 'text-white'
                                    }`} />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className={`text-sm truncate ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'
                                }`}>@{selectedPrivateChat.username || selectedPrivateChat.name.toLowerCase()}</p>
                              {otherUserTyping && (
                                <span className="text-xs font-medium text-green-500 flex-shrink-0">
                                  {t('messages.typing')}
                                </span>

                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">

                            <motion.div
                              animate={{ rotate: showProfile ? 180 : 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              className="flex-shrink-0"
                            >
                              {showProfile ? (
                                <ChevronUp className={`w-5 h-5 ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'
                                  }`} />
                              ) : (
                                <ChevronDown className={`w-5 h-5 ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'
                                  }`} />
                              )}
                            </motion.div>
                          </div>
                        </motion.button>
                      ) : null}
                    </div>
                    {/* Chat Actions Menu */}
                    <div className="relative flex flex-row gap-2 flex-shrink-0">
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefreshMessages();
                        }}
                        whileTap={{ scale: 0.95 }}
                        disabled={isRefreshingMessages || isLoadingMessages}
                        className={`p-2 rounded-full transition-colors ${theme === 'dark'
                          ? 'hover:bg-white/10 text-zinc-400'
                          : 'hover:bg-sky-50 text-slate-500'
                          } disabled:opacity-50`}
                      >
                        <RefreshCw
                          className={`w-5 h-5 ${isRefreshingMessages ? 'animate-spin' : ''
                            }`}
                        />
                      </motion.button>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowChatMenu(!showChatMenu);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-sky-50'
                          }`}
                      >
                        <MoreVertical className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} />
                      </motion.button>
                      {showChatMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className={`absolute right-0 top-full mt-2 z-50 min-w-[200px] rounded-2xl shadow-2xl border backdrop-blur-2xl overflow-hidden ${theme === 'dark'
                            ? 'bg-zinc-900/[0.92] border-white/10'
                            : 'bg-white/[0.92] border-white/70'
                            }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="p-1">
                            {selectedChat && (
                              <>
                                <button
                                  onClick={() => handleClearChatHistory(selectedChat, false)}
                                  className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2.5 rounded-lg transition-colors ${theme === 'dark'
                                    ? 'text-gray-200 hover:bg-white/10'
                                    : 'text-gray-700 hover:bg-black/5'
                                    }`}
                                >
                                  <RefreshCw className="w-4 h-4 opacity-70" />
                                  Clear History for Me
                                </button>
                                <button
                                  onClick={() => handleClearChatHistory(selectedChat, true)}
                                  className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2.5 rounded-lg transition-colors ${theme === 'dark'
                                    ? 'text-gray-200 hover:bg-white/10'
                                    : 'text-gray-700 hover:bg-black/5'
                                    }`}
                                >
                                  <RefreshCw className="w-4 h-4 opacity-70" />
                                  Clear History for All
                                </button>
                              </>
                            )}

                            <div className={`my-1 h-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />

                            {selectedChat && (
                              <>
                                <button
                                  onClick={() => handleDeleteChat(selectedChat, false)}
                                  className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2.5 rounded-lg transition-colors ${theme === 'dark'
                                    ? 'text-gray-200 hover:bg-white/10'
                                    : 'text-gray-700 hover:bg-black/5'
                                    }`}
                                >
                                  <Trash2 className="w-4 h-4 opacity-70" />
                                  Delete Chat for Me
                                </button>
                                <button
                                  onClick={() => handleDeleteChat(selectedChat, true)}
                                  className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2.5 rounded-lg transition-colors ${theme === 'dark'
                                    ? 'text-red-400 hover:bg-red-500/10'
                                    : 'text-red-600 hover:bg-red-50'
                                    }`}
                                >
                                  <Trash2 className="w-4 h-4 opacity-70" />
                                  Delete Chat for All
                                </button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages or Profile */}
                <AnimatePresence mode="wait">
                  {showProfile && selectedPrivateChat ? (
                    <motion.div
                      key="profile-view"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{
                        duration: 0.25,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      className="flex-1 overflow-y-auto no-scrollbar min-h-0"
                      style={{
                        flexGrow: 1,
                        flexShrink: 1,
                        minHeight: 0,
                        overflowY: 'auto'
                      }}
                    >
                      <div className="h-full">
                        <ProfileScreen inline isEmbed username={selectedPrivateChat.username || selectedPrivateChat.name.toLowerCase()} />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="messages-view"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{
                        duration: 0.25,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      ref={null/*messagesContainerRef*/}
                      className={`flex-1 flex flex-col p-3 sm:p-4 no-scrollbar min-h-0 overflow-hidden ${theme === 'dark'
                        ? 'cv-card-surface-muted'
                        : 'bg-sky-50/[0.28]'
                        }`}
                      style={{
                        flexGrow: 1,
                        flexShrink: 1,
                        minHeight: 0,
                        overflowY: 'auto',
                        paddingBottom: otherUserTyping ? '0' : undefined,
                        ...(isMobile && selectedChat && headerHeight > 0 && inputHeight > 0 ? {
                          maxHeight: `calc(100% - ${inputHeight}px${otherUserTyping ? ' - 60px' : ''})`,
                          height: `calc(100% - ${inputHeight}px${otherUserTyping ? ' - 60px' : ''})`,
                        } : {})
                      }}
                    >
                      <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto min-h-0">
                        {isLoadingMessages ? (
                          <div className="flex flex-col gap-4 px-2 py-4 max-w-4xl mx-auto">
                            {/* Skeleton bubbles — alternating sides like a real conversation */}
                            {[
                              { side: 'other', widths: ['w-48', 'w-32'] },
                              { side: 'me', widths: ['w-56'] },
                              { side: 'other', widths: ['w-40', 'w-52'] },
                              { side: 'me', widths: ['w-36', 'w-44'] },
                              { side: 'other', widths: ['w-44'] },
                              { side: 'me', widths: ['w-52', 'w-28'] },
                            ].map((group, gi) => (
                              <div
                                key={gi}
                                className={`flex flex-col gap-1 ${group.side === 'me' ? 'items-end' : 'items-start'}`}
                              >
                                {group.widths.map((w, bi) => (
                                  <div
                                    key={bi}
                                    className={`h-9 rounded-2xl animate-pulse ${w} ${group.side === 'me'
                                      ? theme === 'dark' ? 'bg-sky-500/30 rounded-br-sm' : 'bg-sky-200 rounded-br-sm'
                                      : theme === 'dark' ? 'bg-white/10 rounded-bl-sm' : 'bg-white/80 rounded-bl-sm'
                                      }`}
                                    style={{ animationDelay: `${(gi * 0.12 + bi * 0.06).toFixed(2)}s` }}
                                  />
                                ))}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex-1 min-h-0"> {/* Container for Virtuoso */}
                            <Virtuoso
                              style={{ height: '100%' }}
                              data={messages}
                              initialTopMostItemIndex={messages.length - 1}
                              followOutput="auto"
                              itemContent={(index, msg) => (
                                <div className="pb-3">
                                  {index === 0 && (
                                    <div className="flex justify-center my-6">
                                      <div className={`px-3 py-1 rounded-full border backdrop-blur-xl ${theme === 'dark' ? 'bg-white/[0.08] border-white/10' : 'bg-white/80 border-white/70'}`}>
                                        <span className={`text-xs font-medium ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>
                                          {t('messages.today')}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  <MessageItem
                                    key={msg.id}
                                    msg={msg}
                                    theme={theme}
                                    nowMs={countdownNow}
                                    onContextMenu={handleMessageContextMenu}
                                    onMediaOpen={openMediaViewer}
                                    onMessageOpen={handleMessageOpen}
                                    isMessageOpening={openingMessageIds.has(msg.id)}
                                    hasViewOnceOpenError={viewOnceOpenErrorIds.has(msg.id)}
                                  />
                                </div>
                              )}
                              components={{
                                EmptyPlaceholder: () => (
                                  <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                      <MessageCircle className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-zinc-600' : 'text-sky-300'}`} />
                                      <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>
                                        {t('messages.no_messages_yet')}
                                      </p>
                                    </div>
                                  </div>
                                )
                              }}
                            />
                          </div>
                        )}

                        {/* Telegram/WhatsApp Style Context Menu */}
                        {typeof document !== 'undefined' && createPortal(
                          <AnimatePresence>
                          {selectedMessageId && messageMenuPosition && (
                          <motion.div
                            ref={messageMenuRef}
                            role="menu"
                            aria-label={t('messages.message_actions', { defaultValue: 'Message actions' })}
                            tabIndex={-1}
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.94 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className={`message-context-menu fixed z-[1000] min-w-[180px] overflow-hidden rounded-xl shadow-2xl
                              ${theme === 'dark'
                                ? 'bg-zinc-900/95 border border-white/10 backdrop-blur-2xl'
                                : 'bg-white/95 border border-white/70 backdrop-blur-2xl'}`
                            }
                            style={{
                              left: resolvedMessageMenuPosition?.x ?? 0,
                              top: resolvedMessageMenuPosition?.y ?? 0,
                              visibility: resolvedMessageMenuPosition ? 'visible' : 'hidden',
                              transformOrigin: 'top center',
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="p-1.5">
                              <button
                                role="menuitem"
                                onClick={() => handleDeleteMessage(selectedMessageId, false)}
                                className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-3 rounded-lg transition-colors ${theme === 'dark'
                                  ? 'text-gray-200 hover:bg-white/10'
                                  : 'text-gray-700 hover:bg-black/5'
                                  }`}
                              >
                                <Trash2 className="w-4 h-4 opacity-70" />
                                <span className="font-medium">Delete for Me</span>
                              </button>

                              {messages.find(m => m.id === selectedMessageId)?.sender === 'me' && (
                                <>
                                  <div className={`my-1 h-px mx-1 ${theme === 'dark' ? 'bg-white/10' : 'bg-black/5'}`} />
                                  <button
                                    role="menuitem"
                                    onClick={() => handleDeleteMessage(selectedMessageId, true)}
                                    className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-3 rounded-lg transition-colors ${theme === 'dark'
                                      ? 'text-red-400 hover:bg-red-500/10'
                                      : 'text-red-600 hover:bg-red-50'
                                      }`}
                                  >
                                    <Trash2 className="w-4 h-4 opacity-70" />
                                    <span className="font-medium">Delete for All</span>
                                  </button>
                                </>
                              )}

                              <div className={`my-1 h-px mx-1 ${theme === 'dark' ? 'bg-white/10' : 'bg-black/5'}`} />

                              <button
                                role="menuitem"
                                onClick={() => {
                                  closeMessageContextMenu();
                                }}
                                className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-3 rounded-lg transition-colors ${theme === 'dark'
                                  ? 'text-gray-400 hover:bg-white/10'
                                  : 'text-gray-500 hover:bg-black/5'
                                  }`}
                              >
                                <X className="w-4 h-4 opacity-70" />
                                <span className="font-medium">Cancel</span>
                              </button>
                            </div>
                          </motion.div>
                          )}
                          </AnimatePresence>,
                          document.body
                        )}


                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Typing indicator - Other user typing - Outside messages container to be above input */}
                {!showProfile && otherUserTyping && (
                  <div className={`flex-shrink-0 px-3 sm:px-4 py-2 ${theme === 'dark' ? 'cv-card-surface-muted' : 'bg-sky-50/[0.28]'
                    }`}>
                    <div className="flex justify-start">
                      <div className={`max-w-[75%] sm:max-w-xs md:max-w-sm px-4 py-2.5 rounded-2xl shadow-sm border backdrop-blur-xl ${theme === 'dark' ? 'bg-zinc-900/80 text-white border-white/10' : 'bg-white/[0.85] text-slate-900 border-white/70'
                        }`} style={{
                          borderBottomLeftRadius: '4px',
                          borderTopLeftRadius: '16px',
                          borderTopRightRadius: '16px',
                          borderBottomRightRadius: '16px'
                        }}>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'
                            }`}>
                            {selectedPrivateChat?.name || t('messages.user')} {t('messages.typing')}
                          </span>
                          <div className="flex space-x-1">
                            <div className={`w-2 h-2 rounded-full animate-bounce ${theme === 'dark' ? 'bg-sky-300' : 'bg-sky-600'
                              }`}></div>
                            <div className={`w-2 h-2 rounded-full animate-bounce ${theme === 'dark' ? 'bg-sky-300' : 'bg-sky-600'
                              }`} style={{ animationDelay: '0.2s' }}></div>
                            <div className={`w-2 h-2 rounded-full animate-bounce ${theme === 'dark' ? 'bg-sky-300' : 'bg-sky-600'
                              }`} style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message Input Container */}
                {!showProfile && (
                  <div
                    ref={inputContainerRef}
                    className={`relative flex-shrink-0 border-t w-full p-3 transition-all duration-300 sm:p-4 ${theme === 'dark'
                        ? 'cv-card-surface-soft border-white/10 backdrop-blur-2xl'
                        : 'border-white/70 bg-white/75 backdrop-blur-2xl'
                      }`}
                    style={{
                      paddingBottom: isMobile ? `max(12px, env(safe-area-inset-bottom, 12px))` : undefined,
                      flexGrow: isMobile ? undefined : 0,
                      flexShrink: isMobile ? undefined : 0,
                      flexBasis: isMobile ? undefined : 'auto',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div className="mb-2 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={viewOnceEnabled}
                        aria-label={`${t('messages.view_once_label')}. ${t(viewOnceEnabled && !hasValidViewOncePhoto
                          ? 'messages.view_once_requires_single_photo'
                          : 'messages.view_once_description')}`}
                        title={t(viewOnceEnabled && !hasValidViewOncePhoto
                          ? 'messages.view_once_requires_single_photo'
                          : 'messages.view_once_description')}
                        onClick={handleViewOnceToggle}
                        className={`group flex h-10 min-w-0 w-full items-center justify-between gap-2 rounded-xl border px-2.5 text-xs font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:w-auto ${viewOnceEnabled
                          ? theme === 'dark'
                            ? 'border-sky-300/30 bg-sky-400/12 text-sky-100'
                            : 'border-sky-200 bg-sky-50/90 text-sky-900'
                          : theme === 'dark'
                            ? 'border-white/10 bg-white/[0.045] text-zinc-300 hover:bg-white/[0.075]'
                            : 'border-slate-200/80 bg-white/80 text-slate-600 hover:bg-white'
                          }`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors ${viewOnceEnabled
                            ? theme === 'dark' ? 'bg-sky-300/15 text-sky-200' : 'bg-sky-100 text-sky-700'
                            : theme === 'dark' ? 'bg-white/[0.06] text-zinc-400' : 'bg-slate-100 text-slate-500'
                            }`}>
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                          <span className="truncate text-left leading-none">{t('messages.view_once_label')}</span>
                        </span>
                        <span
                          aria-hidden="true"
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${viewOnceEnabled
                            ? 'bg-sky-500 shadow-inner shadow-sky-950/15'
                            : theme === 'dark' ? 'bg-white/15' : 'bg-slate-300'
                            }`}
                        >
                          <span className={`block h-4 w-4 rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.35)] transition-transform duration-200 ease-out ${viewOnceEnabled
                            ? 'translate-x-4'
                            : 'translate-x-0'
                            }`} />
                        </span>
                      </button>

                      <label
                        title={t('messages.message_expiry_description')}
                        className={`flex h-10 min-w-0 w-full items-center gap-2 rounded-xl border px-2.5 text-xs font-semibold transition-colors duration-200 sm:w-auto ${messageExpirySeconds > 0
                          ? theme === 'dark'
                            ? 'border-amber-300/25 bg-amber-400/10 text-amber-200'
                            : 'border-amber-200 bg-amber-50 text-amber-800'
                          : theme === 'dark'
                            ? 'border-white/10 bg-white/[0.045] text-zinc-300'
                            : 'border-slate-200/80 bg-white/80 text-slate-600'
                          }`}
                      >
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${messageExpirySeconds > 0
                          ? theme === 'dark' ? 'bg-amber-300/15 text-amber-200' : 'bg-amber-100 text-amber-700'
                          : theme === 'dark' ? 'bg-white/[0.06] text-zinc-400' : 'bg-slate-100 text-slate-500'
                          }`}>
                          <Timer className="h-3.5 w-3.5" />
                        </span>
                        <span className="sr-only">{t('messages.message_expiry')}</span>
                        <span className="relative flex min-w-0 flex-1 items-center sm:flex-none">
                          <select
                            value={messageExpirySeconds}
                            onChange={(event) => setMessageExpirySeconds(Number(event.target.value) as MessageExpirySeconds)}
                            aria-label={t('messages.message_expiry')}
                            className="min-w-0 w-full cursor-pointer appearance-none truncate bg-transparent pr-5 text-xs font-semibold leading-none outline-none sm:w-[10.5rem]"
                          >
                            {MESSAGE_EXPIRY_OPTIONS.map((seconds) => (
                              <option key={seconds} value={seconds} className="text-slate-950">
                                {t(MESSAGE_EXPIRY_LABEL_KEYS[seconds])}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-0 h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                        </span>
                      </label>
                    </div>

                    {/* Selected Media Preview */}
                    {(() => {
                      const totalMedia = selectedImages.length + selectedVideos.length;
                      const allMedia = [
                        ...selectedImages.map((file, idx) => ({ type: 'image' as const, file, index: idx })),
                        ...selectedVideos.map((file, idx) => ({ type: 'video' as const, file, index: idx }))
                      ];

                      if (totalMedia === 0) return null;

                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mb-3 -mx-1 overflow-x-auto px-1"
                        >
                          <div className="flex items-center gap-2 pb-1">
                            {allMedia.map((media, idx) => (
                              <SelectedMediaThumbnail
                                key={`${media.type}-${media.file.name}-${media.file.lastModified}-${idx}`}
                                file={media.file}
                                kind={media.type}
                                index={media.index}
                                theme={theme}
                                onRemove={media.type === 'image' ? removeImage : removeVideo}
                                removeLabel={t('messages.remove_attachment', { name: media.file.name })}
                              />
                            ))}
                          </div>
                        </motion.div>
                      );
                    })()}

                    <div className="flex items-center space-x-2">
                      {/* Hidden File Inputs */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple={!viewOnceEnabled}
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <input
                        ref={viewOnceImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleViewOnceImageUpload}
                        aria-label={t('messages.view_once_choose_photo')}
                        className="hidden"
                      />
                      <input
                        ref={videoInputRef}
                        type="file"
                        multiple
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                      <div
                        className={`flex w-full items-center gap-2 rounded-full border transition-all shadow-[0_16px_44px_-30px_rgba(15,23,42,0.45)] ${theme === 'dark'
                          ? 'bg-white/[0.08] border-white/10 focus-within:border-sky-400/[0.35] focus-within:ring-2 focus-within:ring-sky-500/20'
                          : 'bg-white/[0.88] border-white/80 focus-within:border-sky-200 focus-within:ring-2 focus-within:ring-sky-500/15'
                          } px-3 py-2 sm:py-2.5`}
                      >
                        <div className="flex items-center space-x-1">
                          {/* Image Upload Button */}
                          <motion.button
                            onClick={() => fileInputRef.current?.click()}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`p-1.5 rounded-full transition-all duration-200 ${selectedImages.length > 0
                              ? theme === 'dark'
                                ? 'bg-blue-500/15 text-blue-400'
                                : 'bg-blue-50 text-blue-600'
                              : theme === 'dark'
                                ? 'hover:bg-white/10 text-zinc-400'
                                : 'hover:bg-sky-50 text-slate-600'
                              }`}
                          >
                            <Image className="w-4 h-4" />
                          </motion.button>
                          {/* Video Upload Button */}
                          <motion.button
                            onClick={() => videoInputRef.current?.click()}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`p-1.5 rounded-full transition-all duration-200 ${selectedVideos.length > 0
                              ? theme === 'dark'
                                ? 'bg-purple-500/15 text-purple-400'
                                : 'bg-purple-50 text-purple-600'
                              : theme === 'dark'
                                ? 'hover:bg-white/10 text-zinc-400'
                                : 'hover:bg-sky-50 text-slate-600'
                              }`}
                          >
                            <Video className="w-4 h-4" />
                          </motion.button>
                          {/* Emoji Picker Button */}
                          <motion.button
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`p-1.5 rounded-full ${theme === 'dark' ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-sky-50 text-slate-600'
                              }`}
                          >
                            <Smile className="w-4 h-4" />
                          </motion.button>
                        </div>
                        <input
                          type="text"
                          value={message}
                          onChange={handleTyping}
                          onKeyPress={handleKeyPress}
                          placeholder={t('messages.send_message_placeholder')}
                          className={`flex-1 bg-transparent border-0 text-sm focus:outline-none ${theme === 'dark' ? 'text-white placeholder-zinc-500' : 'text-slate-900 placeholder-slate-500'
                            }`}
                        />
                        <motion.button
                          onClick={handleSendMessage}
                          disabled={!message.trim() && selectedImages.length === 0 && selectedVideos.length === 0}
                          whileTap={{ scale: 0.95 }}
                          className={`flex-shrink-0 p-2 rounded-full transition-all ${(message.trim() || selectedImages.length > 0 || selectedVideos.length > 0)
                            ? theme === 'dark'
                              ? 'bg-sky-400 text-zinc-950 hover:bg-sky-300 shadow-[0_10px_24px_-14px_rgba(14,165,233,0.9)]'
                              : 'bg-sky-600 text-white hover:bg-sky-700 shadow-[0_10px_24px_-14px_rgba(2,132,199,0.9)]'
                            : theme === 'dark'
                              ? 'bg-white/10 text-zinc-500 cursor-not-allowed'
                              : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                          <Send className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div className={`mt-2 p-3 rounded-2xl border backdrop-blur-2xl ${theme === 'dark' ? 'bg-zinc-900/[0.92] border-white/10' : 'bg-white/[0.92] border-white/70'
                        }`}>
                        <div className="grid grid-cols-8 gap-2">
                          {emojis.map((emoji, index) => (
                            <motion.button
                              key={index}
                              onClick={() => handleEmojiClick(emoji)}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              className={`p-2 text-lg rounded-full ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-sky-50'
                                }`}
                            >
                              {emoji}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="chat-list-placeholder"
                initial={isMobile ? undefined : { opacity: 0 }}
                animate={isMobile ? undefined : { opacity: 1 }}
                exit={isMobile ? undefined : { opacity: 0 }}
                transition={isMobile ? undefined : {
                  duration: 0.15,
                  ease: 'easeOut'
                }}
                className="flex-1 flex flex-col h-full w-full relative z-10 overflow-hidden"
              >
                {!isMobile ? (
                  <div className={`flex-1 flex items-center justify-center ${theme === 'dark' ? 'cv-card-surface-muted' : 'bg-sky-50/[0.28]'
                    }`}>
                    <div className="text-center px-4">
                      <MessageCircle className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-zinc-600' : 'text-sky-300'
                        }`} />
                      <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-950'
                        }`}>{t('messages.select_conversation')}</h2>
                      <p className={`${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'
                        }`}>{t('messages.select_conversation_subtitle')}</p>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {displayedViewerKey && displayedViewerItems.length > 0 && displayedViewerIndex >= 0 && (
        <ChatMediaViewer
          key={displayedViewerKey}
          items={displayedViewerItems}
          initialIndex={displayedViewerIndex}
          onClose={closeMediaViewer}
          labels={{
            close: t('messages.close_media_viewer'),
            next: t('messages.next_media'),
            previous: t('messages.previous_media'),
            title: t('messages.media_viewer'),
            loadError: t('messages.media_load_error'),
          }}
        />
      )}
    </div>
  );
};

export default MessagesScreen;
