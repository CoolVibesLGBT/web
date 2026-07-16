import React from 'react'
import { openExternalUrl } from '@/platform/runtime'

type NavigateOptions = {
  replace?: boolean
  state?: unknown
}

type LocationState = {
  pathname: string
  search: string
  hash: string
}

const navigationState = new Map<string, unknown>()
const listeners = new Set<() => void>()
const ROUTE_EVENT = 'cv:routechange'
const HOME_HISTORY_GUARD_KEY = '__cvHomeHistoryGuard'
const HOME_PATHS = new Set(['/', '/home', '/pride'])

type HomeHistoryGuardState = 'base' | 'active'

let lastSnapshot: LocationState | null = null

const normalizeHref = (to: string) => {
  if (!to) return '/'
  if (to.startsWith('http://') || to.startsWith('https://')) return to
  if (to.startsWith('/')) return to
  return `/${to}`
}

const getSnapshot = (): LocationState => {
  if (typeof window === 'undefined') {
    return { pathname: '/', search: '', hash: '' }
  }
  const next = {
    pathname: window.location.pathname || '/',
    search: window.location.search || '',
    hash: window.location.hash || '',
  }
  if (
    lastSnapshot &&
    lastSnapshot.pathname === next.pathname &&
    lastSnapshot.search === next.search &&
    lastSnapshot.hash === next.hash
  ) {
    return lastSnapshot
  }
  lastSnapshot = next
  return next
}

const notify = () => {
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const isHomePath = (pathname: string) => {
  const normalizedPath = pathname !== '/' && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname
  return HOME_PATHS.has(normalizedPath)
}

const getHistoryState = () => {
  const currentState = window.history.state
  return currentState && typeof currentState === 'object'
    ? currentState as Record<string, unknown>
    : {}
}

export const armHomeHistoryGuard = () => {
  if (typeof window === 'undefined' || !isHomePath(window.location.pathname)) return

  const currentState = getHistoryState()
  const guardState = currentState[HOME_HISTORY_GUARD_KEY] as HomeHistoryGuardState | undefined
  if (guardState === 'active') return

  const href = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (guardState !== 'base') {
    window.history.replaceState(
      { ...currentState, [HOME_HISTORY_GUARD_KEY]: 'base' satisfies HomeHistoryGuardState },
      '',
      href
    )
  }

  window.history.pushState(
    { ...currentState, [HOME_HISTORY_GUARD_KEY]: 'active' satisfies HomeHistoryGuardState },
    '',
    href
  )
}

const setupBrowserListeners = (() => {
  let initialized = false
  return () => {
    if (initialized || typeof window === 'undefined') return
    initialized = true
    window.addEventListener('popstate', (event) => {
      const guardState = event.state?.[HOME_HISTORY_GUARD_KEY] as HomeHistoryGuardState | undefined
      if (isHomePath(window.location.pathname) && guardState === 'base') {
        armHomeHistoryGuard()
      }
      notify()
    })
    window.addEventListener(ROUTE_EVENT, notify)
  }
})()

export const useNavigate = () => {
  return React.useCallback((to: string | number, options?: NavigateOptions) => {
    if (typeof window === 'undefined') return

    if (typeof to === 'number') {
      window.history.go(to)
      return
    }

    const href = normalizeHref(to)
    if (href.startsWith('http://') || href.startsWith('https://')) {
      openExternalUrl(href)
      return
    }

    if (options && Object.prototype.hasOwnProperty.call(options, 'state')) {
      navigationState.set(href, options.state)
    }

    if (options?.replace) {
      window.history.replaceState({}, '', href)
    } else {
      window.history.pushState({}, '', href)
    }

    window.dispatchEvent(new Event(ROUTE_EVENT))
  }, [])
}

export const usePrefetch = () => {
  return React.useCallback((_to: string) => {
    return
  }, [])
}

export const useLocation = () => {
  setupBrowserListeners()

  const state = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => ({ pathname: '/', search: '', hash: '' })
  )

  const search = state.search || ''
  const key = `${state.pathname}${search}`
  const storedState = navigationState.get(key) ?? navigationState.get(state.pathname) ?? null

  return React.useMemo(
    () => ({
      pathname: state.pathname,
      search,
      hash: state.hash,
      state: storedState,
    }),
    [state.pathname, search, state.hash, storedState]
  )
}

const buildRoutePattern = (path: string) => {
  const keys: string[] = []
  const escaped = path
    .replace(/\//g, '\\/')
    .replace(/:([^/]+)/g, (_match, key) => {
      keys.push(key)
      return '([^/]+)'
    })
  return { regex: new RegExp(`^${escaped}/?$`), keys }
}

const paramPatterns = [
  '/places/:publicId',
  '/ref/:code',
  '/:username/status/:postId',
  '/status/:postId',
  '/checkin/:postId',
  '/legal/:page',
  '/classifieds/:id',
  '/:username/:engagementType',
  '/:username',
].map((path) => ({ path, ...buildRoutePattern(path) }))

export const useParams = <T extends Record<string, string> = Record<string, string>>() => {
  const { pathname } = useLocation()

  const match = React.useMemo(() => {
    for (const pattern of paramPatterns) {
      const result = pathname.match(pattern.regex)
      if (!result) continue
      const params: Record<string, string> = {}
      pattern.keys.forEach((key, index) => {
        const value = result[index + 1]
        if (value !== undefined) {
          params[key] = decodeURIComponent(value)
        }
      })
      return params
    }
    return {}
  }, [pathname])

  return match as T
}

type AppLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string
  replace?: boolean
  state?: unknown
}

export const Link = ({ to, replace, state, onClick, target, rel, ...props }: AppLinkProps) => {
  const navigate = useNavigate()
  const href = normalizeHref(to)

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (event.button !== 0) return
    if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return
    if (target && target !== '_self') return
    if (href.startsWith('http://') || href.startsWith('https://')) return

    event.preventDefault()
    navigate(href, { replace, state })
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      target={target}
      rel={rel}
      {...props}
    />
  )
}
