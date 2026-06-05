import { useEffect, useRef, useCallback, useMemo } from 'react'
import type { CSSProperties } from 'react'
import { getSafeRandom } from '../utils/crypto'
import { handleError } from '../utils/errorHandler'

type GigVisualStats = {
  isToxicMode: boolean
  overload: number
}

// Deliberate test seams: these pure/DOM helpers stay exported so focused tests
// can pin visual-effect behavior without driving the full hook lifecycle.

/**
 * Calculates chaos visual filter styles based on stats.
 * @param isToxicMode - Forces the toxic-mode filter when active.
 * @param overload - Drives saturation and hue shift above overload thresholds.
 * @returns CSS style object
 */
export const calculateChaosStyle = (
  isToxicMode: boolean,
  overload: number
): CSSProperties => {
  const style: CSSProperties = {}
  if (isToxicMode) {
    style.filter = 'invert(0.1) contrast(1.5) saturate(2)'
    return style
  }
  if (overload > 50) {
    const saturation = 1 + (overload - 50) / 25
    let filter = `saturate(${saturation})`
    if (overload > 80) {
      filter += ` hue-rotate(${overload - 80}deg)`
    }
    style.filter = filter
  }
  return style
}

/**
 * Plays the band member bounce animation using WAAPI.
 * @param memberEl - The DOM element to animate
 * @param existingAnim - The previously cached animation instance
 * @returns The created or reused animation instance
 */
export const playBandMemberAnimation = (
  memberEl: Element | null,
  existingAnim: Animation | null | undefined
): Animation | null => {
  if (!memberEl) return null

  let anim = existingAnim
  const effectTarget =
    typeof KeyframeEffect !== 'undefined' &&
    anim?.effect instanceof KeyframeEffect
      ? anim.effect.target
      : anim?.effect && typeof anim.effect === 'object'
        ? (anim.effect as { target?: unknown }).target
        : undefined
  // Reuse existing animation if valid and attached to same element
  if (anim && effectTarget === memberEl) {
    anim.cancel()
    anim.play()
  } else {
    // Create new animation using WAAPI to avoid forced reflows
    anim = memberEl.animate(
      [
        { transform: 'rotate(0deg) scale(1)', offset: 0 },
        { transform: 'rotate(10deg) scale(1.1)', offset: 0.5 },
        { transform: 'rotate(0deg) scale(1)', offset: 1 }
      ],
      {
        duration: 200,
        easing: 'ease',
        iterations: 1
      }
    )
  }
  return anim
}

/**
 * Applies random translation jitter to the container element.
 * Wrapped in try/catch to gracefully handle `secureRandom` failures.
 *
 * @param containerEl - The DOM element to jitter
 * @param isToxicMode - Whether chaos is active
 * @param getRandom - Random value generator, required if `isToxicMode` is true.
 * @param onError - Callback when an error occurs
 * @returns True if successful, False if an error occurred
 */
export const applyChaosJitter = (
  containerEl: HTMLElement | null,
  isToxicMode: boolean,
  getRandom: (() => number) | null,
  onError?: (error: unknown) => void
): boolean => {
  if (!containerEl) return true

  try {
    if (isToxicMode && getRandom) {
      const JITTER_PIXELS = 2
      const x = getRandom() * (JITTER_PIXELS * 2) - JITTER_PIXELS
      const y = getRandom() * (JITTER_PIXELS * 2) - JITTER_PIXELS
      containerEl.style.transform = `translate(${x}px, ${y}px)`
    } else {
      containerEl.style.transform = 'none'
    }
    return true
  } catch (error) {
    containerEl.style.transform = 'none'
    if (onError) onError(error)
    return false
  }
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
