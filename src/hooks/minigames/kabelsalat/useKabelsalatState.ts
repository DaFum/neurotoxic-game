import {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
  type Dispatch,
  type SetStateAction
} from 'react'
import { useTranslation } from 'react-i18next'
import { generateLightningSeeds } from '../../../utils/minigames/kabelsalatUtils'
import {
  INITIAL_SOCKET_ORDER,
  TIME_LIMIT
} from '../../../utils/minigames/kabelsalatConstants'
import type { CableId } from '../../../utils/minigames/kabelsalatConstants'
import type { SocketId, KabelsalatPhase } from '../../../types/kabelsalat'
import { useKabelsalatBackground } from './useKabelsalatBackground'
import { useKabelsalatTimer } from './useKabelsalatTimer'
import { useKabelsalatShuffle } from './useKabelsalatShuffle'
import { useKabelsalatInteractions } from './useKabelsalatInteractions'
import { useKabelsalatGameEnd } from './useKabelsalatGameEnd'
import { useKabelsalatVoidSurge } from './useKabelsalatVoidSurge'

import type { TFunction } from 'i18next'

/**
 * Complete view-model returned to the Kabelsalat scene.
 */
export interface KabelsalatState {
  t: TFunction<['ui'], undefined>
  phase: KabelsalatPhase
  selectedCable: CableId | null
  connections: Partial<Record<SocketId, CableId>>
  isShocked: boolean
  faultReason: string
  isPoweredOn: boolean
  /** Every socket is wired and the win animation is pending. */
  isWinning: boolean
  timeLeft: number
  isGameOver: boolean
  socketOrder: SocketId[]
  lightningSeeds: ReturnType<typeof generateLightningSeeds>
  bgTextureUrl: string | null
  handleCableClick: (cableId: CableId) => void
  handleSocketClick: (socketId: SocketId) => void
  isPowerConnected: boolean
  forceAdvance: (isPowered: boolean) => void
  voidSurge: number
  voidSurgesPurged: number
  purgeVoidSurge: () => void
}

/**
 * Composes Kabelsalat translation, timers, shuffling, interactions, end flow, and void-surge state.
 * @returns The state and callbacks consumed by `KabelsalatScene`.
 */
export const useKabelsalatState = (): KabelsalatState => {
  const { t } = useTranslation(['ui'])

  // Core State: explicit phase state machine
  const [phase, setPhase] = useState<KabelsalatPhase>({ name: 'playing' })
  const phaseRef = useRef<KabelsalatPhase>(phase)
  phaseRef.current = phase

  const [selectedCable, setSelectedCable] = useState<CableId | null>(null)
  const [connections, setConnections] = useState<
    Partial<Record<SocketId, CableId>>
  >({})
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [socketOrder, setSocketOrder] = useState<SocketId[]>([
    ...INITIAL_SOCKET_ORDER
  ])

  // Boolean getters derived from phase
  const isShocked = phase.name === 'shocked'
  const faultReason = phase.name === 'shocked' ? phase.reason : ''
  const isWinning = phase.name === 'winning'
  const isPoweredOn = phase.name === 'powered'
  const isGameOver = phase.name === 'gameover'

  const isWinningRef = useRef(false)
  isWinningRef.current = isWinning

  const shockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const winTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingFaultReasonRef = useRef('')

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (shockTimeoutRef.current) {
        clearTimeout(shockTimeoutRef.current)
        shockTimeoutRef.current = null
      }
      if (winTimeoutRef.current) {
        clearTimeout(winTimeoutRef.current)
        winTimeoutRef.current = null
      }
    }
  }, [])

  // Transition: shock handling (recovers back to playing after 1500ms)
  const triggerShock = useCallback((reason: string) => {
    if (phaseRef.current.name !== 'playing') return
    pendingFaultReasonRef.current = reason
    const nextPhase: KabelsalatPhase = { name: 'shocked', reason }
    phaseRef.current = nextPhase
    setPhase(nextPhase)
    setSelectedCable(null)
    setConnections({})

    if (shockTimeoutRef.current) {
      clearTimeout(shockTimeoutRef.current)
    }

    shockTimeoutRef.current = setTimeout(() => {
      shockTimeoutRef.current = null
      if (phaseRef.current.name === 'shocked') {
        const playPhase: KabelsalatPhase = { name: 'playing' }
        phaseRef.current = playPhase
        setPhase(playPhase)
      }
    }, 1500)
  }, [])

  // Transition: win handling (winning -> 600ms -> powered)
  const handleWin = useCallback(() => {
    if (phaseRef.current.name !== 'playing') return
    const winningPhase: KabelsalatPhase = { name: 'winning' }
    phaseRef.current = winningPhase
    setPhase(winningPhase)

    if (winTimeoutRef.current) {
      clearTimeout(winTimeoutRef.current)
    }

    winTimeoutRef.current = setTimeout(() => {
      winTimeoutRef.current = null
      if (phaseRef.current.name === 'winning') {
        const poweredPhase: KabelsalatPhase = { name: 'powered' }
        phaseRef.current = poweredPhase
        setPhase(poweredPhase)
      }
    }, 600)
  }, [])

  // Transition: game over handling
  const handleGameOver = useCallback(() => {
    if (phaseRef.current.name !== 'playing') return
    const gameOverPhase: KabelsalatPhase = { name: 'gameover' }
    phaseRef.current = gameOverPhase
    setPhase(gameOverPhase)
  }, [])

  // Transition: completion transition finished
  const handleTransitioned = useCallback(() => {
    const transitionedPhase: KabelsalatPhase = { name: 'transitioned' }
    phaseRef.current = transitionedPhase
    setPhase(transitionedPhase)
  }, [])

  // Adapter setters for useKabelsalatInteractions compatibility
  const setIsShocked: Dispatch<SetStateAction<boolean>> = useCallback(
    action => {
      const next =
        typeof action === 'function'
          ? action(phaseRef.current.name === 'shocked')
          : action
      if (next) {
        if (phaseRef.current.name === 'playing') {
          const nextPhase: KabelsalatPhase = {
            name: 'shocked',
            reason: pendingFaultReasonRef.current
          }
          phaseRef.current = nextPhase
          setPhase(nextPhase)

          if (shockTimeoutRef.current) {
            clearTimeout(shockTimeoutRef.current)
          }
          shockTimeoutRef.current = setTimeout(() => {
            shockTimeoutRef.current = null
            if (phaseRef.current.name === 'shocked') {
              const playPhase: KabelsalatPhase = { name: 'playing' }
              phaseRef.current = playPhase
              setPhase(playPhase)
            }
          }, 1500)
        }
      } else {
        if (!shockTimeoutRef.current && phaseRef.current.name === 'shocked') {
          const playPhase: KabelsalatPhase = { name: 'playing' }
          phaseRef.current = playPhase
          setPhase(playPhase)
        }
      }
    },
    []
  )

  const setFaultReason: Dispatch<SetStateAction<string>> = useCallback(
    action => {
      const next =
        typeof action === 'function'
          ? action(
              phaseRef.current.name === 'shocked'
                ? phaseRef.current.reason
                : pendingFaultReasonRef.current
            )
          : action
      pendingFaultReasonRef.current = next
      if (next && phaseRef.current.name === 'shocked') {
        const nextPhase: KabelsalatPhase = { name: 'shocked', reason: next }
        phaseRef.current = nextPhase
        setPhase(nextPhase)
      }
    },
    []
  )

  // 1. Background
  const bgTextureUrl = useKabelsalatBackground()

  // 2. Timer
  useKabelsalatTimer(connections, phase, setTimeLeft, handleGameOver, handleWin)

  // 3. Shuffle
  useKabelsalatShuffle(
    isPoweredOn,
    isGameOver,
    isShocked,
    connections,
    isWinningRef,
    setSocketOrder,
    selectedCable !== null
  )

  // 4. Interactions
  const { handleCableClick, handleSocketClick } = useKabelsalatInteractions(
    t,
    isPoweredOn,
    isGameOver,
    isWinningRef,
    selectedCable,
    setSelectedCable,
    connections,
    setConnections,
    isShocked,
    setIsShocked,
    setFaultReason
  )

  // 5. Void Surge (Autonomously injected mechanic)
  const { voidSurge, voidSurgesPurged, purgeVoidSurge } =
    useKabelsalatVoidSurge(phase, triggerShock, t)

  // 6. Game End
  const { forceAdvance } = useKabelsalatGameEnd(
    phase,
    timeLeft,
    voidSurgesPurged,
    handleTransitioned
  )

  // Lightning Seeds
  const lightningSeeds = useMemo(() => {
    if (isShocked) return generateLightningSeeds()
    return []
  }, [isShocked])

  return {
    t,
    phase,
    selectedCable,
    connections,
    isShocked,
    faultReason,
    isPoweredOn,
    isWinning,
    timeLeft,
    isGameOver,
    socketOrder,
    lightningSeeds,
    bgTextureUrl,
    handleCableClick,
    handleSocketClick,
    isPowerConnected: !!connections['power'],
    forceAdvance,
    voidSurge,
    voidSurgesPurged,
    purgeVoidSurge
  }
}
