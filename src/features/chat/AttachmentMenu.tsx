import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Popover from '@/components/ui/Popover';
import TelegramIcon from './TelegramIcon';
import Switch from '@/components/ui/Switch';
import './attachment-menu.css';

export default function AttachmentMenu({ anchor, onClose, onPhoto, onVideo, viewOnce, onViewOnce, expiry, onExpiry, expiryOptions, expiryLabel }: {
  anchor: HTMLElement | null; onClose: () => void; onPhoto: () => void; onVideo: () => void;
  viewOnce: boolean; onViewOnce: () => void; expiry: number; onExpiry: (value: number) => void;
  expiryOptions: readonly number[]; expiryLabel: (value: number) => string;
}) {
  const { t } = useTranslation('common');
  const [choosingExpiry, setChoosingExpiry] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const expiryTrigger = useRef<HTMLButtonElement>(null);
  const opened = useRef(false);
  useLayoutEffect(() => {
    const target = choosingExpiry
      ? menu.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')
      : opened.current ? expiryTrigger.current : menu.current?.querySelector<HTMLButtonElement>('button');
    target?.focus({ preventScroll: true }); opened.current = true;
  }, [choosingExpiry]);
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && choosingExpiry) { event.preventDefault(); event.stopPropagation(); setChoosingExpiry(false); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : event.key === 'ArrowDown' ? (current + 1) % items.length : (current + items.length - 1) % items.length;
    event.preventDefault(); items[next]?.focus({ preventScroll: true });
  };
  return <Popover anchor={anchor} onClose={onClose} widthRem={16.25} heightRem={22} autoHeight className="cv-attachment-menu" label={t('messages.composer_options')}>
    <div ref={menu} id="chat-composer-options" className="cv-attachment-menu-items" role="menu" aria-label={t(choosingExpiry ? 'messages.message_expiry' : 'messages.composer_options')} onKeyDownCapture={keyboard}>
      {choosingExpiry ? <>
        <button type="button" role="menuitem" className="cv-attachment-action cv-attachment-back" onClick={() => setChoosingExpiry(false)}><TelegramIcon name="arrow_prev" /><span>{t('messages.message_expiry')}</span></button>
        <div className="cv-attachment-separator" role="separator" />
        {expiryOptions.map(value => <button key={value} type="button" role="menuitemradio" aria-checked={value === expiry} className="cv-attachment-action cv-attachment-expiry-option" onClick={() => { onExpiry(value); setChoosingExpiry(false); }}><span>{expiryLabel(value)}</span><TelegramIcon name="check" className="cv-attachment-check" /></button>)}
      </> : <>
        <button type="button" role="menuitem" className="cv-attachment-action" onClick={() => { onPhoto(); onClose(); }}><TelegramIcon name="image" /><span>{t('messages.photo')}</span></button>
        <button type="button" role="menuitem" className="cv-attachment-action" onClick={() => { onVideo(); onClose(); }}><TelegramIcon name="videocamera" /><span>{t('messages.video')}</span></button>
        <div className="cv-attachment-separator" role="separator" />
        <div className="cv-attachment-action" title={t('messages.view_once_description')}><TelegramIcon name="eye" /><span>{t('messages.view_once_label')}</span><Switch className="cv-chat-setting-switch" checked={viewOnce} onChange={onViewOnce} aria-label={t('messages.view_once_label')} /></div>
        <button ref={expiryTrigger} type="button" role="menuitem" className="cv-attachment-action cv-attachment-expiry" aria-haspopup="menu" aria-expanded={false} title={t('messages.message_expiry_description')} onClick={() => setChoosingExpiry(true)}><TelegramIcon name="auto_delete_circle_clock" /><span><span>{t('messages.message_expiry')}</span><small>{expiryLabel(expiry)}</small></span><TelegramIcon name="arrow_next" /></button>
      </>}
    </div>
  </Popover>;
}
