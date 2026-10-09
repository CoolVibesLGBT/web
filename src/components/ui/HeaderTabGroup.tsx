import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Lock } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export interface HeaderTabItem<T extends string> {
  id: T;
  icon: LucideIcon;
  label: string;
  locked?: boolean;
}

interface HeaderTabGroupProps<T extends string> {
  items: HeaderTabItem<T>[];
  activeId: T;
  onSelect: (id: T) => void;
  layoutId: string;
  disabled?: boolean;
  tooltipIdPrefix: string;
  /** Show the label inline (at xl+) instead of as a hover tooltip, and let
   * buttons size to content instead of a fixed icon-only width. */
  showLabel?: boolean;
}

/**
 * Shared segmented tab/view-switcher used inside the floating header pills
 * (nearby, check-in, match, places, classifieds). One implementation so the
 * active-state treatment (brand-colored icon + sliding underline, matching
 * HomeScreen's .cv-tab-bar) only needs fixing in one place.
 */
function HeaderTabGroup<T extends string>({
  items,
  activeId,
  onSelect,
  layoutId,
  disabled = false,
  tooltipIdPrefix,
  showLabel = false,
}: HeaderTabGroupProps<T>) {
  const { theme } = useTheme();

  return (
    <div className={`flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-visible rounded-full p-1 ${showLabel ? 'xl:justify-start' : ''}`}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeId === item.id;
        const tooltipId = `${tooltipIdPrefix}-${item.id}`;
        return (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            disabled={disabled}
            whileTap={{ scale: 0.96 }}
            aria-labelledby={tooltipId}
            aria-pressed={isActive}
            title={showLabel ? item.label : undefined}
            className={`group relative flex h-full items-center justify-center rounded-full transition-colors disabled:cursor-default disabled:opacity-60 ${
              showLabel ? 'min-w-0 flex-1 gap-1.5 px-3' : 'w-10 shrink-0'
            } ${
              isActive
                ? theme === 'dark' ? 'text-white' : 'text-slate-950'
                : theme === 'dark'
                  ? 'text-zinc-500 hover:text-white'
                  : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-[var(--color-brand)]"
                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              />
            )}
            <span className="relative z-10 flex min-w-0 items-center gap-1.5">
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {item.locked && <Lock className="h-3 w-3 shrink-0" />}
              {showLabel && (
                <span className={`hidden min-w-0 truncate text-[15px] min-[1500px]:inline ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              )}
            </span>
            {!showLabel && (
              <span
                id={tooltipId}
                role="tooltip"
                className={`pointer-events-none absolute left-1/2 top-full z-[700] mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[9px] font-bold normal-case tracking-normal opacity-0 shadow-xl transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 ${
                  theme === 'dark' ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'
                }`}
              >
                {item.label}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

export default HeaderTabGroup;
