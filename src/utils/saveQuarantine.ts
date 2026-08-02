import { logger } from './logger'

/**
 * Key prefix for quarantined save payloads. One slot per source version, so a
 * repeatedly failing migration cannot grow storage without bound.
 */
export const SAVE_QUARANTINE_KEY_PREFIX = 'neurotoxic:save:quarantine:'

/**
 * Builds the quarantine key for a given save version.
 *
 * @param version - Version marker the failing payload carried.
 * @returns Storage key the raw payload is copied to.
 */
export const getQuarantineKey = (version: number): string =>
  `${SAVE_QUARANTINE_KEY_PREFIX}v${Number.isFinite(version) ? version : 'unknown'}`

/**
 * Copies a raw, unmigrated save payload aside so a failed migration is
 * recoverable instead of being overwritten by the next autosave.
 *
 * @param raw - Exact serialized payload as read from storage.
 * @param version - Version marker the payload carried.
 * @param reason - Failure description recorded alongside the payload.
 * @returns `true` when the copy was written, `false` when storage refused it.
 *
 * @remarks
 * Never throws: quarantining is a best-effort recovery aid, so a storage
 * failure here must not turn a migration failure into a boot crash.
 */
export const quarantineSave = (
  raw: string,
  version: number,
  reason: string
): boolean => {
  const key = getQuarantineKey(version)
  try {
    localStorage.setItem(key, JSON.stringify({ version, reason, raw }))
    logger.warn('Persistence', `Quarantined unmigrated save at ${key}`)
    return true
  } catch (error) {
    logger.error(
      'Persistence',
      `Failed to quarantine save at ${key}`,
      error instanceof Error ? error.message : String(error)
    )
    return false
  }
}
