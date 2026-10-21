import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Sheet } from '@/components/ui/Interface'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
  icon?: ReactNode
}

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, variant = 'default' }: ConfirmationModalProps) {
  const { t } = useTranslation('common')
  return <Sheet isOpen={isOpen} onClose={onClose} title={title} variant="alert" actions={<>
    <button type="button" className="cv-btn cv-btn-secondary" onClick={onClose}>{cancelText || t('common.cancel', { defaultValue: 'Cancel' })}</button>
    <button type="button" className="cv-btn" style={variant === 'danger' ? { background: 'var(--cv-critical)', color: '#fff' } : undefined} onClick={onConfirm}>{confirmText || t('common.confirm', { defaultValue: 'Confirm' })}</button>
  </>}><p>{message}</p></Sheet>
}
