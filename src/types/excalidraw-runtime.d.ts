declare module '@excalidraw/excalidraw' {
  export type ExportToSvgParams = {
    appState?: Record<string, unknown>
    elements?: Array<Record<string, unknown>>
    files?: Record<string, unknown>
  }

  export function exportToSvg(params: ExportToSvgParams): Promise<SVGElement>
}
