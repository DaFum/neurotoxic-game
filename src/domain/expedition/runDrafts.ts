import { mulberry32 } from '../../utils/seededRng'
import { fnv1a32 } from '../../utils/stringUtils'
import type { ExpeditionRunDraftTraitId } from '../../types/expedition'
export const EXPEDITION_RUN_DRAFT_TRAITS: readonly ExpeditionRunDraftTraitId[] =
  [
    'road_warrior',
    'field_engineer',
    'crew_mediator',
    'backchannel',
    'cold_trail',
    'reckless_encore'
  ]
/** Traits one Run Draft offer presents; an offer with fewer is not made. */
export const EXPEDITION_RUN_DRAFT_OFFER_SIZE = 3

export const deriveExpeditionDraftCandidates = (
  runSeed: number,
  sourceKey: string,
  owned: readonly ExpeditionRunDraftTraitId[]
): ExpeditionRunDraftTraitId[] => {
  const pool = EXPEDITION_RUN_DRAFT_TRAITS.filter(id => !owned.includes(id))
  const rng = mulberry32(fnv1a32(sourceKey, runSeed))
  return pool
    .map(id => ({ id, score: rng() }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, EXPEDITION_RUN_DRAFT_OFFER_SIZE)
    .map(entry => entry.id)
}
