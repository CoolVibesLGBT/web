/** Keep the selected view visible; reserve space for a discoverable overflow menu. */
export function fitTabs(widths: number[], available: number, overflowWidth: number, activeIndex: number): number[] {
  if (widths.length === 0) return []
  if (available > 0 && widths.reduce((sum, width) => sum + width, 0) <= available) return widths.map((_, index) => index)
  const active = Math.max(0, Math.min(activeIndex, widths.length - 1))
  const visible = [active]
  let remaining = Math.max(0, available - overflowWidth - widths[active] - 4)
  widths.forEach((width, index) => {
    if (index !== active && width <= remaining) {
      visible.push(index)
      remaining -= width
    }
  })
  return visible.sort((a, b) => a - b)
}
