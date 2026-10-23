import { useEffect, useLayoutEffect, useId, useRef, type ReactNode, type ReactElement, cloneElement } from 'react'
import { ChevronLeft, ChevronRight, X, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@/router'

export function AppHeader({ title, leading, actions }: { title: string; leading: ReactNode; actions: ReactNode }) {
  return <header className="cv-app-header">
    <div className="cv-app-header-inner">
      <div className="cv-app-header-leading">{leading}</div>
      <span className="cv-app-header-title">{title}</span>
      <div className="cv-app-header-actions">{actions}</div>
    </div>
  </header>
}

/** Shared web controls with Apple visual hierarchy and browser-native behavior. */
export function NavigationBar({ title, onBack, actions, backIcon }: {
  title: string
  onBack?: () => void
  backIcon?: ReactNode
  actions?: ReactNode
}) {
  const { t } = useTranslation('common')
  return (
    <header className="cv-navigation-bar">
      <div className="cv-navigation-leading">
        {onBack && <button type="button" className="cv-icon-button" onClick={onBack} aria-label={t('app.back')}>{backIcon ?? <ChevronLeft aria-hidden="true" />}</button>}
      </div>
      <h1>{title}</h1>
      <div className="cv-navigation-actions">{actions}</div>
    </header>
  )
}

export function GroupedSection({ title, footer, children, className = '' }: {
  title?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}) {
  const id = useId()
  return (
    <section className={`cv-grouped-section ${className}`} aria-labelledby={title ? id : undefined}>
      {title && <h2 id={id} className="cv-section-label">{title}</h2>}
      <div className="cv-grouped-list">{children}</div>
      {footer && <p className="cv-section-footer">{footer}</p>}
    </section>
  )
}

export function ListRow({ icon, title, description, value, accessory, onClick, destructive, selected, checked }: {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  value?: ReactNode
  accessory?: ReactNode
  onClick?: () => void
  destructive?: boolean
  selected?: boolean
  checked?: boolean
}) {
  const content = <>
    {icon && <span className="cv-list-icon" aria-hidden="true">{icon}</span>}
    <span className="cv-list-copy"><span className="cv-list-title">{title}</span>{description && <span className="cv-list-description">{description}</span>}</span>
    {value && <span className="cv-list-value">{value}</span>}
    {accessory ?? (onClick ? <ChevronRight className="cv-list-disclosure" aria-hidden="true" /> : null)}
  </>
  const className = `cv-list-row${destructive ? ' cv-list-row-destructive' : ''}`
  return onClick
    ? <button type="button" className={className} onClick={onClick} role={checked === undefined ? undefined : 'switch'} aria-checked={checked} aria-pressed={checked === undefined ? selected : undefined}>{content}</button>
    : <div className={className}>{content}</div>
}

type FieldControl = { id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }
export function FormField({ label, hint, error, children }: {
  label: string
  hint?: string
  error?: string
  children: ReactElement<FieldControl>
}) {
  const generatedId = useId()
  const id = children.props.id || generatedId
  const descriptionId = `${id}-description`
  const describedBy = [children.props['aria-describedby'], hint || error ? descriptionId : null].filter(Boolean).join(' ') || undefined
  return (
    <div className="cv-form-field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, { id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {(hint || error) && <p id={descriptionId} className={error ? 'cv-field-error' : 'cv-field-hint'} role={error ? 'alert' : undefined}>{error || hint}</p>}
    </div>
  )
}

/** Native HTML dialog provides focus containment, inert background and Escape. */
export function Sheet({ isOpen, onClose, title, children, actions, variant = 'sheet', className = '', headerActions, hideCloseButton = false, closeIcon, leading }: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  actions?: ReactNode
  variant?: 'sheet' | 'alert'
  className?: string
  headerActions?: ReactNode
  hideCloseButton?: boolean
  closeIcon?: ReactNode
  leading?: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const { t } = useTranslation('common')
  useLayoutEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (isOpen && !dialog.open) dialog.showModal()
    if (!isOpen && dialog.open) dialog.close()
    return () => { if (dialog.open) dialog.close() }
  }, [isOpen])
  return (
    <dialog ref={ref} className={`cv-sheet cv-sheet-${variant} ${className}`} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => {
      if (event.target !== event.currentTarget) return
      const rect = event.currentTarget.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose()
    }}>
      <header className="cv-sheet-header">{leading}<h2 id={titleId}>{title}</h2>{!hideCloseButton && <button type="button" className="cv-icon-button" onClick={onClose} aria-label={t('app.close', { defaultValue: 'Close' })}>{closeIcon ?? <X aria-hidden="true" />}</button>}{headerActions}</header>
      <div className="cv-sheet-body">{children}</div>
      {actions && <footer className="cv-sheet-actions">{actions}</footer>}
    </dialog>
  )
}

export function AppTabBar({ items, label }: {
  items: Array<{ id: string; label: string; icon: LucideIcon; active?: boolean; onSelect: () => void }>
  label: string
}) {
  return <nav className="cv-app-tab-bar" aria-label={label}>{items.map(({ id, label: text, icon: Icon, active, onSelect }) => (
    <button type="button" key={id} onClick={onSelect} aria-current={active ? 'page' : undefined} className="cv-app-tab"><Icon aria-hidden="true" /><span>{text}</span></button>
  ))}</nav>
}

/** Browser history remains responsible for Android Back and Safari edge swipe. */
export function usePageBack() {
  const navigate = useNavigate()
  return () => window.history.length > 1 ? navigate(-1) : navigate('/')
}

export function InterfaceViewport() {
  useEffect(() => {
    const viewport = window.visualViewport
    const update = () => {
      const height = viewport?.height ?? window.innerHeight
      document.documentElement.style.setProperty('--cv-viewport-height', `${height}px`)
      const keyboard = window.innerHeight - height > 150
      document.documentElement.toggleAttribute('data-keyboard-open', keyboard)
      const focused = document.activeElement
      if (keyboard && focused instanceof HTMLElement && focused.matches('input, textarea, [contenteditable="true"]')) focused.scrollIntoView({ block: 'nearest' })
    }
    update()
    viewport?.addEventListener('resize', update)
    window.addEventListener('resize', update)
    return () => {
      viewport?.removeEventListener('resize', update)
      window.removeEventListener('resize', update)
      document.documentElement.style.removeProperty('--cv-viewport-height')
      document.documentElement.removeAttribute('data-keyboard-open')
    }
  }, [])
  return null
}
