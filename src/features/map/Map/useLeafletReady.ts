import { useEffect, useState } from 'react'

const useLeafletReady = () => {
  const [ready, setReady] = useState(
    () => typeof window !== 'undefined' && !!(window as any).L
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ((window as any).L) {
      setReady(true)
      return
    }
    let active = true
    import('leaflet')
      .then((leaflet) => {
        if (!active) return
        if (!(window as any).L) {
          (window as any).L = leaflet
        }
        setReady(true)
      })
      .catch((error) => {
        console.error('Failed to load Leaflet', error)
      })
    return () => {
      active = false
    }
  }, [])

  return ready
}

export default useLeafletReady
