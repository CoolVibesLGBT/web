import type { LucideIcon } from 'lucide-react'
import ViewTabs from '@/components/ui/ViewTabs'

export interface HeaderTabItem<T extends string> { id: T; icon: LucideIcon; label: string; locked?: boolean }
interface HeaderTabGroupProps<T extends string> {
  items: HeaderTabItem<T>[]
  activeId: T
  onSelect: (id: T) => void
  layoutId: string
  disabled?: boolean
  tooltipIdPrefix: string
  showLabel?: boolean
}

/** Named buttons keep every view reachable on touch, keyboard and screen readers. */
export default function HeaderTabGroup<T extends string>({ items, activeId, onSelect, disabled }: HeaderTabGroupProps<T>) {
  return <ViewTabs items={items.map(({ icon: Icon, ...item }) => ({ ...item, icon: <Icon /> }))} activeId={activeId} onSelect={onSelect} disabled={disabled} label={items.map(item => item.label).join(', ')} variant="segmented" />
}
