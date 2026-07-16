type NoopFn = (...args: any[]) => void

const noop: NoopFn = () => {}

const stubLayer = () => ({
  addTo: noop,
  remove: noop,
  clearLayers: noop,
})

const stubMap = () => ({
  remove: noop,
  on: noop,
  off: noop,
  once: noop,
  setView: noop,
  flyTo: noop,
  invalidateSize: noop,
})

const stub = {
  map: stubMap,
  tileLayer: stubLayer,
  marker: stubLayer,
  divIcon: () => ({}),
  latLngBounds: () => ({
    getCenter: () => ({ lat: 0, lng: 0 }),
  }),
  MarkerClusterGroup: function MarkerClusterGroup() {
    return stubLayer()
  },
}

export default stub
export const map = stub.map
export const tileLayer = stub.tileLayer
export const marker = stub.marker
export const divIcon = stub.divIcon
export const latLngBounds = stub.latLngBounds
export const MarkerClusterGroup = stub.MarkerClusterGroup
