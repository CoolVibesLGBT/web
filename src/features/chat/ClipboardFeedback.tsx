import { useTranslation } from 'react-i18next';
import './clipboard-feedback.css';

export default function ClipboardFeedback({ status, link = false }: { status: 'copied' | 'failed' | null; link?: boolean }) {
 const { t } = useTranslation('common');
 return <div className="cv-clipboard-feedback" role={status === 'failed' ? 'alert' : 'status'} aria-live="polite" aria-atomic="true">{status && <span data-tone={status}>{t(status === 'failed' ? 'chat_actions.copy_failed' : link ? 'chat_actions.link_copied' : 'chat_actions.copied')}</span>}</div>;
}
