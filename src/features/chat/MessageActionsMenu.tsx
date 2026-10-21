import { forwardRef } from 'react';
import TelegramIcon from './TelegramIcon';
import type icons from './telegram-icons.json';
import './message-actions.css';

export type MessageAction = { id: string; label: string; icon: keyof typeof icons; run: () => void; danger?: boolean };

/** tweb contextMenu + _button.scss; actions are gated by the chat's capabilities. */
export default forwardRef<HTMLDivElement, { actions: MessageAction[]; label: string; position: { x: number; y: number } | null }>(function MessageActionsMenu({ actions, label, position }, ref) {
  return <div ref={ref} role="menu" aria-label={label} tabIndex={-1} className="message-context-menu cv-message-actions" style={{ left: position?.x ?? 0, top: position?.y ?? 0, visibility: position ? 'visible' : 'hidden' }} onClick={event => event.stopPropagation()} onKeyDown={event => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : event.key === 'ArrowDown' ? (current + 1) % items.length : (current <= 0 ? items.length : current) - 1;
    items[index]?.focus({ preventScroll: true });
  }}>{actions.map(action => <button key={action.id} data-action={action.id} type="button" role="menuitem" tabIndex={-1} data-danger={action.danger || undefined} onClick={action.run}><TelegramIcon name={action.icon} /><span>{action.label}</span></button>)}</div>;
});
