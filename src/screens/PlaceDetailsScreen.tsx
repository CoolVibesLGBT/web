import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Globe, Phone, Loader, Mail, Compass, Navigation } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import Container from '../components/ui/Container';
import { Place } from '../types/places';
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
    image: place?.extras?.place?.image && place.extras.place.image.startsWith('http') ? place.extras.place.image : undefined,
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

  const handleBackClick = () => {
    navigate('/places', { replace: true });
  };

  const renderHeader = () => (
    <div
      className={`z-40 border-b sticky top-0 ${theme === 'dark'
        ? 'bg-gray-950 border-gray-800/50'
        : 'bg-white border-gray-100/50'
        }`}
    >
      <div className="flex items-center px-4 py-3">
        <button
          onClick={handleBackClick}
          className={`p-2 rounded-full transition-all duration-200 mr-3 ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
        >
          <ArrowLeft
            className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
          />
        </button>
        <div>
          <h2
            className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
          >
            {t('places.details_title', { defaultValue: 'Business Profile' })}
          </h2>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Container className="w-full min-h-[100dvh] overflow-y-auto scrollbar-hide max-h-[100dvh]">
        {renderHeader()}
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader className={`w-8 h-8 animate-spin ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
        </div>
      </Container>
    );
  }

  if (error || !place) {
    return (
      <Container className="w-full min-h-[100dvh] overflow-y-auto scrollbar-hide max-h-[100dvh]">
        {renderHeader()}
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div
            className={`max-w-md w-full rounded-2xl border p-6 text-center ${theme === 'dark'
              ? 'border-red-800 bg-red-900/20'
              : 'border-red-200 bg-red-50'
              }`}
          >
            <p
              className={`text-sm font-semibold ${theme === 'dark' ? 'text-red-300' : 'text-red-700'
                }`}
            >
              {error || t('places.details_not_found')}
            </p>
            {publicId && (
              <p
                className={`mt-2 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}
              >
                ID: {publicId}
              </p>
            )}
          </div>
        </div>
      </Container>
    );
  }

  const { name, address, town, province, country, website, telephone, urls, email, image, postcode } =
    place.extras.place;
  const i18nTitle = place.title[t('lang_code', { defaultValue: 'tr' })] || place.title['en'] || name;
  /* const i18nDesc = place.content[t('lang_code', { defaultValue: 'tr' })] || place.content['en'] || description; */
  const mainUrl = urls?.[0] || website;
  const locationText = [town, province, country].filter(Boolean).join(', ');

  // Directions URL
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address || i18nTitle)}`;

  return (
    <Container className="w-full min-h-[100dvh] overflow-y-auto scrollbar-hide max-h-[100dvh]">
      {/* Header - requested to stay as is */}
      <div
        className={`z-50 border-b sticky top-0 ${theme === 'dark'
          ? 'bg-gray-950/95 border-gray-900'
          : 'bg-white/95 border-gray-200/50'
          } backdrop-blur-sm`}
      >
        <div className="flex items-center px-4 py-3">
          <button
            onClick={handleBackClick}
            className={`p-2 rounded-full transition-all duration-200 mr-3 ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
              }`}
          >
            <ArrowLeft
              className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
            />
          </button>
          <div>
            <h2
              className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
            >
              {t('places.details_title', { defaultValue: 'İşletme Profili' })}
            </h2>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative w-full h-[250px] sm:h-[350px] overflow-hidden"
      >
        <img
          src={image && image.startsWith('http') ? image : generatePlaceImage(place.public_id)}
          alt={i18nTitle}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {place.hashtags && place.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black text-white shadow-sm">
                  #{place.hashtags[0].tag}
                </span>
                {place.hashtags.length > 1 && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30">
                    +{place.hashtags.length - 1} Daha
                  </span>
                )}
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 leading-tight">
              {i18nTitle}
            </h1>

            <div className="flex items-center gap-2 text-white/80 text-sm sm:text-base">
              <MapPin className="w-4 h-4 text-white/80" />
              <span>{locationText}</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Action Bar */}
      <div className={`sticky top-[52px] z-40 px-4 py-3 border-b backdrop-blur-sm ${theme === 'dark' ? 'bg-gray-950/90 border-gray-900' : 'bg-white/90 border-gray-200/50'
        }`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide">
          {telephone && (
            <a
              href={`tel:${telephone}`}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm transition-all border whitespace-nowrap active:scale-95 ${theme === 'dark'
                ? 'bg-white border-white/10 text-black hover:bg-gray-200'
                : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100'
                }`}
            >
              <Phone className="w-4 h-4" />
              <span>{t('places.call', { defaultValue: 'Hemen Ara' })}</span>
            </a>
          )}

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm transition-all border whitespace-nowrap active:scale-95 ${theme === 'dark'
              ? 'bg-white border-white/10 text-black hover:bg-gray-200'
              : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100'
              }`}
          >
            <Compass className="w-4 h-4" />
            <span>{t('places.directions', { defaultValue: 'Yol Tarifi' })}</span>
          </a>

          {mainUrl && (
            <a
              href={mainUrl.startsWith('http') ? mainUrl : `https://${mainUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm transition-all border whitespace-nowrap active:scale-95 ${theme === 'dark'
                ? 'bg-white border-white/10 text-black hover:bg-gray-200'
                : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100'
                }`}
            >
              <Globe className="w-4 h-4" />
              <span>{t('places.website', { defaultValue: 'Web Sitesi' })}</span>
            </a>
          )}
        </div>
      </div>

      {/* Content body */}
      <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-8">

        {/* About Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-black dark:bg-white rounded-full" />
            <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('places.about', { defaultValue: 'İşletme Hakkında' })}
            </h3>
          </div>

        
         <Post
        post={place as any}
  
        defaultShowReply={true}
        loadChildren={false}
      />

          <div className={`rounded-3xl p-6 border ${theme === 'dark'
            ? 'border-gray-900 bg-gray-950'
            : 'border-gray-200/50 bg-white shadow-sm'
            }`}>
       

            {place.hashtags && place.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {place.hashtags.map((tag) => (
                  <span
                    key={tag.id}
                    className={`px-4 py-1.5 rounded-2xl text-xs font-semibold border transition-all cursor-default ${theme === 'dark'
                      ? 'border-gray-900 bg-gray-950 text-gray-400 hover:text-white hover:border-gray-700'
                      : 'border-gray-200/50 bg-white text-gray-600 hover:text-black hover:border-gray-300'
                      }`}
                  >
                    #{tag.tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Location & Contact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Card */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-purple-600 rounded-full" />
              <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('places.contact', { defaultValue: 'İletişim' })}
              </h3>
            </div>

            <div className={`rounded-3xl p-6 border h-full flex flex-col justify-between ${theme === 'dark'
              ? 'border-gray-900 bg-gray-950'
              : 'border-gray-200/50 bg-white shadow-sm'
              }`}>
              <div className="space-y-4">
                {telephone && (
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
                      <Phone className="w-5 h-5 text-black dark:text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('places.phone', { defaultValue: 'Telefon' })}
                      </p>
                      <a href={`tel:${telephone}`} className={`text-base font-bold transition-cyan block truncate ${theme === 'dark' ? 'text-white hover:text-gray-200' : 'text-gray-900 hover:text-black'}`}>
                        {telephone}
                      </a>
                    </div>
                  </div>
                )}

                {email && (
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
                      <Mail className="w-5 h-5 text-black dark:text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('places.email', { defaultValue: 'E-Posta' })}
                      </p>
                      <a href={`mailto:${email}`} className={`text-base font-bold transition-cyan block truncate ${theme === 'dark' ? 'text-white hover:text-gray-200' : 'text-gray-900 hover:text-black'}`}>
                        {email}
                      </a>
                    </div>
                  </div>
                )}

                {mainUrl && (
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
                      <Globe className="w-5 h-5 text-black dark:text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('places.website', { defaultValue: 'Web Sitesi' })}
                      </p>
                      <a href={mainUrl.startsWith('http') ? mainUrl : `https://${mainUrl}`} target="_blank" rel="noreferrer" className={`text-base font-bold transition-cyan block truncate ${theme === 'dark' ? 'text-white hover:text-gray-200' : 'text-gray-900 hover:text-black'}`}>
                        {mainUrl}
                      </a>
                    </div>
                  </div>
                )}

                {!telephone && !email && !mainUrl && (
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>İletişim bilgisi bulunmuyor.</p>
                )}
              </div>
            </div>
          </section>

          {/* Location Card */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-black dark:bg-white rounded-full" />
              <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('places.location', { defaultValue: 'Konum' })}
              </h3>
            </div>

            <div className={`rounded-3xl p-6 border h-full flex flex-col justify-between ${theme === 'dark'
              ? 'border-gray-900 bg-gray-950'
              : 'border-gray-200/50 bg-white shadow-sm'
              }`}>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
                    <Navigation className="w-5 h-5 text-black dark:text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {t('places.address', { defaultValue: 'Adres' })}
                    </p>
                    <p className={`text-base font-medium leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {address || locationText || t('places.no_address', { defaultValue: 'Adres bilgisi yok' })}
                    </p>
                    {postcode && (
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{postcode}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all shadow-md active:scale-95 ${theme === 'dark'
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-black text-white hover:bg-gray-900'
                    }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>{t('places.get_directions', { defaultValue: 'Yol Tarifi Al' })}</span>
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Business Owner Section */}
        <section className={`rounded-3xl p-6 border flex items-center justify-between gap-4 ${theme === 'dark'
          ? 'border-gray-900 bg-gray-950'
          : 'border-gray-200/50 bg-white'
          }`}>
          <div className="flex items-center gap-4 min-w-0">
            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 shrink-0 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${place.author.username}`}
                alt={place.author.displayname}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('places.added_by', { defaultValue: 'Added By User' })}
              </p>
              <h4 className={`font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {place.author.displayname}
              </h4>
            </div>
          </div>
          <button
            onClick={() => navigate(`/${place.author.username}`)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${theme === 'dark'
              ? 'border-gray-900 text-gray-300 hover:bg-gray-900/50'
              : 'border-gray-200/50 text-gray-700 hover:bg-gray-100'
              }`}
          >
            {t('places.view_profile', { defaultValue: 'Profili Gör' })}
          </button>
        </section>

        {/* Meta Footer */}
        <div className="pt-8 text-center">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            {t('places.business_id', { defaultValue: 'Business ID' })}: {place.public_id}
          </p>
          <p className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
            {t('places.verified_by', { defaultValue: 'Verified by {{domain}}', domain: place.domain })}
          </p>
        </div>
      </div>
    </Container>
  );
};

export default PlaceDetailsScreen;
