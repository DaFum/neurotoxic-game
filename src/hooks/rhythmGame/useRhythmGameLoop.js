/*
 * (#1) Actual Updates: Refactored logic to reduce cognitive complexity and improve testability by extracting pure logic to `src/utils/rhythmGameLoopUtils.js`.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import { useCallback, useRef, useEffect } from 'react'
import { createHecklerSession } from '../../utils/hecklerLogic'
import { getTransportState } from '../../utils/audioEngine'
import { processRhythmGameTick, finalizeGig } from '../../utils/rhythmGameLoopUtils'

export const useRhythmGameLoop = ({
  gameStateRef,
  scoringActions,
  setters,
  contextState,
  contextActions
}) => {
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
    stateRef => {
      finalizeGig(stateRef, setLastGigStats, endGig)
    },
    [endGig, setLastGigStats]
  )

  const update = useCallback(
    deltaMS => {
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
        finalizeGigCallback
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
