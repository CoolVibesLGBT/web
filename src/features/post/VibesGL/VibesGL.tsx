import AnimatedEmptyState from '@/components/ui/AnimatedEmptyState';
import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo
} from "react";
import { useAtom } from "jotai";
import { useTranslation } from 'react-i18next';
import { getTimelinePosts, getTimelineCursor, hasUsableTimelineCursor, withTimeout, type TimelineResponse } from '@/features/post/timelineUtils';
import { vibesStateAtom } from '@/state/vibes';
import { VibeItem } from "./VibeItem";
import { api } from "../../../services/api";
import { getSafeImageURL, getSafeImageURLEx } from "../../../helpers/helpers";
import { defaultServiceServerId, serviceURL } from "../../../appSettings";
import { useWebGLCoverflow } from "../../../hooks/useWebGLCoverflow";
import { Volume2, VolumeX, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const VibesGL: React.FC = () => {
    const { t } = useTranslation('common');
    const initialLoadStarted = useRef(false);
    const [feedState, setFeedState] = useAtom(vibesStateAtom);

    const [activeIndex, setActiveIndex] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const isLoading = feedState.isLoading;
    const hasMore = feedState.hasMore;

    const vibes = useMemo(() => feedState.items ?? [], [feedState.items]);
    const [isMuted, setIsMuted] = useState(false);

    // Refs for safe fetching
    const cursorRef = useRef(feedState.cursor);
    const hasMoreRef = useRef(feedState.hasMore);
    const isFetchingRef = useRef(false);

    useEffect(() => {
        cursorRef.current = feedState.cursor;
    }, [feedState.cursor]);

    useEffect(() => {
        hasMoreRef.current = hasMore;
    }, [hasMore]);

    // FETCH FUNCTION
    const fetchVibesFromAPI = useCallback(
        async (loadMore = false) => {
            if (isFetchingRef.current) return;
            if (loadMore && !hasMoreRef.current) return;

            try {
                isFetchingRef.current = true;
                if (!loadMore) {
                    setFeedState(prev => ({ ...prev, isLoading: true, error: null }));
                } else {
                    setFeedState(prev => ({ ...prev, isLoadingMore: true, error: null }));
                }

                const currentCursor = loadMore ? (cursorRef.current?.toString?.() || "") : "";

                const response = await withTimeout(api.fetchVibes({
                    limit: 15, // Increased limit for smoother experience
                    cursor: currentCursor
                }) as Promise<TimelineResponse>, 12000);

                const posts = getTimelinePosts(response);
                const incomingVibes = posts
                    .filter((post: any) => post.attachments?.some((attachment: any) => attachment?.file))
                    .map((post: any) => {
                        const attachment = post.attachments.find((attachment: any) => attachment?.file);
                        const file = attachment.file;
                        const author = post.author || {};

                        const mimeType = file?.mime_type || "";
                        const isVideo = mimeType.startsWith("video/");

                        let mediaUrl = "";
                        let posterUrl = "";

                        if (isVideo) {
                            mediaUrl =
                                getSafeImageURL(attachment, "high") ||
                                getSafeImageURL(attachment, "medium") ||
                                getSafeImageURL(attachment, "low") ||
                                getSafeImageURL(attachment, "preview") ||
                                getSafeImageURL(attachment, "original") ||
                                "";

                            if (!mediaUrl && file?.storage_path) {
                                const serviceURI = serviceURL[defaultServiceServerId];
                                const path = file.storage_path.replace(/^\.\//, "");
                                mediaUrl = `${serviceURI}/${path}`;
                            }

                            posterUrl = getSafeImageURL(attachment, "poster") || "";
                        } else {
                            mediaUrl =
                                getSafeImageURL(attachment, "large") ||
                                getSafeImageURL(attachment, "medium") ||
                                getSafeImageURL(attachment, "small") ||
                                getSafeImageURL(attachment, "original") ||
                                "";
                        }

                        const avatar = getSafeImageURLEx(author.public_id, author.avatar, "small");

                        return {
                            id: String(post.public_id ?? post.id),
                            mediaUrl,
                            mediaType: isVideo ? "video" as const : "image" as const,
                            posterUrl: isVideo ? posterUrl : undefined,
                            username: author.username || "Unknown",
                            date_of_birth: author.date_of_birth,
                            avatar: avatar || undefined,
                            description: file?.name || "Vibe",
                            author: author
                        };
                    }).filter((vibe: any) => vibe.mediaUrl);

                const nextCursor = getTimelineCursor(response);
                const hasMorePosts = hasUsableTimelineCursor(nextCursor) && String(nextCursor) !== currentCursor;

                setFeedState(prev => {
                    if (!loadMore) {
                        return {
                            ...prev,
                            items: incomingVibes,
                            cursor: nextCursor ?? null,
                            hasMore: hasMorePosts,
                            isLoading: false,
                            isLoadingMore: false
                        };
                    }

                    const existingIds = new Set(prev.items.map((v: any) => v.id));
                    const filtered = incomingVibes.filter((v: any) => !existingIds.has(v.id));

                    return {
                        ...prev,
                        items: [...prev.items, ...filtered],
                        cursor: nextCursor ?? null,
                        hasMore: hasMorePosts,
                        isLoadingMore: false
                    };
                });

                cursorRef.current = nextCursor ?? null;
                hasMoreRef.current = hasMorePosts;
                
            } catch (err) {
                console.error("fetchVibes error:", err);
                setFeedState(prev => ({
                    ...prev,
                    error: 'vibes_error',
                    isLoading: false,
                    isLoadingMore: false
                }));
            } finally {
                isFetchingRef.current = false;
            }
        },
        [setFeedState]
    );

    // An empty response is a completed request, not a reason to fetch again.
    useEffect(() => {
        if (initialLoadStarted.current) return;
        initialLoadStarted.current = true;
        if (feedState.items.length === 0) {
            void fetchVibesFromAPI(false);
        } else if (feedState.isLoading) {
            setFeedState(prev => ({ ...prev, isLoading: false }));
        }
    }, [fetchVibesFromAPI, feedState.items.length, feedState.isLoading, setFeedState]);

    // Infinite Scroll
    useEffect(() => {
        // Trigger load more when we reach the last 5 items
        if (vibes.length > 0 && hasMoreRef.current && activeIndex >= vibes.length - 5) {
            fetchVibesFromAPI(true);
        }
    }, [activeIndex, vibes.length, fetchVibesFromAPI]);

    const [mediaState, setMediaState] = useState({ loading: false, failed: false });
    const handleMediaState = useCallback((loading: boolean, failed = false) => {
        setMediaState(previous => previous.loading === loading && previous.failed === failed ? previous : { loading, failed });
    }, []);

    useWebGLCoverflow({
        canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>,
        vibes,
        onActiveIndexChange: setActiveIndex,
        isMuted: isMuted,
        onActiveMediaLoadingChange: handleMediaState
    });

    const currentVibe = useMemo(() => vibes[activeIndex], [vibes, activeIndex]);

    return (
        <div
            className="relative w-full h-full overflow-hidden bg-black"
            style={{ cursor: "grab" }}
        >
            <AnimatePresence>
                {(isLoading || (vibes.length > 0 && mediaState.loading)) && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        role="status" className="absolute inset-0 z-50 flex items-center justify-center text-white bg-black/60 backdrop-blur-md pointer-events-none"
                    >
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <Loader2 className="w-12 h-12 text-white/20 animate-spin" />
                                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-white animate-pulse" />
                            </div>
                            <p className="mt-6 text-[0.882rem] font-bold tracking-widest normal-case opacity-80">{t('discovery.loading_vibes')}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isLoading && (vibes.length === 0 || mediaState.failed) && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center text-white bg-black">
                    <AnimatedEmptyState inverse title={t(feedState.error ? 'discovery.vibes_error' : mediaState.failed && vibes.length > 0 ? 'discovery.media_error' : 'discovery.empty_vibes')} description={!feedState.error && vibes.length === 0 ? t('discovery.empty_vibes_description') : undefined}>
                      {(feedState.error || (mediaState.failed && vibes.length > 0)) && <button type="button" className="min-h-11 rounded-xl bg-white/10 px-5 py-3 text-white" onClick={() => { handleMediaState(false); void fetchVibesFromAPI(false); }}>{t('emoticons.retry')}</button>}
                    </AnimatedEmptyState>
                </div>
            )}

            <div className="absolute top-6 right-6 z-20 flex gap-3">
                <button
                    onClick={() => setIsMuted(m => !m)}
                    className="p-3 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-xl border border-white/10 transition-all active:scale-90"
                    aria-label={t(isMuted ? 'chat_actions.unmute' : 'chat_actions.mute')}
                >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
            </div>

            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />
            {currentVibe && <VibeItem key={currentVibe.id} vibe={currentVibe} />}
        </div >
    );
};

export default VibesGL;
