/**
 * Normalizes a raw save-version marker into the number the migration chain
 * expects.
 *
 * @param value - Raw `version` field as read from a save payload.
 * @returns The version as a non-negative integer, or `null` when the marker is
 * unusable.
 *
 * @remarks
 * The single contract behind every save-load boundary: `validateSaveData`,
 * `usePersistence`, and `handleLoadGame` all decide "is this a usable version"
 * here, so schema selection cannot differ between the normal load path,
 * screenshot injection, and a direct `LOAD_GAME` dispatch.
 *
 * Deliberately kept out of `reducers/migrations` despite feeding it: suites
 * that stub the migration chain replace that whole module, and a parser living
 * there would vanish with it.
 *
 * Digit-only strings are accepted as a deliberate legacy-compatibility step:
 * `PERSISTED_FIELDS.version` has always persisted number-or-string, and
 * rejecting `'2'` would silently re-run every migration from `0` on a save that
 * carries one. Such a string is accepted only when it denotes a safe
 * non-negative integer. Nothing else is coerced — `true`, `[2]`, `' 2'`, `2.5`,
 * `-1`, and digit runs that overflow are rejected rather than folded into a
 * number.
 */
export const parseSaveVersion = (value: unknown): number | null => {
  if (typeof value === 'number') {
    // `isSafeInteger`, not `isInteger`: `2 ** 53` is an integer but no longer
    // round-trips, and the string branch below already rejects it -- the two
    // branches must not disagree on the same value.
    return Number.isSafeInteger(value) && value >= 0 ? value : null
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    // The regex admits arbitrarily long digit runs, and `Number` turns those
    // into `Infinity`. Left unchecked it would pass validation, get stamped
    // into state, and serialize back as `null` -- bricking the save on the next
    // load. `isSafeInteger` also rejects values past 2^53 that stay finite but
    // no longer round-trip through JSON.
    const parsed = Number(value)
    return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null
  }
  return null
}
