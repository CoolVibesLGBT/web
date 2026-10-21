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
  return <Popover anchor={anchor} onClose={onClose} widthRem={16.25} heightRem={16} autoHeight className="cv-attachment-menu" label={t('messages.composer_options')}>
    <div id="chat-composer-options" className="cv-attachment-menu-items">
      <button type="button" className="cv-attachment-action" onClick={() => { onPhoto(); onClose(); }}><TelegramIcon name="image" /><span>{t('messages.photo')}</span></button>
      <button type="button" className="cv-attachment-action" onClick={() => { onVideo(); onClose(); }}><TelegramIcon name="videocamera" /><span>{t('messages.video')}</span></button>
      <div className="cv-attachment-separator" />
      <div className="cv-attachment-action" title={t('messages.view_once_description')}><TelegramIcon name="eye" /><span>{t('messages.view_once_label')}</span><Switch className="cv-chat-setting-switch" checked={viewOnce} onChange={onViewOnce} aria-label={t('messages.view_once_label')} /></div>
      <label className="cv-attachment-expiry" title={t('messages.message_expiry_description')}><TelegramIcon name="auto_delete_circle_clock" /><span><span>{t('messages.message_expiry')}</span><select value={expiry} onChange={event => onExpiry(Number(event.target.value))} aria-label={t('messages.message_expiry')}>{expiryOptions.map(value => <option key={value} value={value}>{expiryLabel(value)}</option>)}</select></span></label>
    </div>
  </Popover>;
}
