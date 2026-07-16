import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAtom } from 'jotai';
import { api } from '@/services/api';
import { liveBroadcastsStateAtom, type BroadcastItem } from '@/state/live';
import { useNavigate } from '@/router';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { PremiumGateModal } from '@/components/premium/PremiumGate';
import FeatureAdCard from '@/components/ads/FeatureAdCard';
import { isFeatureEnabled } from '@/config/featureFlags';
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
} from 'agora-rtc-sdk-ng';
import { Plus, Video, Users, RefreshCw, Play, X, Mic, MicOff, VideoOff, Maximize2, Minimize2, UserPlus, Volume2, VolumeX, LogOut, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { getSafeImageURLEx } from '../helpers/helpers';
const AGORA_APP_ID = "c52085782b1c476e835a38b9c000208f";
const LIVE_ACCENTS = [
  'from-emerald-500/30 via-teal-500/20 to-cyan-500/10',
  'from-pink-500/30 via-fuchsia-500/20 to-rose-500/10',
  'from-amber-500/30 via-orange-500/20 to-yellow-500/10',
  'from-sky-500/30 via-indigo-500/20 to-blue-500/10',
  'from-lime-500/30 via-emerald-500/20 to-teal-500/10',
  'from-purple-500/30 via-violet-500/20 to-purple-500/10',
];

const BroadcastCard = React.memo(({
  item,
  index,
  theme,
  t,
  shouldBlur,
  onOpenViewer,
}: {
  item: BroadcastItem;
  index: number;
  theme: 'dark' | 'light';
  t: any;
  shouldBlur: boolean;
  onOpenViewer: (item: BroadcastItem) => void;
}) => {
  const accent = LIVE_ACCENTS[index % LIVE_ACCENTS.length];
  const name = item.userDetails?.displayName || item.userDetails?.firstName || 'Live';
  const viewers = item.currentViewers ?? item.totalViewers ?? 0;
  const heroImage = item.userDetails?.profilePic?.large || item.userDetails?.profilePic?.square;
  const started = formatElapsed(item.createdAt, t);
  const startedLabel = started ? started : null;
  const initial = name?.trim()?.[0]?.toUpperCase() ?? 'L';
  const canWatch = Boolean(item.viewerToken && item.objectId);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={() => canWatch && onOpenViewer(item)}
      className={`group relative overflow-hidden rounded-2xl border transition-all ${theme === 'dark'
          ? 'border-white/10 bg-white/5 hover:border-white/20 hover:shadow-[0_18px_45px_rgba(0,0,0,0.45)]'
          : 'border-black/10 bg-white hover:border-black/20 hover:shadow-[0_18px_45px_rgba(15,23,42,0.12)]'
        } ${canWatch ? 'cursor-pointer hover:-translate-y-1' : 'cursor-default opacity-90'}`}
    >
      <div className={`relative aspect-[9/16] overflow-hidden bg-black ${accent}`}>
        {heroImage ? (
          <img
            src={heroImage}
            alt={name}
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={index === 0 ? 'high' : 'auto'}
            referrerPolicy="no-referrer"
            className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05] ${shouldBlur ? 'blur-xl scale-[1.02]' : ''
              }`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-3xl font-semibold text-white/70">
            {initial}
          </div>
        )}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
              className="pointer-events-auto transition-colors z-0 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white shadow-2xl backdrop-blur-sm"
            >
              <Play className="w-8 h-8 ml-0.5" fill="currentColor" />
            </motion.div>
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/90 text-white text-[10px] font-bold tracking-wide px-2 py-0.5 shadow">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5">
            <Users className="w-3 h-3" />
            {viewers}
          </span>
        </div>
        <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-full bg-black/55 px-2.5 py-1.5 text-[11px] text-white/85 backdrop-blur">
          <span className="truncate font-semibold">{name}</span>
          {startedLabel && <span className="shrink-0 text-white/70">{startedLabel}</span>}
        </div>
      </div>
    </motion.div>
  );
});

type LiveRenderItem =
  | { kind: 'broadcast'; id: string; item: BroadcastItem; index: number }
  | { kind: 'ad'; id: string };

const parsePayload = (payload: unknown) => {
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }
  if (payload && typeof payload === 'object' && typeof (payload as { data?: unknown }).data === 'string') {
    try {
      return JSON.parse((payload as { data: string }).data);
    } catch {
      return payload;
    }
  }
  return payload;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const tryParseJsonString = (value: unknown): unknown | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
};

const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const inferServiceCode = (...values: Array<unknown>): string | undefined => {
  for (const value of values) {
    if (!value) continue;
    const raw = String(value).trim();
    if (!raw) continue;
    const lower = raw.toLowerCase();
    if (
      lower === 'g' ||
      lower.startsWith('gdata') ||
      lower.includes('growlr') ||
      lower.includes('growler')
    ) return 'G';
    if (
      lower === 'h' ||
      lower.startsWith('hdata') ||
      lower.includes('hornet')
    ) return 'H';
  }
  return undefined;
};

const inferProvider = (...values: Array<unknown>): 'gdata' | 'hdata' | undefined => {
  for (const value of values) {
    if (!value) continue;
    const lower = String(value).trim().toLowerCase();
    if (!lower) continue;
    if (
      lower === 'g' ||
      lower === 'gdata' ||
      lower.includes('growlr') ||
      lower.includes('growler')
    ) return 'gdata';
    if (
      lower === 'h' ||
      lower === 'hdata' ||
      lower.includes('hornet')
    ) return 'hdata';
  }
  return undefined;
};

const getBroadcastProvider = (item?: BroadcastItem | null): 'gdata' | 'hdata' => {
  const provider = inferProvider(
    item?.provider,
    item?.serviceCode,
    (item as BroadcastItem & { service?: unknown })?.service,
    (item as BroadcastItem & { source?: unknown })?.source
  );
  return provider ?? 'hdata';
};

const isBroadcastCandidate = (value: unknown) => {
  const item = asRecord(value);
  if (!item) return false;
  const id = item.objectId ?? item.broadcastId ?? item.videoId ?? item.id;
  if (!id) return false;
  return Boolean(
    item.viewerToken ||
    item.broadcasterToken ||
    item.token ||
    item.userDetails ||
    item.streamDescription ||
    item.currentViewers !== undefined ||
    item.totalViewers !== undefined ||
    item.className === 'SNSVideo'
  );
};

const normalizeBroadcastCandidate = (
  value: unknown,
  serviceHint?: string
): BroadcastItem | null => {
  const item = asRecord(value);
  if (!item) return null;

  // New API: The root object might be a User with broadcast_info
  const broadcastInfo = asRecord(item.broadcast_info) || asRecord(item.broadcastInfo);
  const objectId = broadcastInfo?.objectId ?? item.public_id ?? item.objectId ?? item.broadcastId ?? item.videoId ?? item.id;
  if (!objectId) return null;

  const userDetailsRaw = asRecord(item.userDetails) ?? (item.username || item.displayname ? item : null);
  const avatarRaw = asRecord(item.avatar);
  const locationRaw = asRecord(item.location) || asRecord(userDetailsRaw?.location);

  // Poster logic: Prefer broadcast_info poster/image, then user avatar via helper
  const broadcastPoster = getSafeImageURLEx(String(objectId), avatarRaw, "large");


  const normalized: BroadcastItem = {
    ...(item as BroadcastItem),
    objectId: String(objectId),
    provider: getBroadcastProvider(item as BroadcastItem),
    streamDescription:
      (typeof broadcastInfo?.streamDescription === 'string' && broadcastInfo.streamDescription) ||
      (typeof broadcastInfo?.description === 'string' && broadcastInfo.description) ||
      (typeof item.streamDescription === 'string' && item.streamDescription) ||
      (typeof item.description === 'string' && item.description) ||
      (typeof item.title === 'string' && item.title) ||
      undefined,
    currentViewers: toOptionalNumber(broadcastInfo?.currentViewers ?? broadcastInfo?.viewers ?? item.currentViewers ?? item.viewersCount ?? item.viewers),
    totalViewers: toOptionalNumber(broadcastInfo?.totalViewers ?? item.totalViewers ?? item.viewerCount ?? item.views),
    totalDiamonds: toOptionalNumber(broadcastInfo?.totalDiamonds ?? item.totalDiamonds),
    totalLikes: toOptionalNumber(broadcastInfo?.totalLikes ?? item.totalLikes ?? item.likes),
    broadcasterLifetimeDiamonds: toOptionalNumber(broadcastInfo?.broadcasterLifetimeDiamonds ?? item.broadcasterLifetimeDiamonds),
    viewerToken:
      (typeof broadcastInfo?.viewerToken === 'string' && broadcastInfo.viewerToken) ||
      (typeof broadcastInfo?.viewer_token === 'string' && broadcastInfo.viewer_token) ||
      (typeof broadcastInfo?.token === 'string' && broadcastInfo.token) ||
      (typeof item.viewerToken === 'string' && item.viewerToken) ||
      (typeof item.token === 'string' && item.token) ||
      undefined,
    viewerTokenExpiration: toOptionalNumber(broadcastInfo?.viewerTokenExpiration ?? broadcastInfo?.expires_at ?? item.viewerTokenExpiration ?? item.tokenExpiration),
    broadcasterToken:
      (typeof broadcastInfo?.broadcasterToken === 'string' && broadcastInfo.broadcasterToken) ||
      (typeof item.broadcasterToken === 'string' && item.broadcasterToken) || undefined,
    token: (typeof broadcastInfo?.token === 'string' ? broadcastInfo.token : undefined) || (typeof item.token === 'string' ? item.token : undefined),
    agoraAppId: (typeof broadcastInfo?.agoraAppId === 'string' && broadcastInfo.agoraAppId) || (typeof item.agoraAppId === 'string' && item.agoraAppId) || undefined,
    language:
      (typeof broadcastInfo?.language === 'string' && broadcastInfo.language) ||
      (typeof item.language === 'string' && item.language) ||
      (typeof item.lang === 'string' && item.lang) ||
      undefined,
    createdAt:
      (typeof broadcastInfo?.createdAt === 'string' && broadcastInfo.createdAt) ||
      (typeof item.createdAt === 'string' && item.createdAt) ||
      (typeof item.startedAt === 'string' && item.startedAt) ||
      (typeof item.created_at === 'string' && item.created_at) ||
      undefined,
    updatedAt:
      (typeof broadcastInfo?.updatedAt === 'string' && broadcastInfo.updatedAt) ||
      (typeof item.updatedAt === 'string' && item.updatedAt) ||
      (typeof item.updated_at === 'string' && item.updated_at) ||
      undefined,
    activeUntil: broadcastInfo?.activeUntil || item.activeUntil || undefined,
    isActive: typeof broadcastInfo?.isActive === 'boolean' ? broadcastInfo.isActive : (typeof item.is_live === 'boolean' ? item.is_live : (typeof item.isActive === 'boolean' ? item.isActive : true)),
    isHidden: typeof broadcastInfo?.isHidden === 'boolean' ? broadcastInfo.isHidden : (typeof item.isHidden === 'boolean' ? item.isHidden : false),
    isQuestionable: typeof broadcastInfo?.isQuestionable === 'boolean' ? broadcastInfo.isQuestionable : (typeof item.isQuestionable === 'boolean' ? item.isQuestionable : false),
    broadcasterAge: toOptionalNumber(broadcastInfo?.broadcasterAge ?? item.broadcasterAge),
    userDetails: userDetailsRaw
      ? {
        ...(userDetailsRaw as BroadcastItem['userDetails']),
        objectId: (typeof userDetailsRaw.objectId === 'string' && userDetailsRaw.objectId) || (typeof item.id === 'string' && item.id) || undefined,
        networkUserId: (typeof userDetailsRaw.memberId === 'number' && String(userDetailsRaw.memberId)) || (typeof item.public_id === 'string' && item.public_id) || undefined,
        displayName:
          (typeof userDetailsRaw.displayName === 'string' && userDetailsRaw.displayName) ||
          (typeof item.displayname === 'string' && item.displayname) ||
          (typeof userDetailsRaw.username === 'string' && userDetailsRaw.username) ||
          undefined,
        firstName:
          (typeof userDetailsRaw.firstName === 'string' && userDetailsRaw.firstName) ||
          (typeof userDetailsRaw.name === 'string' && userDetailsRaw.name) ||
          (typeof item.displayname === 'string' && item.displayname) ||
          undefined,
        username: (typeof item.username === 'string' && item.username) || (typeof userDetailsRaw.displayName === 'string' && userDetailsRaw.displayName) || undefined,
        gender: (typeof userDetailsRaw.gender === 'string' && userDetailsRaw.gender) || undefined,
        memberId: toOptionalNumber(userDetailsRaw.memberId),
        profilePic: {
          large: broadcastPoster || undefined,
          square: broadcastPoster || undefined,
        },
        location: {
          country: (typeof locationRaw?.country === 'string' && locationRaw.country) || undefined,
          city: (typeof locationRaw?.city === 'string' && locationRaw.city) || undefined,
          state: (typeof locationRaw?.state === 'string' && locationRaw.state) || undefined,
        },
        birthDate: userDetailsRaw.birthDate || undefined,
      }
      : undefined,
  };

  const serviceCode = inferServiceCode(
    item.service,
    item.serviceCode,
    item.network,
    item.source,
    asRecord(item.correlation)?.id,
    asRecord(item.result)?.source,
    serviceHint
  );
  if (serviceCode) {
    (normalized as BroadcastItem & { serviceCode?: string }).serviceCode = serviceCode;
  }

  const provider = inferProvider(
    item.provider,
    item.sourceProvider,
    item.service,
    item.serviceCode,
    item.network,
    item.source,
    asRecord(item.correlation)?.id,
    serviceCode,
    serviceHint
  );
  if (provider) {
    (normalized as BroadcastItem & { provider?: string }).provider = provider;
  }

  return normalized;
};

const collectBroadcastCandidates = (
  node: unknown,
  output: Array<{ value: unknown; serviceHint?: string }>,
  inheritedService?: string,
  depth = 0
) => {
  if (depth > 9 || node == null) return;
  const parsedStringNode = tryParseJsonString(node);
  if (parsedStringNode) {
    collectBroadcastCandidates(parsedStringNode, output, inheritedService, depth + 1);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item) => collectBroadcastCandidates(item, output, inheritedService, depth + 1));
    return;
  }

  const record = asRecord(node);
  if (!record) return;

  const nodeServiceHint = inferServiceCode(
    record.service,
    record.serviceCode,
    record.network,
    record.source,
    asRecord(record.correlation)?.id,
    inheritedService
  );

  if (isBroadcastCandidate(record)) {
    output.push({ value: record, serviceHint: nodeServiceHint });
  }

  for (const [key, value] of Object.entries(record)) {
    const keyLower = key.toLowerCase();
    const childServiceHint =
      keyLower === 'gdata' || keyLower.includes('growlr') || keyLower.includes('growler')
        ? 'G'
        : keyLower === 'hdata' || keyLower.includes('hornet')
          ? 'H'
          : nodeServiceHint;
    if (Array.isArray(value) || asRecord(value)) {
      collectBroadcastCandidates(value, output, childServiceHint, depth + 1);
      continue;
    }
    const parsedChild = tryParseJsonString(value);
    if (parsedChild) {
      collectBroadcastCandidates(parsedChild, output, childServiceHint, depth + 1);
    }
  }
};

const normalizeBroadcasts = (raw: unknown): { items: BroadcastItem[]; cursor: any | null } => {
  const parsed = parsePayload(raw) as any;
  if (!parsed) return { items: [], cursor: null };

  const rawItems = parsed?.users ?? parsed?.items ?? parsed?.data?.users ?? parsed?.data?.items ?? parsed?.data ?? parsed;
  let cursor = parsed?.cursor ?? parsed?.data?.cursor ?? null;
  
  if (!cursor && (parsed?.next || parsed?.data?.next)) {
    cursor = { next: parsed?.next || parsed?.data?.next };
  }

  const candidates: Array<{ value: unknown; serviceHint?: string }> = [];
  if (Array.isArray(rawItems)) {
    rawItems.forEach(item => {
      candidates.push({ value: item });
    });
  } else {
    collectBroadcastCandidates(parsed, candidates);
  }

  const unique = new Map<string, BroadcastItem>();
  candidates.forEach(({ value, serviceHint }) => {
    const normalized = normalizeBroadcastCandidate(value, serviceHint);
    if (!normalized) return;
    const normalizedServiceCode = (normalized as BroadcastItem & { serviceCode?: string }).serviceCode;
    const normalizedProvider = (normalized as BroadcastItem & { provider?: string }).provider;
    const key =
      (normalized.objectId ? `${normalizedServiceCode ?? normalizedProvider ?? 'X'}:${normalized.objectId}` : undefined) ??
      normalized.viewerToken ??
      `${normalized.userDetails?.displayName ?? ''}-${normalized.createdAt ?? ''}`;
    if (!key) return;
    if (!unique.has(key)) {
      unique.set(key, normalized);
    }
  });

  return { items: [...unique.values()], cursor };
};

const normalizeBroadcast = (raw: unknown): BroadcastItem | null => {
  const parsed = parsePayload(raw) as any;
  if (!parsed) return null;
  const result = parsed?.result ?? parsed?.data ?? parsed;
  const candidate =
    result?.broadcast ??
    result?.video ??
    result?.item ??
    parsed?.broadcast ??
    parsed?.video ??
    parsed?.item ??
    result;
  const normalized = normalizeBroadcastCandidate(candidate);
  if (normalized) return normalized;
  const { items } = normalizeBroadcasts(raw);
  return items[0] ?? null;
};

const formatElapsed = (iso: string | undefined, t: (key: string, options?: Record<string, unknown>) => string) => {
  if (!iso) return null;
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return null;
  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return null;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return t('live.time.just_now', { defaultValue: 'just now' });
  if (minutes < 60) return t('live.time.minutes', { count: minutes, defaultValue: `${minutes} min ago` });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('live.time.hours', { count: hours, defaultValue: `${hours} h ago` });
  const days = Math.floor(hours / 24);
  return t('live.time.days', { count: days, defaultValue: `${days} d ago` });
};

export const LiveTab: React.FC<{ theme: 'dark' | 'light'; headerVariant?: 'tab' | 'page'; showHeader?: boolean }> = ({
  theme,
  headerVariant = 'tab',
  showHeader = true,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const { isPremiumRequired } = usePremiumAccess();
  const [liveState, setLiveState] = useAtom(liveBroadcastsStateAtom);
  const { items: liveItems, isLoading, isRefreshing, error: loadError } = liveState;
  const adsInLiveEnabled = useMemo(() => isFeatureEnabled('ads_in_live'), []);
  const liveRenderItems = useMemo<LiveRenderItem[]>(() => {
    const rows: LiveRenderItem[] = [];
    liveItems.forEach((item, index) => {
      rows.push({
        kind: 'broadcast',
        id: String(item.objectId ?? `broadcast-${index}`),
        item,
        index,
      });
      if (adsInLiveEnabled && (index + 1) % 8 === 0) {
        rows.push({
          kind: 'ad',
          id: `live-ad-${index + 1}`,
        });
      }
    });
    return rows;
  }, [adsInLiveEnabled, liveItems]);
  const [premiumGateContext, setPremiumGateContext] = useState<'join' | 'create' | null>(null);
  const [activeBroadcast, setActiveBroadcast] = useState<BroadcastItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerStatus, setViewerStatus] = useState<'idle' | 'joining' | 'waiting' | 'playing' | 'error'>('idle');
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<'audience' | 'host'>('audience');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isCamEnabled, setIsCamEnabled] = useState(false);
  const [hasLocalAudio, setHasLocalAudio] = useState(false);
  const [hasLocalVideo, setHasLocalVideo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showViewerControls, setShowViewerControls] = useState(true);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [primaryRemoteUid, setPrimaryRemoteUid] = useState<string | number | null>(null);
  const [joinFlow, setJoinFlow] = useState<'idle' | 'setup' | 'requesting' | 'waiting'>('idle');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [createFlow, setCreateFlow] = useState<'idle' | 'setup' | 'creating'>('idle');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createDescription, setCreateDescription] = useState('');
  const [autoLikeEnabled, setAutoLikeEnabled] = useState(false);
  const [streamClientId, setStreamClientId] = useState('');
  const [joinMicOn, setJoinMicOn] = useState(true);
  const [joinCamOn, setJoinCamOn] = useState(true);
  const [isViewerMuted, setIsViewerMuted] = useState(true);
  const [viewerFit, setViewerFit] = useState<'cover' | 'contain'>('contain');
  const [participantNonce, setParticipantNonce] = useState(0);
  const [switchPulseUid, setSwitchPulseUid] = useState<string | null>(null);
  const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);
  const [availableCams, setAvailableCams] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState('');
  const [selectedCamId, setSelectedCamId] = useState('');

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const previewVideoRef = useRef<HTMLDivElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const videoTrackRef = useRef<IRemoteVideoTrack | null>(null);
  const audioTrackRef = useRef<IRemoteAudioTrack | null>(null);
  const audioTracksRef = useRef<Map<string | number, IRemoteAudioTrack>>(new Map());
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const primaryRemoteUidRef = useRef<string | number | null>(null);
  const streamClientIdRef = useRef('');
  const viewerMutedRef = useRef(true);
  const viewerFitRef = useRef<'cover' | 'contain'>('contain');
  const lastJoinTokenRef = useRef<string | null>(null);
  const autoLikeTimerRef = useRef<number | null>(null);
  const autoLikeLockRef = useRef(false);
  const eventsBoundRef = useRef(false);
  const audioRetryTimerRef = useRef<number | null>(null);
  const audioRetryCountRef = useRef(0);
  const switchPulseTimerRef = useRef<number | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  const setPrimaryUid = useCallback((uid: string | number | null) => {
    primaryRemoteUidRef.current = uid;
    setPrimaryRemoteUid(uid);
  }, []);

  const setStreamClientIdSafe = useCallback((id: string | number | null) => {
    const value = id ? String(id) : '';
    streamClientIdRef.current = value;
    setStreamClientId(value);
  }, []);

  const setViewerMutedSafe = useCallback((value: boolean) => {
    viewerMutedRef.current = value;
    setIsViewerMuted(value);
  }, []);

  const setViewerFitSafe = useCallback((value: 'cover' | 'contain') => {
    viewerFitRef.current = value;
    setViewerFit(value);
  }, []);

  const openPremiumGate = useCallback((context: 'join' | 'create') => {
    setPremiumGateContext(context);
  }, []);

  const closePremiumGate = useCallback(() => {
    setPremiumGateContext(null);
  }, []);

  const handleUpgradePremium = useCallback(() => {
    setPremiumGateContext(null);
    navigate('/premium');
  }, [navigate]);

  const triggerSwitchPulse = useCallback((uid: string) => {
    if (switchPulseTimerRef.current) {
      window.clearTimeout(switchPulseTimerRef.current);
    }
    setSwitchPulseUid(uid);
    switchPulseTimerRef.current = window.setTimeout(() => {
      setSwitchPulseUid((prev) => (prev === uid ? null : prev));
      switchPulseTimerRef.current = null;
    }, 420);
  }, []);

  const clearAudioRetry = useCallback(() => {
    if (audioRetryTimerRef.current) {
      window.clearTimeout(audioRetryTimerRef.current);
      audioRetryTimerRef.current = null;
    }
    audioRetryCountRef.current = 0;
  }, []);

  const playRemoteAudio = useCallback((track?: IRemoteAudioTrack | null, attempts = 0) => {
    if (viewerMutedRef.current) return;
    const target = track ?? audioTrackRef.current;
    if (!target) {
      const tracks = Array.from(audioTracksRef.current.values()).filter(Boolean);
      if (tracks.length) {
        let failed = false;
        tracks.forEach((item) => {
          try {
            item.setVolume?.(100);
            item.play();
          } catch {
            failed = true;
          }
        });
        if (failed && attempts < 6 && !audioRetryTimerRef.current) {
          audioRetryTimerRef.current = window.setTimeout(() => {
            audioRetryTimerRef.current = null;
            playRemoteAudio(undefined, attempts + 1);
          }, 200);
        }
        return;
      }
      if (attempts >= 8) return;
      if (!audioRetryTimerRef.current) {
        audioRetryTimerRef.current = window.setTimeout(() => {
          audioRetryTimerRef.current = null;
          playRemoteAudio(undefined, attempts + 1);
        }, 180);
      }
      return;
    }
    try {
      target.setVolume?.(100);
      target.play();
    } catch {
      if (attempts >= 8) return;
      if (!audioRetryTimerRef.current) {
        audioRetryTimerRef.current = window.setTimeout(() => {
          audioRetryTimerRef.current = null;
          playRemoteAudio(target, attempts + 1);
        }, 200);
      }
    }
  }, []);

  const stopAllRemoteAudio = useCallback(() => {
    audioTracksRef.current.forEach((track) => {
      try {
        track.stop();
      } catch {
        // ignore
      }
    });
  }, []);

  const clearRemoteAudio = useCallback(() => {
    stopAllRemoteAudio();
    audioTracksRef.current.clear();
    audioTrackRef.current?.stop();
    audioTrackRef.current = null;
  }, [stopAllRemoteAudio]);

  const syncRemoteAudio = useCallback(async () => {
    if (viewerMutedRef.current) return;
    const client = clientRef.current;
    if (!client) return;
    const users = client.remoteUsers ?? [];
    if (!users.length) return;

    for (const user of users) {
      if (!user.hasAudio) continue;
      if (!user.audioTrack) {
        try {
          await client.subscribe(user, 'audio');
        } catch (error) {
          console.warn('Audio subscribe failed', error);
          continue;
        }
      }
      if (user.audioTrack) {
        audioTracksRef.current.set(user.uid, user.audioTrack);
        audioTrackRef.current = user.audioTrack;
      }
    }

    clearAudioRetry();
    playRemoteAudio();
  }, [clearAudioRetry, playRemoteAudio]);

  const stopAutoLike = useCallback(() => {
    if (autoLikeTimerRef.current) {
      window.clearInterval(autoLikeTimerRef.current);
      autoLikeTimerRef.current = null;
    }
    autoLikeLockRef.current = false;
    setAutoLikeEnabled(false);
  }, []);

  const startAutoLike = useCallback(() => {
    if (!activeBroadcast?.objectId) {
      setViewerError(t('live.viewer.like_missing', { defaultValue: 'Yayın bilgileri eksik.' }));
      return;
    }
    const viewerId = streamClientIdRef.current || streamClientId;
    if (!viewerId) {
      setViewerError(t('live.viewer.like_missing', { defaultValue: 'Yayın bilgileri eksik.' }));
      return;
    }
    if (autoLikeTimerRef.current) return;
    setViewerError(null);
    setAutoLikeEnabled(true);

    const sendLike = async () => {
      if (autoLikeLockRef.current) return;
      autoLikeLockRef.current = true;
      try {
        await api.likeBroadcasts({
          provider: getBroadcastProvider(activeBroadcast),
          broadcastId: activeBroadcast.objectId!,
          viewerId,
          numLikes: 30
        });
      } catch (error) {
        console.warn('Auto-like failed', error);
      } finally {
        autoLikeLockRef.current = false;
      }
    };

    autoLikeTimerRef.current = window.setInterval(sendLike, 300);
    void sendLike();
  }, [activeBroadcast?.objectId, streamClientId, t]);

  const upsertRemoteUser = useCallback((user: IAgoraRTCRemoteUser) => {
    setRemoteUsers((prev) => {
      const idx = prev.findIndex((item) => item.uid === user.uid);
      if (idx === -1) return [...prev, user];
      const next = [...prev];
      next[idx] = user;
      return next;
    });
    setParticipantNonce((prev) => prev + 1);
  }, []);

  const removeRemoteUser = useCallback((uid: string | number) => {
    setRemoteUsers((prev) => prev.filter((user) => user.uid !== uid));
    setParticipantNonce((prev) => prev + 1);
  }, []);

  const playPrimaryVideo = useCallback((user: IAgoraRTCRemoteUser | null) => {
    const track = user?.videoTrack ?? null;
    videoTrackRef.current?.stop();
    videoTrackRef.current = track;
    if (videoRef.current) {
      videoRef.current.innerHTML = '';
    }
    if (track && videoRef.current) {
      track.play(videoRef.current, { fit: viewerFitRef.current });
      setViewerStatus('playing');
    }
  }, []);

  const toggleViewerFit = useCallback(() => {
    const next = viewerFitRef.current === 'cover' ? 'contain' : 'cover';
    setViewerFitSafe(next);
    const current = remoteUsers.find((user) => user.uid === primaryRemoteUidRef.current);
    playPrimaryVideo(current ?? null);
  }, [playPrimaryVideo, remoteUsers, setViewerFitSafe]);

  const handleSelectParticipant = useCallback(
    (user: IAgoraRTCRemoteUser) => {
      if (!user?.uid) return;
      if (primaryRemoteUidRef.current === user.uid) return;
      // Ensure track is not playing in the small tile before swapping to main view.
      user.videoTrack?.stop();
      setPrimaryUid(user.uid);
      playPrimaryVideo(user);
    },
    [playPrimaryVideo, setPrimaryUid]
  );

  const stopTracks = useCallback(() => {
    videoTrackRef.current?.stop();
    videoTrackRef.current = null;
    clearRemoteAudio();
    clearAudioRetry();
    if (videoRef.current) {
      videoRef.current.innerHTML = '';
    }
    setRemoteUsers([]);
    setPrimaryUid(null);
  }, [clearAudioRetry, clearRemoteAudio, setPrimaryUid]);

  const stopLocalTracks = useCallback(() => {
    localAudioTrackRef.current?.stop();
    localAudioTrackRef.current?.close();
    localAudioTrackRef.current = null;
    localVideoTrackRef.current?.stop();
    localVideoTrackRef.current?.close();
    localVideoTrackRef.current = null;
    setHasLocalAudio(false);
    setHasLocalVideo(false);
    setIsMicEnabled(false);
    setIsCamEnabled(false);
    setViewerRole('audience');
  }, []);

  const leaveStream = useCallback(async () => {
    try {
      if (clientRef.current && clientRef.current.connectionState !== 'DISCONNECTED') {
        await clientRef.current.leave();
      }
    } catch (error) {
      console.warn('Live leave failed', error);
    } finally {
      stopAutoLike();
      stopTracks();
      stopLocalTracks();
    }
  }, [stopAutoLike, stopTracks, stopLocalTracks]);

  const ensureClient = useCallback(async () => {
    if (clientRef.current) return clientRef.current;
    const { default: AgoraRTC } = await import('agora-rtc-sdk-ng');
    const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
    clientRef.current = client;

    if (!eventsBoundRef.current) {
      const pickNextPrimary = () => {
        const nextUser = client.remoteUsers.find((remote) => remote.hasVideo);
        if (nextUser) {
          setPrimaryUid(nextUser.uid);
          playPrimaryVideo(nextUser);
        } else {
          setPrimaryUid(null);
          playPrimaryVideo(null);
        }
      };

      client.on('user-published', async (user, mediaType) => {
        try {
          await client.subscribe(user, mediaType);
          if (mediaType === 'video') {
            upsertRemoteUser(user);
            if (!primaryRemoteUidRef.current) {
              setPrimaryUid(user.uid);
            }
            if (primaryRemoteUidRef.current === user.uid) {
              playPrimaryVideo(user);
            }
          }
          if (mediaType === 'audio') {
            const track = user.audioTrack ?? null;
            if (track) {
              audioTracksRef.current.set(user.uid, track);
              audioTrackRef.current = track;
              if (!viewerMutedRef.current) {
                void syncRemoteAudio();
                setViewerStatus('playing');
              }
            }
          }
        } catch (error) {
          console.warn('Live subscribe failed', error);
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          removeRemoteUser(user.uid);
          if (primaryRemoteUidRef.current === user.uid) {
            pickNextPrimary();
          }
        }
        if (mediaType === 'audio') {
          const track = audioTracksRef.current.get(user.uid);
          if (track) {
            track.stop();
            audioTracksRef.current.delete(user.uid);
          }
          if (audioTrackRef.current === track) {
            audioTrackRef.current = null;
          }
        }
      });

      client.on('user-left', (user) => {
        removeRemoteUser(user.uid);
        const track = audioTracksRef.current.get(user.uid);
        if (track) {
          track.stop();
          audioTracksRef.current.delete(user.uid);
        }
        if (audioTrackRef.current === track) {
          audioTrackRef.current = null;
        }
        if (primaryRemoteUidRef.current === user.uid) {
          pickNextPrimary();
        }
      });

      eventsBoundRef.current = true;
    }

    return client;
  }, [playPrimaryVideo, removeRemoteUser, setPrimaryUid, syncRemoteAudio, upsertRemoteUser]);

  const loadBroadcasts = useCallback(
    async (mode: 'initial' | 'refresh' | 'loadMore' = 'initial', pCursor?: any): Promise<BroadcastItem[]> => {
      if (isFetchingRef.current && mode === 'loadMore') return [];
      isFetchingRef.current = true;

      let cleaned: BroadcastItem[] = [];
      if (mode === 'initial') {
        setLiveState((prev) => ({ ...prev, isLoading: true, items: [], cursor: null }));
      } else if (mode === 'refresh') {
        setLiveState((prev) => ({ ...prev, isRefreshing: true }));
      } else if (mode === 'loadMore') {
        setLiveState((prev) => ({ ...prev, isLoading: true }));
      }

      try {
        const raw = await api.fetchBroadcasts({
          limit: 30,
          cursor: pCursor?.next || "",
          distance: pCursor?.distance
        });
        const { items, cursor } = normalizeBroadcasts(raw);

        const filtered = items.filter(
          (item: BroadcastItem) =>
            item?.isActive !== false &&
            item?.isHidden !== true &&
            item?.isQuestionable !== true
        );

        const sortByCreatedAtDesc = (items: BroadcastItem[]) => [...items].sort((a, b) => {
          const bTime = b?.createdAt ? Date.parse(b.createdAt) : 0;
          const aTime = a?.createdAt ? Date.parse(a.createdAt) : 0;
          return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
        });

        const gItems = filtered.filter((item) => getBroadcastProvider(item) === 'gdata');
        const hItems = filtered.filter((item) => getBroadcastProvider(item) === 'hdata');
        cleaned = [...sortByCreatedAtDesc(gItems), ...sortByCreatedAtDesc(hItems)];

        setLiveState((prev) => {
          // Prevent setting an old or identical cursor if we already have one that's further ahead
          // or if the new cursor is the same as the one we just used.
          if (mode === 'loadMore' && prev.cursor?.next === cursor?.next) {
            // Stop further pagination if we didn't get any new items OR the cursor didn't move
            return { ...prev, isLoading: false, cursor: cursor?.next ? { ...cursor, next: undefined } : null };
          }

          const allItems = mode === 'loadMore' ? [...prev.items, ...cleaned] : cleaned;
          
          // Deduplicate by objectId
          const uniqueItems: BroadcastItem[] = [];
          const seen = new Set<string>();
          for (const it of allItems) {
            if (it.objectId && !seen.has(it.objectId)) {
              seen.add(it.objectId);
              uniqueItems.push(it);
            } else if (!it.objectId) {
              uniqueItems.push(it);
            }
          }

          return {
            ...prev,
            items: uniqueItems,
            cursor: cursor || null,
            error: null
          };
        });
      } catch (error) {
        console.error('Live broadcasts fetch failed', error);
        setLiveState((prev) => ({
          ...prev,
          error: t('live.load_error', { defaultValue: 'Canlı yayınlar yüklenemedi.' })
        }));
      } finally {
        isFetchingRef.current = false;
        // Add a small delay for UI to settle before resetting isLoading
        setTimeout(() => {
          setLiveState((prev) => ({ ...prev, isLoading: false, isRefreshing: false }));
        }, 300);
      }
      return cleaned;
    },
    [setLiveState, t]
  );

  const loadMore = useCallback(async () => {
    if (isLoading || !liveState.cursor?.next) return;
    await loadBroadcasts('loadMore', liveState.cursor);
  }, [isLoading, liveState.cursor, loadBroadcasts]);

  const loadDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter((device) => device.kind === 'audioinput');
      const cams = devices.filter((device) => device.kind === 'videoinput');
      setAvailableMics(mics);
      setAvailableCams(cams);
      if (!selectedMicId && mics[0]?.deviceId) {
        setSelectedMicId(mics[0].deviceId);
      }
      if (!selectedCamId && cams[0]?.deviceId) {
        setSelectedCamId(cams[0].deviceId);
      }
    } catch (error) {
      console.warn('Device enumeration failed', error);
    }
  }, [selectedCamId, selectedMicId]);

  const ensurePreviewTracks = useCallback(
    async ({
      audio,
      video,
      forceAudio = false,
      forceVideo = false,
      target = 'preview',
      micId,
      camId,
    }: {
      audio: boolean;
      video: boolean;
      forceAudio?: boolean;
      forceVideo?: boolean;
      target?: 'preview' | 'pip';
      micId?: string;
      camId?: string;
    }) => {
      const { default: AgoraRTC } = await import('agora-rtc-sdk-ng');
      let audioTrack = localAudioTrackRef.current;
      let videoTrack = localVideoTrackRef.current;

      if (!audio || forceAudio) {
        if (audioTrack) {
          audioTrack.stop();
          audioTrack.close();
          audioTrack = null;
        }
      }

      if (!video || forceVideo) {
        if (videoTrack) {
          videoTrack.stop();
          videoTrack.close();
          videoTrack = null;
        }
      }

      if (audio && !audioTrack) {
        try {
          audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
            microphoneId: micId || selectedMicId || undefined,
          });
        } catch (error) {
          console.warn('Microphone unavailable', error);
        }
      }

      if (video && !videoTrack) {
        try {
          videoTrack = await AgoraRTC.createCameraVideoTrack({
            cameraId: camId || selectedCamId || undefined,
          });
        } catch (error) {
          console.warn('Camera unavailable', error);
        }
      }

      localAudioTrackRef.current = audioTrack;
      localVideoTrackRef.current = videoTrack;
      setHasLocalAudio(Boolean(audioTrack));
      setHasLocalVideo(Boolean(videoTrack));

      if (target === 'preview' && videoTrack && previewVideoRef.current) {
        videoTrack.play(previewVideoRef.current, { fit: 'contain' });
      }
    },
    [selectedCamId, selectedMicId]
  );

  useEffect(() => {
    void loadBroadcasts('initial');
  }, [loadBroadcasts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && liveState.cursor?.next) {
          void loadMore();
        }
      },
      { threshold: 0.5, rootMargin: '80px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [isLoading, liveState.cursor?.next, loadMore]);

  useEffect(() => {
    return () => {
      void leaveStream();
    };
  }, [leaveStream]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreen);
    handleFullscreen();
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreen);
    };
  }, []);

  useEffect(() => {
    if (joinFlow === 'setup' || createFlow === 'setup') {
      void loadDevices();
      return;
    }
    if (previewVideoRef.current) {
      previewVideoRef.current.innerHTML = '';
    }
  }, [joinFlow, createFlow, loadDevices]);

  useEffect(() => {
    if (joinFlow !== 'setup' && createFlow !== 'setup') return;
    if (localVideoTrackRef.current && previewVideoRef.current) {
      localVideoTrackRef.current.play(previewVideoRef.current, { fit: 'contain' });
    }
  }, [joinFlow, createFlow]);

  useEffect(() => {
    if (viewerRole !== 'host') return;
    setJoinFlow('idle');
    setJoinError(null);
  }, [viewerRole]);

  const refreshLive = async () => {
    await loadBroadcasts('refresh');
  };

  const isTokenNearExpiry = (item: BroadcastItem) => {
    const tokenExpiry = Number(item.viewerTokenExpiration ?? 0);
    if (!tokenExpiry) return false;
    return tokenExpiry - Date.now() < 30_000;
  };

  const toggleFullscreen = async () => {
    if (typeof document === 'undefined') return;
    try {
      if (!document.fullscreenElement && viewerContainerRef.current) {
        await viewerContainerRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen toggle failed', error);
    }
  };

  const toggleViewerMute = () => {
    const next = !viewerMutedRef.current;
    setViewerMutedSafe(next);
    try {
      if (next) {
        clearAudioRetry();
        stopAllRemoteAudio();
      } else {
        void syncRemoteAudio();
      }
    } catch (error) {
      console.warn('Audio toggle failed', error);
    }
  };

  const toggleMic = async () => {
    const track = localAudioTrackRef.current;
    if (!track) return;
    const next = !isMicEnabled;
    await track.setEnabled(next);
    setIsMicEnabled(next);
  };

  const toggleCam = async () => {
    const track = localVideoTrackRef.current;
    if (!track) return;
    const next = !isCamEnabled;
    await track.setEnabled(next);
    setIsCamEnabled(next);
  };

  const startPublishing = async (overrides?: { mic?: boolean; cam?: boolean }): Promise<{ ok: boolean; reason?: string }> => {
    const hostToken = activeBroadcast?.broadcasterToken ?? activeBroadcast?.viewerToken ?? activeBroadcast?.token;
    if (!activeBroadcast?.objectId || !hostToken) {
      const reason = t('live.errors.missing_info', { defaultValue: 'Yayın bilgileri eksik.' });
      setViewerError(reason);
      return { ok: false, reason };
    }
    if (isPublishing) return { ok: false };
    setViewerError(null);
    setIsPublishing(true);
    try {
      const client = await ensureClient();
      const hostTokenValue = String(hostToken);
      if (client.connectionState !== 'DISCONNECTED' && lastJoinTokenRef.current !== hostTokenValue) {
        await client.leave();
      }
      if (client.connectionState === 'DISCONNECTED') {
        await client.setClientRole('host');
        await client.join(AGORA_APP_ID, activeBroadcast.objectId, hostTokenValue, 0);
        lastJoinTokenRef.current = hostTokenValue;
      } else {
        await client.setClientRole('host');
      }

      const { default: AgoraRTC } = await import('agora-rtc-sdk-ng');
      const micEnabled = overrides?.mic ?? joinMicOn;
      const camEnabled = overrides?.cam ?? joinCamOn;
      let audio: IMicrophoneAudioTrack | null = micEnabled ? localAudioTrackRef.current : null;
      let video: ICameraVideoTrack | null = camEnabled ? localVideoTrackRef.current : null;

      if (micEnabled && !audio) {
        try {
          audio = await AgoraRTC.createMicrophoneAudioTrack({
            microphoneId: selectedMicId || undefined,
          });
        } catch (error) {
          console.warn('Microphone unavailable', error);
        }
      }

      if (camEnabled && !video) {
        try {
          video = await AgoraRTC.createCameraVideoTrack({
            cameraId: selectedCamId || undefined,
          });
        } catch (error) {
          console.warn('Camera unavailable', error);
        }
      }

      if (!audio && !video) {
        throw new Error(t('live.viewer.no_media', { defaultValue: 'Kameraya veya mikrofona erişilemedi.' }));
      }

      localAudioTrackRef.current = audio;
      localVideoTrackRef.current = video;
      setHasLocalAudio(Boolean(audio));
      setHasLocalVideo(Boolean(video));
      setIsMicEnabled(Boolean(audio));
      setIsCamEnabled(Boolean(video));

      const tracks = [audio, video].filter(Boolean) as (IMicrophoneAudioTrack | ICameraVideoTrack)[];
      if (tracks.length) {
        await client.publish(tracks);
      }
      setViewerRole('host');
      setViewerStatus('playing');
      void syncRemoteAudio();
      return { ok: true };
    } catch (error) {
      console.error('Live publish failed', error);
      const message = String((error as { message?: string })?.message ?? '');
      const permissionDenied = /privilege|permission|unauthorized|not authorized|publish/i.test(message);
      const reason = permissionDenied
        ? t('live.viewer.join_not_approved', { defaultValue: 'Katılım isteğin onaylanmadı.' })
        : t('live.viewer.publish_failed', { defaultValue: 'Kamera/mikrofon açılamadı veya yayın izni yok.' });
      setViewerError(reason);
      setViewerRole('audience');
      return { ok: false, reason };
    } finally {
      setIsPublishing(false);
    }
  };

  const openJoinSetup = async () => {
    if (viewerRole !== 'host' && isPremiumRequired) {
      openPremiumGate('join');
      return;
    }
    if (viewerRole === 'host') return;
    const nextMic = joinMicOn || joinCamOn ? joinMicOn : true;
    const nextCam = joinMicOn || joinCamOn ? joinCamOn : true;
    setJoinMicOn(nextMic);
    setJoinCamOn(nextCam);
    setJoinError(null);
    setJoinFlow('setup');
    setCreateFlow('idle');
    setCreateError(null);
    setShowViewerControls(true);
    await loadDevices();
    await ensurePreviewTracks({
      audio: nextMic,
      video: nextCam,
      target: 'preview',
    });
  };

  const cancelJoinRequest = () => {
    if (viewerRole === 'host') return;
    setJoinFlow('idle');
    setJoinError(null);
    stopLocalTracks();
  };

  const openCreateSetup = async () => {
    if (isPremiumRequired) {
      openPremiumGate('create');
      return;
    }
    if (isViewerOpen) return;
    const nextMic = joinMicOn || joinCamOn ? joinMicOn : true;
    const nextCam = joinMicOn || joinCamOn ? joinCamOn : true;
    setJoinMicOn(nextMic);
    setJoinCamOn(nextCam);
    setCreateError(null);
    setCreateFlow('setup');
    setJoinFlow('idle');
    setJoinError(null);
    await loadDevices();
    await ensurePreviewTracks({
      audio: nextMic,
      video: nextCam,
      target: 'preview',
    });
  };

  const cancelCreateSetup = () => {
    setCreateFlow('idle');
    setCreateError(null);
    setCreateDescription('');
    stopLocalTracks();
  };

  const toggleJoinMic = async () => {
    const next = !joinMicOn;
    setJoinMicOn(next);
    if (!next) {
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
        setHasLocalAudio(false);
      }
      return;
    }
    await ensurePreviewTracks({
      audio: true,
      video: joinCamOn,
      forceAudio: true,
      target: 'preview',
    });
  };

  const toggleJoinCam = async () => {
    const next = !joinCamOn;
    setJoinCamOn(next);
    if (!next) {
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
        setHasLocalVideo(false);
      }
      if (previewVideoRef.current) {
        previewVideoRef.current.innerHTML = '';
      }
      return;
    }
    await ensurePreviewTracks({
      audio: joinMicOn,
      video: true,
      forceVideo: true,
      target: 'preview',
    });
  };

  const handleMicChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = event.target.value;
    setSelectedMicId(nextId);
    if (joinMicOn) {
      await ensurePreviewTracks({
        audio: true,
        video: joinCamOn,
        forceAudio: true,
        target: 'preview',
        micId: nextId,
      });
    }
  };

  const handleCamChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = event.target.value;
    setSelectedCamId(nextId);
    if (joinCamOn) {
      await ensurePreviewTracks({
        audio: joinMicOn,
        video: true,
        forceVideo: true,
        target: 'preview',
        camId: nextId,
      });
    }
  };

  const checkJoinApproval = async () => {
    if (viewerRole === 'host') return;
    const result = await startPublishing();
    if (result.ok) {
      setJoinFlow('idle');
      setJoinError(null);
      return;
    }
    if (result.reason) {
      setJoinError(result.reason);
    }
    setJoinFlow('waiting');
  };

  const sendJoinRequest = async () => {
    if (!joinMicOn && !joinCamOn) {
      setJoinError(t('live.viewer.join_request_need_device', { defaultValue: 'Mikrofon veya kameradan en az biri açık olmalı.' }));
      return;
    }
    setJoinError(null);
    setJoinFlow('requesting');
    await ensurePreviewTracks({
      audio: joinMicOn,
      video: joinCamOn,
      target: 'preview',
    });
    if (!localAudioTrackRef.current && !localVideoTrackRef.current) {
      setJoinFlow('setup');
      setJoinError(t('live.viewer.no_media', { defaultValue: 'Kameraya veya mikrofona erişilemedi.' }));
      return;
    }
    const broadcastId = activeBroadcast?.objectId ?? '';
    const provider = getBroadcastProvider(activeBroadcast);
    const clientId = streamClientIdRef.current || streamClientId;
    if (!broadcastId || !clientId) {
      setJoinFlow('setup');
      setJoinError(t('live.viewer.join_request_missing', { defaultValue: 'Yayına katılmak için bağlantı bilgileri eksik.' }));
      return;
    }
    try {
      await api.joinBroadcasts({ provider, broadcastId, streamClientId: clientId });
    } catch (error) {
      console.error('Join request failed', error);
      setJoinFlow('setup');
      setJoinError(t('live.viewer.join_request_failed', { defaultValue: 'Katılım isteği gönderilemedi. Lütfen tekrar deneyin.' }));
      return;
    }
    setJoinFlow('waiting');
    setTimeout(() => {
      void checkJoinApproval();
    }, 900);
  };

  const openViewer = useCallback(async (broadcast: BroadcastItem, options?: { skipJoin?: boolean }) => {
    let target = broadcast;
    if (isTokenNearExpiry(target)) {
      const updated = await loadBroadcasts('refresh');
      const fresh = updated.find((item) => item.objectId === target.objectId);
      if (fresh) target = fresh;
    }

    setActiveBroadcast(target);
    setViewerError(null);
    setViewerStatus('joining');
    setIsViewerOpen(true);
    setShowViewerControls(true);
    setRemoteUsers([]);
    setPrimaryUid(null);
    setSwitchPulseUid(null);
    setStreamClientIdSafe(null);
    setViewerMutedSafe(false);
    clearRemoteAudio();
    clearAudioRetry();
    lastJoinTokenRef.current = null;
    stopAutoLike();
    setJoinFlow('idle');
    setJoinError(null);
    setCreateFlow('idle');
    setCreateError(null);
    setJoinMicOn(true);
    setJoinCamOn(true);
    stopLocalTracks();
    setViewerRole('audience');
    setHasLocalAudio(false);
    setHasLocalVideo(false);
    setIsMicEnabled(false);
    setIsCamEnabled(false);

    const joinToken = target?.viewerToken ?? target?.broadcasterToken ?? target?.token;
    if (!target?.objectId || !joinToken) {
      setViewerStatus('error');
      setViewerError(t('live.errors.missing_info', { defaultValue: 'Yayın bilgileri eksik.' }));
      return;
    }

    const tokenExpiry = Number(target.viewerTokenExpiration ?? 0);
    if (tokenExpiry && Date.now() > tokenExpiry) {
      setViewerStatus('error');
      setViewerError(t('live.errors.token_expired', { defaultValue: 'Yayın anahtarı süresi dolmuş. Yenile ve tekrar dene.' }));
      return;
    }

    api
      .viewBroadcasts({ provider: getBroadcastProvider(target), broadcastId: target.objectId })
      .catch((error) => console.warn('View broadcast tracking failed', error));

    if (options?.skipJoin) {
      setViewerStatus('waiting');
      return;
    }

    try {
      const client = await ensureClient();
      if (client.connectionState !== 'DISCONNECTED') {
        await client.leave();
      }
      await client.setClientRole('audience');
      const tokenValue = String(joinToken);
      const uid = await client.join(target.agoraAppId ?? AGORA_APP_ID, target.objectId, tokenValue, 0);
      lastJoinTokenRef.current = tokenValue;
      setStreamClientIdSafe(uid);
      setViewerStatus('waiting');

      if (client.remoteUsers?.length) {
        setRemoteUsers(client.remoteUsers);
        let primarySet = false;
        for (const user of client.remoteUsers) {
          if (user.hasVideo) {
            await client.subscribe(user, 'video');
            upsertRemoteUser(user);
            if (!primarySet) {
              primarySet = true;
              setPrimaryUid(user.uid);
              playPrimaryVideo(user);
            }
          }
          if (user.hasAudio) {
            await client.subscribe(user, 'audio');
            const track = user.audioTrack ?? null;
            if (track) {
              audioTracksRef.current.set(user.uid, track);
              audioTrackRef.current = track;
              if (!viewerMutedRef.current) {
                clearAudioRetry();
                playRemoteAudio(track);
                setViewerStatus('playing');
              }
            }
          }
        }
        if (!viewerMutedRef.current) {
          void syncRemoteAudio();
        }
      }
    } catch (error) {
      console.error('Live join failed', error);
      const message = String((error as { message?: string })?.message ?? '');
      const retryable = /token|key|NO_AUTHORIZED|DYNAMIC_KEY|privilege/i.test(message);
      if (retryable) {
        const updated = await loadBroadcasts('refresh');
        const fresh = updated.find((item) => item.objectId === target.objectId);
        const refreshedToken = fresh?.viewerToken ?? fresh?.broadcasterToken ?? fresh?.token;
        if (refreshedToken) {
          try {
            const client = await ensureClient();
            if (client.connectionState !== 'DISCONNECTED') {
              await client.leave();
            }
            await client.setClientRole('audience');
            const uid = await client.join(AGORA_APP_ID, fresh.objectId!, refreshedToken, 0);
            setStreamClientIdSafe(uid);
            setActiveBroadcast(fresh);
            setViewerStatus('waiting');
            return;
          } catch (retryError) {
            console.error('Live join retry failed', retryError);
          }
        }
      }
      setViewerStatus('error');
      setViewerError(t('live.errors.start_failed', { defaultValue: 'Yayın başlatılamadı.' }));
    }
  }, [clearAudioRetry, clearRemoteAudio, ensureClient, loadBroadcasts, playPrimaryVideo, playRemoteAudio, setPrimaryUid, setStreamClientIdSafe, setViewerMutedSafe, stopAutoLike, stopLocalTracks, syncRemoteAudio, t, upsertRemoteUser]);

  const handleCreateBroadcast = async () => {
    if (!joinMicOn && !joinCamOn) {
      setCreateError(t('live.create.need_device', { defaultValue: 'Yayın açmak için mikrofon veya kamera gerekli.' }));
      return;
    }
    const requestedMic = joinMicOn;
    const requestedCam = joinCamOn;
    setCreateError(null);
    setCreateFlow('creating');
    await ensurePreviewTracks({
      audio: joinMicOn,
      video: joinCamOn,
      target: 'preview',
    });
    if (!localAudioTrackRef.current && !localVideoTrackRef.current) {
      setCreateFlow('setup');
      setCreateError(t('live.viewer.no_media', { defaultValue: 'Kameraya veya mikrofona erişilemedi.' }));
      return;
    }

    const preferredProvider = getBroadcastProvider(activeBroadcast || liveItems[0] || null);
    let created = null as BroadcastItem | null;
    try {
      const response = await api.createBroadcasts({
        provider: preferredProvider,
        streamDescription: createDescription
      });
      created = normalizeBroadcast(response);
    } catch (error) {
      console.error('Create broadcast failed', error);
      setCreateFlow('setup');
      setCreateError(t('live.create.failed', { defaultValue: 'Yayın oluşturulamadı. Lütfen tekrar deneyin.' }));
      return;
    }

    if (!created?.objectId) {
      setCreateFlow('setup');
      setCreateError(t('live.create.failed', { defaultValue: 'Yayın oluşturulamadı. Lütfen tekrar deneyin.' }));
      return;
    }

    const prepared: BroadcastItem = {
      ...created,
      provider: created.provider ?? preferredProvider,
      viewerToken: created.viewerToken ?? created.broadcasterToken ?? created.token,
    };
    if (!prepared.viewerToken) {
      setCreateFlow('setup');
      setCreateError(t('live.create.missing_info', { defaultValue: 'Yayın bilgileri eksik.' }));
      return;
    }

    setCreateFlow('idle');
    setCreateDescription('');
    await openViewer(prepared, { skipJoin: true });
    setJoinMicOn(requestedMic);
    setJoinCamOn(requestedCam);
    const publish = await startPublishing({ mic: requestedMic, cam: requestedCam });
    if (!publish.ok && publish.reason) {
      setViewerError(publish.reason);
    }
  };

  const closeViewer = async () => {
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // ignore
      }
    }
    stopAutoLike();
    setIsViewerOpen(false);
    setViewerStatus('idle');
    setViewerError(null);
    setActiveBroadcast(null);
    setShowViewerControls(true);
    setJoinFlow('idle');
    setJoinError(null);
    setStreamClientIdSafe(null);
    setViewerMutedSafe(true);
    lastJoinTokenRef.current = null;
    await leaveStream();
  };

  const headerContent = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-black/5 text-black'}`}>
          <Video className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold">{t('live.title', { defaultValue: 'Live Now' })}</h2>
          <p className={`text-[12px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('live.subtitle', { defaultValue: 'Explore ongoing broadcasts' })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={openCreateSetup}
          disabled={createFlow !== 'idle' || isViewerOpen}
          className={`h-9 px-3 rounded-full text-xs font-semibold flex items-center gap-2 transition-all ${theme === 'dark'
              ? 'bg-white text-black hover:bg-white/90'
              : 'bg-black text-white hover:bg-black/90'
            } ${(createFlow !== 'idle' || isViewerOpen) ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <Plus className="w-4 h-4" />
          {isPremiumRequired
            ? t('premium.required_short', { defaultValue: 'Premium' })
            : t('live.create.cta', { defaultValue: 'Yayın aç' })}
        </button>
        <button
          onClick={refreshLive}
          disabled={isRefreshing}
          className={`h-9 px-3 rounded-full text-xs font-semibold flex items-center gap-2 transition-all ${theme === 'dark' ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-black/5 text-black hover:bg-black/10'} ${isRefreshing ? 'opacity-60' : ''}`}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('live.refresh', { defaultValue: 'Refresh' })}
        </button>
      </div>
    </div>
  );

  const primaryUid = primaryRemoteUid ?? primaryRemoteUidRef.current;
  const shouldBlur = !isAuthenticated || settings.blurPhotos;
  const broadcasterName =
    activeBroadcast?.userDetails?.displayName ||
    activeBroadcast?.userDetails?.firstName ||
    activeBroadcast?.userDetails?.networkUserId ||
    activeBroadcast?.userDetails?.memberId ||
    'Live';
  const viewerTitle =
    activeBroadcast?.streamDescription?.trim() ||
    t('live.default_title', { name: broadcasterName, defaultValue: `${broadcasterName} yayında` });
  const viewerCountry = activeBroadcast?.userDetails?.location?.country;
  const premiumGateCopy = premiumGateContext === 'create'
    ? {
      badge: t('premium.gate_badge', { defaultValue: 'Premium Access' }),
      title: t('premium.live_create_title', { defaultValue: 'Starting a live broadcast requires Premium' }),
      description: t('premium.live_create_description', {
        defaultValue: 'Upgrade to Premium to host live sessions and accept guest requests.',
      }),
      highlights: [
        t('premium.live_create_highlight_1', { defaultValue: 'Host your own broadcast' }),
        t('premium.live_create_highlight_2', { defaultValue: 'Accept guest join requests' }),
      ],
      cta: t('premium.upgrade_cta', { defaultValue: 'Upgrade to Premium' }),
      dismiss: t('premium.dismiss_cta', { defaultValue: 'Maybe later' }),
      footnote: t('premium.gate_note', {
        defaultValue: 'You can manage your plan anytime from account settings.',
      }),
    }
    : {
      badge: t('premium.gate_badge', { defaultValue: 'Premium Access' }),
      title: t('premium.live_join_title', { defaultValue: 'Joining live broadcasts requires Premium' }),
      description: t('premium.live_join_description', {
        defaultValue: 'Upgrade to Premium to request to join broadcasts and participate live.',
      }),
      highlights: [
        t('premium.live_join_highlight_1', { defaultValue: 'Request to join live rooms' }),
        t('premium.live_join_highlight_2', { defaultValue: 'Participate with mic and camera' }),
      ],
      cta: t('premium.upgrade_cta', { defaultValue: 'Upgrade to Premium' }),
      dismiss: t('premium.dismiss_cta', { defaultValue: 'Maybe later' }),
      footnote: t('premium.gate_note', {
        defaultValue: 'You can manage your plan anytime from account settings.',
      }),
    };
  const participantList = [...remoteUsers].sort((a, b) => {
    if (a.uid === primaryUid) return -1;
    if (b.uid === primaryUid) return 1;
    return String(a.uid).localeCompare(String(b.uid));
  });
  const overlayParticipants = participantList.filter((user) => user.uid !== primaryUid);
  const showLocalParticipantTile = viewerRole === 'host' && hasLocalVideo && Boolean(localVideoTrackRef.current);
  const participantTileCount = overlayParticipants.length + (showLocalParticipantTile ? 1 : 0);
  const totalVideoTiles = 1 + participantTileCount;
  const stageCols = totalVideoTiles <= 1 ? 1 : totalVideoTiles <= 4 ? 2 : totalVideoTiles <= 9 ? 3 : 4;
  const stageRows = Math.max(1, Math.ceil(totalVideoTiles / stageCols));
  const stageGridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${stageCols}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${stageRows}, minmax(0, 1fr))`,
  };

  const rootClassName = headerVariant === 'page'
    ? `skyline-page-scroll mx-auto w-full max-w-7xl px-1 pb-8 pt-24 md:px-2 md:pt-28 ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`
    : `px-4 py-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`;

  return (
    <div className={rootClassName}>
      {showHeader && (headerVariant === 'page' ? (
        <div
          className={`mb-4 rounded-[30px] border p-4 backdrop-blur-3xl ${theme === 'dark' ? 'cv-card-surface-soft border-white/10' : 'border-white/70 bg-white/75'} shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)]`}
        >
          {headerContent}
        </div>
      ) : (
        <div className="mb-4">{headerContent}</div>
      ))}

      {loadError && (
        <div className={`mb-4 text-xs ${theme === 'dark' ? 'text-rose-200' : 'text-rose-500'}`}>
          {loadError}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
          {[...Array(20)].map((_, idx) => (
            <div
              key={`live-skeleton-${idx}`}
              className={`relative w-full aspect-[9/16] rounded-2xl border overflow-hidden ${theme === 'dark' ? 'border-white/10 bg-white/[0.04]' : 'border-black/10 bg-gray-100'
                }`}
            >
              <div className={`absolute inset-0 ${theme === 'dark'
                  ? 'bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent'
                  : 'bg-gradient-to-b from-white/70 via-white/35 to-transparent'
                }`} />
              <motion.div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 ${theme === 'dark'
                    ? 'bg-gradient-to-r from-transparent via-white/20 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-white/80 to-transparent'
                  }`}
                animate={{ x: ['-130%', '260%'] }}
                transition={{
                  duration: 1.25,
                  ease: 'linear',
                  repeat: Infinity,
                  delay: idx * 0.03,
                }}
              />
              <div className="absolute top-3 left-3 h-5 w-16 rounded-full bg-black/20" />
              <div className="absolute top-3 right-3 h-5 w-9 rounded-full bg-black/20" />
              <div className="absolute bottom-3 left-3 h-6 w-[calc(100%-1.5rem)] rounded-full bg-black/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-14 w-14 rounded-full bg-black/15" />
              </div>
            </div>
          ))}
        </div>
      ) : liveItems.length === 0 ? (
        <div className="py-16 text-center">
          <Video className={`mx-auto mb-4 h-12 w-12 ${theme === 'dark' ? 'text-gray-700' : 'text-gray-300'}`} />
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            {t('live.empty_title', { defaultValue: 'No live streams found' })}
          </h3>
          <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('live.empty_subtitle', { defaultValue: 'Try refreshing or start your own live broadcast.' })}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
          <AnimatePresence>
            {liveRenderItems.map((row) => {
              if (row.kind === 'ad') {
                return (
                  <motion.div
                    key={row.id}
                    layout
                    className="col-span-full"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                  >
                    <FeatureAdCard theme={theme} placement="live" />
                  </motion.div>
                );
              }

              return (
                <BroadcastCard
                  key={row.id}
                  item={row.item}
                  index={row.index}
                  theme={theme}
                  t={t}
                  shouldBlur={shouldBlur}
                  onOpenViewer={openViewer}
                />
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
        {isLoading && liveState.cursor?.next && (
          <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
        )}
      </div>

      <AnimatePresence>
        {createFlow !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[85] flex items-center justify-center p-4 ${theme === 'dark' ? 'bg-black/45' : 'bg-black/20'
              }`}
          >
            <div className={`w-full max-w-xl rounded-3xl border p-6 shadow-2xl ${theme === 'dark' ? 'cv-card-surface-solid border-white/10 text-white' : 'border-white/70 bg-white text-slate-950'}`}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm font-semibold">
                    {t('live.create.title', { defaultValue: 'Canlı yayın oluştur' })}
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-white/70' : 'text-gray-500'}`}>
                    {t('live.create.subtitle', { defaultValue: 'Yayını başlatmadan önce kamera ve mikrofonunu ayarla.' })}
                  </p>
                </div>
                <button
                  onClick={cancelCreateSetup}
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${theme === 'dark'
                      ? 'bg-white/10 hover:bg-white/20'
                      : 'bg-black/5 hover:bg-black/10'
                    }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <label className={`text-[11px] flex flex-col gap-1 ${theme === 'dark' ? 'text-white/70' : 'text-gray-500'}`}>
                  {t('live.create.description_label', { defaultValue: 'Yayın açıklaması' })}
                  <input
                    value={createDescription}
                    onChange={(event) => setCreateDescription(event.target.value)}
                    placeholder={t('live.create.description_placeholder', { defaultValue: 'Yayının başlığı veya konusu' })}
                    className={`h-10 rounded-xl border px-3 text-xs focus:outline-none ${theme === 'dark'
                        ? 'bg-white/5 border-white/10 text-white focus:border-white/40'
                        : 'bg-black/5 border-black/10 text-gray-900 focus:border-black/40'
                      }`}
                  />
                </label>

                <div className={`relative aspect-video rounded-2xl overflow-hidden border ${theme === 'dark' ? 'border-white/10 bg-black/60' : 'border-black/10 bg-black/5'
                  }`}>
                  <div ref={previewVideoRef} className="absolute inset-0" />
                  {!joinCamOn && (
                    <div className={`absolute inset-0 flex items-center justify-center text-xs ${theme === 'dark' ? 'text-white/70' : 'text-gray-500'
                      }`}>
                      {t('live.viewer.camera_off', { defaultValue: 'Kamera kapalı' })}
                    </div>
                  )}
                  {joinCamOn && !hasLocalVideo && (
                    <div className={`absolute inset-0 flex items-center justify-center text-xs ${theme === 'dark' ? 'text-white/70' : 'text-gray-500'
                      }`}>
                      {t('live.viewer.preview', { defaultValue: 'Önizleme hazırlanıyor...' })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={toggleJoinCam}
                    className={`h-10 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all ${joinCamOn
                        ? theme === 'dark'
                          ? 'bg-white text-black'
                          : 'bg-black text-white'
                        : theme === 'dark'
                          ? 'bg-white/10 text-white/70'
                          : 'bg-black/5 text-gray-600'
                      }`}
                  >
                    {joinCamOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    {joinCamOn
                      ? t('live.viewer.camera_on', { defaultValue: 'Kamera açık' })
                      : t('live.viewer.camera_off', { defaultValue: 'Kamera kapalı' })}
                  </button>
                  <button
                    onClick={toggleJoinMic}
                    className={`h-10 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all ${joinMicOn
                        ? theme === 'dark'
                          ? 'bg-white text-black'
                          : 'bg-black text-white'
                        : theme === 'dark'
                          ? 'bg-white/10 text-white/70'
                          : 'bg-black/5 text-gray-600'
                      }`}
                  >
                    {joinMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    {joinMicOn
                      ? t('live.viewer.mic_on', { defaultValue: 'Mikrofon açık' })
                      : t('live.viewer.mic_off', { defaultValue: 'Mikrofon kapalı' })}
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={`text-[11px] flex flex-col gap-1 ${theme === 'dark' ? 'text-white/70' : 'text-gray-500'}`}>
                    {t('live.viewer.device_camera', { defaultValue: 'Kamera' })}
                    <select
                      value={selectedCamId}
                      onChange={handleCamChange}
                      disabled={!availableCams.length}
                      className={`h-9 rounded-xl border px-3 text-xs focus:outline-none disabled:opacity-40 ${theme === 'dark'
                          ? 'bg-white/5 border-white/10 text-white focus:border-white/40'
                          : 'bg-black/5 border-black/10 text-gray-900 focus:border-black/40'
                        }`}
                    >
                      {availableCams.length ? (
                        availableCams.map((cam, idx) => (
                          <option key={cam.deviceId} value={cam.deviceId}>
                            {cam.label || t('live.viewer.device_default', { index: idx + 1, defaultValue: `Camera ${idx + 1}` })}
                          </option>
                        ))
                      ) : (
                        <option value="">
                          {t('live.viewer.device_unavailable', { defaultValue: 'Kamera bulunamadı' })}
                        </option>
                      )}
                    </select>
                  </label>
                  <label className={`text-[11px] flex flex-col gap-1 ${theme === 'dark' ? 'text-white/70' : 'text-gray-500'}`}>
                    {t('live.viewer.device_microphone', { defaultValue: 'Mikrofon' })}
                    <select
                      value={selectedMicId}
                      onChange={handleMicChange}
                      disabled={!availableMics.length}
                      className={`h-9 rounded-xl border px-3 text-xs focus:outline-none disabled:opacity-40 ${theme === 'dark'
                          ? 'bg-white/5 border-white/10 text-white focus:border-white/40'
                          : 'bg-black/5 border-black/10 text-gray-900 focus:border-black/40'
                        }`}
                    >
                      {availableMics.length ? (
                        availableMics.map((mic, idx) => (
                          <option key={mic.deviceId} value={mic.deviceId}>
                            {mic.label || t('live.viewer.device_default', { index: idx + 1, defaultValue: `Device ${idx + 1}` })}
                          </option>
                        ))
                      ) : (
                        <option value="">
                          {t('live.viewer.device_unavailable', { defaultValue: 'Mikrofon bulunamadı' })}
                        </option>
                      )}
                    </select>
                  </label>
                </div>

                {createError && <p className="text-xs text-rose-300">{createError}</p>}

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={cancelCreateSetup}
                    className={`h-10 flex-1 rounded-full border text-xs font-semibold transition ${theme === 'dark'
                        ? 'border-white/15 text-white/80 hover:bg-white/10'
                        : 'border-black/10 text-gray-700 hover:bg-black/5'
                      }`}
                  >
                    {t('live.create.cancel', { defaultValue: 'Vazgeç' })}
                  </button>
                  <button
                    onClick={handleCreateBroadcast}
                    disabled={createFlow === 'creating'}
                    className={`h-10 flex-1 rounded-full text-xs font-semibold transition disabled:opacity-60 ${theme === 'dark'
                        ? 'bg-white text-black hover:bg-white/90'
                        : 'bg-black text-white hover:bg-black/90'
                      }`}
                  >
                    {createFlow === 'creating'
                      ? t('live.create.creating', { defaultValue: 'Yayın oluşturuluyor...' })
                      : t('live.create.create', { defaultValue: 'Yayını başlat' })}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isViewerOpen && activeBroadcast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] h-[100dvh] w-[100vw] overflow-hidden isolate bg-black"
          >
            <div ref={viewerContainerRef} className="relative w-full h-full overflow-hidden bg-black">
              <div className="relative flex h-full w-full overflow-hidden">
                <div className="relative w-full min-w-0">
                  <div
                    className="relative h-full w-full overflow-hidden bg-black"
                    onClick={() => setShowViewerControls((prev) => !prev)}
                  >
                    <div className="absolute inset-x-0 top-[74px] bottom-[84px] z-10 px-2 sm:px-3">
                      <div className="grid h-full w-full gap-2" style={stageGridStyle}>
                        <div className="relative w-full h-full min-h-0 overflow-hidden rounded-xl border border-white/10 bg-black">
                          <div ref={videoRef} className="absolute inset-0" />
                        </div>
                        {showLocalParticipantTile && (
                          <LocalParticipantTile
                            key="stage-local-participant"
                            videoTrack={localVideoTrackRef.current}
                            muted={!isCamEnabled}
                            label={t('live.viewer.you', { defaultValue: 'Sen' })}
                            variant="grid"
                          />
                        )}
                        {overlayParticipants.map((user) => (
                          <RemoteParticipantTile
                            key={`stage-grid-${user.uid}`}
                            user={user}
                            primaryUidRef={primaryRemoteUidRef}
                            nonce={participantNonce}
                            variant="grid"
                            showPulse={switchPulseUid === String(user.uid)}
                            onSelect={(selected) => {
                              triggerSwitchPulse(String(selected.uid));
                              handleSelectParticipant(selected);
                            }}
                            onClick={(event) => {
                              event.stopPropagation();
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {viewerStatus !== 'playing' && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center text-center text-sm text-gray-200 bg-black/80">
                        {viewerStatus === 'joining' && t('live.viewer.connecting', { defaultValue: 'Bağlanıyor...' })}
                        {viewerStatus === 'waiting' && t('live.viewer.starting', { defaultValue: 'Yayın başlatılıyor...' })}
                        {viewerStatus === 'error' && (viewerError ?? t('live.viewer.unavailable', { defaultValue: 'Yayın açılamadı.' }))}
                      </div>
                    )}

                    <div
                      className={`absolute inset-x-0 top-0 z-30 px-4 sm:px-6 pt-4 pb-5 flex items-start justify-between bg-gradient-to-b from-black/80 via-black/35 to-transparent pointer-events-none transition-opacity ${showViewerControls ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                      <div className="text-white pointer-events-none">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 text-white text-[10px] font-bold tracking-wide px-2 py-0.5 shadow">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                            LIVE
                          </span>
                          <span className="text-xs text-white/75">
                            {viewerRole === 'host'
                              ? t('live.viewer.you_are_live', { defaultValue: 'Sahnedesin' })
                              : t('live.viewer.you_are_viewing', { defaultValue: 'İzliyorsun' })}
                          </span>
                        </div>
                        <p className="mt-2 text-base sm:text-lg font-semibold leading-snug line-clamp-2">
                          {viewerTitle}
                        </p>
                        <p className="mt-1 text-xs text-white/70 flex flex-wrap items-center gap-2">
                          <span className="truncate max-w-[220px] sm:max-w-[300px]">@{broadcasterName}</span>
                          {viewerCountry && (
                            <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase">
                              {viewerCountry}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pointer-events-auto" onClick={(event) => event.stopPropagation()}>
                        <button
                          onClick={openJoinSetup}
                          disabled={viewerRole === 'host' || isPublishing || joinFlow === 'requesting' || joinFlow === 'waiting'}
                          className={`h-9 px-4 rounded-full text-xs font-semibold flex items-center gap-2 transition-all border ${viewerRole === 'host'
                              ? 'border-white/20 bg-white/10 text-white/70 cursor-default'
                              : theme === 'dark'
                                ? 'border-white/20 bg-white text-black hover:bg-white/90'
                                : 'border-black/80 bg-black text-white hover:bg-black/90'
                            } ${(viewerRole === 'host' || isPublishing || joinFlow === 'requesting' || joinFlow === 'waiting') ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          <UserPlus className="w-4 h-4" />
                          {isPremiumRequired && viewerRole !== 'host'
                            ? t('premium.required_short', { defaultValue: 'Premium' })
                            : isPublishing
                              ? t('live.viewer.connecting_short', { defaultValue: 'Bağlanıyor' })
                              : viewerRole === 'host'
                                ? t('live.viewer.you_are_live', { defaultValue: 'Sahnedesin' })
                                : joinFlow === 'waiting'
                                  ? t('live.viewer.join_request_waiting_short', { defaultValue: 'Onay bekleniyor' })
                                  : t('live.viewer.join_request_cta', { defaultValue: 'Katılma isteği' })}
                        </button>
                        <button
                          onClick={toggleFullscreen}
                          className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
                        >
                          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={closeViewer}
                          className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div
                      className={`absolute inset-x-0 bottom-4 z-30 flex justify-center pointer-events-none transition-opacity ${showViewerControls ? 'opacity-100' : 'opacity-0'
                        }`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {adsInLiveEnabled && joinFlow === 'idle' && (
                        <div
                          className={`absolute left-1/2 -translate-x-1/2 w-[min(92vw,400px)] pointer-events-none transition-opacity ${showViewerControls ? 'opacity-100' : 'opacity-0'
                            }`}
                          style={{ bottom: '72px' }}
                        >
                          <div className="pointer-events-auto origin-bottom scale-[0.92]">
                            <FeatureAdCard theme={theme} placement="live" />
                          </div>
                        </div>
                      )}
                      <div
                        className="pointer-events-auto flex items-center gap-2 rounded-full px-3 py-2 border backdrop-blur bg-black/60 border-white/15 text-white"
                      >
                        <button
                          onClick={toggleViewerMute}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isViewerMuted
                              ? 'bg-red-500/85 text-white'
                              : 'bg-white/10 text-white'
                            } hover:scale-105`}
                          title={isViewerMuted ? 'Mute' : 'Unmute'}
                        >
                          {isViewerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => (autoLikeEnabled ? stopAutoLike() : startAutoLike())}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${autoLikeEnabled
                              ? 'bg-rose-500 text-white'
                              : 'bg-white/10 text-white'
                            } hover:scale-105`}
                          title={autoLikeEnabled
                            ? t('live.viewer.auto_like_off', { defaultValue: 'Auto-like durdur' })
                            : t('live.viewer.auto_like_on', { defaultValue: 'Auto-like başlat' })}
                        >
                          <Heart className={`w-4 h-4 ${autoLikeEnabled ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={toggleViewerFit}
                          className="h-10 px-3 rounded-full text-[11px] font-semibold transition-all bg-white/10 text-white hover:bg-white/20"
                          title={viewerFit === 'cover'
                            ? t('live.viewer.fit_contain', { defaultValue: 'Fit' })
                            : t('live.viewer.fit_cover', { defaultValue: 'Fill' })}
                        >
                          {viewerFit === 'cover'
                            ? t('live.viewer.fit_cover', { defaultValue: 'Fill' })
                            : t('live.viewer.fit_contain', { defaultValue: 'Fit' })}
                        </button>

                        {viewerRole === 'audience' && (
                          <button
                            onClick={openJoinSetup}
                            disabled={isPublishing || joinFlow === 'requesting' || joinFlow === 'waiting'}
                            className={`h-10 px-4 rounded-full text-xs font-semibold flex items-center gap-2 transition-all border ${'border-white/20 bg-white text-black hover:bg-white/90'
                              } ${(isPublishing || joinFlow === 'requesting' || joinFlow === 'waiting') ? 'opacity-70 cursor-not-allowed' : ''}`}
                            title={t('live.viewer.join_request_cta', { defaultValue: 'Katılma isteği' })}
                          >
                            <UserPlus className="w-4 h-4" />
                            {isPremiumRequired
                              ? t('premium.required_short', { defaultValue: 'Premium' })
                              : isPublishing
                                ? t('live.viewer.connecting_short', { defaultValue: 'Bağlanıyor' })
                                : joinFlow === 'waiting'
                                  ? t('live.viewer.join_request_waiting_short', { defaultValue: 'Onay bekleniyor' })
                                  : t('live.viewer.join_request_cta', { defaultValue: 'Katılma isteği' })}
                          </button>
                        )}

                        {viewerRole === 'host' && (
                          <>
                            <button
                              onClick={toggleMic}
                              disabled={!hasLocalAudio}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isMicEnabled
                                  ? 'bg-white/10 text-white'
                                  : 'bg-red-500/85 text-white'
                                } ${hasLocalAudio ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'}`}
                            >
                              {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={toggleCam}
                              disabled={!hasLocalVideo}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCamEnabled
                                  ? 'bg-white/10 text-white'
                                  : 'bg-red-500/85 text-white'
                                } ${hasLocalVideo ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'}`}
                            >
                              {isCamEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                            </button>
                          </>
                        )}

                        <button
                          onClick={closeViewer}
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white/10 text-white hover:bg-white/20"
                          title={t('live.viewer.exit', { defaultValue: 'Yayından çık' })}
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {joinFlow !== 'idle' && viewerRole === 'audience' && (
                  <div
                    className={`absolute inset-0 z-30 flex items-center justify-center px-6 py-10 backdrop-blur-sm ${theme === 'dark' ? 'bg-black/45' : 'bg-black/25'
                      }`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className={`w-full max-w-xl rounded-3xl border p-6 shadow-2xl ${theme === 'dark' ? 'cv-card-surface-solid border-white/10 text-white' : 'border-white/70 bg-white text-slate-950'}`}>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <p className="text-sm font-semibold">
                            {t('live.viewer.join_request_title', { defaultValue: 'Katılma isteği' })}
                          </p>
                          <p className="text-xs text-white/70">
                            {t('live.viewer.join_request_subtitle', { defaultValue: 'Katılmadan önce kamera ve mikrofonunu ayarla.' })}
                          </p>
                        </div>
                        <button
                          onClick={cancelJoinRequest}
                          className={`w-9 h-9 rounded-full flex items-center justify-center ${theme === 'dark'
                              ? 'bg-white/10 hover:bg-white/20'
                              : 'bg-black/5 hover:bg-black/10'
                            }`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {joinFlow === 'setup' ? (
                        <div className="space-y-4">
                          <div className={`relative aspect-video rounded-2xl overflow-hidden border ${theme === 'dark' ? 'border-white/10 bg-black/60' : 'border-black/10 bg-black/5'
                            }`}>
                            <div ref={previewVideoRef} className="absolute inset-0" />
                            {!joinCamOn && (
                              <div className="absolute inset-0 flex items-center justify-center text-xs text-white/70">
                                {t('live.viewer.camera_off', { defaultValue: 'Kamera kapalı' })}
                              </div>
                            )}
                            {joinCamOn && !hasLocalVideo && (
                              <div className="absolute inset-0 flex items-center justify-center text-xs text-white/70">
                                {t('live.viewer.preview', { defaultValue: 'Önizleme hazırlanıyor...' })}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={toggleJoinCam}
                              className={`h-10 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all ${joinCamOn ? 'bg-white text-black' : 'bg-white/10 text-white/70'
                                }`}
                            >
                              {joinCamOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                              {joinCamOn
                                ? t('live.viewer.camera_on', { defaultValue: 'Kamera açık' })
                                : t('live.viewer.camera_off', { defaultValue: 'Kamera kapalı' })}
                            </button>
                            <button
                              onClick={toggleJoinMic}
                              className={`h-10 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all ${joinMicOn ? 'bg-white text-black' : 'bg-white/10 text-white/70'
                                }`}
                            >
                              {joinMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                              {joinMicOn
                                ? t('live.viewer.mic_on', { defaultValue: 'Mikrofon açık' })
                                : t('live.viewer.mic_off', { defaultValue: 'Mikrofon kapalı' })}
                            </button>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="text-[11px] flex flex-col gap-1 text-white/70">
                              {t('live.viewer.device_camera', { defaultValue: 'Kamera' })}
                              <select
                                value={selectedCamId}
                                onChange={handleCamChange}
                                disabled={!availableCams.length}
                                className="h-9 rounded-xl border px-3 text-xs focus:outline-none disabled:opacity-40 bg-white/5 border-white/10 text-white focus:border-white/40"
                              >
                                {availableCams.length ? (
                                  availableCams.map((cam, idx) => (
                                    <option key={cam.deviceId} value={cam.deviceId}>
                                      {cam.label || t('live.viewer.device_default', { index: idx + 1, defaultValue: `Camera ${idx + 1}` })}
                                    </option>
                                  ))
                                ) : (
                                  <option value="">
                                    {t('live.viewer.device_unavailable', { defaultValue: 'Kamera bulunamadı' })}
                                  </option>
                                )}
                              </select>
                            </label>
                            <label className="text-[11px] flex flex-col gap-1 text-white/70">
                              {t('live.viewer.device_microphone', { defaultValue: 'Mikrofon' })}
                              <select
                                value={selectedMicId}
                                onChange={handleMicChange}
                                disabled={!availableMics.length}
                                className="h-9 rounded-xl border px-3 text-xs focus:outline-none disabled:opacity-40 bg-white/5 border-white/10 text-white focus:border-white/40"
                              >
                                {availableMics.length ? (
                                  availableMics.map((mic, idx) => (
                                    <option key={mic.deviceId} value={mic.deviceId}>
                                      {mic.label || t('live.viewer.device_default', { index: idx + 1, defaultValue: `Device ${idx + 1}` })}
                                    </option>
                                  ))
                                ) : (
                                  <option value="">
                                    {t('live.viewer.device_unavailable', { defaultValue: 'Mikrofon bulunamadı' })}
                                  </option>
                                )}
                              </select>
                            </label>
                          </div>

                          {joinError && <p className="text-xs text-rose-300">{joinError}</p>}

                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={cancelJoinRequest}
                              className="h-10 flex-1 rounded-full border text-xs font-semibold transition border-white/15 text-white/80 hover:bg-white/10"
                            >
                              {t('live.viewer.join_request_cancel', { defaultValue: 'Vazgeç' })}
                            </button>
                            <button
                              onClick={sendJoinRequest}
                              className="h-10 flex-1 rounded-full text-xs font-semibold transition bg-white text-black hover:bg-white/90"
                            >
                              {t('live.viewer.join_request_send', { defaultValue: 'İstek gönder' })}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm">
                            <RefreshCw className={`w-4 h-4 ${joinFlow === 'requesting' ? 'animate-spin' : ''}`} />
                            {joinFlow === 'requesting'
                              ? t('live.viewer.join_request_sending', { defaultValue: 'İstek gönderiliyor...' })
                              : t('live.viewer.join_request_waiting', { defaultValue: 'Onay bekleniyor' })}
                          </div>
                          <p className="text-xs text-white/70">
                            {t('live.viewer.join_request_hint', { defaultValue: 'Yayıncı onay verince otomatik olarak bağlanacaksın.' })}
                          </p>
                          {joinError && <p className="text-xs text-rose-300">{joinError}</p>}
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={cancelJoinRequest}
                              className="h-10 flex-1 rounded-full border text-xs font-semibold transition border-white/15 text-white/80 hover:bg-white/10"
                            >
                              {t('live.viewer.join_request_cancel', { defaultValue: 'Vazgeç' })}
                            </button>
                            <button
                              onClick={checkJoinApproval}
                              disabled={isPublishing}
                              className="h-10 flex-1 rounded-full text-xs font-semibold transition disabled:opacity-60 bg-white text-black hover:bg-white/90"
                            >
                              {t('live.viewer.join_request_check', { defaultValue: 'Onayı kontrol et' })}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PremiumGateModal
        open={premiumGateContext !== null}
        theme={theme}
        copy={premiumGateCopy}
        onClose={closePremiumGate}
        onUpgrade={handleUpgradePremium}
      />

    </div>
  );
};

export default LiveTab;

function RemoteParticipantTile({
  user,
  onSelect,
  onClick,
  primaryUidRef,
  nonce,
  variant = 'strip',
  showPulse = false,
}: {
  user: IAgoraRTCRemoteUser;
  onSelect?: (user: IAgoraRTCRemoteUser) => void;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  primaryUidRef?: React.MutableRefObject<string | number | null>;
  nonce?: number;
  variant?: 'strip' | 'grid' | 'overlay' | 'panel';
  showPulse?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !user.videoTrack) return;
    let cancelled = false;
    let attempts = 0;
    const play = () => {
      if (cancelled) return;
      const { offsetWidth, offsetHeight } = container;
      if ((offsetWidth === 0 || offsetHeight === 0) && attempts < 12) {
        attempts += 1;
        requestAnimationFrame(play);
        return;
      }
      container.innerHTML = '';
      user.videoTrack?.play(container, { fit: variant === 'strip' ? 'cover' : 'contain' });
    };
    play();
    return () => {
      cancelled = true;
      if (primaryUidRef?.current === user.uid) return;
      user.videoTrack?.stop();
    };
  }, [nonce, primaryUidRef, user.uid, user.videoTrack, variant]);

  const label = user?.uid ? `#${String(user.uid)}` : 'Participant';

  const sizeClasses =
    variant === 'panel'
      ? 'w-full h-full'
      : variant === 'overlay'
        ? 'w-full h-[128px] sm:h-[136px] shrink-0'
        : variant === 'grid'
          ? 'w-full h-full min-h-0'
          : 'shrink-0 snap-start min-w-[180px] sm:min-w-[220px] md:min-w-[260px] aspect-video';
  const shapeClasses = variant === 'overlay' ? 'rounded-xl' : 'rounded-2xl';

  return (
    <div
      role="button"
      aria-label={label}
      onClick={(event) => {
        onClick?.(event);
        onSelect?.(user);
      }}
      className={`relative ${sizeClasses} ${shapeClasses} overflow-hidden bg-black/45 text-left transition-transform ${onSelect ? 'cursor-pointer hover:scale-[1.01]' : 'cursor-default'}`}
    >
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      {!user.videoTrack && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-white/70">
          No video
        </div>
      )}
      <AnimatePresence>
        {showPulse && (
          <motion.div
            key="switch-pulse"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: [0.9, 1.06, 1] }}
              transition={{ duration: 0.35 }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl shadow-[0_12px_30px_rgba(0,0,0,0.45)] ring-1 ring-white/30"
            >
              <Play className="h-6 w-6 text-white" fill="currentColor" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute bottom-1.5 left-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] text-white/90">
        {label}
      </div>
    </div>
  );
}

function LocalParticipantTile({
  videoTrack,
  muted,
  label,
  variant = 'overlay',
}: {
  videoTrack: ICameraVideoTrack | null;
  muted: boolean;
  label: string;
  variant?: 'overlay' | 'panel' | 'grid';
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !videoTrack) return;
    let cancelled = false;
    let attempts = 0;
    const play = () => {
      if (cancelled) return;
      const { offsetWidth, offsetHeight } = container;
      if ((offsetWidth === 0 || offsetHeight === 0) && attempts < 12) {
        attempts += 1;
        requestAnimationFrame(play);
        return;
      }
      container.innerHTML = '';
      videoTrack.play(container, { fit: 'contain' });
    };
    play();
    return () => {
      cancelled = true;
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [videoTrack]);

  const sizeClasses =
    variant === 'panel'
      ? 'w-full h-full'
      : variant === 'grid'
        ? 'w-full h-full min-h-0'
        : 'w-full h-[128px] sm:h-[136px] shrink-0';

  return (
    <div className={`relative ${sizeClasses} overflow-hidden rounded-xl bg-black/45`}>
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      {(!videoTrack || muted) && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-white/70">
          Camera off
        </div>
      )}
      <div className="absolute bottom-1.5 left-1.5 rounded-md bg-emerald-500/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
        {label}
      </div>
    </div>
  );
}
