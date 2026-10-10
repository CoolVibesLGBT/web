import React from 'react';
import type { Place } from '../../types/places';
import { useTheme } from '../../contexts/ThemeContext';
import { MapPin } from 'lucide-react';

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
  const tags = Array.isArray(place.hashtags) ? place.hashtags.slice(0, 3) : [];
  const fallbackInitial = title?.trim()?.charAt(0)?.toUpperCase() || 'P';

  return (
    <article
      onClick={() => onClick(place)}
      className={`cv-card-lift group flex h-full min-h-0 cursor-pointer flex-col gap-1 overflow-hidden rounded-2xl border border-[var(--cv-surface-3)] p-1 ${
        theme === 'dark' ? 'bg-[#131313]' : 'bg-white'
        } ${selected ? 'ring-1 ring-[var(--color-brand)]' : ''} ${className ?? ''}`}
    >
      <div className="relative h-[220px] w-full shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {hasRemoteImage ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            sizes="(min-width: 1024px) 390px, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#131313_0%,#3a3a3a_100%)]" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-4xl font-black text-white backdrop-blur-md">
              {fallbackInitial}
            </div>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
        {tags.length > 0 && (
          <div className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] gap-1.5 overflow-hidden">
            {tags.map((tag: any) => (
              <span
                key={tag.tag || tag}
                className="rounded-full bg-white/85 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-700 shadow-lg backdrop-blur-md"
              >
                #{tag.tag || tag}
              </span>
            ))}
          </div>
        )}
        {locationString && (
          <div className="absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-md">
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
