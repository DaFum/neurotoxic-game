import { useEffect, useRef, useCallback, useMemo } from 'react'
import { secureRandom } from '../utils/crypto.js'
import { handleError } from '../utils/errorHandler.js'

let secureRandomErrorReported = false

/**
 * Calculates chaos visual filter styles based on stats.
 * @param {boolean} isToxicMode
 * @param {number} overload
 * @returns {Object} CSS style object
 */
export const calculateChaosStyle = (isToxicMode, overload) => {
  const style = {}
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
 * @param {Element} memberEl - The DOM element to animate
 * @param {Animation} existingAnim - The previously cached animation instance
 * @returns {Animation|null} The created or reused animation instance
 */
export const playBandMemberAnimation = (memberEl, existingAnim) => {
  if (!memberEl) return null

  let anim = existingAnim
  // Reuse existing animation if valid and attached to same element
  if (anim && anim.effect && anim.effect.target === memberEl) {
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
 * @param {Element} containerEl - The DOM element to jitter
 * @param {boolean} isToxicMode - Whether chaos is active
 * @param {Function} getRandom - Random value generator, required if `isToxicMode` is true.
 * @param {Function} onError - Callback when an error occurs
 * @returns {boolean} True if successful, False if an error occurred
 */
export const applyChaosJitter = (containerEl, isToxicMode, getRandom, onError) => {
  if (!containerEl) return true

  try {
    if (isToxicMode) {
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
 * @param {Object} stats - The current game stats (e.g., isToxicMode, overload).
 * @returns {Object} - Refs and styles for the Gig component.
 */
export const useGigEffects = stats => {
  const chaosContainerRef = useRef(null)
  const bandAnimationsRef = useRef({})
  const bandMembersRef = useRef([])
  const bandMemberSettersRef = useRef([])

  /**
   * Returns a stable ref callback for a band member at the given index.
   * @param {number} index
   */
  const setBandMemberRef = useCallback(index => {
    if (!bandMemberSettersRef.current[index]) {
      bandMemberSettersRef.current[index] = el => {
        bandMembersRef.current[index] = el
      }
    }
    return bandMemberSettersRef.current[index]
  }, [])

  /**
   * Triggers a CSS animation on the corresponding band member DOM element.
   * @param {number} laneIndex
   */
  const triggerBandAnimation = useCallback(laneIndex => {
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
    let rAF
    const animateChaos = () => {
      const isSuccess = applyChaosJitter(
        chaosContainerRef.current,
        stats.isToxicMode,
        secureRandom,
        (error) => {
          cancelAnimationFrame(rAF)
          if (!secureRandomErrorReported) {
            handleError(error, { severity: 'medium', silent: true })
            secureRandomErrorReported = true
          }
        }
      )

      if (isSuccess && stats.isToxicMode) {
        rAF = requestAnimationFrame(animateChaos)
      }
    }

    if (stats.isToxicMode) {
      rAF = requestAnimationFrame(animateChaos)
    } else {
      applyChaosJitter(chaosContainerRef.current, false, null, (error) => {
        if (!secureRandomErrorReported) {
          handleError(error, { severity: 'medium', silent: true })
          secureRandomErrorReported = true
        }
      })
    }

    return () => cancelAnimationFrame(rAF)
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
