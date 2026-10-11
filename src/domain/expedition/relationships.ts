import type {
  ExpeditionRelationshipActorRef,
  ExpeditionRelationshipTier
} from '../../types/expedition'
import { finiteNumberOr } from '../../utils/finiteNumber'

const actorKey = (actor: ExpeditionRelationshipActorRef): string =>
  `${actor.kind}:${actor.id}`
export const getExpeditionRelationshipPairKey = (
  first: ExpeditionRelationshipActorRef,
  second: ExpeditionRelationshipActorRef
): string => [actorKey(first), actorKey(second)].sort().join('|')
export const applyRelationshipTierDelta = (
  tier: ExpeditionRelationshipTier,
  delta: number
): ExpeditionRelationshipTier =>
  Math.max(-2, Math.min(2, tier + delta)) as ExpeditionRelationshipTier

/**
 * Reads the persisted tier of one actor pair.
 *
 * @param relationshipByPair - `career.expeditionRelationshipByPair`.
 * @param first - One actor of the pair.
 * @param second - The other actor; order does not matter.
 * @returns The stored tier, or `0` (neutral) for a pair with no history.
 *
 * @remarks
 * The single read point for event eligibility and the crew-status display, so
 * both see the same pair key and the same bounded tier even for a malformed
 * stored value.
 */
export const getExpeditionRelationshipTier = (
  relationshipByPair:
    Readonly<Record<string, ExpeditionRelationshipTier>> | null | undefined,
  first: ExpeditionRelationshipActorRef,
  second: ExpeditionRelationshipActorRef
): ExpeditionRelationshipTier => {
  const key = getExpeditionRelationshipPairKey(first, second)
  if (!relationshipByPair || !Object.hasOwn(relationshipByPair, key)) return 0
  return applyRelationshipTierDelta(
    0,
    Math.trunc(finiteNumberOr(relationshipByPair[key], 0))
  )
}
