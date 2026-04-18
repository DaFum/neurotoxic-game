import { useCallback, useRef, useEffect } from 'react'
import { createHecklerSession } from '../../utils/hecklerLogic'
import {
  getTransportState,
  getGigTimeMs,
  pauseAudio,
  resumeAudio,
  stopAudio
} from '../../utils/audioEngine'
import {
  processRhythmGameTick,
  finalizeGig
} from '../../utils/rhythmGameLoopUtils'
import type {
  RhythmGameRefState,
  RhythmStateSetters
} from './useRhythmGameState'

type RhythmGameLoopParams = {
  gameStateRef: { current: RhythmGameRefState }
  scoringActions: { handleMiss: (count?: number, isEmptyHit?: boolean) => void }
  setters: Pick<RhythmStateSetters, 'setIsToxicMode'>
  contextState: { activeEvent: unknown }
  contextActions: {
    setLastGigStats: (stats: unknown) => void
    endGig: () => void
  }
}

export const useRhythmGameLoop = ({
  gameStateRef,
  scoringActions,
  setters,
  contextState,
  contextActions
}: RhythmGameLoopParams) => {
  const { handleMiss } = scoringActions
  const { setIsToxicMode } = setters
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
      finalizeGig(stateRef, setLastGigStats, endGig, stopAudio)
    },
    [endGig, setLastGigStats]
  )

  const update = useCallback(
    (deltaMS: number) => {
      const transportState = getTransportState()
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
        handleMiss,
        finalizeGigCallback,
        getGigTimeMs,
        pauseAudio,
        resumeAudio
      })
    },
    [
      activeEvent,
      finalizeGigCallback,
      gameStateRef,
      handleCollision,
      handleMiss,
      setIsToxicMode
    ]
  )

  return { update }
}
