import type { GameSettings, RawGameSettings } from '../types'
import { isValidLogLevel } from './logger'
import { RESERVED_START_BUTTON } from './gamepad/standardIndices'

/**
 * Canonical sanitizer for game settings updates.
 *
 * Whitelists the known settings keys and validates each value type, dropping
 * unknown keys and malformed values. Shared by the reducer's `LOAD_GAME` /
 * `UPDATE_SETTINGS` handling and the global-storage write so every path
 * persists the same validated shape.
 *
 * @param rawSettings - Untrusted settings object (from a save, an action
 * payload, or global storage).
 * @returns A partial settings object containing only valid whitelisted entries.
 */
export const sanitizeSettingsPayload = (
  rawSettings: RawGameSettings | Record<string, unknown>
): Partial<GameSettings> => {
  const sanitized: Partial<GameSettings> = {}

  if (rawSettings == null || typeof rawSettings !== 'object') {
    return sanitized
  }

  if (
    Object.hasOwn(rawSettings, 'crtEnabled') &&
    typeof rawSettings.crtEnabled === 'boolean'
  ) {
    sanitized.crtEnabled = rawSettings.crtEnabled
  }
  if (
    Object.hasOwn(rawSettings, 'tutorialSeen') &&
    typeof rawSettings.tutorialSeen === 'boolean'
  ) {
    sanitized.tutorialSeen = rawSettings.tutorialSeen
  }
  if (
    Object.hasOwn(rawSettings, 'logLevel') &&
    typeof rawSettings.logLevel === 'number' &&
    Number.isFinite(rawSettings.logLevel)
  ) {
    // Drop out-of-range levels (e.g. -1, 999) so stored settings can't drift
    // from the logger's supported range. isValidLogLevel is the canonical check.
    const flooredLevel = Math.floor(rawSettings.logLevel)
    if (isValidLogLevel(flooredLevel)) {
      sanitized.logLevel = flooredLevel
    }
  }

  if (Object.hasOwn(rawSettings, 'gamepadLaneBindings')) {
    const bindings = rawSettings.gamepadLaneBindings
    if (Array.isArray(bindings) && bindings.length === 3) {
      const isValid = bindings.every((val, idx) => {
        return (
          Object.hasOwn(bindings, idx) &&
          typeof val === 'number' &&
          Number.isFinite(val) &&
          Number.isInteger(val) &&
          val >= 0 &&
          val <= 63 &&
          val !== RESERVED_START_BUTTON
        )
      })
      if (isValid) {
        const unique = new Set(bindings)
        if (unique.size === 3) {
          sanitized.gamepadLaneBindings = [bindings[0], bindings[1], bindings[2]]
        }
      }
    }
  }

  return sanitized
}
