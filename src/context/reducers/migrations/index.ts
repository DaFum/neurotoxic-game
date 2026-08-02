import { logger } from '../../../utils/logger'
import { migrateV1ToV2 } from './v1_to_v2'

/**
 * Schema version written by the current build. Saves below this version are
 * folded through `SAVE_MIGRATIONS` on load.
 */
export const CURRENT_SAVE_VERSION = 2

/**
 * A single, pure save migration step.
 */
export interface SaveMigration {
  /** Version the payload carries after this step ran. */
  readonly to: number
  /** Pure transform from the previous layout to the `to` layout. */
  readonly migrate: (state: unknown) => unknown
}

/**
 * Ordered migration chain, ascending by target version. Every step is pure and
 * unit-tested in isolation; `runSaveMigrations` owns the ordering.
 */
export const SAVE_MIGRATIONS: readonly SaveMigration[] = [
  { to: 2, migrate: migrateV1ToV2 }
]

/**
 * Folds a raw save payload through every migration above its stored version.
 *
 * @param payload - Raw, unsanitized save payload as read from storage.
 * @param fromVersion - Version marker the payload carries.
 * @param migrations - Chain to fold through; defaults to `SAVE_MIGRATIONS`.
 * @returns The payload in the current layout.
 *
 * @throws Whatever a migration step throws — callers decide how to recover.
 */
export const runSaveMigrations = (
  payload: unknown,
  fromVersion: number,
  migrations: readonly SaveMigration[] = SAVE_MIGRATIONS
): unknown => {
  let migrated = payload
  for (const step of migrations) {
    if (step.to <= fromVersion) continue
    logger.info('SaveMigration', `Applying migration to version ${step.to}`)
    migrated = step.migrate(migrated)
  }
  return migrated
}
