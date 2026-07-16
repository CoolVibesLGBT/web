export type ExportToSvgParams = {
  appState?: Record<string, unknown>
  elements?: Array<Record<string, unknown>>
  files?: Record<string, unknown>
}

export async function exportToSvg(_params: ExportToSvgParams): Promise<SVGElement> {
  if (typeof document !== 'undefined') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 1 1')
    svg.setAttribute('width', '1')
    svg.setAttribute('height', '1')
    return svg
  }

  return {} as SVGElement
}
