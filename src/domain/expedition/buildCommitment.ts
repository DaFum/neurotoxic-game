/**
 * Committed-identity freeze for an active Expedition.
 *
 * @remarks
 * The design makes the pre-tour build a real commitment: the player must not be
 * able to bring every solution, and must not be able to swap the build back out
 * once the route is underway. These predicates are the shared authority the
 * setlist and chassis-module reducers consult, so the freeze holds against a
 * direct dispatch rather than only against the Tour Prep UI.
 *
 * Only *identity* is frozen. Mood, stamina, relationships, injuries, technical
 * Condition and consumables stay mutable — they are the run's consequences, not
 * its commitments.
 */

import { normalizeSetlistForSave } from '../../utils/gameState/setlist'
import type { GameState } from '../../types'
import type { RhythmSetlistEntry } from '../../types/rhythmGame'

/**
 * Reports whether the committed build is currently frozen.
 *
 * @param state - Current game state.
 * @returns True while a run is active.
 *
 * @remarks
 * `prepared` deliberately does not freeze: reopening Tour Prep before START is
 * edit-only by design.
 */
export const isExpeditionCommitmentFrozen = (state: GameState): boolean =>
  state.expedition.status === 'active' && state.expedition.loadout !== null

/**
 * Extracts the song ids a setlist payload resolves to.
 *
 * @param setlist - Raw setlist payload or persisted setlist.
 * @returns Song ids in order.
 */
export const readSetlistSongIds = (setlist: unknown): string[] =>
  normalizeSetlistForSave(setlist).map(entry => entry.id)

/**
 * Detects a setlist that drifts from the committed one.
 *
 * @param state - Current game state.
 * @param candidate - Setlist payload a caller wants to install.
 * @returns True when the change must be rejected.
 *
 * @remarks
 * Order matters: the committed setlist is what the player planned the run's
 * pacing and stamina around, so a reorder is as much a drift as a swap.
 */
export const isExpeditionSetlistDrift = (
  state: GameState,
  candidate: RhythmSetlistEntry[] | unknown
): boolean => {
  if (!isExpeditionCommitmentFrozen(state)) return false
  const committed = state.expedition.loadout?.build.setlistSongIds ?? []
  const next = readSetlistSongIds(candidate)
  if (next.length !== committed.length) return true
  return next.some((songId, index) => songId !== committed[index])
}

/**
 * Detects a module mutation on the chassis the active run committed to.
 *
 * @param state - Current game state.
 * @param assetId - Asset a caller wants to install into or remove from.
 * @returns True when the change must be rejected.
 *
 * @remarks
 * Scoped to the committed chassis only: the player may still service an asset
 * that is not part of this run.
 */
export const isExpeditionChassisCommitmentLocked = (
  state: GameState,
  assetId: unknown
): boolean => {
  if (!isExpeditionCommitmentFrozen(state)) return false
  const committedAssetId = state.expedition.loadout?.activeTourbusAssetId
  if (typeof committedAssetId !== 'string') return false
  return assetId === committedAssetId
}
