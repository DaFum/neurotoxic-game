/**
 * Critical-injury gate for Expedition Gigs.
 *
 * @remarks
 * Kept apart from `injuries.ts` so `condition.ts` can read the gate without
 * importing the injury performance profiles, which themselves read Condition:
 * both modules depend on this one, and neither depends on the other.
 */

import type { GameState } from '../../types'

/**
 * Finds the first band member whose Expedition injury is critical.
 *
 * @param state - Expedition and band slices.
 * @returns The member's id, or `null` when nobody is critically injured or no
 * run is active.
 *
 * @remarks
 * The one owner of the critical-injury scan: the gig gate below, the pre-gig
 * start check and the crew-collapse failure signal all read it, so they cannot
 * disagree about who counts as unable to play.
 */
export const getCriticallyInjuredBandMemberId = (
  state: Pick<GameState, 'expedition' | 'band'>
): string | null => {
  if (state.expedition?.status !== 'active') return null
  for (const member of state.band.members) {
    if (
      member &&
      typeof member.id === 'string' &&
      state.expedition.bandInjuryByMemberId?.[member.id] === 'critical'
    )
      return member.id
  }
  return null
}

export const canPerformExpeditionGig = (
  state: Pick<GameState, 'expedition' | 'band'>
): boolean => getCriticallyInjuredBandMemberId(state) === null
