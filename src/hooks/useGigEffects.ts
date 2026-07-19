import { useEffect, useRef, useCallback, useMemo } from 'react'
import { getSafeRandom } from '../utils/crypto'
import { handleError } from '../utils/errorHandler'
import {
  applyChaosJitter,
  calculateChaosStyle,
  playBandMemberAnimation
} from './gigEffectsUtils'

type GigVisualStats = {
  isToxicMode: boolean
  overload: number
}

/**
 * Manages visual effects for the Gig scene, including Chaos Mode jitter and band animations.
 *
 * @param stats - The current game stats (e.g., isToxicMode, overload).
 * @returns - Refs and styles for the Gig component.
 */
export const useGigEffects = (stats: GigVisualStats) => {
  const chaosContainerRef = useRef<HTMLDivElement | null>(null)
  const bandAnimationsRef = useRef<Record<number, Animation | null>>({})
  const bandMembersRef = useRef<Array<HTMLElement | null>>([])
  const bandMemberSettersRef = useRef<
    Array<((el: HTMLElement | null) => void) | undefined>
  >([])

  /**
   * Returns a stable ref callback for a band member at the given index.
   * @param index - Index.
   */
  const setBandMemberRef = useCallback((index: number) => {
    if (!bandMemberSettersRef.current[index]) {
      bandMemberSettersRef.current[index] = (el: HTMLElement | null) => {
        bandMembersRef.current[index] = el
      }
    }
    return bandMemberSettersRef.current[index]
  }, [])

  /**
   * Triggers a CSS animation on the corresponding band member DOM element.
   * @param laneIndex - Lane index.
   */
  const triggerBandAnimation = useCallback((laneIndex: number) => {
    const memberEl = bandMembersRef.current[laneIndex]
    if (memberEl) {
      const currentAnim = bandAnimationsRef.current[laneIndex]
      const nextAnim = playBandMemberAnimation(memberEl, currentAnim)
      if (nextAnim) {
        bandAnimationsRef.current[laneIndex] = nextAnim
      }
    }
  }, [])

  // Chaos Mode Visuals (Jitter via RAF)
  useEffect(() => {
    let rAF: number | undefined
    const animateChaos = () => {
      const isSuccess = applyChaosJitter(
        chaosContainerRef.current,
        stats.isToxicMode,
        getSafeRandom,
        (error: unknown) => {
          if (rAF !== undefined) cancelAnimationFrame(rAF)
          handleError(error, { severity: 'medium', silent: true })
        }
      )

      if (isSuccess && stats.isToxicMode) {
        rAF = requestAnimationFrame(animateChaos)
      }
    }

    if (stats.isToxicMode) {
      rAF = requestAnimationFrame(animateChaos)
    } else {
      applyChaosJitter(
        chaosContainerRef.current,
        false,
        null,
        (error: unknown) => {
          handleError(error, { severity: 'medium', silent: true })
        }
      )
    }

    return () => {
      if (rAF !== undefined) cancelAnimationFrame(rAF)
    }
  }, [stats.isToxicMode])

  // Chaos Mode Visuals (Filters)
  const chaosStyle = useMemo(() => {
    return calculateChaosStyle(stats.isToxicMode, stats.overload)
  }, [stats.overload, stats.isToxicMode])

  return {
    chaosContainerRef,
    chaosStyle,
    triggerBandAnimation,
    setBandMemberRef
  }
}
