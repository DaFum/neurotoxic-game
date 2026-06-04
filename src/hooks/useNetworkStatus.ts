import {
  createContext,
  createElement,
  use,
  useEffect,
  useState,
  type ReactNode
} from 'react'

const getInitialOnline = () =>
  typeof navigator !== 'undefined' ? navigator.onLine : true

const NetworkStatusContext = createContext<boolean | null>(null)

/**
 * Provides browser online/offline status to descendants.
 *
 * @param props - Provider props containing child nodes.
 * @returns React context provider element.
 */
export const NetworkStatusProvider = ({
  children
}: {
  children: ReactNode
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(getInitialOnline)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return createElement(
    NetworkStatusContext.Provider,
    { value: isOnline },
    children
  )
}

/**
 * Reads the current browser online/offline status.
 *
 * @returns True when the browser reports online, otherwise false.
 */
export const useNetworkStatus = (): boolean => {
  const ctx = use(NetworkStatusContext)
  if (ctx !== null) return ctx
  return getInitialOnline()
}
