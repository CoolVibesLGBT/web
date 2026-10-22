/** A tiny, irreversibly downsampled preview; never return the original file URL. */
export async function createViewOncePreview(file: File): Promise<string | undefined> {
  let bitmap: ImageBitmap | undefined
  try {
    bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    const scale = 12 / Math.max(bitmap.width, bitmap.height)
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) return undefined
    context.fillStyle = '#65717d'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.5)
  } catch {
    return undefined
  } finally {
    bitmap?.close()
  }
}

export function readViewOncePreview(value: unknown): string | undefined {
  return typeof value === 'string' && value.length <= 8192 && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(value)
    ? value : undefined
}
