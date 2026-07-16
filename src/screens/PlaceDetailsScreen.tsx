import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from '@/router';
import { motion } from 'framer-motion';
import { MapPin, Globe, Phone, Loader, Mail, Compass, Navigation } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import type { Place } from '../types/places';
import { api } from '../services/api';
import { generatePlaceImage } from '../helpers/helpers';
import Post from '../features/post/Post';
import { useSEO } from '../hooks/useSEO';

interface LocationState {
  place?: Place;
}

const PlaceDetailsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { publicId } = useParams<{ publicId: string }>();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [place, setPlace] = useState<Place | null>(state?.place || null);
  const [loading, setLoading] = useState<boolean>(!place);
  const [error, setError] = useState<string | null>(null);

  // Dynamic SEO – updates when place data is available
  const placeTitle = place?.title?.[t('lang_code', { defaultValue: 'tr' })] || place?.title?.['en'] || place?.extras?.place?.name;
  const placeLocation = [place?.extras?.place?.town, place?.extras?.place?.country].filter(Boolean).join(', ');
  useSEO({
    title: placeTitle ? `${placeTitle}${placeLocation ? ` – ${placeLocation}` : ''} | LGBTQ+ Place` : 'Place Details',
    description: placeTitle
      ? `Discover ${placeTitle} on CoolVibes. An LGBTQ+ friendly place in ${placeLocation || 'your area'}. View contact info, directions, and more.`
      : 'Explore LGBTQ+ friendly places on CoolVibes.',
    canonical: publicId ? `/places/${publicId}` : '/places',
    image: place?.extras?.place?.image?.startsWith('http') ? place.extras.place.image : undefined,
    type: 'website',
  });

  const fetchPlaceDetails = useCallback(async () => {
    if (!place && publicId) {
      setLoading(true);
      setError(null);
      try {
        const response = (await api.fetchPlace(publicId)) as any;
        // The API might return a single place in an array or as a single object
        const foundPlace = Array.isArray(response.places) && response.places.length > 0 ? response.places[0] : response.place;

        if (foundPlace) {
          setPlace(foundPlace);
        } else {
          throw new Error(response.error || t('places.details_not_found', { defaultValue: 'Place not found' }));
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching place details.');
      }
    } else if (!publicId) {
      setError(t('places.no_public_id', { defaultValue: 'No place ID provided.' }));
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [place, publicId, t]);

  useEffect(() => {
    fetchPlaceDetails();
  }, [fetchPlaceDetails]);

  const isDark = theme === 'dark';
  const pageClassName = 'skyline-page-scroll w-full';
  const contentClassName = 'mx-auto w-full max-w-5xl px-1 pb-8 pt-24 md:px-2 md:pt-28';
  const panelClassName = isDark
    ? 'cv-card-surface-soft border-white/10 text-zinc-300'
    : 'border-white/70 bg-white/75 text-slate-600';

  if (loading) {
    return (
      <div className={pageClassName}>
        <main className={contentClassName}>
          <div className={`flex min-h-[340px] items-center justify-center rounded-[30px] border backdrop-blur-3xl ${panelClassName}`}>
            <Loader className={`h-8 w-8 animate-spin ${isDark ? 'text-white' : 'text-slate-950'}`} />
          </div>
        </main>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className={pageClassName}>
        <main className={contentClassName}>
          <div className={`mx-auto max-w-xl rounded-[30px] border p-10 text-center backdrop-blur-3xl ${panelClassName}`}>
            <p className="text-sm font-black text-red-500">
              {error || t('places.details_not_found')}
            </p>
            {publicId && (
              <p className={`mt-2 text-xs font-bold uppercase tracking-[0.16em] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                ID: {publicId}
              </p>
            )}
          </div>
        </main>
      </div>
    );
  }

  const { name = '', address = '', town = '', province = '', country = '', website = '', telephone = '', urls = [], email = '', image = '', postcode = '' } =
    place.extras?.place ?? {};
  const i18nTitle = place.title?.[t('lang_code', { defaultValue: 'tr' })] || place.title?.['en'] || name;
  /* const i18nDesc = place.content[t('lang_code', { defaultValue: 'tr' })] || place.content['en'] || description; */
  const mainUrl = urls?.[0] || website;
  const locationText = [town, province, country].filter(Boolean).join(', ');

  // Directions URL
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address || i18nTitle)}`;
  const heroImage = image && image.startsWith('http') ? image : generatePlaceImage(place.public_id);
  const seenTags = new Set<string>();
  const tags = Array.isArray(place.hashtags)
    ? place.hashtags.filter((tag: any) => {
        const tagKey = String(tag?.tag || tag?.id || '').trim().toLowerCase();
        if (!tagKey || seenTags.has(tagKey)) {
          return false;
        }
        seenTags.add(tagKey);
        return true;
      })
    : [];
  const authorUsername = place.author?.username || '';
  const authorName = place.author?.displayname || authorUsername || t('places.added_by', { defaultValue: 'Added By User' });
  const authorAvatarSeed = authorUsername || place.public_id;
  const actionButtonClass = `inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-[10px] font-black uppercase tracking-[0.14em] transition-all active:scale-95 ${isDark
    ? 'bg-white !text-slate-950 hover:bg-zinc-200'
    : 'bg-slate-950 !text-white hover:bg-slate-800'
    }`;
  const secondaryButtonClass = `inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-[10px] font-black uppercase tracking-[0.14em] transition-all active:scale-95 ${isDark
    ? 'bg-white/[0.06] !text-zinc-300 hover:bg-white/10 hover:!text-white'
    : 'bg-white/80 !text-slate-600 hover:bg-white hover:!text-slate-950'
    }`;

  return (
    <div className={pageClassName}>
      <main className={contentClassName}>
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="elite-card overflow-hidden p-3"
        >
          <div className="cv-card-surface-muted relative aspect-[16/10] w-full overflow-hidden rounded-[28px] bg-slate-100 md:aspect-[21/9]">
            <img
              src={heroImage}
              alt={i18nTitle}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag.id || tag.tag}
                    className="rounded-full bg-white/85 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-700 shadow-lg backdrop-blur-md"
                  >
                    #{tag.tag}
                  </span>
                ))}
                {tags.length > 3 && (
                  <span className="rounded-full border border-white/25 bg-black/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-md">
                    +{tags.length - 3}
                  </span>
                )}
              </div>
              <h1 className="mt-3 max-w-3xl text-3xl font-black leading-none tracking-tight text-white md:text-5xl">
                {i18nTitle}
              </h1>
              {locationText && (
                <div className="mt-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/75">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">{locationText}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-1 pt-3">
            {telephone && (
              <a href={`tel:${telephone}`} className={actionButtonClass}>
                <Phone className="h-4 w-4" />
                <span>{t('places.call', { defaultValue: 'Hemen Ara' })}</span>
              </a>
            )}
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className={actionButtonClass}>
              <Compass className="h-4 w-4" />
              <span>{t('places.directions', { defaultValue: 'Yol Tarifi' })}</span>
            </a>
            {mainUrl && (
              <a
                href={mainUrl.startsWith('http') ? mainUrl : `https://${mainUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className={secondaryButtonClass}
              >
                <Globe className="h-4 w-4" />
                <span>{t('places.website', { defaultValue: 'Web Sitesi' })}</span>
              </a>
            )}
          </div>
        </motion.section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0 space-y-4">
            <div className="skyline-feed-card elite-card overflow-hidden">
              <Post
                post={place as any}
                defaultShowReply={false}
                loadChildren={false}
              />
            </div>

            {tags.length > 0 && (
              <section className={`rounded-[30px] border p-4 backdrop-blur-3xl ${panelClassName}`}>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag.id || tag.tag}
                      className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${isDark ? 'bg-white/[0.06] text-zinc-400' : 'bg-white/80 text-slate-500'}`}
                    >
                      #{tag.tag}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </section>

          <aside className="space-y-4">
            <section className={`rounded-[30px] border p-4 backdrop-blur-3xl ${panelClassName}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-600">
                {t('places.contact', { defaultValue: 'İletişim' })}
              </p>
              <div className="mt-4 space-y-4">
                {telephone && (
                  <a href={`tel:${telephone}`} className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isDark ? 'bg-white/[0.06] text-zinc-300' : 'bg-white/80 text-slate-600'}`}>
                      <Phone className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-[10px] font-black uppercase tracking-[0.16em] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                        {t('places.phone', { defaultValue: 'Telefon' })}
                      </span>
                      <span className={`block truncate text-sm font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                        {telephone}
                      </span>
                    </span>
                  </a>
                )}

                {email && (
                  <a href={`mailto:${email}`} className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isDark ? 'bg-white/[0.06] text-zinc-300' : 'bg-white/80 text-slate-600'}`}>
                      <Mail className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-[10px] font-black uppercase tracking-[0.16em] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                        {t('places.email', { defaultValue: 'E-Posta' })}
                      </span>
                      <span className={`block truncate text-sm font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                        {email}
                      </span>
                    </span>
                  </a>
                )}

                {mainUrl && (
                  <a href={mainUrl.startsWith('http') ? mainUrl : `https://${mainUrl}`} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isDark ? 'bg-white/[0.06] text-zinc-300' : 'bg-white/80 text-slate-600'}`}>
                      <Globe className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-[10px] font-black uppercase tracking-[0.16em] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                        {t('places.website', { defaultValue: 'Web Sitesi' })}
                      </span>
                      <span className={`block truncate text-sm font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                        {mainUrl}
                      </span>
                    </span>
                  </a>
                )}

                {!telephone && !email && !mainUrl && (
                  <p className={`text-sm font-bold ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                    {t('places.no_contact', { defaultValue: 'İletişim bilgisi bulunmuyor.' })}
                  </p>
                )}
              </div>
            </section>

            <section className={`rounded-[30px] border p-4 backdrop-blur-3xl ${panelClassName}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-600">
                {t('places.location', { defaultValue: 'Konum' })}
              </p>
              <div className="mt-4 flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isDark ? 'bg-white/[0.06] text-zinc-300' : 'bg-white/80 text-slate-600'}`}>
                  <Navigation className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-black leading-snug ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    {address || locationText || t('places.no_address', { defaultValue: 'Adres bilgisi yok' })}
                  </p>
                  {postcode && (
                    <p className={`mt-1 text-xs font-bold ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                      {postcode}
                    </p>
                  )}
                </div>
              </div>
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className={`${actionButtonClass} mt-4 w-full`}>
                <Compass className="h-4 w-4" />
                <span>{t('places.get_directions', { defaultValue: 'Yol Tarifi Al' })}</span>
              </a>
            </section>

            <section className={`rounded-[30px] border p-4 backdrop-blur-3xl ${panelClassName}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-600">
                {t('places.added_by', { defaultValue: 'Added By User' })}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${authorAvatarSeed}`}
                  alt={authorName}
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h4 className={`truncate text-sm font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    {authorName}
                  </h4>
                  {authorUsername && (
                    <p className={`truncate text-xs font-bold ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                      @{authorUsername}
                    </p>
                  )}
                </div>
              </div>
              {authorUsername && (
                <button
                  type="button"
                  onClick={() => navigate(`/${authorUsername}`)}
                  className={`${secondaryButtonClass} mt-4 w-full`}
                >
                  {t('places.view_profile', { defaultValue: 'Profili Gör' })}
                </button>
              )}
            </section>

            <div className="px-2 text-center">
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                {t('places.business_id', { defaultValue: 'Business ID' })}: {place.public_id}
              </p>
              <p className={`mt-1 text-[10px] font-bold ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                {t('places.verified_by', { defaultValue: 'Verified by {{domain}}', domain: place.domain })}
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default PlaceDetailsScreen;
