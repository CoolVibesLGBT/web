export function getDOMRangeRect(
  selection: Selection,
  rootElement: HTMLElement
): DOMRect {
  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  const rootRect = rootElement.getBoundingClientRect()

  return new DOMRect(
    rect.left - rootRect.left,
    rect.top - rootRect.top,
    rect.width,
    rect.height
  )
}
