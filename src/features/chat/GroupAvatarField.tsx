import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet } from '@/components/ui/Interface';
import AppearanceRange from '@/features/appearance/AppearanceRange';
import ChatAvatarImage from './ChatAvatarImage';
import TelegramIcon from './TelegramIcon';
import './group-avatar.css';

function AvatarEditor({ file, onCancel, onApply }: { file: File; onCancel: () => void; onApply: (file: File) => void }) {
 const { t } = useTranslation('common');
 const zoomId = useId();
 const [url, setUrl] = useState(''); const [zoom, setZoom] = useState(1); const [angle, setAngle] = useState(0);
 const [size, setSize] = useState({ width: 0, height: 0 }); const [pan, setPan] = useState({ x: 0, y: 0 });
 const [failed, setFailed] = useState(false); const [busy, setBusy] = useState(false);
 const frame = useRef<HTMLDivElement>(null), image = useRef<HTMLImageElement>(null), drag = useRef<{ id: number; x: number; y: number; panX: number; panY: number } | null>(null);
 const [viewport, setViewport] = useState(280);
 useEffect(() => { const value = URL.createObjectURL(file); setUrl(value); return () => URL.revokeObjectURL(value); }, [file]);
 useEffect(() => { if (!frame.current) return; const observer = new ResizeObserver(entries => setViewport(entries[0].contentRect.width)); observer.observe(frame.current); return () => observer.disconnect(); }, []);
 const rotatedWidth = angle % 180 ? size.height : size.width, rotatedHeight = angle % 180 ? size.width : size.height;
 const scale = size.width ? viewport / Math.min(rotatedWidth, rotatedHeight) * zoom : 1;
 const clampPan = (x: number, y: number) => ({ x: Math.max(-(rotatedWidth * scale - viewport) / 2, Math.min((rotatedWidth * scale - viewport) / 2, x)), y: Math.max(-(rotatedHeight * scale - viewport) / 2, Math.min((rotatedHeight * scale - viewport) / 2, y)) });
 const apply = async () => {
  if (!image.current || !size.width || busy) return;
  setBusy(true); setFailed(false);
  try {
   const canvas = document.createElement('canvas'); canvas.width = canvas.height = 640;
   const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas unavailable');
   context.fillStyle = '#fff'; context.fillRect(0, 0, 640, 640); context.translate(320 + pan.x * 640 / viewport, 320 + pan.y * 640 / viewport); context.rotate(angle * Math.PI / 180); context.scale(scale * 640 / viewport, scale * 640 / viewport); context.drawImage(image.current, -size.width / 2, -size.height / 2, size.width, size.height);
   const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('Image export failed')), 'image/jpeg', .92));
   onApply(new File([blob], 'group-avatar.jpg', { type: 'image/jpeg' }));
  } catch { setFailed(true); } finally { setBusy(false); }
 };
 return <Sheet isOpen onClose={() => { if (!busy) onCancel(); }} className="cv-avatar-editor" title={t('chat_actions.group_avatar')} closeIcon={<TelegramIcon name="close" />} actions={<><button type="button" className="cv-avatar-rotate" onClick={() => { setAngle(value => (value + 90) % 360); setPan({ x: 0, y: 0 }); setZoom(1); }} aria-label={t('chat_actions.rotate_photo')} disabled={busy}><TelegramIcon name="rotate" /></button><button type="button" className="cv-avatar-apply" disabled={busy || !size.width || failed} onClick={() => void apply()}>{t('chat_actions.save')}</button></>}>
  <div ref={frame} className="cv-avatar-crop" tabIndex={0} aria-label={t('chat_actions.crop_photo')} onKeyDown={event => { const move = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] }[event.key]; if (move) { event.preventDefault(); setPan(previous => clampPan(previous.x + move[0], previous.y + move[1])); } }} onPointerDown={event => { drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={event => { if (drag.current?.id === event.pointerId) setPan(clampPan(drag.current.panX + event.clientX - drag.current.x, drag.current.panY + event.clientY - drag.current.y)); }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
   {url && <img ref={image} src={url} alt="" draggable={false} onLoad={event => { const img = event.currentTarget; if (img.naturalWidth > 8192 || img.naturalHeight > 8192 || img.naturalWidth * img.naturalHeight > 32000000) { setFailed(true); return; } setSize({ width: img.naturalWidth, height: img.naturalHeight }); }} onError={() => setFailed(true)} style={{ width: size.width ? size.width * scale : '100%', height: size.height ? size.height * scale : '100%', transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) rotate(${angle}deg)` }} />}
   <span className="cv-avatar-crop-mask" />
  </div>
  <label htmlFor={zoomId}>{t('chat_actions.zoom_photo')}</label><AppearanceRange id={zoomId} min={1} max={3} step={.01} value={zoom} onChange={value => { setZoom(value); setPan({ x: 0, y: 0 }); }} />
  {failed && <p role="alert">{t('chat_actions.avatar_invalid')}</p>}
 </Sheet>;
}

export default function GroupAvatarField({ value, initialUrl, onChange, disabled }: { value: File | null; initialUrl?: string | null; onChange: (file: File | null) => void; disabled?: boolean }) {
 const { t } = useTranslation('common'); const input = useRef<HTMLInputElement>(null);
 const [editing, setEditing] = useState<File | null>(null), [preview, setPreview] = useState(''), [failed, setFailed] = useState(false);
 useEffect(() => { if (!value) { setPreview(''); return; } const url = URL.createObjectURL(value); setPreview(url); return () => URL.revokeObjectURL(url); }, [value]);
 return <div className="cv-group-avatar-field">
  <input ref={input} hidden type="file" accept="image/*" aria-label={t('chat_actions.group_avatar')} disabled={disabled} onChange={event => { const file = event.target.files?.[0]; event.currentTarget.value = ''; if (!file) return; if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) { setFailed(true); return; } setFailed(false); setEditing(file); }} />
  <button type="button" className="cv-group-avatar" onClick={() => input.current?.click()} disabled={disabled} aria-label={t('chat_actions.group_avatar')}><TelegramIcon name="camera" />{preview ? <img src={preview} alt="" /> : initialUrl && <ChatAvatarImage protectedMedia src={initialUrl} alt="" />}<span className="cv-group-avatar-edit"><TelegramIcon name="camera" /></span></button>
  {(preview || initialUrl) && <button type="button" className="cv-group-avatar-remove" disabled={disabled} onClick={() => onChange(null)}>{t('chat_actions.remove_photo')}</button>}
  {failed && <p role="alert">{t('chat_actions.avatar_invalid')}</p>}
  {editing && <AvatarEditor file={editing} onCancel={() => setEditing(null)} onApply={file => { onChange(file); setEditing(null); }} />}
 </div>;
}
