import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from '@/router';
import { useTheme } from '../contexts/ThemeContext';
import Post, { type PostProps, type ApiPost } from '../features/post/Post';
import { api } from '../services/api';
import { PostSkeleton } from '../features/post/Flows';
import { useSEO } from '../hooks/useSEO';
import { useTranslation } from 'react-i18next';
import { SITE_URL } from '@/seo/seoConfig';
import { htmlToPlainText, serializeJsonLd } from '../helpers/helpers';

type PostDetailsProps = Omit<PostProps, 'post' | 'defaultShowReply' | 'loadChildren'>;
type PostFetchResponse = ApiPost | { post?: ApiPost; data?: { post?: ApiPost } };

const replyMasonryItemStyle: React.CSSProperties = {
  contentVisibility: 'auto',
  contain: 'layout paint style',
  containIntrinsicSize: '1px 520px',
};

const PostDetails: React.FC<PostDetailsProps> = ({ showChildren = true, ...restProps }) => {
  const { t } = useTranslation('common');
  const { postId, username } = useParams<{ postId: string; username?: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [post, setPost] = useState<ApiPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);
  const isMountedRef = useRef(true);
  const redirectTimeoutRef = useRef<number | null>(null);
  const isDeletedMarker = useCallback((value: unknown) => {
    if (!value) return false;
    if (typeof value === 'string' && value.startsWith('0001-01-01')) return false;
    return true;
  }, []);
  const isProcessingAttachment = useCallback((attachment?: { processing_status?: string | null }) => {
    return attachment?.processing_status === 'pending' || attachment?.processing_status === 'processing';
  }, []);
  const resolveFetchedPost = useCallback((postData: PostFetchResponse) => {
    return (postData as { post?: ApiPost; data?: { post?: ApiPost } }).post
      ?? (postData as { data?: { post?: ApiPost } }).data?.post
      ?? (postData as ApiPost);
  }, []);

  const authorName = post?.author?.displayname || post?.author?.username;
  const rawContent = post?.content && (typeof post.content === 'object' && post.content !== null)
    ? (post.content as Record<string, string>).en || (post.content as Record<string, string>).tr || Object.values(post.content as Record<string, string>).find(Boolean)
    : '';
  const postExcerpt = htmlToPlainText(typeof rawContent === 'string' ? rawContent : '').slice(0, 120).trim() || undefined;
  const canonicalPath = username && postId ? `/${username}/status/${postId}` : postId ? `/status/${postId}` : undefined;
  const canonicalUrl = canonicalPath ? `${SITE_URL}${canonicalPath}` : undefined;
  const seoTitle = authorName
    ? t('post_details.seo.title_with_author', { name: authorName })
    : t('post_details.seo.title_default');
  const seoDescription = postExcerpt || (authorName
    ? t('post_details.seo.description_with_author', { name: authorName })
    : t('post_details.seo.description_default'));
  useSEO({
    title: seoTitle,
    description: seoDescription,
    canonical: canonicalPath,
    type: 'article',
    image: post?.media?.[0]?.url,
  });

  const postJsonLd = React.useMemo(() => {
    if (!post || !canonicalUrl) return null;
    const authorUsername = post?.author?.username;
    const authorName = post?.author?.displayname || authorUsername || 'User';
    const authorUrl = authorUsername ? `${SITE_URL}/${authorUsername}` : SITE_URL;
    const bodyText = postExcerpt ?? '';
    const images = Array.isArray(post?.media)
      ? post.media
        .map((media) => media?.url)
        .filter((url): url is string => Boolean(url))
      : [];
    return {
      '@context': 'https://schema.org',
      '@type': 'SocialMediaPosting',
      headline: bodyText || authorName,
      articleBody: bodyText || undefined,
      datePublished: post?.created_at,
      dateModified: post?.updated_at || post?.created_at,
      url: canonicalUrl,
      author: {
        '@type': 'Person',
        name: authorName,
        url: authorUrl,
      },
      image: images.length > 0 ? images : undefined,
    };
  }, [post, canonicalUrl, postExcerpt]);

  // Handle post click - navigate to post detail page
  const handlePostClick = useCallback((postId: string, username: string) => {
    navigate(`/${username}/status/${postId}`, { replace: true });
  }, [navigate]);

  // Handle profile click - navigate to profile page
  const handleProfileClick = useCallback((username: string) => {
    // Pass state to indicate we came from PostDetails
    // Use postId from params and username from the clicked profile
    navigate(`/${username}`, { 
      state: { 
        fromPostDetails: true, 
        postId: postId,
        postUsername: post?.author?.username || username
      } 
    });
  }, [navigate, postId, post?.author?.username]);

  const handlePostUpdate = useCallback((updatedPost: ApiPost) => {
    if (isDeletedMarker(updatedPost?.deleted_at)) {
      if (!isMountedRef.current) return;
      setIsDeleted(true);
      setPost(updatedPost);
      // Redirect away from deleted post detail
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
      redirectTimeoutRef.current = window.setTimeout(() => {
        navigate('/', { replace: true });
      }, 150);
      return;
    }
    if (!isMountedRef.current) return;
    setPost(updatedPost);
  }, [navigate, isDeletedMarker]);

  const processingAttachmentCount = React.useMemo(() => {
    if (!post?.attachments || !Array.isArray(post.attachments)) return 0;
    return post.attachments.filter((attachment) => isProcessingAttachment(attachment)).length;
  }, [post?.attachments, isProcessingAttachment]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!postId) {
      if (isMountedRef.current) {
        setError(t('post_details.errors.missing_id'));
        setLoading(false);
      }
      return;
    }
    if (isMountedRef.current) {
      setIsDeleted(false);
    }

    const fetchPostData = async () => {
      try {
        if (!isMountedRef.current) return;
        setLoading(true);
        setError(null);
        const postData = await api.fetchPost(postId) as PostFetchResponse;
        if (!isMountedRef.current) return;
        const resolvedPost = resolveFetchedPost(postData);
        if (isDeletedMarker(resolvedPost?.deleted_at)) {
          setIsDeleted(true);
          setPost(resolvedPost);
          if (redirectTimeoutRef.current) {
            window.clearTimeout(redirectTimeoutRef.current);
          }
          redirectTimeoutRef.current = window.setTimeout(() => {
            navigate('/', { replace: true });
          }, 150);
          return;
        }
        setPost(resolvedPost);
      } catch (err) {
        console.error('Error fetching post:', err);
        if (!isMountedRef.current) return;
        setError(t('post_details.errors.load_failed'));
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchPostData();
  }, [postId, t, navigate, isDeletedMarker, resolveFetchedPost]);

  useEffect(() => {
    if (!postId || processingAttachmentCount === 0) return;

    let cancelled = false;
    let timeoutId: number | null = null;

    const scheduleRefresh = (delay: number) => {
      if (cancelled) return;
      timeoutId = window.setTimeout(() => {
        void refreshPostData();
      }, delay);
    };

    const refreshPostData = async () => {
      if (cancelled || !isMountedRef.current) return;

      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        scheduleRefresh(4000);
        return;
      }

      try {
        const postData = await api.fetchPost(postId) as PostFetchResponse;
        if (cancelled || !isMountedRef.current) return;

        const resolvedPost = resolveFetchedPost(postData);
        handlePostUpdate(resolvedPost);

        const stillProcessing = Array.isArray(resolvedPost?.attachments)
          && resolvedPost.attachments.some((attachment) => isProcessingAttachment(attachment));

        if (stillProcessing) {
          scheduleRefresh(2500);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error refreshing post details while media is processing:', err);
          scheduleRefresh(5000);
        }
      }
    };

    scheduleRefresh(2000);

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [postId, processingAttachmentCount, handlePostUpdate, resolveFetchedPost, isProcessingAttachment]);

  const pageClassName = 'skyline-page-scroll w-full';
  const contentClassName = 'mx-auto w-full max-w-[760px] px-1 pb-8 pt-24 md:px-2 md:pt-28';
  const detailCardClassName = 'skyline-feed-card elite-card-static overflow-hidden';
  const panelClassName = theme === 'dark'
    ? 'cv-card-surface-soft border-white/10 text-zinc-300'
    : 'border-white/70 bg-white/75 text-slate-600';
  const replyPosts = React.useMemo(
    () => (post?.children || []).filter((child) => !isDeletedMarker(child.deleted_at)),
    [post?.children, isDeletedMarker]
  );

  const refreshPostDetails = useCallback(async () => {
    if (!postId) return;
    try {
      const postData = await api.fetchPost(postId) as PostFetchResponse;
      const resolvedPost = resolveFetchedPost(postData);
      handlePostUpdate(resolvedPost);
    } catch (err) {
      console.error('Error refreshing post details:', err);
    }
  }, [postId, resolveFetchedPost, handlePostUpdate]);

  const handleReplyUpdate = useCallback((updatedReply: ApiPost) => {
    setPost((currentPost) => {
      if (!currentPost?.children) return currentPost;
      return {
        ...currentPost,
        children: currentPost.children.map((child) =>
          child.id === updatedReply.id || child.public_id === updatedReply.public_id
            ? updatedReply
            : child
        ),
      };
    });
  }, []);

  if (loading) {
    return (
      <div className={pageClassName}>
        <main className={contentClassName}>
          <div className={detailCardClassName}>
            <PostSkeleton theme={theme} />
          </div>
        </main>
      </div>
    );
  }

  if (isDeleted) {
    return (
      <div className={pageClassName}>
        <div className={contentClassName}>
          <div className={`rounded-[30px] border p-10 text-center backdrop-blur-3xl ${panelClassName}`}>
            <p className="text-sm font-black">{t('post_details.deleted')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className={pageClassName}>
        <div className={contentClassName}>
          <div className={`rounded-[30px] border p-10 text-center backdrop-blur-3xl ${panelClassName}`}>
            <p className="text-sm font-black text-red-500">{error || t('post_details.errors.not_found')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={pageClassName}>
      {postJsonLd && (
        <script
          type="application/ld+json"
        >{serializeJsonLd(postJsonLd)}</script>
      )}
      <main className={contentClassName}>
        <div className="space-y-6">
          <div className={detailCardClassName}>
            <Post
              post={post}
              {...restProps}
              onPostClick={restProps.onPostClick || handlePostClick}
              disablePostClick={true}
              onProfileClick={restProps.onProfileClick || handleProfileClick}
              onUpdatePost={handlePostUpdate}
              showChildren={false}
              defaultShowReply={false}
              loadChildren={false}
            />
          </div>

          {showChildren && replyPosts.length > 0 && (
            <section className="space-y-4">
              <div className={`px-2 text-sm font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
                Replies ({replyPosts.length})
              </div>
              <div className="columns-1 gap-5 sm:columns-2">
                {replyPosts.map((reply) => (
                  <div
                    key={reply.id}
                    style={replyMasonryItemStyle}
                    className="mb-5 break-inside-avoid skyline-feed-card elite-card-static overflow-hidden"
                  >
                    <Post
                      post={reply}
                      onPostClick={restProps.onPostClick || handlePostClick}
                      onProfileClick={restProps.onProfileClick || handleProfileClick}
                      onUpdatePost={handleReplyUpdate}
                      onRefreshParent={refreshPostDetails}
                      showChildren={false}
                      defaultShowReply={false}
                      loadChildren={false}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default PostDetails;
