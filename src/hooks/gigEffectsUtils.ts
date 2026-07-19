import type { CSSProperties } from 'react'

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
