import { useLayoutEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface PropertyField {
  /** Stable per-row identity, independent of list position — removing a row must never let React
   * reuse another row's input DOM nodes (and stale focus/ref state) for a different item. */
  id: string;
  key: string;
  value: string;
  /** Example text shown as the value placeholder, carried over from the suggestion chip that created this row. */
  hint?: string;
}

export interface PropertySuggestion {
  label: string;
  hint: string;
}

let fieldIdCounter = 0;
const nextFieldId = () => `field-${++fieldIdCounter}`;

/** iOS-style key/value editor. A brand-new or actively-focused row shows a guided two-line form
 * ("Field name" / "Value" captions); once it's filled in and loses focus it collapses to one
 * compact line (key small/left, value normal/right) — the same layout the published post uses. */
export default function PropertyFieldsEditor({ items, onChange, suggestions = [] }: {
  items: PropertyField[]
  onChange: (items: PropertyField[]) => void
  suggestions?: PropertySuggestion[]
}) {
  const { t } = useTranslation('common');
  const keyRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const valueRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const pendingFocusRef = useRef<{ id: string; field: 'key' | 'value' } | null>(null);

  // Switching compact <-> guided mode remounts the row's inputs, which silently drops focus.
  // Re-apply focus to whichever field the viewer was last interacting with after that happens.
  useLayoutEffect(() => {
    const pending = pendingFocusRef.current;
    if (!pending) return;
    const target = pending.field === 'key' ? keyRefs.current[pending.id] : valueRefs.current[pending.id];
    if (target && document.activeElement !== target) target.focus();
  });

  const normalizedKeys = items.map(item => item.key.trim().toLocaleLowerCase());
  const availableSuggestions = suggestions.filter(s => !normalizedKeys.includes(s.label.trim().toLocaleLowerCase()));

  const addRow = (preset?: PropertySuggestion) => {
    const existingIndex = preset
      ? normalizedKeys.indexOf(preset.label.trim().toLocaleLowerCase())
      : -1;
    if (existingIndex >= 0) {
      valueRefs.current[items[existingIndex].id]?.focus();
      return;
    }
    const id = nextFieldId();
    onChange([...items, { id, key: preset?.label ?? '', value: '', hint: preset?.hint }]);
    pendingFocusRef.current = { id, field: 'value' };
    setFocusedId(id);
    requestAnimationFrame(() => valueRefs.current[id]?.focus());
  };

  const updateRow = (id: string, patch: Partial<PropertyField>) => {
    onChange(items.map(item => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeRow = (id: string) => {
    onChange(items.filter(item => item.id !== id));
    delete keyRefs.current[id];
    delete valueRefs.current[id];
  };

  const keyLabel = t('classifieds.form_metadata_key', { defaultValue: 'Field name' });
  const valueLabel = t('classifieds.form_metadata_value', { defaultValue: 'Value' });
  const keyHint = t('classifieds.form_metadata_key_hint', { defaultValue: 'e.g. Location' });
  const genericValueHint = t('classifieds.form_metadata_value_hint', { defaultValue: 'Enter a value' });

  return (
    <div className="cv-property-editor">
      {availableSuggestions.length > 0 && (
        <div className="cv-property-suggestions">
          {availableSuggestions.map(suggestion => (
            <button key={suggestion.label} type="button" className="cv-property-suggestion" onClick={() => addRow(suggestion)}>
              <Plus aria-hidden="true" />
              <span>{suggestion.label}</span>
            </button>
          ))}
        </div>
      )}
      {items.length > 0 && (
        <div className="cv-property-entries">
          {items.map(item => {
            const isComplete = item.key.trim().length > 0 && item.value.trim().length > 0;
            const isCompact = isComplete && focusedId !== item.id;
            const fieldHandlers = (field: 'key' | 'value') => ({
              onFocus: () => { pendingFocusRef.current = { id: item.id, field }; setFocusedId(item.id); },
              onBlur: () => {
                setFocusedId(current => (current === item.id ? null : current));
                if (pendingFocusRef.current?.id === item.id && pendingFocusRef.current.field === field) pendingFocusRef.current = null;
              },
            });
            return (
              <div className="cv-property-entry" key={item.id}>
                {isCompact ? (
                  <div className="cv-property-entry-fields cv-property-entry-compact">
                    <input
                      ref={el => { keyRefs.current[item.id] = el; }}
                      className="cv-property-compact-key"
                      value={item.key}
                      onChange={e => updateRow(item.id, { key: e.target.value })}
                      aria-label={keyLabel}
                      {...fieldHandlers('key')}
                    />
                    <input
                      ref={el => { valueRefs.current[item.id] = el; }}
                      className="cv-property-compact-value"
                      value={item.value}
                      onChange={e => updateRow(item.id, { value: e.target.value })}
                      aria-label={valueLabel}
                      {...fieldHandlers('value')}
                    />
                  </div>
                ) : (
                  <div className="cv-property-entry-fields">
                    <div className="cv-property-field-row">
                      <span className="cv-property-field-label">{keyLabel}</span>
                      <input
                        ref={el => { keyRefs.current[item.id] = el; }}
                        value={item.key}
                        onChange={e => updateRow(item.id, { key: e.target.value })}
                        placeholder={keyHint}
                        aria-label={keyLabel}
                        {...fieldHandlers('key')}
                      />
                    </div>
                    <div className="cv-property-field-row">
                      <span className="cv-property-field-label">{valueLabel}</span>
                      <input
                        ref={el => { valueRefs.current[item.id] = el; }}
                        value={item.value}
                        onChange={e => updateRow(item.id, { value: e.target.value })}
                        placeholder={item.hint || genericValueHint}
                        aria-label={valueLabel}
                        {...fieldHandlers('value')}
                      />
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeRow(item.id)}
                  aria-label={t('classifieds.form_metadata_remove', { defaultValue: 'Remove field' })}
                  className="cv-property-remove"
                >
                  <X aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <button type="button" className="cv-property-add" onClick={() => addRow()}>
        <span className="cv-property-add-icon" aria-hidden="true"><Plus /></span>
        <span>{t('classifieds.form_metadata_add_field', { defaultValue: 'Add custom field' })}</span>
      </button>
    </div>
  );
}
