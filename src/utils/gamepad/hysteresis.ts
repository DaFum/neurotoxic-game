/**
 * Trigger & Direction Hysteresis Utilities.
 * Prevents rapid toggling and stick drift near activation boundaries.
 */

export type DirectionName = 'up' | 'down' | 'left' | 'right'

/**
 * Trigger activation with hysteresis.
 *
 * @param value - Trigger value (0..1).
 * @param wasPressed - Previous trigger pressed state.
 * @param thresholdPress - Value required to activate (default: 0.5).
 * @param thresholdRelease - Value required to release (default: 0.3).
 */
export function isTriggerPressed(
  value: number,
  wasPressed: boolean,
  thresholdPress = 0.5,
  thresholdRelease = 0.3
): boolean {
  const safeVal = Number.isFinite(value) ? value : 0
  if (wasPressed) {
    return safeVal >= thresholdRelease
  }
  return safeVal >= thresholdPress
}

/**
 * Evaluates directional navigation activation based on dominant stick axis with hysteresis.
 * Activation occurs at ~0.6 and release occurs at ~0.4.
 *
 * @param rawX - Normalized or raw X axis value.
 * @param rawY - Normalized or raw Y axis value.
 * @param currentDirection - Currently active direction, if any.
 * @param thresholdActivate - Magnitude to activate direction (default: 0.6).
 * @param thresholdRelease - Magnitude to release direction (default: 0.4).
 */
export function evaluateDirectionHysteresis(
  rawX: number,
  rawY: number,
  currentDirection: DirectionName | null,
  thresholdActivate = 0.6,
  thresholdRelease = 0.4
): DirectionName | null {
  const x = Number.isFinite(rawX) ? rawX : 0
  const y = Number.isFinite(rawY) ? rawY : 0

  const absX = Math.abs(x)
  const absY = Math.abs(y)

  // Determine candidate direction based on dominant axis
  let candidate: DirectionName | null = null
  let candidateMag = 0

  if (absX >= absY) {
    if (x >= thresholdRelease) {
      candidate = 'right'
      candidateMag = absX
    } else if (x <= -thresholdRelease) {
      candidate = 'left'
      candidateMag = absX
    }
  } else {
    if (y >= thresholdRelease) {
      candidate = 'down'
      candidateMag = absY
    } else if (y <= -thresholdRelease) {
      candidate = 'up'
      candidateMag = absY
    }
  }

  // If currently active in a direction
  if (currentDirection !== null) {
    if (candidate === currentDirection && candidateMag >= thresholdRelease) {
      return currentDirection
    }
  }

  // Require full activation threshold for new direction
  if (candidate !== null && candidateMag >= thresholdActivate) {
    return candidate
  }

  return null
}
