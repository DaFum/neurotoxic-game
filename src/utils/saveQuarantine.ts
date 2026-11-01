import { logger } from './logger'
import {
  defaultStorageAdapter,
  listStorageKeys,
  removeStorageItem,
  writeStorageItem
} from './storage'
import type { IStorageAdapter } from './storageAdapter'
import { systemClock } from './clock'
import type { IClock } from './clock'

/** Key prefix for quarantined save payloads. */
const SAVE_QUARANTINE_KEY_PREFIX = 'neurotoxic:save:quarantine:'

/** Copies kept per family; older ones are pruned once a newer copy landed. */
const QUARANTINE_COPIES_PER_FAMILY = 3

/**
 * Why a payload was quarantined: a failed migration, or a save refused before
 * migration (unparseable, not an object, or failing validation).
 */
export type QuarantineKind = 'migration' | 'rejected'

/**
 * Builds the key prefix of one quarantine family: one reason and one version.
 *
 * @param version - Version marker the failing payload carried, or `null` when
 * the payload could not be read far enough to have one.
 * @param kind - Why the payload was quarantined.
 * @returns Family key; each copy is stored under it plus `:<timestamp>-<seq>`.
 * An unknown version gets its own `vunknown` family and a refused save its own
 * `rejected:` family, so neither prunes a real version's migration copies.
 */
export const getQuarantineKey = (
  version: number | null,
  kind: QuarantineKind = 'migration'
): string =>
  `${SAVE_QUARANTINE_KEY_PREFIX}${kind === 'rejected' ? 'rejected:' : ''}v${Number.isFinite(version) ? version : 'unknown'}`

/**
 * Lists the copies of one quarantine family, newest first.
 *
 * @param family - Family key from {@link getQuarantineKey}.
 * @param adapter - Storage backend; defaults to the production singleton.
 * @returns Each copy's key and sequence number; the highest sequence is the
 * newest copy, whatever the clock said when it was written.
 */
export const listQuarantineCopies = (
  family: string,
  adapter: IStorageAdapter = defaultStorageAdapter
): { key: string; seq: number }[] => {
  const copies: { key: string; seq: number }[] = []
  for (const key of listStorageKeys(adapter)) {
    if (!key.startsWith(`${family}:`)) continue
    const match = /^\d+-(\d+)$/.exec(key.slice(family.length + 1))
    if (match?.[1] !== undefined) copies.push({ key, seq: Number(match[1]) })
  }
  return copies.sort((a, b) => b.seq - a.seq)
}

/**
 * Copies a raw, unmigrated save payload aside so a failed load is recoverable
 * instead of being overwritten by the next autosave.
 *
 * @param raw - Exact serialized payload as read from storage.
 * @param version - Version marker the payload carried, or `null` when unknown.
 * @param reason - Failure description recorded alongside the payload.
 * @param adapter - Storage backend; defaults to the production singleton.
 * @param options - `kind` selects the family (default `migration`); `clock`
 * stamps the copy's key (default the system clock).
 * @returns `true` when the copy was written, `false` when storage refused it.
 *
 * @remarks
 * Never overwrites an earlier copy: each one gets its own key, numbered one
 * past the family's newest. Only after the new copy reached persistent storage
 * are copies beyond the newest {@link QUARANTINE_COPIES_PER_FAMILY} pruned, so
 * storage stays bounded without a refused write costing an older copy.
 * Never throws: quarantining is a best-effort recovery aid, so a storage
 * failure here must not turn a load failure into a boot crash.
 */
export const quarantineSave = (
  raw: string,
  version: number | null,
  reason: string,
  adapter: IStorageAdapter = defaultStorageAdapter,
  options: { kind?: QuarantineKind; clock?: IClock } = {}
): boolean => {
  const family = getQuarantineKey(version, options.kind)
  const newest = listQuarantineCopies(family, adapter)[0]
  const key = `${family}:${(options.clock ?? systemClock).now()}-${(newest?.seq ?? 0) + 1}`
  const stored = writeStorageItem(
    key,
    JSON.stringify({ version, reason, raw }),
    adapter
  )
  if (stored) {
    logger.warn('Persistence', `Quarantined unloadable save at ${key}`)
    for (const old of listQuarantineCopies(family, adapter).slice(
      QUARANTINE_COPIES_PER_FAMILY
    )) {
      removeStorageItem(old.key, adapter)
    }
  } else {
    logger.error(
      'Persistence',
      `Quarantined save at ${key} could not be persisted; kept in memory only`
    )
  }
  return stored
}
