export function setFloatingElemPosition(
  targetRect: DOMRect | null,
  floatingElem: HTMLElement,
  anchorElem: HTMLElement,
  isLink: boolean
) {
  if (!targetRect) {
    floatingElem.style.opacity = '0'
    floatingElem.style.transform = 'translate(-10000px, -10000px)'
    return
  }

  const anchorRect = anchorElem.getBoundingClientRect()
  const top =
    targetRect.top -
    anchorRect.top -
    floatingElem.offsetHeight -
    (isLink ? 8 : 12)
  const left =
    targetRect.left -
    anchorRect.left +
    targetRect.width / 2 -
    floatingElem.offsetWidth / 2

  floatingElem.style.opacity = '1'
  floatingElem.style.transform = `translate(${Math.max(left, 0)}px, ${Math.max(
    top,
    0
  )}px)`
}
