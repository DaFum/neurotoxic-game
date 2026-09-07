/**
 * The starter perks a Career can commit to one run.
 *
 * @remarks
 * A perk is a *build option*, not a payout: each one changes how a run plays
 * and none of them hands over Cash or a reward. Every perk is earned through
 * the unlock set that carries its capability, so a Career that has bought
 * nothing has no perks to pick - the Tour Prep list is empty rather than
 * seeded with free advantage.
 *
 * A Legendary id is never a legal starter perk: this registry is the whole
 * vocabulary, and `getAvailableStarterPerkIds` filters it rather than
 * accepting an id from anywhere else.
 */

import type { ExpeditionCapabilityId } from '../../types/career'
import type { ExpeditionNumericRules } from '../../types/expedition'

/** Canonical starter perk ids. */
export type ExpeditionStarterPerkId =
  'mechanic_kit' | 'press_pass' | 'underground_contact' | 'rehearsed_set'

/** One starter perk: what unlocks it and what it is worth. */
export interface ExpeditionStarterPerkDefinition {
  id: ExpeditionStarterPerkId
  /** Capability the Career must own for this perk to be selectable. */
  capabilityId: ExpeditionCapabilityId
  /**
   * The perk's contribution to the composed numeric rules.
   *
   * @remarks
   * Read at the Starter Perk stage of `getEffectiveExpeditionRules` with the
   * same identities every other stage uses - `0` for the additive starting
   * values, `1` for multipliers - so a perk can never reach a number by any
   * other path.
   */
  numeric: Partial<ExpeditionNumericRules>
  /**
   * Added to the effective Sponsor-quality bias.
   *
   * @remarks
   * Composed with the Fame band's own bias and with `premium_sponsor_pool`,
   * then capped: the perk buys a better pool, never a bigger one.
   */
  sponsorQualityBias?: number
  /**
   * Whether the perk hints Underground opportunity presence at Level 0.
   *
   * @remarks
   * A category hint, not a payout-level reveal: it says an Underground
   * opportunity is on the route, never what it pays, so it cannot stand in for
   * a committed Scout.
   */
  revealsUndergroundCategory?: true
  /**
   * Points of technical wear the perk absorbs at the run's first Gig.
   *
   * @remarks
   * Spent on the group that is *currently* lowest, so the protection lands
   * where the run has actually taken damage. One Gig per run, consumed through
   * a run marker so a reload cannot spend it twice.
   */
  firstGigSetupProtection?: number
}

/** Every starter perk, keyed by its canonical id. */
export const EXPEDITION_STARTER_PERKS = {
  mechanic_kit: {
    id: 'mechanic_kit',
    capabilityId: 'perk_mechanic_kit',
    numeric: { startingSpareParts: 1 }
  },
  press_pass: {
    id: 'press_pass',
    capabilityId: 'perk_press_pass',
    numeric: {},
    // Quality, never count or payout: one more of the staged offers is
    // guaranteed to be a genuine match. Stacks with `premium_sponsor_pool`
    // into the same effective bias, which is capped so the two together can
    // never promote more real matches than the pool has room for.
    sponsorQualityBias: 1
  },
  underground_contact: {
    id: 'underground_contact',
    capabilityId: 'perk_underground_contact',
    numeric: { startingHeat: 5 },
    revealsUndergroundCategory: true
  },
  rehearsed_set: {
    id: 'rehearsed_set',
    capabilityId: 'perk_rehearsed_set',
    numeric: {},
    firstGigSetupProtection: 20
  }
} as const satisfies Record<
  ExpeditionStarterPerkId,
  ExpeditionStarterPerkDefinition
>

/** Every starter perk id, for iteration and registry invariants. */
export const EXPEDITION_STARTER_PERK_IDS = Object.keys(
  EXPEDITION_STARTER_PERKS
) as readonly ExpeditionStarterPerkId[]

/**
 * Narrows an untrusted value to a known starter perk id.
 *
 * @param value - Raw candidate, typically from a payload or a save.
 * @returns True when the id is in the registry.
 */
export const isExpeditionStarterPerkId = (
  value: unknown
): value is ExpeditionStarterPerkId =>
  typeof value === 'string' && Object.hasOwn(EXPEDITION_STARTER_PERKS, value)

/**
 * Reads a starter perk, or `null` for an id the registry does not have.
 *
 * @param perkId - Candidate id.
 * @returns The definition, or `null`.
 */
export const getExpeditionStarterPerk = (
  perkId: unknown
): ExpeditionStarterPerkDefinition | null =>
  isExpeditionStarterPerkId(perkId) ? EXPEDITION_STARTER_PERKS[perkId] : null
