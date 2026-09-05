/**
 * Centralized motion tokens for durations, easings, and transitions.
 *
 * @remarks
 * Standardizing motion parameters prevents fragmented animation timings
 * and ensures smooth, consistent micro-interactions and scene presence.
 */

/**
 * Common motion durations (in seconds) mapped to semantic interaction scales.
 */
export const MOTION_DURATIONS = {
  instant: 0,
  fast: 0.2,
  normal: 0.25,
  slow: 0.6,
  hero: 0.8,
  long: 1.0,
  scene: 0.15
} as const

/**
 * Common motion easing curves for entering, exiting, and linear animations.
 */
export const MOTION_EASING = {
  enter: 'easeOut',
  exit: 'easeIn',
  linear: 'linear'
} as const

/**
 * Preset motion transitions combining duration and easing parameters tailored for specific UI layers.
 */
export const MOTION_TRANSITIONS = {
  ui: {
    duration: MOTION_DURATIONS.normal,
    ease: MOTION_EASING.enter
  },
  modal: {
    duration: MOTION_DURATIONS.fast,
    ease: MOTION_EASING.enter
  },
  modalExit: {
    duration: MOTION_DURATIONS.fast,
    ease: MOTION_EASING.exit
  },
  scene: {
    duration: MOTION_DURATIONS.scene,
    ease: MOTION_EASING.enter
  },
  toast: {
    duration: MOTION_DURATIONS.fast,
    ease: MOTION_EASING.enter
  }
} as const
