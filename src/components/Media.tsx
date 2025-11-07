import React from 'react';
import VideoPlayer from './VideoPlayer';
import { getSafeImageURL } from '../helpers/helpers';

interface MediaProps {
  media: {
    id: string;
    file: {
      url: string;
      mime_type: string;
      variants?: {
        image?: {
          small?: { url: string };
          medium?: { url: string };
          large?: { url: string };
          original?: { url: string };
        };
        video?: {
          preview?: { url: string };
        };
      };
    };
  };
}

const Media: React.FC<MediaProps> = ({ media }) => {
  const isVideo = media.file?.mime_type?.startsWith('video/');

  // Get safe image URL using the helper
  const imageUrl = getSafeImageURL(media.file, 'medium') || media.file?.url;

  if (!imageUrl && !isVideo) {
    return null;
  }

  return (
    <div
      className={`break-inside-avoid mb-2 sm:mb-3 rounded-lg overflow-hidden cursor-pointer group`}
    >
      {isVideo ? (
        <VideoPlayer 
          src={media.file.url}
          className="w-full h-auto"
        />
      ) : (
        <div className="relative">
          <img
            src={imageUrl}
            alt=""
            className="w-full h-auto rounded-lg"
            loading="lazy"
          />
          <div className={`absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-lg`} />
        </div>
      )}
    </div>
  );
};

export default Media;
