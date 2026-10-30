/**
 * Radial Deadzone calculation for analog thumbsticks.
 */

export interface DeadzoneResult {
  x: number
  y: number
  magnitude: number
}

/**
 * Applies a radial deadzone threshold to analog stick coordinates.
 *
 * @param x - Raw X axis value (-1..1).
 * @param y - Raw Y axis value (-1..1).
 * @param deadzone - Radial deadzone radius (default: 0.25).
 * @returns Object with normalized x, y, and magnitude (0..1).
 */
export function applyRadialDeadzone(
  x: number,
  y: number,
  deadzone = 0.25
): DeadzoneResult {
  const safeX = Number.isFinite(x) ? x : 0
  const safeY = Number.isFinite(y) ? y : 0
  const mag = Math.hypot(safeX, safeY)

  if (mag <= deadzone) {
    return { x: 0, y: 0, magnitude: 0 }
  }

  // Smooth re-scaling between deadzone and 1.0
  const scaledMag = Math.min(1, (mag - deadzone) / (1 - deadzone))
  const normX = (safeX / mag) * scaledMag
  const normY = (safeY / mag) * scaledMag

  return {
    x: normX,
    y: normY,
    magnitude: scaledMag
  }
}
