export function setFloatingElemPositionForLinkEditor(
  targetRect: DOMRect | null,
  floatingElem: HTMLElement,
  anchorElem: HTMLElement
) {
  if (!targetRect) {
    floatingElem.style.opacity = '0'
    floatingElem.style.transform = 'translate(-10000px, -10000px)'
    return
  }

  const anchorRect = anchorElem.getBoundingClientRect()
  const top = targetRect.top - anchorRect.top + targetRect.height + 8
  const left = targetRect.left - anchorRect.left

  floatingElem.style.opacity = '1'
  floatingElem.style.transform = `translate(${Math.max(left, 0)}px, ${Math.max(
    top,
    0
  )}px)`
}
