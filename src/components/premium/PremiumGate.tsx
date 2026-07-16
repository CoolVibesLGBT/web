import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Crown, X } from 'lucide-react'

type ThemeMode = 'dark' | 'light'

type PremiumGateCopy = {
  badge?: string
  title: string
  description: string
  cta: string
  dismiss?: string
  highlights?: string[]
  footnote?: string
}

type PremiumGateInlineProps = {
  theme: ThemeMode
  copy: PremiumGateCopy
  onUpgrade: () => void
  onClose?: () => void
  className?: string
}

export const PremiumGateInline: React.FC<PremiumGateInlineProps> = ({
  theme,
  copy,
  onUpgrade,
  onClose,
  className = '',
}) => {
  const dark = theme === 'dark'

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 ${
        dark
          ? 'cv-card-surface-solid border-white/15 text-white shadow-[0_24px_60px_-28px_rgba(0,0,0,0.75)]'
          : 'border-black/10 bg-white text-black shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)]'
      } ${className}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          dark
            ? 'bg-[radial-gradient(130%_130%_at_0%_0%,rgba(167,139,250,0.20),transparent_50%),radial-gradient(120%_120%_at_100%_100%,rgba(16,185,129,0.10),transparent_45%)]'
            : 'bg-[radial-gradient(130%_130%_at_0%_0%,rgba(59,130,246,0.12),transparent_50%),radial-gradient(120%_120%_at_100%_100%,rgba(16,185,129,0.10),transparent_45%)]'
        }`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          <div
            className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              dark
                ? 'bg-gradient-to-br from-amber-300/25 to-fuchsia-300/20 text-amber-100'
                : 'bg-gradient-to-br from-amber-100 to-fuchsia-100 text-amber-700'
            }`}
          >
            <Crown className="h-5 w-5" strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            {copy.badge && (
              <p className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                dark ? 'bg-white/10 text-white/75' : 'bg-black/[0.06] text-black/60'
              }`}>
                {copy.badge}
              </p>
            )}
            <p className={`mt-2 text-base font-semibold leading-tight sm:text-lg ${dark ? 'text-white' : 'text-gray-900'}`}>
              {copy.title}
            </p>
            <p className={`mt-2 text-xs leading-relaxed sm:text-sm ${dark ? 'text-white/75' : 'text-black/65'}`}>
              {copy.description}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              dark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-black hover:bg-black/10'
            }`}
            aria-label={copy.dismiss || 'Close'}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {Array.isArray(copy.highlights) && copy.highlights.length > 0 && (
        <div className="relative mt-4 space-y-2.5">
          {copy.highlights.map((highlight) => (
            <div key={highlight} className="flex items-center gap-2 text-xs sm:text-sm">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                dark ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
              }`}>
                <Check className="h-3.5 w-3.5" strokeWidth={2.8} />
              </span>
              <span className={dark ? 'text-white/80' : 'text-black/70'}>{highlight}</span>
            </div>
          ))}
        </div>
      )}

      <div className="relative mt-5 flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={onUpgrade}
          className={`h-11 flex-1 rounded-full px-4 text-sm font-semibold transition ${
            dark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'
          }`}
        >
          {copy.cta}
        </button>

        {onClose && copy.dismiss && (
          <button
            type="button"
            onClick={onClose}
            className={`h-11 rounded-full px-4 text-sm font-semibold transition ${
              dark
                ? 'border border-white/20 text-white/85 hover:bg-white/10'
                : 'border border-black/15 text-black/70 hover:bg-black/[0.04]'
            }`}
          >
            {copy.dismiss}
          </button>
        )}
      </div>

      {copy.footnote && (
        <p className={`relative mt-3 text-[11px] leading-relaxed ${dark ? 'text-white/60' : 'text-black/55'}`}>
          {copy.footnote}
        </p>
      )}
    </div>
  )
}

type PremiumGateModalProps = {
  open: boolean
  theme: ThemeMode
  copy: PremiumGateCopy
  onClose: () => void
  onUpgrade: () => void
}

export const PremiumGateModal: React.FC<PremiumGateModalProps> = ({
  open,
  theme,
  copy,
  onClose,
  onUpgrade,
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="cv-modal-glass-backdrop fixed inset-0 z-[1200] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-[460px]"
          onClick={(event) => event.stopPropagation()}
        >
          <PremiumGateInline
            theme={theme}
            copy={copy}
            onUpgrade={onUpgrade}
            onClose={onClose}
            className={theme === 'dark' ? 'cv-card-surface-solid border-white/15' : 'bg-white border-black/10'}
          />
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)
