import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo
} from "react";
import { useAtom } from "jotai";
import { vibesStateAtom } from '@/state/vibes';
import { VibeItem } from "./VibeItem";
import { api } from "../../../services/api";
import { getSafeImageURL, getSafeImageURLEx } from "../../../helpers/helpers";
import { defaultServiceServerId, serviceURL } from "../../../appSettings";
import { useWebGLCoverflow } from "../../../hooks/useWebGLCoverflow";
import { Volume2, VolumeX, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const VibesGL: React.FC = () => {
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

                const response = await api.fetchVibes({
                    limit: 15, // Increased limit for smoother experience
                    cursor: currentCursor
                });

                const posts = response.posts || [];
                const incomingVibes = posts
                    .filter((post: any) => post.attachments?.length > 0)
                    .map((post: any) => {
                        const attachment = post.attachments[0];
                        const file = attachment.file;
                        const author = post.author;

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
                            id: post.public_id,
                            mediaUrl,
                            mediaType: isVideo ? "video" : "image",
                            posterUrl: isVideo ? posterUrl : undefined,
                            username: author.username || "Unknown",
                            date_of_birth: author.date_of_birth,
                            avatar,
                            description: file?.name || "Vibe",
                            author: author
                        };
                    });

                const cursorVal = response?.cursor != null ? String(response.cursor) : '';
                const hasMorePosts = cursorVal !== '' && cursorVal !== '0' && cursorVal !== 'null' && cursorVal !== 'undefined';

                setFeedState(prev => {
                    if (!loadMore) {
                        return {
                            ...prev,
                            items: incomingVibes,
                            cursor: response?.cursor ?? null,
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
                        cursor: response?.cursor ?? prev.cursor,
                        hasMore: hasMorePosts,
                        isLoadingMore: false
                    };
                });

                cursorRef.current = response?.cursor ?? null;
                hasMoreRef.current = hasMorePosts;
                
            } catch (err) {
                console.error("fetchVibes error:", err);
                setFeedState(prev => ({
                    ...prev,
                    error: 'Failed to load vibes',
                    isLoading: false,
                    isLoadingMore: false
                }));
            } finally {
                isFetchingRef.current = false;
            }
        },
        [setFeedState]
    );

    // Initial Load
    useEffect(() => {
        if (!feedState.items || feedState.items.length === 0) {
            fetchVibesFromAPI(false);
        } else {
            setFeedState(prev => ({ ...prev, isLoading: false }));
        }
    }, [fetchVibesFromAPI, feedState.items, setFeedState]);

    // Infinite Scroll
    useEffect(() => {
        // Trigger load more when we reach the last 5 items
        if (vibes.length > 0 && hasMoreRef.current && activeIndex >= vibes.length - 5) {
            fetchVibesFromAPI(true);
        }
    }, [activeIndex, vibes.length, fetchVibesFromAPI]);

    const [isMediaLoading, setIsMediaLoading] = useState(false);

    useWebGLCoverflow({
        canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>,
        vibes,
        onActiveIndexChange: setActiveIndex,
        isMuted: isMuted,
        onActiveMediaLoadingChange: setIsMediaLoading
    });

    const currentVibe = useMemo(() => vibes[activeIndex], [vibes, activeIndex]);

    return (
        <div
            className="relative w-full h-full overflow-hidden bg-black"
            style={{ cursor: "grab" }}
        >
            <AnimatePresence>
                {(isLoading || isMediaLoading) && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center text-white bg-black/60 backdrop-blur-md pointer-events-none"
                    >
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <Loader2 className="w-12 h-12 text-white/20 animate-spin" />
                                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-white animate-pulse" />
                            </div>
                            <p className="mt-6 text-[15px] font-bold tracking-widest uppercase opacity-80">Loading Vibes</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isLoading && vibes.length === 0 && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center text-white bg-black">
                    <div className="w-20 h-20 bg-gray-900/50 rounded-[32px] flex items-center justify-center mb-6">
                        <Sparkles className="w-10 h-10 text-gray-700" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">No Vibes Found</h2>
                    <p className="text-gray-500 mt-2 text-[14px]">Check back later for new discoveries.</p>
                </div>
            )}

            <div className="absolute top-6 right-6 z-20 flex gap-3">
                <button
                    onClick={() => setIsMuted(m => !m)}
                    className="p-3 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-xl border border-white/10 transition-all active:scale-90"
                    aria-label={isMuted ? "Unmute" : "Mute"}
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
