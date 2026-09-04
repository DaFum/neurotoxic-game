import type {
  ExpeditionRelationshipActorRef,
  ExpeditionRelationshipTier
} from '../../types/expedition'

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
