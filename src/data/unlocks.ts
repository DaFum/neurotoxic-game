/**
 * Persistent unlock ids granted by gameplay.
 *
 * @remarks
 * Unlocks live in the player's cross-run `neurotoxic_unlocks` store
 * (`src/utils/unlockManager.ts` owns persistence; `unlockCheck.ts` owns
 * trait-eligibility and is unrelated). This registry is the one list of valid
 * ids, so an event cannot grant an id that has no display label or that no
 * consumer knows about. Each id needs `unlocks:<id>` EN/DE strings for the
 * unlock toast, and every unlock counts toward the `collector` milestone
 * (`src/data/milestones/milestones.ts`), the consumer of the unlock count.
 * `tests/node/unlockRegistry.test.js` enforces both.
 */
export const UNLOCK_IDS = {
  RARE_VINYL: 'rare_vinyl'
} as const
