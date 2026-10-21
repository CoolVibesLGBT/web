import React from 'react';
import type { Place } from '../../types/places';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { name = '', description = '', image = '' } = place.extras?.place ?? {};
  const title = place.title?.['tr'] || place.title?.['en'] || name;
  const locationString = place.location ? [place.location.city, place.location.country].filter(Boolean).join(', ') : '';
  const hasRemoteImage = typeof image === 'string' && image.startsWith('http');
  const fallbackImage = generatePlaceImage(place.public_id);
  // Kart dar olduğu için en fazla 2 etiket gösteriliyor — 3. etiket genelde
  // yarım kesilip kart kenarından taşıyordu (bkz. aşağıdaki truncate da ek güvence).
  const tags = Array.isArray(place.hashtags) ? place.hashtags.slice(0, 2) : [];

  return (
    <article
      onClick={() => onClick(place)}
      className={`cv-card-lift group flex h-full min-h-0 cursor-pointer flex-col gap-1 overflow-hidden rounded-2xl border border-[var(--cv-surface-3)] p-1 ${
        theme === 'dark' ? 'bg-[#131313]' : 'bg-white'
        } ${selected ? 'ring-1 ring-[var(--color-brand)]' : ''} ${className ?? ''}`}
    >
      <div className="relative h-[220px] w-full shrink-0 overflow-hidden rounded-xl bg-slate-100">
        <img
          src={hasRemoteImage ? image : fallbackImage}
          alt={title}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          sizes="(min-width: 1024px) 390px, (min-width: 640px) 50vw, 100vw"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
        {tags.length > 0 && (
          <div className="absolute left-3 right-3 top-3 flex gap-1.5">
            {tags.map((tag: any) => (
              <span
                key={tag.tag || tag}
                className="min-w-0 shrink truncate rounded-full bg-white/85 px-2.5 py-1 text-[0.765rem] font-semibold normal-case tracking-normal text-slate-700 shadow-lg backdrop-blur-md"
              >
                #{tag.tag || tag}
              </span>
            ))}
          </div>
        )}
        {locationString && (
          <div className="absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-[0.765rem] font-bold normal-case tracking-normal text-white backdrop-blur-md">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{locationString}</span>
          </div>
        )}
      </div>
      <div className="flex min-h-[24px] flex-col justify-center px-3 py-2">
        <h3 className={`truncate text-sm font-normal leading-5 ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{title}</h3>
        <p className={`mt-0.5 truncate text-xs leading-4 ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>
          {[locationString, description].filter(Boolean).join(' · ')}
        </p>
      </div>
    </article>
  );
};

export default PlaceCard;
