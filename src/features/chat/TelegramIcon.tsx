import paths from './telegram-icons.json';

/** Original outlines from the supplied tweb tgico.svg, rendered without an icon font. */
export default function TelegramIcon({ name, className = '' }: { name: keyof typeof paths; className?: string }) {
  return <svg className={`cv-telegram-icon ${className}`} viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true" focusable="false"><path d={paths[name]} transform="translate(0 1024) scale(1 -1)" /></svg>;
}
