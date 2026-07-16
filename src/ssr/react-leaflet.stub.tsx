import React from 'react'

type StubProps = {
  children?: React.ReactNode
}

const StubComponent = ({ children }: StubProps) => (children ? <>{children}</> : null)

export const MapContainer = StubComponent
export const TileLayer = StubComponent
export const Marker = StubComponent
export const Popup = StubComponent

export const useMap = () => null
export const useMapEvents = () => null

const defaultExport = {}
export default defaultExport
