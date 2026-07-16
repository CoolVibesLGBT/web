type SwipeHandler = (..._args: any[]) => void

export function addSwipeRightListener(
  element: HTMLElement,
  handler: SwipeHandler,
  threshold = 50
): () => void {
  let startX: number | null = null
  let startY: number | null = null

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0]
    if (!touch) return
    startX = touch.clientX
    startY = touch.clientY
  }

  const onTouchEnd = (event: TouchEvent) => {
    if (startX === null || startY === null) return
    const touch = event.changedTouches[0]
    if (!touch) return

    const deltaX = touch.clientX - startX
    const deltaY = Math.abs(touch.clientY - startY)

    if (deltaX > threshold && deltaY < threshold) {
      handler()
    }

    startX = null
    startY = null
  }

  element.addEventListener('touchstart', onTouchStart, { passive: true })
  element.addEventListener('touchend', onTouchEnd, { passive: true })

  return () => {
    element.removeEventListener('touchstart', onTouchStart)
    element.removeEventListener('touchend', onTouchEnd)
  }
}
