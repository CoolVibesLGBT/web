import type { EditorThemeClasses } from 'lexical'

export function getThemeSelector(
  getTheme: () => EditorThemeClasses | null | undefined,
  key: keyof EditorThemeClasses
): string {
  const theme = getTheme()
  const value = theme?.[key]

  if (!value) return ''
  if (Array.isArray(value)) {
    return value.length ? ` ${value.join(' ')}` : ''
  }

  return ` ${value}`
}
