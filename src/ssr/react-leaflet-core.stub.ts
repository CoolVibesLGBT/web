export type LeafletContextInterface = Record<string, unknown>

export const createElementObject = (instance: unknown, context: LeafletContextInterface) => ({
  instance,
  context,
})

export const extendContext = (context: LeafletContextInterface, extra: LeafletContextInterface) => ({
  ...context,
  ...extra,
})

export const createPathComponent = () => {
  return () => null
}
