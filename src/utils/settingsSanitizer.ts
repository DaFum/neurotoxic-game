import type { GameSettings, RawGameSettings } from '../types'

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
    sanitized.logLevel = Math.floor(rawSettings.logLevel)
  }

  return sanitized
}
