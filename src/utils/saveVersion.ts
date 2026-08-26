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
 * carries one. Nothing else is coerced — `true`, `[2]`, `' 2'`, `2.5`, and `-1`
 * are rejected rather than folded into a number.
 */
export const parseSaveVersion = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 0 ? value : null
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number(value)
  }
  return null
}
