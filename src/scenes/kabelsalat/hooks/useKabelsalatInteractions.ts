import {
  useEffect,
  useCallback,
  useRef,
  type MutableRefObject,
  type Dispatch,
  type SetStateAction
} from 'react'
import { SOCKET_DEFS, CABLE_MAP } from '../constants'

export const useKabelsalatInteractions = (
  t: (key: string) => string,
  isPoweredOn: boolean,
  isGameOver: boolean,
  isWinningRef: MutableRefObject<boolean>,
  selectedCable: string | null,
  setSelectedCable: Dispatch<SetStateAction<string | null>>,
  connections: Record<string, string>,
  setConnections: Dispatch<SetStateAction<Record<string, string>>>,
  isShocked: boolean,
  setIsShocked: Dispatch<SetStateAction<boolean>>,
  setFaultReason: Dispatch<SetStateAction<string>>
) => {
  const shockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Shock Cleanup
  useEffect(() => {
    return () => {
      if (shockTimeoutRef.current) clearTimeout(shockTimeoutRef.current)
    }
  }, [])

  const triggerShock = useCallback(
    (reason: string) => {
      setIsShocked(true)
      setFaultReason(reason)
      setSelectedCable(null)
      setConnections({})

      if (shockTimeoutRef.current) {
        clearTimeout(shockTimeoutRef.current)
      }

      shockTimeoutRef.current = setTimeout(() => {
        setIsShocked(false)
        setFaultReason('')
        shockTimeoutRef.current = null
      }, 1200)
    },
    [setIsShocked, setFaultReason, setSelectedCable, setConnections]
  )

  const handleCableClick = useCallback(
    (cableId: string) => {
      if (isShocked || isPoweredOn || isGameOver || isWinningRef.current) return

      const connectionSocketId = Object.keys(connections).find(
        key => connections[key] === cableId
      )

      if (connectionSocketId) {
        setConnections(prev => {
          const { [connectionSocketId]: _, ...rest } = prev
          return rest
        })
        setSelectedCable(null)
        return
      }
      setSelectedCable(prev => (prev === cableId ? null : cableId))
    },
    [
      isShocked,
      isPoweredOn,
      isGameOver,
      connections,
      isWinningRef,
      setConnections,
      setSelectedCable
    ]
  )

  const handleSocketClick = useCallback(
    (socketId: string) => {
      if (
        isShocked ||
        isPoweredOn ||
        isGameOver ||
        isWinningRef.current ||
        !selectedCable
      )
        return
      if (connections[socketId]) return

      if (!Object.hasOwn(SOCKET_DEFS, socketId)) return
      if (!Object.hasOwn(CABLE_MAP, selectedCable)) return

      const targetSocket = SOCKET_DEFS[socketId as keyof typeof SOCKET_DEFS]
      const incomingCable = CABLE_MAP[selectedCable]

      const hasPower = !!connections['power']
      const hasAmp = !!connections['amp']

      if (targetSocket.type !== incomingCable.type) {
        triggerShock(t('ui:minigames.kabelsalat.errors.wrongCable'))
        return
      }

      if (!hasPower && targetSocket.id !== 'power') {
        triggerShock(t('ui:minigames.kabelsalat.errors.noPower'))
        return
      }

      if (
        hasPower &&
        !hasAmp &&
        (targetSocket.id === 'mic' || targetSocket.id === 'synth')
      ) {
        triggerShock(t('ui:minigames.kabelsalat.errors.noAmp'))
        return
      }

      setConnections(prev => ({ ...prev, [socketId]: selectedCable }))
      setSelectedCable(null)
    },
    [
      isShocked,
      isPoweredOn,
      isGameOver,
      selectedCable,
      connections,
      triggerShock,
      t,
      isWinningRef,
      setConnections,
      setSelectedCable
    ]
  )

  return { handleCableClick, handleSocketClick }
}
