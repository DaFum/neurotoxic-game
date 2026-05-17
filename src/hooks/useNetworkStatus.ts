import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from 'react'

const getInitialOnline = () =>
  typeof navigator !== 'undefined' ? navigator.onLine : true

const NetworkStatusContext = createContext<boolean | null>(null)

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

export const useNetworkStatus = (): boolean => {
  const ctx = useContext(NetworkStatusContext)
  if (ctx !== null) return ctx
  return getInitialOnline()
}
