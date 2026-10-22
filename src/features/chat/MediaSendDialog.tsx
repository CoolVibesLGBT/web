import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sheet } from '@/components/ui/Interface'
import TelegramIcon from '@/features/chat/TelegramIcon'
import ViewOnceDust from '@/features/chat/ViewOnceDust'

const EmoticonPicker = lazy(() => import('@/features/emoticons/EmoticonPicker'))

type Props = {
  images: File[]
  videos: File[]
  caption: string
  viewOnce: boolean
  busy: boolean
  error?: boolean
  onCaption: (value: string) => void
  onViewOnce: () => void
  onRemoveImage: (index: number) => void
  onRemoveVideo: (index: number) => void
  onAdd: () => void
  onClose: () => void
  onSend: () => void
}
function Preview({ file, video, concealed, onRemove }: { file: File; video: boolean; concealed: boolean; onRemove: () => void }) {
  const { t } = useTranslation('common')
  const [url, setUrl] = useState('')
  useEffect(() => {
    const value = URL.createObjectURL(file)
    setUrl(value)
    return () => URL.revokeObjectURL(value)
  }, [file])
  return <div className="cv-media-send-item" data-concealed={concealed}>
    {url && (video ? <video src={url} controls preload="metadata" playsInline /> : <img src={url} alt={file.name} />)}
    {concealed && <><ViewOnceDust /><span className="cv-media-send-once" aria-hidden="true">1</span></>}
    <button type="button" className="cv-media-send-remove" aria-label={t('messages.remove_attachment', { name: file.name })} onClick={onRemove}><TelegramIcon name="delete" /></button>
  </div>
}
export default function MediaSendDialog(props: Props) {
  const { t } = useTranslation('common')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const emojiRef = useRef<HTMLButtonElement>(null)
  const captionRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const total = props.images.length + props.videos.length
  const canViewOnce = props.images.length === 1 && props.videos.length === 0
  useEffect(() => { if (!total) setEmojiOpen(false) }, [total])
  return <Sheet isOpen={total > 0} onClose={() => { if (!props.busy) props.onClose() }} title={`${t(props.videos.length ? 'messages.media' : 'messages.photo')} · ${total}`} className="cv-panel-sheet cv-media-send-dialog" closeIcon={<TelegramIcon name="close" />} headerActions={<>
      <button type="button" className="cv-icon-button cv-media-send-menu-toggle" aria-label={t('messages.composer_options')} popoverTarget="cv-media-send-menu" onClick={event => {
        const box = event.currentTarget.getBoundingClientRect()
        const menu = menuRef.current
        if (menu) { menu.style.top = `${box.bottom + 4}px`; menu.style.left = `${Math.max(8, Math.min(box.right - 256, window.innerWidth - 264))}px` }
      }}><TelegramIcon name="more" /></button>
      <div ref={menuRef} id="cv-media-send-menu" popover="auto" className="cv-media-send-menu">
        <button type="button" onClick={() => { menuRef.current?.hidePopover(); props.onAdd() }} disabled={props.busy || props.viewOnce}><TelegramIcon name="plus" />{t('messages.composer_options')}</button>
        {canViewOnce && <button type="button" className="cv-media-send-toggle" disabled={props.busy} aria-pressed={props.viewOnce} onClick={() => { props.onViewOnce(); menuRef.current?.hidePopover() }}><TelegramIcon name="eye" />{t('messages.view_once_label')}{props.viewOnce && <TelegramIcon name="check" />}</button>}
      </div>
    </>} actions={
    <div className="cv-media-send-controls">
      <button ref={emojiRef} type="button" className="cv-icon-button cv-media-send-emoji" aria-label={t('messages.emoji')} aria-expanded={emojiOpen} onClick={() => setEmojiOpen(value => !value)}><TelegramIcon name="smile" /></button>
      <textarea ref={captionRef} rows={1} disabled={props.busy} value={props.caption} aria-label={t('messages.caption')} placeholder={t('messages.caption')} onChange={e => props.onCaption(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (!props.busy) props.onSend() } }} />
        <button type="button" className="cv-media-send-submit" onClick={props.onSend} disabled={props.busy} aria-label={t('messages.send')}><TelegramIcon name="logo" /></button>
    </div>
  }>
    {emojiOpen && <Suspense fallback={null}><EmoticonPicker isOpen emojiOnly presentation="popover" anchor={emojiRef.current} onClose={() => setEmojiOpen(false)} onSelect={selection => {
      if (selection.kind !== 'emoji') return
      const input = captionRef.current
      const start = input?.selectionStart ?? props.caption.length
      const end = input?.selectionEnd ?? start
      props.onCaption(props.caption.slice(0, start) + selection.emoji + props.caption.slice(end))
      requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(start + selection.emoji.length, start + selection.emoji.length) })
    }} /></Suspense>}
    {props.error && <p role="alert">{t('chat_actions.action_failed')}</p>}
    {props.busy && <div role="status"><progress aria-label={t('social.uploading_photos')} />{t('social.uploading_photos')}</div>}
    <div className="cv-media-send-previews" data-album={total > 1}>
      {props.images.map((file,index) => <Preview key={`image-${file.name}-${file.lastModified}-${index}`} file={file} video={false} concealed={props.viewOnce} onRemove={() => { if (!props.busy) props.onRemoveImage(index) }} />)}
      {props.videos.map((file,index) => <Preview key={`video-${file.name}-${file.lastModified}-${index}`} file={file} video concealed={false} onRemove={() => { if (!props.busy) props.onRemoveVideo(index) }} />)}
    </div>
  </Sheet>
}
