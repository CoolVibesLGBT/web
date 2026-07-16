export default function joinClasses(
  ...classes: Array<string | null | undefined | false>
): string {
  return classes.filter(Boolean).join(' ')
}
