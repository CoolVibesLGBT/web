import type { ComponentProps } from 'react';
import { Sheet } from './Interface';

/** One content layout, embedded in a profile tab or presented as a native dialog. */
export default function ContentPanel({ embedded, ...props }: ComponentProps<typeof Sheet> & { embedded?: boolean }) {
 if (!embedded) return <Sheet {...props} />;
 return <section className={`${props.className || ''} cv-embedded-panel`} aria-label={props.title}>
  <header className="cv-sheet-header"><h2>{props.title}</h2>{props.headerActions}</header>
  <div className="cv-sheet-body">{props.children}</div>
  {props.actions && <footer className="cv-sheet-actions">{props.actions}</footer>}
 </section>;
}
