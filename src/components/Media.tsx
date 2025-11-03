import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import VideoPlayer from './VideoPlayer';

interface MediaProps {
  media: {
    id: string;
    file: {
      url: string;
      mime_type: string;
    };
  };
}

const Media: React.FC<MediaProps> = ({ media }) => {
  const { theme } = useTheme();
  const isVideo = media.file?.mime_type?.startsWith('video/');

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
            src={media.file.url}
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
