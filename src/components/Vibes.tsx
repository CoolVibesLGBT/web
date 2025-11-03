import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import Media from './Media';
import { api } from '../services/api';

interface ApiPost {
  id: string;
  public_id: number;
  author_id: string;
  type: string;
  content: {
    en: string;
  };
  published: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  author: {
    id: string;
    public_id: number;
    username: string;
    displayname: string;
    email: string;
    date_of_birth: string;
    gender: string;
    sexual_orientation: {
      id: string;
      key: string;
      order: number;
    };
    sex_role: string;
    relationship_status: string;
    user_role: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    default_language: string;
    languages: unknown;
    fantasies: unknown[];
    travel: unknown;
    social: unknown;
    deleted_at: string | null;
  };
  attachments: Array<{
    id: string;
    file_id: string;
    owner_id: string;
    owner_type: string;
    role: string;
    is_public: boolean;
    file: {
      id: string;
      url: string;
      storage_path: string;
      mime_type: string;
      size: number;
      name: string;
      created_at: string;
    };
    created_at: string;
    updated_at: string;
  }>;
  poll?: Array<{
    id: string;
    post_id: string;
    contentable_id: string;
    contentable_type: string;
    question: {
      en: string;
    };
    duration: string;
    created_at: string;
    updated_at: string;
    choices: Array<{
      id: string;
      poll_id: string;
      label: {
        en: string;
      };
      vote_count: number;
      voters?: Array<{
        id: string;
        username: string;
        displayname: string;
      }>;
    }>;
  }>;
  event?: {
    id: string;
    post_id: string;
    title: {
      en: string;
    };
    description: {
      en: string;
    };
    start_time: string;
    location: {
      id: string;
      contentable_id: string;
      contentable_type: string;
      country_code: string | null;
      address: string;
      display: string | null;
      latitude: number;
      longitude: number;
      location_point: {
        lng: number;
        lat: number;
      };
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
    };
    type: string;
    created_at: string;
    updated_at: string;
    attendees?: Array<{
      id: string;
      username: string;
      displayname: string;
      status: 'going' | 'not_going' | 'maybe';
    }>;
  };
  location?: {
    id: string;
    contentable_id: string;
    contentable_type: string;
    country_code: string | null;
    address: string;
    display: string | null;
    latitude: number;
    longitude: number;
    location_point: {
      lng: number;
      lat: number;
    };
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
}

interface TimelineResponse {
  posts: ApiPost[];
  next_cursor: number;
}

interface VibesProps {
  activeTab: string;
  onPostClick: (postId: string, username: string) => void;
}

const Vibes: React.FC<VibesProps> = ({ activeTab, onPostClick }) => {
  const { theme } = useTheme();
  const [vibesPosts, setVibesPosts] = useState<ApiPost[]>([]);
  const [vibesLoading, setVibesLoading] = useState(false);

  // Fetch vibes when tab switches to vibes
  useEffect(() => {
    const fetchVibes = async () => {
      if (activeTab === 'vibes' && vibesPosts.length === 0 && !vibesLoading) {
        try {
          setVibesLoading(true);
          const response: TimelineResponse = await api.fetchVibes({ limit: 20, cursor: "" });
          setVibesPosts(response.posts);
        } catch (err) {
          console.error('Error fetching vibes:', err);
        } finally {
          setVibesLoading(false);
        }
      }
    };

    fetchVibes();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="p-4"
    >
      {vibesLoading ? (
        <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading vibes...
        </div>
      ) : vibesPosts.length === 0 ? (
        <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          No vibes available
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2 sm:gap-3">
          {vibesPosts.map((post, index) => {
            // Filter posts with media attachments
            const mediaAttachments = post.attachments?.filter(att =>
              att.file?.mime_type?.startsWith('image/') ||
              att.file?.mime_type?.startsWith('video/')
            ) || [];

            if (mediaAttachments.length === 0) return null;

            const firstMedia = mediaAttachments[0];

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onPostClick(post.id, post.author.username)}
              >
                <Media media={firstMedia} />
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default Vibes;

