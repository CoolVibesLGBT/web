import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, RefreshCw, ExternalLink, Search, Loader2, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import { Actions } from '../services/actions';

type RawTrend = Record<string, any> | string;

export interface NormalizedTrend {
  id: string;
  label: string;
  subtitle?: string | null;
  volume?: number | null;
  change?: number | null;
  url?: string | null;
  query?: string | null;
  raw: RawTrend;
  rank: number;
}

interface TrendsPanelProps {
  limit?: number;
  onTrendSelect?: (trend: NormalizedTrend) => void;
}

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) {
    return null;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return value.toLocaleString();
};

const normalizeTrends = (data: any, fallbackTitle: string): NormalizedTrend[] => {
  if (!data) return [];

  const list: RawTrend[] =
    Array.isArray(data) ? data : data?.trends ?? data?.items ?? data?.data ?? [];

  return list
    .map<NormalizedTrend | null>((item, index) => {
      if (item == null) return null;

      if (typeof item === 'string') {
        return {
          id: `${index}-${item}`,
          label: item,
          subtitle: null,
          volume: null,
          change: null,
          url: null,
          query: item,
          raw: item,
          rank: index + 1,
        };
      }

      const label =
        item.title ??
        item.name ??
        item.query ??
        item.topic ??
        item.label ??
        item.keyword ??
        fallbackTitle;

      const subtitle =
        item.subtitle ??
        item.category ??
        item.context ??
        item.location ??
        item.description ??
        null;

      const volume =
        item.volume ??
        item.total ??
        item.count ??
        item.searchVolume ??
        item.tweet_volume ??
        item.popularity ??
        null;

      const change =
        item.change ??
        item.delta ??
        item.score ??
        item.spark ??
        (typeof item.trend_change === 'number' ? item.trend_change : null) ??
        null;

      const url =
        item.url ??
        item.link ??
        item.permalink ??
        (typeof item.target === 'string' ? item.target : null) ??
        null;

      const query =
        item.query ??
        item.keyword ??
        item.searchQuery ??
        item.slug ??
        item.hashtag ??
        label;

      const id =
        item.id ??
        item.key ??
        item.slug ??
        item.query ??
        `${index}-${label}`;

      return {
        id: String(id),
        label: String(label),
        subtitle: subtitle ? String(subtitle) : null,
        volume: typeof volume === 'number' ? volume : Number(volume) || null,
        change: typeof change === 'number' ? change : Number(change) || null,
        url: url ? String(url) : null,
        query: query ? String(query) : null,
        raw: item,
        rank: index + 1,
      };
    })
    .filter((item): item is NormalizedTrend => Boolean(item));
};

const rainbowRankStyles: Array<{ background: string; color: string }> = [
  {
    background: 'linear-gradient(135deg, #FF3B30 0%, #FF6B3B 100%)',
    color: '#ffffff',
  },
  {
    background: 'linear-gradient(135deg, #FF9500 0%, #FFD60A 100%)',
    color: '#1f2937',
  },
  {
    background: 'linear-gradient(135deg, #FFD60A 0%, #34C759 100%)',
    color: '#1f2937',
  },
  {
    background: 'linear-gradient(135deg, #34C759 0%, #32D74B 100%)',
    color: '#ffffff',
  },
  {
    background: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)',
    color: '#ffffff',
  },
  {
    background: 'linear-gradient(135deg, #5856D6 0%, #5E5CE6 100%)',
    color: '#ffffff',
  },
  {
    background: 'linear-gradient(135deg, #AF52DE 0%, #FF2D55 100%)',
    color: '#ffffff',
  },
];

const getRankStyle = (rank: number) => {
  if (rank <= rainbowRankStyles.length) {
    return rainbowRankStyles[rank - 1];
  }

  const hue = (rank * 47) % 360;
  const nextHue = (hue + 30) % 360;

  return {
    background: `linear-gradient(135deg, hsl(${hue}, 85%, 55%) 0%, hsl(${nextHue}, 80%, 60%) 100%)`,
    color: '#ffffff',
  };
};

const TrendsPanel: React.FC<TrendsPanelProps> = ({ limit = 20, onTrendSelect }) => {
  const { theme } = useTheme();
  const { t } = useTranslation('common');
  const [trends, setTrends] = React.useState<NormalizedTrend[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const fetchTrends = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.call<any>(Actions.CMD_SEARCH_TRENDS, {
        method: "POST",
        body: { limit },
      });

      let normalized: NormalizedTrend[] = [];

      if (Array.isArray(response?.trends)) {
        normalized = response.trends
          .slice(0, limit)
          .map((item: any, index: number): NormalizedTrend => {
            const tag = item?.tag ?? item?.keyword ?? item?.title ?? `Trend ${index + 1}`;
            const count = typeof item?.count === 'number' ? item.count : Number(item?.count) || null;

            return {
              id: String(item?.id ?? item?.tag ?? index),
              label: String(tag),
              subtitle: null,
              volume: count,
              change: null,
              url: null,
              query: String(tag),
              raw: item,
              rank: index + 1,
            };
          });
      } else {
        normalized = normalizeTrends(
          response,
          t('app.trending_unknown', { defaultValue: 'Trending Topic' })
        );
      }

      setTrends(normalized);
      const apiTimestamp = response?.last_update ?? response?.last_updated;
      setLastUpdated(apiTimestamp ? new Date(apiTimestamp) : new Date());
      setIsExpanded(false);
    } catch (err: any) {
      console.error('Failed to fetch trends', err);
      setError(err?.response?.data?.message || err?.message || t('app.trending_error', { defaultValue: 'Unable to load trends right now.' }));
    } finally {
      setLoading(false);
    }
  }, [limit, t]);

  React.useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const handleSelect = React.useCallback((trend: NormalizedTrend) => {
    if (onTrendSelect) {
      onTrendSelect(trend);
      return;
    }

    if (trend.url) {
      window.open(trend.url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (trend.query) {
      const encoded = encodeURIComponent(trend.query);
      window.location.href = `/search?q=${encoded}`;
    }
  }, [onTrendSelect]);

  const subtitleColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
const cardBackground =
  theme === 'dark'
    ? 'bg-gradient-to-br from-gray-950/95 via-gray-900/90 to-gray-950/95 backdrop-blur-xl'
    : 'bg-gradient-to-br from-white via-white/97 to-gray-50';

  const MAX_COMPACT_ITEMS = 7;
  const hasOverflow = trends.length > MAX_COMPACT_ITEMS;
  const displayedTrends = isExpanded ? trends : trends.slice(0, MAX_COMPACT_ITEMS);
  const hiddenCount = hasOverflow ? trends.length - MAX_COMPACT_ITEMS : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`rounded-3xl overflow-hidden ${cardBackground}`}
    >
      <div className="p-5 pb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-500'}`} />
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('app.trending_title')}
            </h2>
          </div>
          <p className={`text-sm ${subtitleColor}`}>
            {t('app.trending_subtitle')}
          </p>
          {lastUpdated && (
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  theme === 'dark' ? 'bg-white/10 text-gray-200' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
                {t('app.trending_updated', {
                  time: lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                })}
              </span>
              {trends.length > 0 && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    theme === 'dark' ? 'bg-white/5 text-gray-300' : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  #{trends.length}
                </span>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={fetchTrends}
          className={`p-2 rounded-full transition-colors ${
            theme === 'dark'
              ? 'hover:bg-white/15 text-gray-300'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          aria-label={t('app.trending_refresh')}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>

      <div className="px-5 pb-5 space-y-3">
        {error ? (
          <div
            className={`rounded-2xl p-4 ${
              theme === 'dark'
                ? 'bg-red-500/15 text-red-200 shadow-[0_14px_32px_-22px_rgba(248,113,113,0.7)]'
                : 'bg-red-50 text-red-600 shadow-[0_14px_28px_-20px_rgba(248,113,113,0.45)]'
            }`}
          >
            <p className="text-sm font-medium mb-3">{error}</p>
            <button
              type="button"
              onClick={fetchTrends}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                theme === 'dark'
                  ? 'bg-red-500/30 text-red-100 hover:bg-red-500/40'
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t('app.trending_retry')}
            </button>
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {loading && trends.length === 0 ? (
                <motion.div
                  key="trend-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid gap-2"
                >
                  {Array.from({ length: Math.min(6, limit) }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-3 animate-pulse ${
                        theme === 'dark' ? 'bg-white/[0.06]' : 'bg-gray-100/70'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full ${
                          theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'
                        }`}
                      />
                      <div className="flex-1 space-y-2">
                        <div className={`h-3 w-2/3 rounded ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
                        <div className={`h-3 w-1/3 rounded ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
                      </div>
                      <div
                        className={`w-12 h-3 rounded ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}
                      />
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="trend-list"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid gap-2"
                >
                  {displayedTrends.map((trend) => {
                    const volumeLabel = trend.volume ? formatNumber(trend.volume) : null;
                    const changeLabel =
                      typeof trend.change === 'number' && Number.isFinite(trend.change)
                        ? `${trend.change > 0 ? '+' : ''}${trend.change.toFixed(1)}%`
                        : null;
                    const rankStyle = getRankStyle(trend.rank);

                    return (
                      <motion.button
                        key={trend.id}
                        type="button"
                        onClick={() => handleSelect(trend)}
                        layout
                        whileHover={{ scale: 0.995, y: -1 }}
                        whileTap={{ scale: 0.985 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 24, mass: 0.9 }}
                        className={`group grid grid-cols-[auto,1fr,auto] items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200 cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-white/[0.045] hover:bg-white/[0.08]'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <span
                          style={rankStyle}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                        >
                          {trend.rank}
                        </span>
                        <div className="min-w-0 text-left">
                          <p className={`truncate text-sm font-semibold leading-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {trend.label}
                          </p>
                          {trend.subtitle && (
                            <p className={`truncate text-[11px] mt-1 ${subtitleColor}`}>
                              {trend.subtitle}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 justify-self-end">
                          {volumeLabel && (
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                theme === 'dark' ? 'bg-white/10 text-gray-200' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
                              {t('app.trending_volume', { count: volumeLabel })}
                            </span>
                          )}
                          {(trend.url || changeLabel) && (
                            <span
                              className={`flex items-center gap-1 text-xs font-medium ${
                                changeLabel
                                  ? trend.change && trend.change > 0
                                    ? 'text-emerald-500'
                                    : 'text-amber-500'
                                  : theme === 'dark'
                                    ? 'text-gray-500'
                                    : 'text-gray-400'
                              }`}
                            >
                              {changeLabel ?? <ExternalLink className="w-3.5 h-3.5" />}
                            </span>
                          )}
                          <ArrowUpRight
                            className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                              theme === 'dark'
                                ? 'text-gray-500 group-hover:text-gray-300 group-hover:translate-x-1'
                                : 'text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1'
                            }`}
                          />
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {hasOverflow && (
              <div className="flex">
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className={`ml-auto inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    theme === 'dark'
                      ? 'bg-white/10 text-gray-200 hover:bg-white/15'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isExpanded ? t('app.trending_show_less', { defaultValue: 'Show less' }) : t('app.trending_show_more', { count: hiddenCount, defaultValue: `Show ${hiddenCount} more` })}
                  <ArrowUpRight className={`w-3.5 h-3.5 ${isExpanded ? 'rotate-45' : ''}`} />
                </button>
              </div>
            )}

            {!loading && trends.length === 0 && (
              <div
                className={`rounded-2xl p-6 text-center text-sm ${
                  theme === 'dark' ? 'bg-white/[0.05] text-gray-400' : 'bg-gray-100/60 text-gray-500'
                }`}
              >
                {t('app.trending_empty')}
              </div>
            )}

            {loading && trends.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                  {t('app.trending_refresh')}
                </span>
              </div>
            )}
          </>
        )}

        <button
          type="button"
          onClick={() => handleSelect({
            id: 'open-search',
            label: t('app.trending_view_more'),
            query: '',
            subtitle: null,
            volume: null,
            change: null,
            url: null,
            raw: {},
            rank: 0,
          })}
          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            theme === 'dark'
              ? 'bg-white/10 text-white hover:bg-white/15'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          <Search className="w-4 h-4" />
          {t('app.trending_view_more')}
        </button>
      </div>
    </motion.div>
  );
};

export default TrendsPanel;

