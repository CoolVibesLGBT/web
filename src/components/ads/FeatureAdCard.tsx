import React from 'react'
import { Megaphone } from 'lucide-react'

type FeatureAdCardProps = {
  theme: 'dark' | 'light'
  placement: 'flows' | 'nearby' | 'live'
}

const placementLabel: Record<FeatureAdCardProps['placement'], string> = {
  flows: 'Flows',
  nearby: 'Nearby',
  live: 'Live',
}

const FeatureAdCard: React.FC<FeatureAdCardProps> = ({ theme, placement }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 ${
        theme === 'dark'
          ? 'border-white/10 bg-white/[0.03]'
          : 'border-black/10 bg-white'
      }`}
    >
      <div
        className={`absolute inset-0 pointer-events-none ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-white/[0.08] via-transparent to-transparent'
            : 'bg-gradient-to-br from-black/[0.04] via-transparent to-transparent'
        }`}
      />
      <div className="relative flex items-start gap-3">
        <div
          className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${
            theme === 'dark'
              ? 'bg-white/10 text-white'
              : 'bg-black/10 text-black'
          }`}
        >
          <Megaphone className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p
            className={`text-[11px] font-bold uppercase tracking-[0.14em] ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            Sponsored
          </p>
          <p
            className={`mt-1 text-sm sm:text-base font-semibold leading-tight ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            Premium showcase slot ({placementLabel[placement]})
          </p>
          <p
            className={`mt-1 text-xs sm:text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Feature flag aktif olduğunda reklam alanı burada görünür.
          </p>
        </div>
      </div>
    </div>
  )
}

export default FeatureAdCard
