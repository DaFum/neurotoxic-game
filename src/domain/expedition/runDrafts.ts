import { mulberry32 } from '../../utils/seededRng'
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
const hash = (seed: number, key: string): number => {
  let value = seed >>> 0
  for (let i = 0; i < key.length; i += 1)
    value = Math.imul(value ^ key.charCodeAt(i), 16777619) >>> 0
  return value
}
export const deriveExpeditionDraftCandidates = (
  runSeed: number,
  sourceKey: string,
  owned: readonly ExpeditionRunDraftTraitId[]
): ExpeditionRunDraftTraitId[] => {
  const pool = EXPEDITION_RUN_DRAFT_TRAITS.filter(id => !owned.includes(id))
  const rng = mulberry32(hash(runSeed, sourceKey))
  return pool
    .map(id => ({ id, score: rng() }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 3)
    .map(entry => entry.id)
}
