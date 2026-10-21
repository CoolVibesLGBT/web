import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, ListRow } from '@/components/ui/Interface';
import TelegramIcon from '@/features/chat/TelegramIcon';
import { socialApi } from './socialApi';
import './photo-upload.css';

const MAX_FILES = 10;
const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;
function Preview({ file }: { file: File }) {
 const [src, setSrc] = useState(''), [failed, setFailed] = useState(false);
 useEffect(() => { const url = URL.createObjectURL(file); setSrc(url); return () => URL.revokeObjectURL(url); }, [file]);
 return src && !failed ? <img src={src} alt={file.name} onError={() => setFailed(true)} /> : <TelegramIcon name="image" />;
}

export default function PhotoUploadSheet({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
 const { t } = useTranslation('common');
 const [files, setFiles] = useState<File[]>([]), [busy, setBusy] = useState(false), [dragging, setDragging] = useState(false);
 const [error, setError] = useState(''), [progress, setProgress] = useState<number | null>(null);
 const input = useRef<HTMLInputElement>(null), locked = useRef(false);
 const choose = (added: File[]) => {
  if (locked.current || !added.length) return;
  const supported = added.every(file => !file.type ? /\.(jpe?g|png|gif|webp|bmp|tiff?)$/i.test(file.name) : /^image\/(jpeg|png|gif|webp|bmp|x-ms-bmp|tiff)$/.test(file.type));
  if (!supported || added.some(file => !file.size)) { setError('social.invalid_photo'); return; }
  const unique = new Map(files.map(file => [fileKey(file), file])); added.forEach(file => unique.set(fileKey(file), file));
  if (unique.size > MAX_FILES) { setError('social.upload_limit'); return; }
  setFiles([...unique.values()]); setError('');
 };
 const submit = async () => {
  if (locked.current || !files.length) return;
  locked.current = true; setBusy(true); setError(''); setProgress(null);
  try {
   const response = await socialApi.upload(files, setProgress);
   if (!response.photos?.length) throw new Error('Missing uploaded photos');
   onUploaded(); onClose();
  } catch { setError('chat_actions.action_failed'); }
  finally { locked.current = false; setBusy(false); }
 };
 return <Sheet isOpen onClose={() => { if (!locked.current) onClose(); }} title={t('social.upload_photos')} className="cv-panel-sheet cv-private-photo-upload" closeIcon={<TelegramIcon name="close" />} actions={<div className="cv-photo-upload-actions"><button type="button" className="cv-btn cv-btn-text" disabled={busy} onClick={onClose}>{t('app.cancel')}</button><button type="button" className="cv-profile-social-primary" disabled={busy || !files.length} onClick={() => void submit()}>{busy ? t(progress === 100 ? 'social.processing_photos' : 'social.uploading_photos') : t('social.upload_photos')}</button></div>}>
  <div className="cv-panel-card cv-photo-upload-privacy"><ListRow icon={<TelegramIcon name="lock" />} title={t('social.private_photos')} description={t('social.private_upload_hint')} /></div>
  <input ref={input} hidden type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff,.tif,.tiff" multiple disabled={busy} aria-label={t('social.choose_photos')} onChange={event => { const selected = Array.from(event.target.files || []); event.currentTarget.value = ''; choose(selected); }} />
  <div className={`cv-photo-upload-selection${dragging ? ' is-dragging' : ''}`} onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }} onDrop={event => { event.preventDefault(); setDragging(false); choose(Array.from(event.dataTransfer.files)); }}>
   {files.length ? <div className="cv-photo-upload-grid">{files.map(file => <article key={fileKey(file)} className="cv-photo-upload-item"><div className="cv-photo-upload-thumb"><Preview file={file} /><button type="button" aria-label={`${t('chat_actions.remove_photo')}: ${file.name}`} disabled={busy} onClick={() => { setFiles(previous => previous.filter(item => item !== file)); setError(''); }}><TelegramIcon name="close" /></button></div><span title={file.name}>{file.name}</span></article>)}</div> : <div className="cv-photo-upload-empty"><TelegramIcon name="image" /><p>{t('social.no_photos')}</p></div>}
   <button type="button" className="cv-photo-upload-choose" disabled={busy || files.length === MAX_FILES} onClick={() => input.current?.click()}><TelegramIcon name="attach" />{t('social.choose_photos')}</button>
   <p className="cv-photo-upload-hint">{files.length > 0 && <span>{t('chat_actions.selected', { count: files.length })} · </span>}{t('social.upload_limit', { count: MAX_FILES })}</p>
  </div>
  {error && <p className="cv-profile-social-error" role="alert">{t(error, { count: MAX_FILES })}</p>}
  {busy && <div className="cv-photo-upload-progress" role="status"><span>{t(progress === 100 ? 'social.processing_photos' : 'social.uploading_photos')}</span><progress max={100} value={progress ?? undefined} aria-label={t('social.uploading_photos')} /></div>}
 </Sheet>;
}
