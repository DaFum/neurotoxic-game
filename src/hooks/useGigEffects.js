import { useEffect, useRef, useCallback, useMemo } from 'react'

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
      let anim = bandAnimationsRef.current[laneIndex]

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
        bandAnimationsRef.current[laneIndex] = anim
      }
    }
  }, [])

  // Chaos Mode Visuals (Jitter via RAF)
  useEffect(() => {
    let rAF
    const animateChaos = () => {
      if (stats.isToxicMode && chaosContainerRef.current) {
        const x = Math.random() * 4 - 2
        const y = Math.random() * 4 - 2
        chaosContainerRef.current.style.transform = `translate(${x}px, ${y}px)`
      } else if (chaosContainerRef.current) {
        chaosContainerRef.current.style.transform = 'none'
      }
      if (stats.isToxicMode) {
        rAF = requestAnimationFrame(animateChaos)
      }
    }

    if (stats.isToxicMode) {
      rAF = requestAnimationFrame(animateChaos)
    } else if (chaosContainerRef.current) {
      chaosContainerRef.current.style.transform = 'none'
    }

    return () => cancelAnimationFrame(rAF)
  }, [stats.isToxicMode])

  // Chaos Mode Visuals (Filters)
  const chaosStyle = useMemo(() => {
    const style = {}
    if (stats.overload > 50) {
      style.filter = `saturate(${1 + (stats.overload - 50) / 25})`
    }
    if (stats.overload > 80) {
      // Subtle hue shift based on overload
      style.filter =
        (style.filter || '') + ` hue-rotate(${stats.overload - 80}deg)`
    }
    if (stats.isToxicMode) {
      // Full Chaos Filter
      style.filter = 'invert(0.1) contrast(1.5) saturate(2)'
    }
    return style
  }, [stats.overload, stats.isToxicMode])

  return {
    chaosContainerRef,
    chaosStyle,
    triggerBandAnimation,
    setBandMemberRef
  }
}
