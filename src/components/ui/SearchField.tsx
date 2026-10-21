import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import TelegramIcon from '@/features/chat/TelegramIcon';
import './search-field.css';

/** Shared native search control; icon and clear action follow logical RTL layout. */
export default function SearchField({ value, onChange, label, placeholder = label, className = '', disabled = false }: {
 value: string; onChange: (value: string) => void; label: string; placeholder?: string; className?: string; disabled?: boolean;
}) {
 const { t } = useTranslation('common');
 const input = useRef<HTMLInputElement>(null);
 return <div className={`cv-search-field ${className}`}>
  <TelegramIcon name="search" />
  <input ref={input} className="cv-search-field-input" type="search" value={value} onChange={event => onChange(event.target.value)} aria-label={label} placeholder={placeholder} disabled={disabled} autoComplete="off" autoCapitalize="none" spellCheck={false} />
  {value && <button type="button" aria-label={t('app.close')} disabled={disabled} onClick={() => { onChange(''); input.current?.focus({ preventScroll: true }); }}><TelegramIcon name="close" /></button>}
 </div>;
}
