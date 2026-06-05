import {
  useEffect,
  useCallback,
  useRef,
  type MutableRefObject,
  type Dispatch,
  type SetStateAction
} from 'react'
import type { TFunction } from 'i18next'
import { SOCKET_DEFS, CABLE_MAP } from '../kabelsalatConstants'
import type { CableId } from '../kabelsalatConstants'
import type { SocketId } from '../../../types/kabelsalat'
import { logger } from '../../../utils/logger'

const isCableId = (value: string): value is CableId =>
  Object.hasOwn(CABLE_MAP, value)
const isSocketId = (value: string): value is SocketId =>
  Object.hasOwn(SOCKET_DEFS, value)

/**
 * Handles Kabelsalat cable/socket clicks, invalid-connection shock state, and one-shot win guards.
 *
 * @remarks
 * Invalid socket or cable ids throw only in development builds; production logs
 * the fault and ignores the click.
 *
 * @param t - Translation callback used for localized labels and messages.
 * @param isPoweredOn - Whether powered on is active.
 * @param isGameOver - Whether game over is active.
 * @param isWinningRef - Ref that guards one-shot win transitions.
 * @param selectedCable - Currently selected cable id.
 * @param setSelectedCable - State setter for selected cable.
 * @param connections - Current cable-to-socket connection map.
 * @param setConnections - State setter for connections.
 * @param isShocked - Whether shocked is active.
 * @param setIsShocked - State setter for is shocked.
 * @param setFaultReason - State setter for fault reason.
 * @returns Click handlers and a shock trigger for the Kabelsalat board.
 *
 * @throws Throws an `Error` in development when a socket id or selected
 * cable id is not part of the Kabelsalat definitions.
 */
export const useKabelsalatInteractions = (
  t: TFunction,
  isPoweredOn: boolean,
  isGameOver: boolean,
  isWinningRef: MutableRefObject<boolean>,
  selectedCable: CableId | null,
  setSelectedCable: Dispatch<SetStateAction<CableId | null>>,
  connections: Partial<Record<SocketId, CableId>>,
  setConnections: Dispatch<SetStateAction<Partial<Record<SocketId, CableId>>>>,
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
    (cableId: CableId) => {
      if (isShocked || isPoweredOn || isGameOver || isWinningRef.current) return

      let connectionSocketId: SocketId | undefined
      for (const k in connections) {
        if (!Object.hasOwn(connections, k)) continue
        const socketId = k as SocketId
        if (connections[socketId] !== cableId) continue
        connectionSocketId = socketId
        break
      }

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
    (socketId: SocketId) => {
      if (
        isShocked ||
        isPoweredOn ||
        isGameOver ||
        isWinningRef.current ||
        !selectedCable
      )
        return
      if (!isSocketId(socketId)) {
        if (import.meta.env.DEV) {
          throw new Error(
            `Invalid socketId in useKabelsalatInteractions: ${socketId}`
          )
        } else {
          logger.error(
            'KabelsalatInteractions',
            `Invalid socketId: ${socketId}`
          )
          return
        }
      }
      if (connections[socketId]) return

      if (!isCableId(selectedCable)) {
        if (import.meta.env.DEV) {
          throw new Error(
            `Invalid selectedCable in useKabelsalatInteractions: ${selectedCable}`
          )
        } else {
          logger.error(
            'KabelsalatInteractions',
            `Invalid selectedCable: ${selectedCable}`
          )
          return
        }
      }

      const targetSocket = SOCKET_DEFS[socketId]
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

  return { handleCableClick, handleSocketClick, triggerShock }
}
