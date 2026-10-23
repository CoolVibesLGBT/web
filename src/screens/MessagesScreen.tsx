import { EmojiText } from '@/features/emoticons/Emoji';
import { ChatMediaImage, ChatMediaVideo } from '@/features/chat/ProtectedChatMedia';
import AnimatedEmptyState from '@/components/ui/AnimatedEmptyState';
import ViewTabs from '@/components/ui/ViewTabs';
import SearchField from '@/components/ui/SearchField';
import ChatWallpaper from '@/features/appearance/ChatWallpaper';
import ViewOnceDust from '@/features/chat/ViewOnceDust';
import MediaSendDialog from '@/features/chat/MediaSendDialog';
import { createViewOncePreview, readViewOncePreview } from '@/features/chat/viewOncePreview';
import '@/features/chat/telegram-chat.css';
import TelegramChatListRow from '@/features/chat/TelegramChatListRow';
import ChatPeerHeader from '@/features/chat/ChatPeerHeader';
import TelegramIcon from '@/features/chat/TelegramIcon';
import AttachmentMenu from '@/features/chat/AttachmentMenu';
import MessageActionsMenu, { type MessageAction } from '@/features/chat/MessageActionsMenu';
import FloatingContextMenu from '@/features/chat/FloatingContextMenu';
import ForwardPicker from '@/features/chat/ForwardPicker';
import GroupComposer, { type CreatedGroup } from '@/features/chat/GroupComposer';
import GroupDetails from '@/features/chat/GroupDetails';
import ClipboardFeedback from '@/features/chat/ClipboardFeedback';
import useClipboard from '@/hooks/useClipboard';
import '@/features/chat/chat-confirm.css';
import { Sheet, ListRow } from '@/components/ui/Interface';
import Switch from '@/components/ui/Switch';
import EmptyConversation from '@/features/chat/EmptyConversation';
import StickerMedia from '@/features/emoticons/StickerMedia';
import GifMedia from '@/features/emoticons/GifMedia';
import { normalizeEmoticon, type ChatEmoticon, type EmoticonSelection } from '@/features/emoticons/types';
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
  MoreVertical,
  Paperclip,
  Lock,
  CheckCheck,
  ArrowLeft,
  X,
  Settings,
  RefreshCw,
  Video,
  Timer,
  Eye,
  EyeOff,
  CircleAlert,
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { getSafeImageURLEx } from '../helpers/helpers';
import { useTranslation } from 'react-i18next';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { useAtom } from 'jotai';
import { chatStateAtom, initialChatState, type Attachment, type ChatItem, type ChatMessage } from '@/state/chat';
import ChatMediaViewer from '@/features/chat/ChatMediaViewer';
import {
  resolveChatMedia,
  resolveChatMediaItems,
} from '@/features/chat/chatMedia';
import type { ResolvedChatMedia } from '@/features/chat/chatMedia';

const EmoticonPicker = React.lazy(() => import('@/features/emoticons/EmoticonPicker'));

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
  forwarded_from?: { name: string; date: string };
  parent?: BackendChatMessage | null;
  emoticon?: unknown;
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
  view_once_preview?: string;
  viewed_once?: boolean | number | string;
  attachments?: Attachment[];
  extras?: Record<string, unknown> | null;
}

interface ViewOnceSession {
  expanded?: boolean;
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
    forwardedFrom: !contentHidden && message.forwarded_from?.name ? message.forwarded_from : undefined,
    reply: message.parent?.id && !getBooleanValue(message.parent.content_hidden) && !getBooleanValue(message.parent.view_once) ? { id: message.parent.id, text: getMessageText(message.parent), sender: String(message.parent.author_id) === String(currentUserId) ? 'me' : 'other' } : undefined,
    emoticon: contentHidden ? undefined : normalizeEmoticon(message.emoticon ?? message.extras?.emoticon),
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
    viewOncePreview: viewOnce ? readViewOncePreview(message.view_once_preview) : undefined,
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

function sameMessageGroup(first?: ChatMessage, second?: ChatMessage) {
  if (!first || !second || first.sender !== second.sender || first.emoticon || second.emoticon || first.viewOnce || second.viewOnce) return false;
  const a = Date.parse(first.createdAt || ''), b = Date.parse(second.createdAt || '');
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(b - a) < 300_000 && new Date(a).toDateString() === new Date(b).toDateString();
}

interface MessageItemProps {
  revealedPhoto?: string;
  onRevealExpand: () => void;
  onMediaReady?: () => void;
  selected?: boolean;
  selectionMode?: boolean;
  onSelect?: (id: string, range?: boolean) => void;
  onReplyOpen?: (id: string) => void;
  msg: ChatMessage;
  groupFirst?: boolean;
  groupLast?: boolean;
  theme: 'dark' | 'light';
  nowMs: number;
  onContextMenu: (point: { clientX: number; clientY: number }, id: string) => void;
  onMediaOpen: (messageId: string, attachmentId: string) => void;
  onMessageOpen: (messageId: string) => void;
  isMessageOpening: boolean;
  hasViewOnceOpenError: boolean;
}

interface ViewOnceMessageCardProps {
  revealedPhoto?: string;
  onRevealExpand: () => void;
  preview?: string;
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
  revealedPhoto,
  onRevealExpand,
  preview,
  theme,
  isMe,
  isViewed,
  isOpening,
  hasOpenError,
  onOpen,
}) => {
  const { t } = useTranslation('common');
  const state = hasOpenError
    ? isViewed ? 'error' : 'retry'
    : isViewed
      ? 'viewed'
      : isOpening
        ? 'opening'
        : isMe
          ? 'sent'
          : 'unopened';
  const isActionable = state === 'unopened' || state === 'opening' || state === 'sent' || state === 'retry';
  const title = state === 'retry'
    ? t('chat_actions.action_failed')
    : state === 'error'
    ? t('messages.view_once_unavailable')
    : state === 'viewed'
      ? t('messages.view_once_viewed')
      : state === 'sent'
        ? t('messages.view_once_sent')
        : state === 'opening'
          ? t('messages.view_once_loading')
          : t('messages.view_once_open');
  const description = state === 'retry'
    ? t('messages.view_once_open')
    : state === 'error'
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
  const concealed = state === 'unopened' || state === 'sent' || state === 'opening' || state === 'retry';
  const content = (
    <>
      {concealed && preview && <img src={preview} className="cv-view-once-preview" alt="" aria-hidden="true" draggable={false} />}
      {concealed && <ViewOnceDust />}
      <span className="cv-view-once-icon" aria-hidden="true">
        <StateIcon className={state === 'opening' ? 'animate-spin' : ''} />
        {concealed && <span className="cv-view-once-count">1</span>}
      </span>
      <span className="cv-view-once-copy">
        <span className="cv-view-once-status">{statusLabel}</span>
        <span className="cv-view-once-title">{title}</span>
        <span className="cv-view-once-description">{description}</span>
      </span>
    </>
  );

  const sharedClassName = `cv-view-once-card ${concealed ? 'cv-view-once-concealed' : 'cv-view-once-finished'} cv-view-once-${theme}`;
  const accessibleLabel = `${title}. ${description}`;

  if (revealedPhoto) {
    return <button type="button" className="cv-view-once-revealed" data-view-once-message={messageId} data-view-once-state="revealed"
      aria-label={t('messages.open_image', { name: t('messages.photo') })}
      onClick={event => { event.stopPropagation(); onRevealExpand(); }}>
      <img src={revealedPhoto} alt={t('messages.photo')} draggable={false} />
    </button>;
  }

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
        className={sharedClassName}
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
  revealedPhoto,
  onRevealExpand,
  selected = false,
  selectionMode = false,
  onSelect,
  onReplyOpen,
  onMediaReady,
  msg,
  groupFirst = true,
  groupLast = true,
  theme,
  nowMs,
  onContextMenu,
  onMediaOpen,
  onMessageOpen,
  isMessageOpening,
  hasViewOnceOpenError,
}) => {
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const bubbleRef = React.useRef<HTMLDivElement>(null);
  const timeRef = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const time = timeRef.current;
    const bubble = bubbleRef.current;
    if (!time || !bubble) return;
    const measure = () => bubble.style.setProperty('--cv-message-time-width', `${time.getBoundingClientRect().width + 8}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(time);
    return () => observer.disconnect();
  }, []);
  React.useEffect(() => () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }, []);
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
    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;
    longPressTimer.current = setTimeout(() => {
      onContextMenu({ clientX, clientY }, msg.id);
    }, 400); // 400ms for slightly snappier opening
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  return (
    <div
      id={`cv-message-${msg.id}`}
      data-message-id={msg.id}
      data-side={isMe ? 'outgoing' : 'incoming'}
      data-selected={selected}
      role={selectionMode ? 'checkbox' : undefined}
      aria-checked={selectionMode ? selected : undefined}
      aria-label={selectionMode ? `${t('chat_actions.select')}: ${msg.text || msg.emoticon?.emoji || t('messages.media')}` : undefined}
      tabIndex={selectionMode ? 0 : undefined}
      onClickCapture={event => { if (selectionMode) { event.preventDefault(); event.stopPropagation(); onSelect?.(msg.id, event.shiftKey); } }}
      onKeyDown={event => { if (selectionMode && [' ', 'Enter'].includes(event.key)) { event.preventDefault(); onSelect?.(msg.id, event.shiftKey); } }}
      className={`cv-chat-message-selectable flex ${isMe ? 'justify-end' : 'justify-start'} group relative`}
      onTouchStart={handleTouchStart}
      onTouchEnd={cancelLongPress}
      onTouchMove={cancelLongPress}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu({ clientX: e.clientX, clientY: e.clientY }, msg.id);
      }}
    >
      {selectionMode && <span className="cv-chat-selection-check" aria-hidden="true"><TelegramIcon name="check" /></span>}
      {/* Message Bubble */}
      <div
        data-side={isMe ? 'outgoing' : 'incoming'}
        data-kind={msg.emoticon?.kind}
        data-group-first={groupFirst}
        data-group-last={groupLast}
        data-has-text={!!msg.text}
        data-has-timer={msg.isDisappearing || undefined}
        ref={bubbleRef}
        data-has-media={!msg.viewOnce && !isHiddenDisappearing && !!msg.attachments?.some(attachment => resolveChatMedia(attachment))}
        className="cv-chat-bubble"
        onLoadCapture={onMediaReady}
        onLoadedMetadataCapture={onMediaReady}
      >
        {groupLast && <svg className="cv-message-tail" width="11" height="20" viewBox="0 0 11 20" aria-hidden="true"><g transform="translate(9 -14)" fillRule="evenodd"><path d="M-6 16h6v17c-.193-2.84-.876-5.767-2.05-8.782-.904-2.325-2.446-4.485-4.625-6.48A1 1 0 01-6 16z" transform="matrix(1 0 0 -1 0 49)" /></g></svg>}
        {!isHiddenDisappearing && msg.forwardedFrom && <div className="cv-chat-forwarded"><span>{t('chat_actions.forwarded_message')}</span><strong><bdi>{msg.forwardedFrom.name}</bdi></strong></div>}
        {!isHiddenDisappearing && msg.reply && <button type="button" className="cv-chat-reply" onClick={() => onReplyOpen?.(msg.reply!.id)}><strong>{t('chat_actions.reply')}</strong><span>{msg.reply.text || t('messages.media')}</span></button>}
        {!isHiddenDisappearing && msg.emoticon?.kind === 'sticker' && <StickerMedia document={msg.emoticon} size={180} onReady={onMediaReady} />}
        {!isHiddenDisappearing && msg.emoticon?.kind === 'gif' && <GifMedia className="cv-message-gif" document={msg.emoticon} />}
        {msg.viewOnce && (
          <div className="mb-2">
            <ViewOnceMessageCard
              messageId={msg.id}
              revealedPhoto={revealedPhoto}
              onRevealExpand={onRevealExpand}
              preview={msg.viewOncePreview}
              theme={theme}
              isMe={isMe}
              isViewed={!isMe && Boolean(msg.viewedOnce)}
              isOpening={isMessageOpening}
              hasOpenError={hasViewOnceOpenError}
              onOpen={() => onMessageOpen(msg.id)}
            />
          </div>
        )}

        {isHiddenDisappearing && (
          <div className={`mb-2 min-w-[190px] overflow-hidden rounded-2xl border p-2 ${theme === 'dark'
            ? 'border-white/10 bg-white/[0.05]'
            : 'border-[var(--cv-inner-border)] bg-white/65'
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
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-wait ${theme === 'dark'
                ? 'bg-brand text-zinc-950 hover:bg-brand'
                : 'bg-brand-hovered text-white hover:bg-brand-hovered'
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
          <div data-count={msg.attachments.length} className="cv-chat-media-grid">
            {msg.attachments.map((attachment, idx) => {
              const file = attachment.file;
              const media = resolveChatMedia(attachment);
              const isImage = media?.kind === 'image';
              const isVideo = media?.kind === 'video';
              const thumbClass = 'cv-chat-media-thumb';

              return (
                <React.Fragment key={attachment.id || idx}>
                  {isImage && media ? (
                    <button
                      type="button"
                      onClick={() => onMediaOpen(msg.id, media.attachmentId)}
                      style={{ aspectRatio: media.aspectRatio }}
                      className={thumbClass}
                      title={file.name}
                      aria-label={t('messages.open_image', { name: file.name })}
                    >
                      <ChatMediaImage
                        src={media.previewSrc}
                        alt={file.name}
                        className="cv-chat-photo"
                      />
                      <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/30" />
                    </button>
                  ) : isVideo && media ? (
                    <button
                      type="button"
                      onClick={() => onMediaOpen(msg.id, media.attachmentId)}
                      style={{ aspectRatio: media.aspectRatio }}
                      className={thumbClass}
                      title={file.name}
                      aria-label={t('messages.open_video', { name: file.name })}
                    >
                      {media.posterSrc ? (
                        <ChatMediaImage
                          src={media.posterSrc}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ChatMediaVideo
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
                      className={`flex max-w-[220px] items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 ${isMe ? 'border-white/30 bg-white/16' : theme === 'dark' ? 'border-white/10 bg-white/8' : 'border-[var(--cv-inner-border)] bg-slate-100/85'}`}
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
          <div className="cv-chat-message-text text-sm leading-relaxed mb-1 whitespace-pre-wrap break-words">
            <EmojiText>{msg.text}</EmojiText>
            {!msg.isDisappearing && <span className="cv-message-time-space" aria-hidden="true" />}
          </div>
        )}

        {/* Time and Status */}
        <div ref={timeRef} className={`cv-chat-time flex items-center ${isMe ? 'justify-end' : ''} mt-1 gap-1`}>
          {countdown !== null && (
            <span
              className={`mr-1 inline-flex items-center gap-1 text-[0.765rem] font-semibold ${isMe ? 'text-white/80' : theme === 'dark' ? 'text-amber-300' : 'text-amber-700'}`}
              title={t('messages.disappearing_message')}
            >
              <Timer className="h-3 w-3" />
              {countdown}
            </span>
          )}
          {isMe && msg.isDisappearing && !msg.openedAt && !msg.viewOnce && (
            <span
              className="mr-1 inline-flex items-center gap-1 text-[0.765rem] font-semibold text-white/80"
              title={t('messages.waiting_to_open')}
            >
              <Timer className="h-3 w-3" />
              {t('messages.waiting_to_open')}
            </span>
          )}
          <span className={`text-[0.765rem] ${isMe
            ? 'text-white/70'
            : theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'
            }`}>{msg.time}</span>
          {isMe && <CheckCheck className="w-3 h-3 text-white/70" />}
        </div>
      </div>
    </div>
  );
};

const MessagesScreen: React.FC = () => {
  const clipboard = useClipboard();
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
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const input = messageInputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 170)}px`;
  }, [message, selectedChat]);
  const [messageExpirySeconds, setMessageExpirySeconds] = useState<MessageExpirySeconds>(0);
  const [viewOnceEnabled, setViewOnceEnabled] = useState(false);
  const [failedEmoticon, setFailedEmoticon] = useState<ChatEmoticon | null>(null);
  const [countdownNow, setCountdownNow] = useState(() => Date.now());
  const [activeMedia, setActiveMedia] = useState<{ messageId: string; attachmentId: string } | null>(null);
  const [viewOnceSession, setViewOnceSession] = useState<ViewOnceSession | null>(null);
  const [openingMessageIds, setOpeningMessageIds] = useState<Set<string>>(() => new Set());
  const [viewOnceOpenErrorIds, setViewOnceOpenErrorIds] = useState<Set<string>>(() => new Set());
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const [showComposerOptions, setShowComposerOptions] = useState(false);
  const attachmentButtonRef = useRef<HTMLButtonElement>(null);
  const [chatSearch, setChatSearch] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const viewOnceImageInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [messageMenuPosition, setMessageMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [resolvedMessageMenuPosition, setResolvedMessageMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const messageMenuRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<VirtuosoHandle>(null);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(() => new Set());
  const lastSelectionRef = useRef<string | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [actionError, setActionError] = useState(false);
  const [deleteRequest, setDeleteRequest] = useState<ChatMessage[]>([]);
  const [deleteForAll, setDeleteForAll] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [forwardMessages, setForwardMessages] = useState<ChatMessage[]>([]);
  const [pendingForward, setPendingForward] = useState<{ sourceChatId: string; messages: ChatMessage[]; targetChatId: string } | null>(null);
  const [forwardSourceId, setForwardSourceId] = useState<string | null>(null);
  const forwardingBusyRef = useRef(false);
  const sendingMessageRef = useRef(false);
  useEffect(() => {
    setSelectedMessages(new Set()); setReplyTo(null); setEditingMessage(null);
    setSelectedMessageId(null); setMessageMenuPosition(null); setActionError(false);
    setShowEmojiPicker(false); setShowComposerOptions(false); setShowProfile(false);
  }, [selectedChat]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setSelectedMessages(new Set()); setReplyTo(null); setEditingMessage(null); } };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, []);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [openChatItemMenu, setOpenChatItemMenu] = useState<string | null>(null);
  const [chatItemMenuPoint, setChatItemMenuPoint] = useState({ x: 0, y: 0 });
  const [chatRequest, setChatRequest] = useState<{ chat: ChatItem; kind: 'delete' | 'clear' } | null>(null);
  const [chatRequestForAll, setChatRequestForAll] = useState(false);
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
    setViewOnceSession(current => current ? { ...current, expanded: false } : null);
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
            lastMessageOutgoing: isFromCurrentUser,
            lastMessageRead: false,
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

        if (action === Actions.CMD_EDIT_MESSAGE) {
          const edited = getOpenedMessage(typedData.message || typedData.data);
          if (edited?.id) {
            const normalized = normalizeChatMessage(edited, String(user.id));
            setMessages(previous => previous.map(message => message.id === normalized.id ? normalized : message));
            void refreshChatsRef.current?.();
          }
          return;
        }

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
              : newMessage.emoticon ? newMessage.emoticon.kind === 'gif' ? t('emoticons.gifs') : `${t('emoticons.stickers')} ${newMessage.emoticon.emoji || ''}` : newMessage.text || (newMessage.attachments?.some(
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
              const matchingByContent = newMessage.emoticon
                ? optimisticMessages.find(chatMessage => chatMessage.emoticon?.id === newMessage.emoticon?.id && chatMessage.emoticon?.kind === newMessage.emoticon?.kind)
                : newMessage.text
                ? optimisticMessages.find((chatMessage) => !chatMessage.emoticon && chatMessage.text === newMessage.text)
                : optimisticMessages.find((chatMessage) => (
                  !chatMessage.emoticon
                  &&
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
                      viewOncePreview: newMessage.viewOncePreview ?? chatMessage.viewOncePreview,
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
    const state = location.state as { openChat?: string; userId?: string; publicId?: number; username?: string; groupChat?: ChatItem } | null;
    if (state?.groupChat) {
      const group = state.groupChat;
      setChatsList(previous => [group, ...previous.filter(chat => chat.chatId !== group.chatId)]);
      setSelectedChat(group.id); setShowSidebar(false); setShowProfile(false);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
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
          const isGroup = chat.type === 'group';
          const displayName = isGroup ? getMessageText({ content: chat.title }, t('messages.groups')) : otherUser?.displayname || otherUser?.username || 'Unknown';
          const username = isGroup ? '' : otherUser?.username || '';
          const avatar = isGroup ? chat.avatar ? getSafeImageURLEx(chat.id, chat.avatar, 'thumbnail') : null : getSafeImageURLEx(otherUser?.public_id, otherUser?.avatar, "thumbnail");
          const avatarLetter = displayName.charAt(0).toUpperCase();

          // Telegram-style compact time; use the application's active language.
          let lastTime = '';
          if (chat.last_message?.created_at) {
            const date = new Date(chat.last_message.created_at);
            const now = new Date(), locale = document.documentElement.lang || undefined;
            if (Number.isFinite(date.getTime())) {
              lastTime = date.toDateString() === now.toDateString()
                ? date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
                : date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
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
          if (!lastMessageText && chat.last_message?.emoticon) lastMessageText = chat.last_message.emoticon.kind === 'gif' ? t('emoticons.gifs') : `${t('emoticons.stickers')} ${chat.last_message.emoticon.emoji || ''}`;
          if (!lastMessageText && Array.isArray(chat.last_message?.attachments)) {
            lastMessageText = chat.last_message.attachments.some(
              (attachment: Attachment) => attachment.file?.mime_type?.startsWith('image/'),
            ) ? t('messages.photo') : t('messages.media');
          }

          return {
            id: isGroup ? chat.id : otherUser?.id || chat.id,
            peerId: isGroup ? undefined : String(otherUser?.public_id || otherParticipant?.user_id || otherUser?.id || ''),
            type: chat.type,
            participantCount: chat.participants?.length,
            description: getMessageText({ content: chat.description }),
            visibility: chat.visibility || 'private', publicUsername: chat.public_username || '',
            chatId: chat.id, // Real chat ID from backend (UUID)
            name: displayName,
            username: username,
            emojis: '',
            avatar: avatar,
            avatarLetter: avatar ? null : avatarLetter,
            muted: !!chat.is_muted,
            canManage: String(chat.creator_id) === String(user.id),
            pinnedMessageId: chat.pinned_msg_id || null,
            pinnedMessageText: chat.pinned_msg ? getMessageText(chat.pinned_msg) : '',
            lastMessageId: chat.last_message?.id || null,
            lastMessageOutgoing: String(chat.last_message?.author_id) === String(user.id),
            lastMessageRead: !!otherParticipant?.last_read_at && Date.parse(otherParticipant.last_read_at) >= Date.parse(chat.last_message?.created_at || ''),
            lastMessage: lastMessageText,
            lastTime: lastTime,
            unread: currentUserParticipant?.unread_count || 0,
            online: false, // TODO: Get online status from backend if available
            verified: false, // TODO: Get verified status from backend if available
            encrypted: chat.encrypted === true,
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



  const messagesRequestRef = useRef(0);
  const initialScrollRef = useRef(false);
  const activePeerRef = useRef<ChatItem | null>(null);
  const listedPrivateChat = chatsList.find(chat => chat.id === selectedChat);
  useLayoutEffect(() => { if (listedPrivateChat) activePeerRef.current = listedPrivateChat; }, [listedPrivateChat]);
  const selectedPrivateChat = listedPrivateChat || (activePeerRef.current?.id === selectedChat ? activePeerRef.current : undefined);

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
    const requestId = ++messagesRequestRef.current;
    if (!showRefreshing) initialScrollRef.current = true;

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
      if (requestId !== messagesRequestRef.current || selectedChatRef.current !== selectedChat) return;
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
      if (requestId === messagesRequestRef.current && selectedChatRef.current === selectedChat) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      }
    } finally {
      if (requestId === messagesRequestRef.current && selectedChatRef.current === selectedChat) {
        setIsLoadingMessages(false);
        setIsRefreshingMessages(false);
        if (!showRefreshing) {
          const align = () => {
            if (initialScrollRef.current && requestId === messagesRequestRef.current && selectedChatRef.current === selectedChat) messageListRef.current?.scrollTo({ top: Number.MAX_SAFE_INTEGER, behavior: 'auto' });
          };
          requestAnimationFrame(() => requestAnimationFrame(align));
          void document.fonts.ready.then(() => requestAnimationFrame(align));
        }
      }
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

  // Handle message context menu (long press / right click)
  const handleMessageContextMenu = (point: { clientX: number; clientY: number }, messageId: string) => {
    initialScrollRef.current = false;
    if (selectedMessages.size > 0) { toggleMessageSelection(messageId); return; }
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

  // User scrolling dismisses the menu; late media/list measurements do not.
  React.useEffect(() => {
    const handleClickOutside = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.message-context-menu') && selectedMessageId) {
        closeMessageContextMenu();
      }
    };
    const handleScrollIntent = (event: Event) => { if (event.target instanceof Node && messageMenuRef.current?.contains(event.target)) return; closeMessageContextMenu(); };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMessageContextMenu();
    };

    if (selectedMessageId) {
      const listenerTimer = window.setTimeout(() => {
        document.addEventListener('pointerdown', handleClickOutside);
      }, 0);
      document.addEventListener('wheel', handleScrollIntent, { capture: true, passive: true });
      document.addEventListener('touchmove', handleScrollIntent, { capture: true, passive: true });
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        window.clearTimeout(listenerTimer);
        document.removeEventListener('pointerdown', handleClickOutside);
        document.removeEventListener('wheel', handleScrollIntent, true);
        document.removeEventListener('touchmove', handleScrollIntent, true);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [closeMessageContextMenu, selectedMessageId]);

  React.useEffect(() => {
    if (resolvedMessageMenuPosition) {
      const timer = window.setTimeout(() => messageMenuRef.current?.focus({ preventScroll: true }), 0);
      return () => window.clearTimeout(timer);
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
      console.error('Error deleting chat:', error); setActionError(true); return false;
    }
    setOpenChatItemMenu(null);
    setShowChatMenu(false);
    return true;
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
      console.error('Error clearing chat history:', error); setActionError(true); return false;
    }
    setShowChatMenu(false);
    setOpenChatItemMenu(null);
    return true;
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

  const handleMessageOpen = useCallback(async (messageId: string) => {
    if (!user?.id || messageOpenRequestsRef.current.has(messageId)) return;

    const targetMessage = messages.find((chatMessage) => chatMessage.id === messageId);
    const currentChat = chatsList.find((chat) => chat.id === selectedChat);
    const canOpenViewOnce = Boolean(
      targetMessage?.viewOnce && (targetMessage.sender === 'me' || !targetMessage.viewedOnce),
    );
    const canOpenDisappearing = Boolean(
      targetMessage?.isDisappearing
      && targetMessage.contentHidden
      && !targetMessage.viewOnce
      && targetMessage.sender === 'other',
    );
    if (
      !targetMessage
      || messageId.startsWith('temp-')
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
        if (targetMessage.sender !== 'me') markAsConsumed();
        if (openedPayload && targetMessage.sender !== 'me') {
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
        // Only definitive consumption/expiry responses end the recipient's access.
        if (targetMessage.sender !== 'me' && (status === 409 || status === 410)) markAsConsumed();
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

  const handleSendMessage = async (emoticon?: ChatEmoticon) => {
    if (sendingMessageRef.current) return;
    if (!user?.id) return;
    setFailedEmoticon(null); setActionError(false);
    if (pendingForward && !emoticon) {
      const target = chatsList.find(chat => chat.id === selectedChat && chat.chatId === pendingForward.targetChatId);
      if (!target || forwardingBusyRef.current) return;
      forwardingBusyRef.current = true; setActionBusy(true); setActionError(false);
      try {
        await transferMessages(pendingForward.sourceChatId, pendingForward.messages, target, message.trim());
        setPendingForward(null); setMessage('');
      } catch { setActionError(true); }
      finally { forwardingBusyRef.current = false; setActionBusy(false); }
      return;
    }
    const totalMedia = selectedImages.length + selectedVideos.length;
    if (!selectedChat || (!message.trim() && totalMedia === 0 && !emoticon)) {
      return;
    }
    if (editingMessage && !emoticon) {
      const currentChat = chatsList.find(chat => chat.id === selectedChat);
      if (!currentChat?.chatId || actionBusy) return;
      setActionBusy(true);
      try {
        const response = await api.call(Actions.CMD_EDIT_MESSAGE, { method: 'POST', body: { chat_id: currentChat.chatId, message_id: editingMessage.id, content: message.trim() } }) as { message?: BackendChatMessage };
        if (!response?.message) throw new Error('Missing edited message');
        const edited = normalizeChatMessage(response.message, String(user?.id));
        setMessages(previous => previous.map(item => item.id === edited.id ? edited : item));
        setMessage(''); setEditingMessage(null); void refreshChatsRef.current?.();
      } catch { setActionError(true); }
      finally { setActionBusy(false); }
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
    const selectedChatAtSend = selectedChat;

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

    }


    const replySnapshot = replyTo;
    const messageText = emoticon ? '' : message.trim();
    // Store files before clearing state
    const imagesToSend = emoticon ? [] : [...selectedImages];
    const videosToSend = emoticon ? [] : [...selectedVideos];
    const allFiles = [...imagesToSend, ...videosToSend];
    sendingMessageRef.current = true;
    setActionBusy(true);
    setActionError(false);
    const viewOnceForSend = !emoticon && viewOnceEnabled
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
      emoticon,
      reply: replySnapshot ? { id: replySnapshot.id, text: replySnapshot.text, sender: replySnapshot.sender } : undefined,
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
    initialScrollRef.current = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (initialScrollRef.current && selectedChatRef.current === selectedChatAtSend) messageListRef.current?.scrollTo({ top: Number.MAX_SAFE_INTEGER, behavior: 'auto' });
    }));
    if (!allFiles.length) {
      setMessage('');
      setReplyTo(null);
    }
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

    try {
      // Only the tiny color preview is persisted; originals stay in the secure media flow.
      const viewOncePreview = viewOnceForSend ? await createViewOncePreview(imagesToSend[0]) : undefined;
      if (viewOncePreview) {
        newMessage.viewOncePreview = viewOncePreview;
        setMessages(prev => prev.map(item => item.id === tempMessageId ? { ...item, viewOncePreview } : item));
      }

      // Send message to API
      const response = await api.sendMessage({
        chat_id: realChatId, // Use real chat ID from backend
        content: messageText,
        reply_to: replySnapshot?.id,
        extras: emoticon ? { emoticon } : viewOncePreview ? { view_once_preview: viewOncePreview } : undefined,
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
      if (selectedChatRef.current !== selectedChatAtSend) { void refreshChatsRef.current?.(); return; }
      if (!resolvedMessage && !response?.message_id && !response?.id) throw new Error('Missing sent message');

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
          emoticon: normalizedMessage.emoticon ?? newMessage.emoticon,
          reply: normalizedMessage.reply ?? newMessage.reply,
          attachments: normalizedMessage.viewOnce || viewOnceForSend
            ? undefined
            : normalizedMessage.attachments || newMessage.attachments,
          expiresAt: normalizedMessage.expiresAt ?? newMessage.expiresAt,
          expiresInSeconds: normalizedMessage.expiresInSeconds ?? newMessage.expiresInSeconds,
          isDisappearing: normalizedMessage.isDisappearing || newMessage.isDisappearing,
          viewOnce: normalizedMessage.viewOnce || viewOnceForSend,
          viewOncePreview: normalizedMessage.viewOncePreview ?? newMessage.viewOncePreview,
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
              if (!exists && (emoticon || messageText || (tempAttachments?.length || 0) > 0)) {
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
      if (allFiles.length) {
        setMessage('');
        setReplyTo(null);
        setSelectedImages([]);
        setSelectedVideos([]);
        setViewOnceEnabled(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      if (selectedChatRef.current === selectedChatAtSend) {
        setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
        setActionError(true);
        if (emoticon) setFailedEmoticon(emoticon);
        else {
          setMessage(current => current || messageText);
          setSelectedImages(current => current.length ? current : imagesToSend);
          setSelectedVideos(current => current.length ? current : videosToSend);
          setViewOnceEnabled(viewOnceForSend);
        }
      }
    } finally {
      sendingMessageRef.current = false;
      setActionBusy(false);
    }
  };

  const handleTyping = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Enter key to send message
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
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
    setFailedEmoticon(null);
    setPendingForward(null);
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

  const handleEmoticonSelect = (selection: EmoticonSelection) => {
    if (selection.kind === 'emoji') {
      const input = messageInputRef.current;
      const start = input?.selectionStart ?? message.length, end = input?.selectionEnd ?? message.length;
      setMessage(message.slice(0, start) + selection.emoji + message.slice(end));
      requestAnimationFrame(() => { input?.focus({ preventScroll: true }); input?.setSelectionRange(start + selection.emoji.length, start + selection.emoji.length); });
      return;
    }
    setViewOnceEnabled(false);
    setShowEmojiPicker(false);
    void handleSendMessage(selection);
  };

  const handleEmoticonBackspace = () => {
    const input = messageInputRef.current;
    const start = input?.selectionStart ?? message.length, end = input?.selectionEnd ?? message.length;
    const before = message.slice(0, start);
    const Segmenter = (Intl as typeof Intl & { Segmenter?: new (locale?: string, options?: { granularity: 'grapheme' }) => { segment: (text: string) => Iterable<{ index: number }> } }).Segmenter;
    const segments = Segmenter ? Array.from(new Segmenter(undefined, { granularity: 'grapheme' }).segment(before)) : Array.from(before).map((_, index, points) => ({ index: points.slice(0, index).join('').length }));
    const cut = start === end ? segments[segments.length - 1]?.index ?? 0 : start;
    setMessage(message.slice(0, cut) + message.slice(end));
    requestAnimationFrame(() => { input?.focus({ preventScroll: true }); input?.setSelectionRange(cut, cut); });
  };

  function toggleMessageSelection(id: string, range = false) {
    setShowEmojiPicker(false); setShowComposerOptions(false); closeMessageContextMenu();
    setSelectedMessages(previous => {
      const next = new Set(previous);
      if (range && lastSelectionRef.current) {
        const first = messages.findIndex(item => item.id === lastSelectionRef.current), last = messages.findIndex(item => item.id === id);
        if (first >= 0 && last >= 0) messages.slice(Math.min(first, last), Math.max(first, last) + 1).forEach(item => { if (next.size < 100) next.add(item.id); });
      } else if (next.has(id)) next.delete(id); else if (next.size < 100) next.add(id);
      return next;
    });
    lastSelectionRef.current = id;
  }
  function scrollToMessage(id: string) {
    const index = messages.findIndex(item => item.id === id);
    if (index >= 0) messageListRef.current?.scrollToIndex({ index, align: 'center', behavior: 'smooth' });
  }
  async function copyMessages(items: ChatMessage[]) {
    closeMessageContextMenu();
    await clipboard.copy(items.map(item => item.text).filter(Boolean).join('\n'));
  }
  const canForwardMessage = (item: ChatMessage) => !item.viewOnce && !item.isDisappearing && !item.contentHidden && !!(item.text || item.emoticon || item.attachments?.length);
  async function pinMessage(item: ChatMessage) {
    closeMessageContextMenu();
    if (!selectedPrivateChat?.chatId) return;
    const pinned = selectedPrivateChat.pinnedMessageId === item.id;
    try {
      await api.call(pinned ? Actions.CMD_UNPIN_MESSAGE : Actions.CMD_PIN_MESSAGE, { method: 'POST', body: { chat_id: selectedPrivateChat.chatId, message_id: item.id } });
      setChatsList(previous => previous.map(chat => chat.id === selectedChat ? { ...chat, pinnedMessageId: pinned ? null : item.id, pinnedMessageText: pinned ? '' : item.text } : chat));
    } catch { setActionError(true); }
  }
  async function confirmDeleteMessages() {
    if (!selectedPrivateChat?.chatId || actionBusy) return;
    setActionBusy(true);
    const failed: ChatMessage[] = [];
    for (const item of deleteRequest) {
      try {
        if (deleteForAll) await api.deleteMessageForAll(selectedPrivateChat.chatId, item.id); else await api.deleteMessageForMe(selectedPrivateChat.chatId, item.id);
        setMessages(previous => previous.filter(message => message.id !== item.id));
        setSelectedMessages(previous => { const next = new Set(previous); next.delete(item.id); return next; });
      } catch { failed.push(item); }
    }
    setDeleteRequest(failed); if (failed.length) setActionError(true);
    setActionBusy(false); void refreshChatsRef.current?.();
  }
  function openCreatedGroup(chat: CreatedGroup, title: string) {
    const item: ChatItem = { id: chat.id, chatId: chat.id, type: 'group', name: title, username: '', emojis: '', avatar: chat.avatar ? getSafeImageURLEx(chat.id, chat.avatar, 'thumbnail') : null, avatarLetter: title.charAt(0).toLocaleUpperCase(), lastMessage: '', lastTime: '', unread: 0, online: false, verified: false, encrypted: false, canManage: true, participantCount: chat.participants?.length, visibility: chat.visibility || 'private', publicUsername: chat.public_username || '' };
    setChatsList(previous => [item, ...previous.filter(existing => existing.chatId !== chat.id)]);
    setCreatingGroup(false); setPendingForward(null); setSelectedChat(item.id); setShowSidebar(false); setShowProfile(false);
    void refreshChatsRef.current?.();
  }
  function openForward(items: ChatMessage[]) {
    if (!selectedPrivateChat?.chatId || !items.length || !items.every(canForwardMessage)) return;
    setForwardSourceId(selectedPrivateChat.chatId);
    setForwardMessages(items);
    closeMessageContextMenu();
  }
  function stageForward(chat: ChatItem) {
    if (!forwardSourceId || !chat.chatId) return;
    const draft = { sourceChatId: forwardSourceId, messages: forwardMessages, targetChatId: chat.chatId };
    handleChatSelect(chat.id);
    setPendingForward(draft);
    setForwardMessages([]);
    setSelectedMessages(new Set());
    setReplyTo(null); setEditingMessage(null); setMessage('');
  }
  async function transferMessages(sourceId: string, items: ChatMessage[], target: ChatItem, comment = '') {
    if (!target.chatId) throw new Error('Missing forwarding destination');
    const response = await api.forwardMessages(sourceId, target.chatId, items.map(item => item.id), comment) as { messages?: BackendChatMessage[] };
    if (!Array.isArray(response.messages) || response.messages.length !== items.length + (comment ? 1 : 0) || response.messages.some(item => !item.id)) throw new Error('Invalid forwarding response');
    if (target.id === selectedChatRef.current) {
      const received = response.messages.map(item => normalizeChatMessage(item, String(user?.id)));
      initialScrollRef.current = true;
      setMessages(previous => [...previous, ...received.filter(item => !previous.some(existing => existing.id === item.id))]);
      requestAnimationFrame(() => {
        if (initialScrollRef.current && selectedChatRef.current === target.id) messageListRef.current?.scrollTo({top: Number.MAX_SAFE_INTEGER, behavior: 'auto'});
      });
    }
    void refreshChatsRef.current?.();
  }
  async function forwardToMany(targets: ChatItem[], comment: string): Promise<ChatItem[]> {
    if (!forwardSourceId || forwardingBusyRef.current) return targets;
    forwardingBusyRef.current = true; setActionBusy(true);
    const remaining: ChatItem[] = [];
    try {
      for (const target of targets) {
        try { await transferMessages(forwardSourceId, forwardMessages, target, comment); }
        catch { remaining.push(target); }
      }
      if (!remaining.length) setSelectedMessages(new Set());
      return remaining;
    } finally { forwardingBusyRef.current = false; setActionBusy(false); }
  }
  const selectedMessageItems = messages.filter(item => selectedMessages.has(item.id));
  const contextMessage = messages.find(item => item.id === selectedMessageId);
  const messageActions: MessageAction[] = contextMessage ? [
    ...(!contextMessage.viewOnce && !contextMessage.isDisappearing ? [{ id: 'reply', label: t('chat_actions.reply'), icon: 'reply' as const, run: () => { setPendingForward(null); setReplyTo(contextMessage); setEditingMessage(null); closeMessageContextMenu(); messageInputRef.current?.focus(); } }] : []),
    ...(contextMessage.text && !contextMessage.contentHidden ? [{ id: 'copy', label: t('chat_actions.copy'), icon: 'copy' as const, run: () => void copyMessages([contextMessage]) }] : []),
    ...(contextMessage.sender === 'me' && contextMessage.text && !contextMessage.viewOnce && !contextMessage.isDisappearing && !contextMessage.emoticon ? [{ id: 'edit', label: t('chat_actions.edit'), icon: 'edit' as const, run: () => { setPendingForward(null); setEditingMessage(contextMessage); setReplyTo(null); setMessage(contextMessage.text); closeMessageContextMenu(); messageInputRef.current?.focus(); } }] : []),
    ...(canForwardMessage(contextMessage) ? [{ id: 'forward', label: t('chat_actions.forward'), icon: 'forward' as const, run: () => openForward([contextMessage]) }] : []),
    ...(!contextMessage.viewOnce && !contextMessage.isDisappearing ? [{ id: 'pin', label: t(selectedPrivateChat?.pinnedMessageId === contextMessage.id ? 'chat_actions.unpin' : 'chat_actions.pin'), icon: 'pin' as const, run: () => void pinMessage(contextMessage) }] : []),
    { id: 'select', label: t('chat_actions.select'), icon: 'select', run: () => toggleMessageSelection(contextMessage.id) },
    { id: 'delete', label: t('messages.delete_message'), icon: 'delete', danger: true, run: () => { setDeleteRequest([contextMessage]); setDeleteForAll(false); closeMessageContextMenu(); } },
  ] : [];

  function openListMenu(id: string, point: { x: number; y: number }) {
    closeMessageContextMenu(); setOpenChatItemMenu(id); setChatItemMenuPoint(point);
  }
  async function markDialogRead(chat: ChatItem) {
    setOpenChatItemMenu(null);
    if (!chat.chatId || !chat.lastMessageId) return;
    try {
      await api.call(Actions.CMD_CHAT_MESSAGE_READ, { method: 'POST', body: { chat_id: chat.chatId, 'message_ids[]': [chat.lastMessageId] } });
      setChatsList(previous => previous.map(item => item.id === chat.id ? { ...item, unread: 0 } : item));
    } catch { setActionError(true); }
  }
  async function toggleDialogMuted(chat: ChatItem) {
    setOpenChatItemMenu(null);
    if (!chat.chatId) return;
    try {
      await api.call(Actions.CMD_CHAT_SET_MUTED, { method: 'POST', body: { chat_id: chat.chatId, muted: !chat.muted } });
      setChatsList(previous => previous.map(item => item.id === chat.id ? { ...item, muted: !chat.muted } : item));
    } catch { setActionError(true); }
  }
  async function confirmChatRequest() {
    if (!chatRequest || actionBusy) return;
    setActionBusy(true);
    const result = chatRequest.kind === 'delete' ? await handleDeleteChat(chatRequest.chat.id, chatRequestForAll) : await handleClearChatHistory(chatRequest.chat.id, chatRequestForAll);
    if (result === true) setChatRequest(null);
    setActionBusy(false);
  }
  const contextDialog = chatsList.find(item => item.id === openChatItemMenu);
  const dialogActions: MessageAction[] = contextDialog ? [
    ...(contextDialog.unread > 0 && contextDialog.lastMessageId ? [{ id: 'read', label: t('chat_actions.mark_read'), icon: 'readchats' as const, run: () => void markDialogRead(contextDialog) }] : []),
    { id: 'mute', label: t(contextDialog.muted ? 'chat_actions.unmute' : 'chat_actions.mute'), icon: contextDialog.muted ? 'unmute' : 'mute', run: () => void toggleDialogMuted(contextDialog) },
    { id: 'clear', label: t('chat_actions.clear_history'), icon: 'delete', run: () => { setOpenChatItemMenu(null); setChatRequestForAll(false); setActionError(false); setChatRequest({ chat: contextDialog, kind: 'clear' }); } },
    { id: 'delete', label: t('messages.delete_chat'), icon: 'delete', danger: true, run: () => { setOpenChatItemMenu(null); setChatRequestForAll(false); setActionError(false); setChatRequest({ chat: contextDialog, kind: 'delete' }); } },
  ] : [];

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
    if (viewOnceEnabled) { setViewOnceEnabled(false); return; }
    if (hasValidViewOncePhoto) { setViewOnceEnabled(true); return; }
    // Canceling the explicit photo choice leaves one-time mode off. Sending
    // ordinary text or a sticker never opens a file input.
    setShowComposerOptions(false);
    viewOnceImageInputRef.current?.click();
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
  const displayedViewerKey = viewOnceSession?.expanded
    ? `view-once-${viewOnceSession.messageId}`
    : activeMedia ? `${activeMedia.messageId}-${activeMedia.attachmentId}` : null;

  // If not authenticated, show inline auth wizard
  if (!isAuthenticated) {
    return (
      <div className="skyline-page-scroll w-full">
        <div className="mx-auto flex min-h-full w-full max-w-5xl items-center justify-center px-4 pb-8 pt-[72px]">
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
    <div className="cv-telegram-chat h-full w-full overflow-hidden">
      <div className="cv-chat-layout mx-auto flex h-full min-h-0 w-full flex-row overflow-hidden">
        <div
          className={`flex flex-row h-full w-full flex-1 min-h-0 overflow-hidden ${theme === 'dark'
            ? 'cv-card-surface-soft'
            : 'bg-white'
            }`}
          style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'row' }}
        >
          {/* Sidebar - Responsive Design */}
          <div className={`cv-chat-sidebar absolute lg:relative inset-0 z-40 lg:z-auto w-full lg:w-[360px] lg:flex-shrink-0 border-r flex flex-col h-full overflow-hidden ${theme === 'dark' ? 'cv-card-surface-solid border-white/10' : 'border-[var(--cv-inner-border)] bg-white'
            } ${showSidebar ? 'flex' : 'hidden lg:flex'}`}>
            {creatingGroup ? <GroupComposer chats={chatsList} viewerId={String(user?.id)} viewerName={user?.displayname || user?.username || ''} onClose={() => setCreatingGroup(false)} onCreated={openCreatedGroup} /> : <>
            <div className={`cv-chat-sidebar-header flex-shrink-0 z-50 border-b px-3 py-3 ${theme === 'dark'
              ? 'cv-card-surface-soft border-white/10'
              : 'border-[var(--cv-inner-border)] bg-white'
              }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <h1 className="cv-chat-sidebar-title">{t('app.nav.messages')}</h1>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                <motion.button
                  whileHover={{ scale: isLoadingChats ? 1 : 1.05 }}
                  whileTap={{ scale: isLoadingChats ? 1 : 0.95 }}
                  onClick={refreshChats}
                  disabled={isLoadingChats}
                  aria-label={t('messages.refresh', { defaultValue: 'Yenile' })}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${isLoadingChats ? 'opacity-60 cursor-not-allowed' : ''} ${theme === 'dark' ? 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white' : 'bg-white/80 text-slate-600 hover:bg-brand hover:text-slate-950'
                    }`}
                >
                    <RefreshCw className={`h-4 w-4 ${isLoadingChats ? 'animate-spin' : ''}`} />
                </motion.button>
                <motion.button
                  onClick={() => navigate('/settings/appearance')}
                  aria-label={t('appearance.title')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${theme === 'dark' ? 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white' : 'bg-white/80 text-slate-600 hover:bg-brand hover:text-slate-950'
                    }`}
                >
                    <Settings className="h-4 w-4" />
                </motion.button>
                <motion.button
                  onClick={() => { setCreatingGroup(true); setShowSidebar(true); }}
                  aria-label={t('chat_actions.new_group')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${theme === 'dark' ? 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white' : 'bg-white/80 text-slate-600 hover:bg-brand hover:text-slate-950'
                    }`}
                >
                    <TelegramIcon name="newgroup" className="h-4 w-4" />
                </motion.button>
                </div>
              </div>
            </div>

            <div className="cv-chat-search-area p-3 sm:p-4 flex-shrink-0">
              <SearchField value={chatSearch} onChange={setChatSearch} label={t('messages.search')} />

              {/* Filter Tabs */}
              <div className="cv-tab-bar -mx-1">
                <ViewTabs items={(
                    [
                      { id: 'all' as const, label: t('messages.all') },
                      { id: 'unread' as const, label: t('messages.unread') },
                      { id: 'groups' as const, label: t('messages.groups') },
                      { id: 'unencrypted' as const, label: t('messages.unencrypted') },
                    ]
                  )} activeId={activeFilter} onSelect={id => setActiveFilter(id)} label={t('app.nav.messages')} />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
              {isLoadingChats ? (
                <div className="p-3 sm:p-4 space-y-3" aria-busy="true">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center space-x-3 p-3 sm:p-4 rounded-3xl border ${theme === 'dark' ? 'bg-white/[0.06] border-white/[0.08]' : 'bg-white/70 border-[var(--cv-inner-border)]'}`}
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
                if (chatSearch && !`${chat.name} ${chat.username}`.toLocaleLowerCase().includes(chatSearch.trim().replace(/^@/, '').toLocaleLowerCase())) return false;
                if (activeFilter === 'all') return true;
                if (activeFilter === 'unread') return chat.unread > 0;
                if (activeFilter === 'unencrypted') return !chat.encrypted;
                  if (activeFilter === 'groups') return chat.type === 'group';
                return true;
              }).length === 0 ? (
                <AnimatedEmptyState compact title={t('messages.no_chats_found')} />
              ) : (() => {
                const visibleChats = chatsList.filter((chat: ChatItem) => {
                  if (chatSearch && !`${chat.name} ${chat.username}`.toLocaleLowerCase().includes(chatSearch.trim().replace(/^@/, '').toLocaleLowerCase())) return false;
                  if (activeFilter === 'all') return true;
                  if (activeFilter === 'unread') return chat.unread > 0;
                  if (activeFilter === 'unencrypted') return !chat.encrypted;
                  if (activeFilter === 'groups') return chat.type === 'group';
                  return true;
                });
                return <Virtuoso style={{ height: '100%' }} data={visibleChats} computeItemKey={(_, chat) => chat.id} itemContent={(_, chat) => (
              <React.Fragment>
                <TelegramChatListRow chat={chat} selected={selectedChat === chat.id} typing={selectedChat === chat.id && otherUserTyping} onSelect={() => handleChatSelect(chat.id)} onMenu={point => openListMenu(chat.id, point)}>
                  <div className="cv-chat-row-actions"><button type="button" aria-label={`${chat.name}: ${t('app.nav.more')}`} aria-expanded={openChatItemMenu === chat.id} onClick={event => { event.stopPropagation(); const box = event.currentTarget.getBoundingClientRect(); openListMenu(chat.id, { x: box.left, y: box.bottom }); }}><MoreVertical /></button></div>
                </TelegramChatListRow>
              </React.Fragment>
                )} />;
              })()}
            </div>
            </>}
          </div>

          {/* Chat Area */}
          <>
            {selectedChat ? (
              <div
                key={`chat-view-${selectedChat}`}
                onWheelCapture={() => { initialScrollRef.current = false; }} onTouchMoveCapture={() => { initialScrollRef.current = false; }}
                onPointerDownCapture={() => { initialScrollRef.current = false; }}
                onKeyDownCapture={event => { if (['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'].includes(event.key) && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) initialScrollRef.current = false; }}
                className={`cv-chat-thread flex-1 flex flex-col min-h-0 min-w-0 relative z-10 h-full${showProfile && selectedPrivateChat?.type === 'group' ? ' cv-chat-showing-group-info' : ''}`}
                style={{
                  flex: '1 1 auto',
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',

                }}
              >
                <ChatWallpaper />
                <ClipboardFeedback status={clipboard.status} />
                {/* Chat Header */}
                <div
                  ref={headerRef}
                  className={`cv-chat-topbar flex-shrink-0 z-30 p-3 sm:p-4 border-b ${theme === 'dark'
                    ? 'cv-card-surface-soft border-white/10'
                    : 'border-[var(--cv-inner-border)] bg-white'
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
                        aria-label={t('app.back')}
                        className={`lg:hidden p-2 rounded-full flex-shrink-0 mr-1 transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-brand'}`}
                      >
                        <ArrowLeft className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} />
                      </motion.button>

                      {selectedPrivateChat && <ChatPeerHeader key={`${selectedPrivateChat.id}:${selectedPrivateChat.avatar || ''}`} chat={selectedPrivateChat} typing={otherUserTyping} expanded={showProfile} onClick={() => { setShowProfile(value => !value); setShowChatMenu(false); setShowEmojiPicker(false); setShowComposerOptions(false); }} />}
                    </div>
                    <div className="cv-chat-header-actions">
                      <button type="button" aria-label={t('chat_actions.refresh')} disabled={isRefreshingMessages || isLoadingMessages} onClick={handleRefreshMessages}><RefreshCw className={isRefreshingMessages ? 'animate-spin' : ''} /></button>
                      <button type="button" aria-label={t('app.nav.more')} aria-expanded={openChatItemMenu === selectedChat} onClick={event => { if (selectedChat) { const box = event.currentTarget.getBoundingClientRect(); openListMenu(selectedChat, { x: box.left, y: box.bottom }); } }}><MoreVertical /></button>
                    </div>
                  </div>
                </div>

                {actionError && <div className="cv-chat-action-error" role="alert">{t('chat_actions.action_failed')}{failedEmoticon && <button type="button" onClick={() => void handleSendMessage(failedEmoticon)}>{t('emoticons.retry')}</button>}<button type="button" aria-label={t('app.close')} onClick={() => { setActionError(false); setFailedEmoticon(null); }}><X /></button></div>}
                {!showProfile && selectedPrivateChat?.pinnedMessageId && <button type="button" className="cv-chat-pinned" onClick={() => scrollToMessage(selectedPrivateChat.pinnedMessageId!)}><TelegramIcon name="pin" /><span><strong>{t('chat_actions.pin')}</strong><small>{selectedPrivateChat.pinnedMessageText || t('messages.media')}</small></span></button>}
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
                      className="cv-chat-information flex-1 overflow-y-auto no-scrollbar min-h-0"
                      style={{
                        flexGrow: 1,
                        flexShrink: 1,
                        minHeight: 0,
                        overflowY: 'auto'
                      }}
                    >
                      <div className="h-full">
                        {selectedPrivateChat.type === 'group' ? <GroupDetails key={selectedPrivateChat.chatId} chat={selectedPrivateChat} chats={chatsList} viewerId={String(user?.id)} viewerName={user?.displayname || user?.username || ''} onClose={() => setShowProfile(false)} onUpdated={() => { void refreshChatsRef.current?.(); }} onLeave={() => { setShowProfile(false); setSelectedChat(null); setShowSidebar(true); void refreshChatsRef.current?.(); }} /> : <ProfileScreen inline isEmbed username={selectedPrivateChat.username || selectedPrivateChat.name.toLowerCase()} />}
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
                      className={`cv-chat-wallpaper-host flex-1 flex flex-col p-3 sm:p-4 no-scrollbar min-h-0 overflow-hidden ${theme === 'dark'
                        ? 'cv-card-surface-muted'
                        : 'bg-[var(--cv-page-bg)]'
                        }`}
                      style={{
                        flexGrow: 1,
                        flexShrink: 1,
                        minHeight: 0,
                        overflowY: 'auto',
                        paddingBottom: otherUserTyping ? '0' : undefined,

                      }}
                    >
                      <div className="cv-chat-messages flex-1 flex flex-col w-full max-w-4xl mx-auto min-h-0">
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
                                      ? theme === 'dark' ? 'bg-brand/30 rounded-br-sm' : 'bg-brand rounded-br-sm'
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
                            {messages.length === 0 ? <EmptyConversation key={selectedChat} onGreeting={sticker => void handleSendMessage(sticker)} /> : <Virtuoso key={selectedChat} ref={messageListRef}
                              style={{ height: '100%' }}
                              data={messages}
                              defaultItemHeight={80}
                              increaseViewportBy={{ top: 400, bottom: 400 }}
                              totalListHeightChanged={() => { if (initialScrollRef.current) requestAnimationFrame(() => { if (initialScrollRef.current && selectedChatRef.current === selectedChat) messageListRef.current?.scrollTo({ top: Number.MAX_SAFE_INTEGER, behavior: 'auto' }); }); }}
                              alignToBottom
                              computeItemKey={(_, item) => item.id}
                              followOutput={atBottom => atBottom && !selectedMessageId ? 'auto' : false}
                              itemContent={(index, msg) => (
                                <div className="cv-chat-message-row pb-3">
                                  {index === 0 && (
                                    <div className="flex justify-center my-6">
                                      <div className={`px-3 py-1 rounded-full border backdrop-blur-xl ${theme === 'dark' ? 'bg-white/[0.08] border-white/10' : 'bg-white/80 border-[var(--cv-inner-border)]'}`}>
                                        <span className={`text-xs font-medium ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>
                                          {t('messages.today')}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  <MessageItem
                                    key={msg.id}
                                    msg={msg}
                                    selected={selectedMessages.has(msg.id)}
                                    selectionMode={selectedMessages.size > 0}
                                    onSelect={toggleMessageSelection}
                                    onReplyOpen={scrollToMessage}
                                    onMediaReady={() => { if (initialScrollRef.current) requestAnimationFrame(() => { if (initialScrollRef.current) messageListRef.current?.scrollTo({ top: Number.MAX_SAFE_INTEGER, behavior: 'auto' }); }); }}
                                    groupFirst={!sameMessageGroup(messages[index - 1], msg)}
                                    groupLast={!sameMessageGroup(msg, messages[index + 1])}
                                    theme={theme}
                                    nowMs={countdownNow}
                                    onContextMenu={handleMessageContextMenu}
                                    onMediaOpen={openMediaViewer}
                                    revealedPhoto={viewOnceSession?.messageId === msg.id ? viewOnceSession.items[0]?.src : undefined}
                                    onRevealExpand={() => setViewOnceSession(current => current?.messageId === msg.id ? { ...current, expanded: true } : current)}
                                    onMessageOpen={handleMessageOpen}
                                    isMessageOpening={openingMessageIds.has(msg.id)}
                                    hasViewOnceOpenError={viewOnceOpenErrorIds.has(msg.id)}
                                  />
                                </div>
                              )}

                            />}
                          </div>
                        )}

                        {/* Telegram/WhatsApp Style Context Menu */}
                        {typeof document !== 'undefined' && createPortal(
                          <AnimatePresence>
                          {selectedMessageId && messageMenuPosition && (
                          <MessageActionsMenu ref={messageMenuRef} position={resolvedMessageMenuPosition} label={t('chat_actions.menu')} actions={messageActions} />
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
                  <div className={`flex-shrink-0 px-3 sm:px-4 py-2 ${theme === 'dark' ? 'cv-card-surface-muted' : 'bg-[var(--cv-page-bg)]'
                    }`}>
                    <div className="flex justify-start">
                      <div className={`max-w-[75%] sm:max-w-xs md:max-w-sm px-4 py-2.5 rounded-2xl shadow-sm border backdrop-blur-xl ${theme === 'dark' ? 'bg-zinc-900/80 text-white border-white/10' : 'bg-white/[0.85] text-slate-900 border-[var(--cv-inner-border)]'
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
                            <div className={`w-2 h-2 rounded-full animate-bounce ${theme === 'dark' ? 'bg-brand' : 'bg-brand-hovered'
                              }`}></div>
                            <div className={`w-2 h-2 rounded-full animate-bounce ${theme === 'dark' ? 'bg-brand' : 'bg-brand-hovered'
                              }`} style={{ animationDelay: '0.2s' }}></div>
                            <div className={`w-2 h-2 rounded-full animate-bounce ${theme === 'dark' ? 'bg-brand' : 'bg-brand-hovered'
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
                    data-selecting={selectedMessages.size > 0}
                    onKeyDown={event => { if (event.key === 'Escape') { setShowComposerOptions(false); setShowEmojiPicker(false); } }}
                    className={`cv-chat-composer relative flex-shrink-0 border-t w-full p-3 transition-all duration-300 sm:p-4 ${theme === 'dark'
                        ? 'cv-card-surface-soft border-white/10'
                        : 'border-[var(--cv-inner-border)] bg-white'
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
                    {selectedMessages.size > 0 && <div className="cv-chat-selection-bar">
                      <button type="button" aria-label={t('app.cancel')} onClick={() => setSelectedMessages(new Set())}><X /></button>
                      <span>{t('chat_actions.selected', { count: selectedMessages.size })}</span>
                      <button type="button" aria-label={t('chat_actions.copy')} disabled={!selectedMessageItems.some(item => item.text)} onClick={() => void copyMessages(selectedMessageItems)}><TelegramIcon name="copy" /></button>
                      <button type="button" aria-label={t('chat_actions.forward')} disabled={!selectedMessageItems.every(canForwardMessage)} onClick={() => openForward(selectedMessageItems)}><TelegramIcon name="forward" /></button>
                      <button type="button" data-danger="true" aria-label={t('messages.delete_message')} onClick={() => { setDeleteRequest(selectedMessageItems); setDeleteForAll(false); }}><TelegramIcon name="delete" /></button>
                    </div>}

                    {showComposerOptions && <AttachmentMenu anchor={attachmentButtonRef.current?.closest<HTMLElement>('.cv-chat-compose-plate') || null} onClose={() => setShowComposerOptions(false)} onPhoto={() => fileInputRef.current?.click()} onVideo={() => videoInputRef.current?.click()} viewOnce={viewOnceEnabled} onViewOnce={handleViewOnceToggle} expiry={messageExpirySeconds} onExpiry={value => setMessageExpirySeconds(value as MessageExpirySeconds)} expiryOptions={MESSAGE_EXPIRY_OPTIONS} expiryLabel={value => t(MESSAGE_EXPIRY_LABEL_KEYS[value as MessageExpirySeconds])} />}

                    {/* Selected Media Preview */}
                    <MediaSendDialog images={selectedImages} videos={selectedVideos} caption={message} viewOnce={viewOnceEnabled} busy={actionBusy} error={actionError}
                      onCaption={setMessage} onViewOnce={() => setViewOnceEnabled(value => !value)}
                      onRemoveImage={removeImage} onRemoveVideo={removeVideo} onAdd={() => fileInputRef.current?.click()}
                      onClose={() => { if (sendingMessageRef.current) return; setSelectedImages([]); setSelectedVideos([]); setViewOnceEnabled(false); if (fileInputRef.current) fileInputRef.current.value = ''; if (videoInputRef.current) videoInputRef.current.value = ''; if (viewOnceImageInputRef.current) viewOnceImageInputRef.current.value = ''; }}
                      onSend={() => void handleSendMessage()} />

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
                      <div className="cv-chat-compose-plate">
                        {(replyTo || editingMessage || pendingForward) && <div className="cv-chat-compose-helper" data-forwarding={!!pendingForward || undefined}>
                          <span className="cv-chat-helper-icon"><TelegramIcon name={pendingForward ? 'forward' : editingMessage ? 'edit' : 'reply'} /></span>
                          <div><strong>{pendingForward ? t('chat_actions.forwarded_message') : editingMessage ? t('chat_actions.editing') : t('chat_actions.reply_to', { name: replyTo?.sender === 'me' ? user?.displayname || user?.username : selectedPrivateChat?.name })}</strong><p>{pendingForward ? `${t('chat_actions.selected', { count: pendingForward.messages.length })} · ${pendingForward.messages[0]?.text || pendingForward.messages[0]?.emoticon?.emoji || t('messages.media')}` : (editingMessage || replyTo)?.text || (editingMessage || replyTo)?.emoticon?.emoji || t('messages.media')}</p></div>
                          <button type="button" aria-label={t('app.cancel')} onClick={() => { setPendingForward(null); setReplyTo(null); if (editingMessage) setMessage(''); setEditingMessage(null); }}><X /></button>
                        </div>}
                      <div className="cv-chat-compose-field">
                        <button ref={attachmentButtonRef} type="button" aria-label={t('messages.composer_options')} aria-expanded={showComposerOptions} aria-controls="chat-composer-options" onClick={() => { setShowComposerOptions(value => !value); setShowEmojiPicker(false); }} className="cv-chat-attach" disabled={!!pendingForward}>
                          <TelegramIcon name="attach" />
                        </button>
                        <textarea
                          ref={messageInputRef}
                          rows={1}
                          value={message}
                          onChange={handleTyping}
                          onKeyDown={handleKeyPress}
                          aria-label={t('messages.send_message_placeholder')}
                          placeholder={t('messages.send_message_placeholder')}
                        />
                        <button type="button" className="cv-chat-emoji-toggle" data-ripple="off" aria-label={t('messages.emoji')} ref={emojiButtonRef} aria-expanded={showEmojiPicker} onClick={() => { setShowEmojiPicker(value => !value); setShowComposerOptions(false); }}>
                          <TelegramIcon name={showEmojiPicker ? 'keyboard' : 'smile'} />
                        </button>
                        <button type="button" className="cv-chat-send" aria-label={t(editingMessage ? 'chat_actions.save' : 'messages.send')} onClick={() => void handleSendMessage()} disabled={actionBusy || (!pendingForward && !message.trim() && selectedImages.length === 0 && selectedVideos.length === 0)}>
                          <TelegramIcon name={editingMessage ? 'check' : 'logo'} />
                        </button>
                      </div>
                      </div>
                    </div>

                    {showEmojiPicker && <React.Suspense fallback={null}><EmoticonPicker isOpen={showEmojiPicker} presentation="popover" anchor={emojiButtonRef.current?.closest<HTMLElement>('.cv-chat-compose-plate')} onBackspace={handleEmoticonBackspace} canBackspace={!!message} onClose={() => setShowEmojiPicker(false)} onSelect={handleEmoticonSelect} /></React.Suspense>}
                  </div>
                )}
              </div>
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
                  <div className={`cv-chat-empty flex-1 flex items-center justify-center ${theme === 'dark' ? 'cv-card-surface-muted' : 'bg-[var(--cv-page-bg)]'
                    }`}>
                    <ChatWallpaper />
                <ClipboardFeedback status={clipboard.status} />
                    <div className="cv-chat-empty-label"><AnimatedEmptyState title={t('messages.select_conversation')} description={t('messages.select_conversation_subtitle')} /></div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </>
        </div>
      </div>
      {contextDialog && <FloatingContextMenu point={chatItemMenuPoint} label={`${contextDialog.name}: ${t('chat_actions.menu')}`} actions={dialogActions} onClose={() => setOpenChatItemMenu(null)} />}
      <Sheet isOpen={!!chatRequest} onClose={() => { if (!actionBusy) setChatRequest(null); }} className="cv-chat-confirm popup-peer" leading={chatRequest && <span className="cv-confirm-avatar">{chatRequest.chat.avatar ? <img src={chatRequest.chat.avatar} alt="" /> : chatRequest.chat.name.charAt(0).toLocaleUpperCase()}</span>} hideCloseButton title={t(chatRequest?.kind === 'clear' ? 'chat_actions.clear_history' : 'messages.delete_chat')} variant="alert" actions={<><button type="button" className="cv-confirm-cancel" disabled={actionBusy} onClick={() => setChatRequest(null)}>{t('app.cancel')}</button><button type="button" className="cv-confirm-danger" disabled={actionBusy} onClick={() => void confirmChatRequest()}>{t(chatRequest?.kind === 'clear' ? 'chat_actions.clear_history' : 'messages.delete_chat')}</button></>}>
        <p>{t(chatRequest?.kind === 'clear' ? 'chat_actions.clear_confirm' : 'chat_actions.delete_chat_confirm')}</p><p className="cv-confirm-peer"><strong><bdi>{chatRequest?.chat.name}</bdi></strong></p>
        {chatRequest?.chat.canManage && <ListRow title={t('chat_actions.delete_for_all')} accessory={<Switch className="cv-chat-setting-switch" checked={chatRequestForAll} onChange={setChatRequestForAll} disabled={actionBusy} aria-label={t('chat_actions.delete_for_all')} />} />}
        {actionError && <p role="alert">{t('chat_actions.action_failed')}</p>}
      </Sheet>
      <Sheet isOpen={deleteRequest.length > 0} onClose={() => { if (!actionBusy) setDeleteRequest([]); }} title={t('messages.delete_message')} className="cv-chat-confirm popup-peer" hideCloseButton variant="alert" actions={<><button type="button" className="cv-confirm-cancel" disabled={actionBusy} onClick={() => setDeleteRequest([])}>{t('app.cancel')}</button><button type="button" className="cv-confirm-danger" disabled={actionBusy} onClick={() => void confirmDeleteMessages()}>{t(deleteForAll ? 'chat_actions.delete_for_all' : 'chat_actions.delete_for_me')}</button></>}>
        <p>{t('chat_actions.delete_confirm')}</p><p>{t('chat_actions.selected', { count: deleteRequest.length })}</p>
        {deleteRequest.every(item => item.sender === 'me') && <ListRow title={t('chat_actions.delete_for_all')} accessory={<Switch className="cv-chat-setting-switch" checked={deleteForAll} onChange={setDeleteForAll} disabled={actionBusy} aria-label={t('chat_actions.delete_for_all')} />} />}
        {actionError && <p role="alert">{t('chat_actions.action_failed')}</p>}
      </Sheet>
      {forwardMessages.length > 0 && <ForwardPicker chats={chatsList} messages={forwardMessages} onClose={() => { if (!forwardingBusyRef.current) setForwardMessages([]); }} onOpenChat={stageForward} onSend={forwardToMany} />}
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
