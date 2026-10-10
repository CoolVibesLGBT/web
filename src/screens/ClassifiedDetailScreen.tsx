import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate, useLocation } from '@/router';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import Post from '../features/post/Post';
import { PostSkeleton } from '../features/post/Flows';

export default function ClassifiedDetailScreen() {
    const { theme } = useTheme();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation('common');
    const dark = theme === 'dark';
    const [post, setPost] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const pageClassName = 'skyline-page-scroll w-full';
    const contentClassName = 'mx-auto w-full max-w-[760px] px-1 pb-8 pt-24 md:px-2 md:pt-28';
    // PostDetails ekranıyla (`/status/:id`) birebir aynı — `skyline-feed-card`
    // kaldırıldı: o class feed bağlamında kartın kendi arkaplanını bilerek
    // `transparent !important` yapıyor, tek başına kullanılınca içerik
    // hiçbir kart/arkaplan olmadan çıplak metin olarak görünüyordu.
    const detailCardClassName = 'cv-item overflow-hidden';
    const panelClassName = dark
        ? 'cv-card-surface-soft border-white/10 text-zinc-300'
        : 'border-white/70 bg-white/75 text-slate-600';
    // PostDetails'teki (`backHeader`) ile birebir aynı geri butonu.
    const backHeader = (
        <div className="mb-3 flex items-center gap-3 px-1 md:px-2">
            <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label={t('app.back', { defaultValue: 'Back' })}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-white transition-all hover:bg-[var(--color-brand-hovered)]"
            >
                <ArrowLeft className="h-4 w-4" />
            </button>
        </div>
    );

    const fetchDetail = useCallback(async () => {
        if (!id) return;
        try {
            setIsLoading(true);
            setError(null);
            const response = await api.fetchClassified(String(id));
            const resolved = (response as any)?.post
                ?? (response as any)?.item
                ?? (response as any)?.data
                ?? (response as any)?.result
                ?? response;
            if (Array.isArray(resolved)) {
                setPost(resolved[0] ?? null);
            } else {
                setPost(resolved ?? null);
            }
        } catch (err) {
            console.error('Error fetching classified:', err);
            setError(t('classifieds.fetch_error', { defaultValue: 'İlan yüklenemedi. Lütfen tekrar deneyin.' }));
        } finally {
            setIsLoading(false);
        }
    }, [id, t]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    const handleProfileClick = useCallback((username: string) => {
        const returnTo = `${location.pathname}${location.search}`;
        navigate(`/${username}`, { state: { returnTo } });
    }, [navigate, location.pathname, location.search]);

    const handlePostClick = useCallback((postId: string, _username?: string) => {
        navigate(`/classifieds/${postId}`);
    }, [navigate]);

    return (
        <div className={pageClassName}>
            <main className={contentClassName}>
                {isLoading ? (
                    <>
                        {backHeader}
                        <div className={detailCardClassName}>
                            <PostSkeleton theme={dark ? 'dark' : 'light'} />
                        </div>
                    </>
                ) : error ? (
                    <>
                        {backHeader}
                        <div className={`rounded-[30px] border p-10 text-center backdrop-blur-3xl ${panelClassName}`}>
                            <p className="text-sm font-black text-red-500">{error}</p>
                        </div>
                    </>
                ) : post ? (
                    <>
                        {backHeader}
                        <div className={detailCardClassName}>
                            <Post
                                post={post}
                                onProfileClick={handleProfileClick}
                                onPostClick={handlePostClick}
                                disablePostClick
                                showChildren
                                loadChildren
                            />
                        </div>
                    </>
                ) : (
                    <>
                        {backHeader}
                        <div className={`rounded-[30px] border p-10 text-center backdrop-blur-3xl ${panelClassName}`}>
                            <p className="text-sm font-black">
                                {t('classifieds.no_results')}
                            </p>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
