/**
 * Migrates a version 1 save payload to the version 2 layout.
 *
 * @param state - Raw, unsanitized save payload as read from storage.
 * @returns The payload in version 2 layout.
 *
 * @remarks
 * Version 2 introduced no structural change to the persisted payload — the
 * marker bump exists so older saves can be told apart from current ones. The
 * step is kept as an explicit identity migration rather than a gap in the
 * chain so `runSaveMigrations` folds through an unbroken version sequence.
 */
export const migrateV1ToV2 = (state: unknown): unknown => state
