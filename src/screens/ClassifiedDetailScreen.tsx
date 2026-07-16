import { useState, useEffect, useCallback } from 'react';
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
    const detailCardClassName = 'skyline-feed-card elite-card-static overflow-hidden';
    const panelClassName = dark
        ? 'cv-card-surface-soft border-white/10 text-zinc-300'
        : 'border-white/70 bg-white/75 text-slate-600';

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
                    <div className={detailCardClassName}>
                        <PostSkeleton theme={dark ? 'dark' : 'light'} />
                    </div>
                ) : error ? (
                    <div className={`rounded-[30px] border p-10 text-center backdrop-blur-3xl ${panelClassName}`}>
                        <p className="text-sm font-black text-red-500">{error}</p>
                    </div>
                ) : post ? (
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
                ) : (
                    <div className={`rounded-[30px] border p-10 text-center backdrop-blur-3xl ${panelClassName}`}>
                        <p className="text-sm font-black">
                            {t('classifieds.no_results')}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
