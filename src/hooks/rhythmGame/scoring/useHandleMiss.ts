import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  updateGigPerformanceStats,
  buildGigStatsSnapshot,
  calculateAccuracy
} from '../../../utils/gigStats'
import {
  audioService,
  stopAudio,
  getPlayRequestId
} from '../../../utils/audio/audioEngine'
import { calculateMissImpact } from '../../../utils/rhythmGameScoringUtils'
import { RIVAL_GIG_CROWD_DECAY_PENALTY } from '../../../context/gameConstants'
import { finiteNumberOr } from '../../../utils/finiteNumber'
import type {
  RhythmGameRefState,
  SetLastGigStats
} from '../../../types/rhythmGame'
import type { RhythmStateSetters } from '../useRhythmGameState'

type HandleMissParams = {
  gameStateRef: { current: RhythmGameRefState }
  setters: Pick<
    RhythmStateSetters,
    | 'setCombo'
    | 'setHealth'
    | 'setIsGameOver'
    | 'setIsToxicMode'
    | 'setOverload'
    | 'setAccuracy'
  >
  contextActions: {
    addToast: (message: string, type?: string) => void
    setLastGigStats: SetLastGigStats
    endGig: () => void
  }
  baseCrowdDecay: number
  gameOverTimerRef: { current: ReturnType<typeof setTimeout> | null }
}

export const useHandleMiss = ({
  gameStateRef,
  setters,
  contextActions,
  baseCrowdDecay,
  gameOverTimerRef
}: HandleMissParams) => {
  const { t } = useTranslation('ui')
  const {
    setCombo,
    setHealth,
    setIsGameOver,
    setIsToxicMode,
    setOverload,
    setAccuracy
  } = setters
  const { addToast, setLastGigStats, endGig } = contextActions

  const handleMiss = useCallback(
    (count = 1, isEmptyHit = false) => {
      if (count <= 0) return

      // Immediate deactivation of Toxic Mode on real miss (not empty hits)
      if (gameStateRef.current.isToxicMode && !isEmptyHit) {
        setIsToxicMode(false)
        gameStateRef.current.isToxicMode = false
        addToast(t('ui:gig.toasts.toxicModeLost', 'TOXIC MODE LOST!'), 'error')
      }

      setCombo(0)
      gameStateRef.current.combo = 0

      const currentHealth = finiteNumberOr(gameStateRef.current.health, 100)
      const currentOverload = finiteNumberOr(gameStateRef.current.overload, 0)

      let activeCrowdDecay = baseCrowdDecay
      if (gameStateRef.current.modifiers?.crowdDecay !== undefined) {
        activeCrowdDecay *= gameStateRef.current.modifiers.crowdDecay
      }

      const crowdDecay = gameStateRef.current.rivalPenaltyActive
        ? activeCrowdDecay * RIVAL_GIG_CROWD_DECAY_PENALTY
        : activeCrowdDecay

      // Calculate new overload and stats outside the setState callback
      const { nextOverload, nextHealth } = calculateMissImpact(
        count,
        isEmptyHit,
        currentOverload,
        currentHealth,
        crowdDecay
      )

      gameStateRef.current.overload = nextOverload
      const updatedStats = updateGigPerformanceStats(
        {
          ...gameStateRef.current.stats,
          misses: gameStateRef.current.stats.misses + count,
          corruptionLevel: gameStateRef.current.stats.corruptionLevel
        },
        { combo: 0, overload: nextOverload }
      )
      gameStateRef.current.stats = updatedStats

      const newAccuracy = calculateAccuracy(
        updatedStats.perfectHits + (updatedStats.hits ?? 0),
        updatedStats.misses
      )

      setOverload(nextOverload)
      if (typeof setAccuracy === 'function') {
        setAccuracy(newAccuracy)
      }

      // Only play miss SFX if it's a real miss
      if (!isEmptyHit) {
        audioService.playSFX('miss')
      }

      gameStateRef.current.health = nextHealth
      setHealth(nextHealth)

      if (nextHealth > 0 || gameStateRef.current.isGameOver) return

      setIsGameOver(true)
      gameStateRef.current.isGameOver = true
      // Stop audio immediately to prevent further hit processing after collapse
      stopAudio()
      const failReqId = getPlayRequestId()
      addToast(t('ui:gig.toasts.bandCollapsed', 'BAND COLLAPSED'), 'error')

      // Schedule exit from Gig if failed (prevents softlock)
      if (gameOverTimerRef.current) return

      gameOverTimerRef.current = setTimeout(() => {
        gameOverTimerRef.current = null
        // Bail if another audio session started in the 4s window (e.g. external endGig call)
        if (getPlayRequestId() !== failReqId) return
        if (!Array.isArray(gameStateRef.current.songStats)) {
          gameStateRef.current.songStats = []
        }
        addToast(
          t('ui:gig.toasts.gigFailed', 'Gig Failed! Reviewing impact...'),
          'info'
        )
        setLastGigStats(
          buildGigStatsSnapshot(
            gameStateRef.current.score,
            gameStateRef.current.stats,
            gameStateRef.current.toxicTimeTotal,
            gameStateRef.current.songStats
          )
        )
        endGig()
      }, 4000)
    },
    [
      addToast,
      endGig,
      setLastGigStats,
      gameStateRef,
      setCombo,
      setHealth,
      setIsGameOver,
      setIsToxicMode,
      setOverload,
      setAccuracy,
      baseCrowdDecay,
      t,
      gameOverTimerRef
    ]
  )

  return handleMiss
}
