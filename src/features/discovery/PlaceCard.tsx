import React from 'react';
import { Place } from '../../types/places';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { generatePlaceImage } from '../../helpers/helpers';

interface PlaceCardProps {
  place: Place;
  selected: boolean;
  onClick: (place: Place) => void;
  className?: string;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, selected, onClick, className }) => {
  const { theme } = useTheme();
  const { name, description, image } = place.extras.place;
  const title = place.title['tr'] || name;
  const locationString = [place.location.city, place.location.country].filter(Boolean).join(', ');

  return (
    <motion.div
      onClick={() => onClick(place)}
      className={`cursor-pointer transition-all duration-200 overflow-hidden rounded-2xl ${
        selected
          ? (theme === 'dark' ? 'bg-purple-900/50' : 'bg-purple-100')
          : (theme === 'dark' ? 'bg-gray-900 hover:bg-gray-800/80' : 'bg-white hover:bg-gray-50')
      } ${className}`}
    >
      <div className="w-full aspect-video overflow-hidden">
        {image ? (
          <img src={generatePlaceImage(place.public_id)} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-700'}`}>
            <img src={generatePlaceImage(place.public_id)} alt={title} className="w-full h-full object-cover" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className={`font-bold text-lg truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        
        {locationString && (
          <div className={`flex items-center gap-1.5 mt-1.5 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{locationString}</span>
          </div>
        )}

        <p className={`text-sm mt-2 h-10 overflow-hidden ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
      </div>
    </motion.div>
  );
};

export default PlaceCard;
