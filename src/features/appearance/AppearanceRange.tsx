import type { CSSProperties } from 'react';

/** Native range semantics with tweb's 5px progress line and 13px colored thumb. */
export default function AppearanceRange({ id, min, max, step = 1, value, onChange }: {
  id: string; min: number; max: number; step?: number; value: number; onChange: (value: number) => void;
}) {
  return <input id={id} className="cv-appearance-range" type="range" min={min} max={max} step={step} value={value} style={{ '--range-progress': `${(value - min) / (max - min) * 100}%` } as CSSProperties} onChange={event => onChange(Number(event.target.value))} />;
}
