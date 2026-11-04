import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { getSafeImageURL } from '@/helpers/helpers';
import type { CheckInTagItem } from '@/contexts/AppContext';
import './checkin-artwork.css';

type ArtworkTag = Pick<CheckInTagItem, 'tag' | 'icon' | 'thumb'>;

function imageURL(value?: string | null) {
  if (!value || !/^(?:https?:\/\/|\/)/i.test(value)) return null;
  return getSafeImageURL({ url: value });
}

export default function CheckInTagArtwork({ tag, className = '', sizes = '8rem' }: {
  tag: ArtworkTag;
  className?: string;
  sizes?: string;
}) {
  // Older initial-sync responses contain Lucide names. The stable tag slug
  // still resolves the public artwork while the API rollout completes.
  const slug = /^[a-z0-9_]+$/.test(tag.tag) ? tag.tag : null;
  const icon = imageURL(tag.icon) ?? (slug ? imageURL(`/static/checkin/${slug}.avif`) : null);
  const thumb = imageURL(tag.thumb) ?? (slug ? imageURL(`/static/checkin/256/${slug}.avif`) : icon);
  const [failedURLs, setFailedURLs] = useState<string[]>([]);
  const usableThumb = thumb && !failedURLs.includes(thumb) ? thumb : null;
  const usableIcon = icon && !failedURLs.includes(icon) ? icon : null;
  const src = usableThumb ?? usableIcon;
  if (!src) {
    return <MapPin aria-hidden="true" className={`cv-checkin-artwork ${className}`} />;
  }
  return <img
    className={`cv-checkin-artwork ${className}`}
    src={src}
    srcSet={usableIcon && usableThumb && usableIcon !== usableThumb ? `${usableThumb} 256w, ${usableIcon} 512w` : undefined}
    sizes={sizes}
    width={256}
    height={256}
    alt=""
    aria-hidden="true"
    loading="lazy"
    decoding="async"
    draggable={false}
    onError={event => {
      const failed = event.currentTarget.currentSrc || src;
      setFailedURLs(previous => previous.includes(failed) ? previous : [...previous, failed]);
    }}
  />;
}
