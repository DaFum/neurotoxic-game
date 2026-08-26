import { useCallback, useRef, useEffect } from 'react'
import { createHecklerSession } from '../../utils/hecklerLogic'
import { useAudioEngine } from '../../context/AudioEngineContext'
import {
  processRhythmGameTick,
  finalizeGig
} from '../../utils/rhythmGameLoopUtils'
import type { GameEvent } from '../../types'
import type {
  RhythmGameRefState,
  SetLastGigStats
} from '../../types/rhythmGame'
import type { RhythmStateSetters } from './useRhythmGameState'

type RhythmGameLoopParams = {
  gameStateRef: { current: RhythmGameRefState }
  scoringActions: { handleMiss: (count?: number, isEmptyHit?: boolean) => void }
  setters: Pick<
    RhythmStateSetters,
    'setIsToxicMode' | 'setIsCorruptionBurstActive' | 'setCorruptionState'
  >
  contextState: { activeEvent: GameEvent | null }
  contextActions: {
    setLastGigStats: SetLastGigStats
    endGig: () => void
  }
}

/**
 * Creates the per-frame rhythm game update callback.
 * @param params - Runtime refs, scoring actions, UI setters, and context actions used each tick.
 * @returns Object containing the `update` function that advances the rhythm simulation.
 */
export const useRhythmGameLoop = ({
  gameStateRef,
  scoringActions,
  setters,
  contextState,
  contextActions
}: RhythmGameLoopParams) => {
  const audioEngine = useAudioEngine()
  const { handleMiss } = scoringActions
  const { setIsToxicMode, setIsCorruptionBurstActive, setCorruptionState } =
    setters
  const { activeEvent } = contextState
  const { setLastGigStats, endGig } = contextActions

  const hecklerSessionRef = useRef(createHecklerSession())
  const dimensionsRef = useRef({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      dimensionsRef.current = {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }
    window.addEventListener('resize', handleResize)
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  const handleCollision = useCallback(() => handleMiss(1, false), [handleMiss])

  const finalizeGigCallback = useCallback(
    (stateRef: RhythmGameRefState) => {
      finalizeGig(stateRef, setLastGigStats, endGig, audioEngine.stopAudio)
    },
    [audioEngine, endGig, setLastGigStats]
  )

  const update = useCallback(
    (deltaMS: number) => {
      const transportState = audioEngine.getTransportState()
      const isTransportRunning = transportState === 'started'

      processRhythmGameTick({
        stateRef: gameStateRef.current,
        isTransportRunning,
        transportState,
        activeEvent,
        dimensionsRef,
        hecklerSessionRef,
        deltaMS,
        handleCollision,
        setIsToxicMode,
        setIsCorruptionBurstActive,
        handleMiss,
        finalizeGigCallback,
        getGigTimeMs: audioEngine.getGigTimeMs,
        pauseAudio: audioEngine.pauseAudio,
        resumeAudio: audioEngine.resumeAudio,
        setCorruptionState,
        setCorruptionEffect: audioEngine.setCorruptionEffect
      })
    },
    [
      activeEvent,
      audioEngine,
      finalizeGigCallback,
      gameStateRef,
      handleCollision,
      handleMiss,
      setIsToxicMode,
      setIsCorruptionBurstActive,
      setCorruptionState
    ]
  )

  return { update }
}
