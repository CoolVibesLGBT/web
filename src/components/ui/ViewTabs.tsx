import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { GroupedSection, ListRow, Sheet } from '@/components/ui/Interface'
import { fitTabs } from '@/components/ui/tabLayout'

export interface ViewTabItem<T extends string> {
  id: T
  label: string
  icon?: ReactNode
  count?: number
  locked?: boolean
  disabled?: boolean
}

interface Props<T extends string> {
  items: readonly ViewTabItem<T>[]
  activeId: T
  onSelect: (id: T) => void
  label: string
  disabled?: boolean
  variant?: 'tabs' | 'segmented'
}

/** Measure real labels instead of squeezing tabs or making labels smaller. */
export default function ViewTabs<T extends string>({ items, activeId, onSelect, label, disabled, variant = 'tabs' }: Props<T>) {
  const { t, i18n } = useTranslation('common')
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const measurements = useRef<Array<HTMLSpanElement | null>>([])
  const moreMeasurement = useRef<HTMLSpanElement>(null)
  const pendingFocus = useRef<T | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [size, setSize] = useState<{ width: number; widths: number[]; more: number }>({ width: 0, widths: [], more: 88 })
  const signature = items.map(item => `${item.id}:${item.label}:${item.count ?? ''}:${!!item.icon}:${!!item.locked}`).join('|')
  const moreLabel = t('app.nav.more')

  useLayoutEffect(() => {
    const node = root.current
    if (!node) return
    let cancelled = false
    const measure = () => {
      if (cancelled) return
      const width = Math.floor(node.clientWidth)
      const widths = measurements.current.slice(0, items.length).map(element => Math.ceil(element?.getBoundingClientRect().width || 96))
      const more = Math.ceil(moreMeasurement.current?.getBoundingClientRect().width || 88)
      setSize(previous => previous.width === width && previous.more === more && previous.widths.length === widths.length && widths.every((value, index) => previous.widths[index] === value) ? previous : { width, widths, more })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    measurements.current.slice(0, items.length).forEach(element => { if (element) observer.observe(element) })
    void document.fonts?.ready.then(measure)
    return () => { cancelled = true; observer.disconnect() }
  }, [signature, moreLabel])

  useLayoutEffect(() => {
    if (pendingFocus.current !== activeId || menuOpen) return
    pendingFocus.current = null
    document.getElementById(`${id}-${activeId}`)?.focus()
  }, [activeId, id, menuOpen])

  const activeIndex = Math.max(0, items.findIndex(item => item.id === activeId))
  const widths = items.map((_, index) => size.widths[index] || 96)
  const visibleIndexes = fitTabs(widths, size.width, size.more, activeIndex)
  const hiddenItems = items.filter((_, index) => !visibleIndexes.includes(index))
  useEffect(() => { if (hiddenItems.length === 0) setMenuOpen(false) }, [hiddenItems.length])
  const select = (item: ViewTabItem<T>) => {
    if (disabled || item.disabled) return
    pendingFocus.current = item.id
    setMenuOpen(false)
    onSelect(item.id)
  }
  const contents = (item: ViewTabItem<T>) => <>
    {item.icon && <span className="cv-adaptive-icon" aria-hidden="true">{item.icon}</span>}
    <span className="cv-adaptive-label">{item.label}</span>
    {typeof item.count === 'number' && item.count > 0 && <span className="cv-adaptive-count">{item.count}</span>}
    {item.locked && <Lock className="cv-adaptive-lock" aria-hidden="true" />}
  </>

  return <div ref={root} className={`cv-adaptive-tabs cv-adaptive-tabs-${variant}`}>
    <div className="cv-adaptive-visible" role="tablist" aria-label={label} onKeyDown={event => {
      if (disabled || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
      const enabled = items.filter(item => !item.disabled)
      if (!enabled.length) return
      event.preventDefault()
      const current = Math.max(0, enabled.findIndex(item => item.id === activeId))
      const direction = i18n.dir() === 'rtl' ? -1 : 1
      const offset = event.key === 'ArrowRight' ? direction : -direction
      const next = event.key === 'Home' ? enabled[0] : event.key === 'End' ? enabled[enabled.length - 1] : enabled[(current + offset + enabled.length) % enabled.length]
      select(next)
    }}>
      {visibleIndexes.map(index => {
        const item = items[index]
        return <button type="button" role="tab" id={`${id}-${item.id}`} key={item.id} className="cv-adaptive-tab" aria-selected={item.id === activeId} tabIndex={item.id === activeId ? 0 : -1} disabled={disabled || item.disabled} onClick={() => select(item)}>{contents(item)}</button>
      })}
    </div>
    {hiddenItems.length > 0 && <button type="button" className="cv-adaptive-more" onClick={() => setMenuOpen(true)} disabled={disabled} aria-haspopup="dialog" aria-expanded={menuOpen} aria-label={`${label}: ${moreLabel}`}><span>{moreLabel}</span><ChevronDown aria-hidden="true" /></button>}
    <div className="cv-adaptive-measure" aria-hidden="true" inert>
      {items.map((item, index) => <span ref={node => { measurements.current[index] = node }} className="cv-adaptive-tab" key={item.id}>{contents(item)}</span>)}
      <span ref={moreMeasurement} className="cv-adaptive-more"><span>{moreLabel}</span><ChevronDown /></span>
    </div>
    <Sheet isOpen={menuOpen && hiddenItems.length > 0} onClose={() => setMenuOpen(false)} title={label}>
      <GroupedSection>{items.map(item => <ListRow key={item.id} title={item.label} icon={item.icon} value={item.count ? String(item.count) : undefined} onClick={disabled || item.disabled ? undefined : () => select(item)} accessory={item.id === activeId ? <Check aria-label={item.label} className="h-5 w-5 text-[var(--cv-action-tint)]" /> : item.locked ? <Lock aria-hidden="true" className="h-4 w-4" /> : undefined} />)}</GroupedSection>
    </Sheet>
  </div>
}
