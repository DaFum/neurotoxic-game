/**
 * Gamepad API Capability Checks.
 * Safely checks and invokes navigator.getGamepads() without throwing.
 */

export function isGamepadAPISupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.getGamepads === 'function'
  )
}

export function getSafeGamepads(): (Gamepad | null)[] {
  if (!isGamepadAPISupported()) {
    return []
  }

  try {
    const rawPads = navigator.getGamepads()
    if (!rawPads) return []
    const result: (Gamepad | null)[] = []
    for (let i = 0; i < rawPads.length; i++) {
      result.push(rawPads[i] ?? null)
    }
    return result
  } catch (_err) {
    return []
  }
}
