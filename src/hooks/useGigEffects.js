import { useEffect, useRef, useCallback } from 'react'

/**
 * Manages visual effects for the Gig scene, including Chaos Mode jitter and band animations.
 *
 * @param {Object} stats - The current game stats (e.g., isToxicMode, overload).
 * @returns {Object} - Refs and styles for the Gig component.
 */
export const useGigEffects = (stats) => {
  const chaosContainerRef = useRef(null)
  const bandAnimationsRef = useRef({})

  /**
   * Triggers a CSS animation on the corresponding band member DOM element.
   * @param {number} laneIndex
   */
  const triggerBandAnimation = useCallback(laneIndex => {
    const memberEl = document.getElementById(`band-member-${laneIndex}`)
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
  const chaosStyle = {}
  if (stats.overload > 50) {
    chaosStyle.filter = `saturate(${1 + (stats.overload - 50) / 25})`
  }
  if (stats.overload > 80) {
    // Subtle hue shift based on overload
    chaosStyle.filter =
      (chaosStyle.filter || '') + ` hue-rotate(${stats.overload - 80}deg)`
  }
  if (stats.isToxicMode) {
    // Full Chaos Filter
    chaosStyle.filter = 'invert(0.1) contrast(1.5) saturate(2)'
  }

  return { chaosContainerRef, chaosStyle, triggerBandAnimation }
}
