import React, { useState, useEffect, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Post, { PostProps, ApiPost } from '../features/post/Post';
import { api } from '../services/api';
import Container from '../components/ui/Container';
import { PostSkeleton } from '../features/post/Flows';

type PostDetailsProps = Omit<PostProps, 'post' | 'defaultShowReply' | 'loadChildren'>;

const PostDetailsHeader = memo(({ theme, onBack }: { theme: 'dark' | 'light'; onBack: () => void }) => (
  <div className={`z-40 border-b sticky top-0 ${theme === 'dark' ? 'bg-gray-950 border-gray-800/50' : 'bg-white border-gray-100/50'}`}>
    <div className="flex items-center px-4 py-3">
      <button
        onClick={onBack}
        className={`p-2 rounded-full transition-all duration-200 mr-3 ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
          }`}
      >
        <ArrowLeft className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
      </button>
      <div>
        <h2 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Post
        </h2>
      </div>
    </div>
  </div>
));

PostDetailsHeader.displayName = 'PostDetailsHeader';

const PostDetails: React.FC<PostDetailsProps> = ({ showChildren = true, ...restProps }) => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [post, setPost] = useState<ApiPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle back button click
  const handleBackClick = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

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

  useEffect(() => {
    if (!postId) {
      setError('Post ID is required');
      setLoading(false);
      return;
    }

    const fetchPostData = async () => {
      try {
        setLoading(true);
        setError(null);
        const postData = await api.fetchPost(postId) as ApiPost;
        setPost(postData);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPostData();
  }, [postId]);

  if (loading) {
    return (
      <Container
        className={`w-full min-h-[100dvh] overflow-y-auto scrollbar-hide max-h-[100dvh]`}>
        {/* Post Detail Header */}
        <PostDetailsHeader theme={theme} onBack={handleBackClick} />
        <PostSkeleton theme={theme} />
      </Container>
    );
  }

  if (error || !post) {
    return (
      <>
        {/* Post Detail Header */}
        <PostDetailsHeader theme={theme} onBack={handleBackClick} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400">{error || 'Post not found'}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <Container
      className={`w-full min-h-[100dvh] overflow-y-auto scrollbar-hide max-h-[100dvh]`}>
      <PostDetailsHeader theme={theme} onBack={handleBackClick} />
      <Post
        post={post}
        {...restProps}
        onPostClick={restProps.onPostClick || handlePostClick}
        onProfileClick={restProps.onProfileClick || handleProfileClick}
        showChildren={showChildren}
        defaultShowReply={true}
        loadChildren={false}
      />
    </Container>
  );
};

export default PostDetails;
