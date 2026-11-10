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

  const shockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const winTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingFaultReasonRef = useRef('')

  // Shared phase transition path keeping eager refs synchronized without render-time writes
  const transitionPhase = useCallback((nextPhase: KabelsalatPhase) => {
    phaseRef.current = nextPhase
    isWinningRef.current = nextPhase.name === 'winning'
    setPhase(nextPhase)
  }, [])

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

  // Shared shock entry and recovery (1500ms recovery window)
  const enterShock = useCallback(
    (reason: string) => {
      if (phaseRef.current.name !== 'playing') return
      pendingFaultReasonRef.current = reason
      transitionPhase({ name: 'shocked', reason })
      setSelectedCable(null)
      setConnections({})

      if (shockTimeoutRef.current) {
        clearTimeout(shockTimeoutRef.current)
      }

      shockTimeoutRef.current = setTimeout(() => {
        shockTimeoutRef.current = null
        if (phaseRef.current.name === 'shocked') {
          transitionPhase({ name: 'playing' })
        }
      }, 1500)
    },
    [transitionPhase]
  )

  // Transition: shock handling (delegates to shared shock path)
  /** Starts a shock with `reason` unless the game is no longer in the `'playing'` phase. */
  const triggerShock = useCallback(
    (reason: string) => {
      enterShock(reason)
    },
    [enterShock]
  )

  // Transition: win handling (winning -> 600ms -> powered)
  /** Moves `playing` to `winning`, then `powered`, once the wiring is complete. */
  const handleWin = useCallback(() => {
    if (phaseRef.current.name !== 'playing') return
    transitionPhase({ name: 'winning' })

    if (winTimeoutRef.current) {
      clearTimeout(winTimeoutRef.current)
    }

    winTimeoutRef.current = setTimeout(() => {
      winTimeoutRef.current = null
      if (phaseRef.current.name === 'winning') {
        transitionPhase({ name: 'powered' })
      }
    }, 600)
  }, [transitionPhase])

  // Transition: game over handling
  /** Ends the run on timeout by moving `playing` to `gameover`. */
  const handleGameOver = useCallback(() => {
    if (phaseRef.current.name !== 'playing') return
    transitionPhase({ name: 'gameover' })
  }, [transitionPhase])

  // Transition: completion transition finished
  /** Marks the terminal `transitioned` phase once the scene continuation has started. */
  const handleTransitioned = useCallback(() => {
    transitionPhase({ name: 'transitioned' })
  }, [transitionPhase])

  // Adapter setters for useKabelsalatInteractions compatibility
  const setIsShocked: Dispatch<SetStateAction<boolean>> = useCallback(
    action => {
      const next =
        typeof action === 'function'
          ? action(phaseRef.current.name === 'shocked')
          : action
      if (next) {
        enterShock(pendingFaultReasonRef.current)
      } else {
        if (!shockTimeoutRef.current && phaseRef.current.name === 'shocked') {
          transitionPhase({ name: 'playing' })
        }
      }
    },
    [enterShock, transitionPhase]
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
        transitionPhase({ name: 'shocked', reason: next })
      }
    },
    [transitionPhase]
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
