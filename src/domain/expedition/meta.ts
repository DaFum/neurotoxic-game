/**
 * Career meta progression: Tour Tokens and the derived Career rank.
 *
 * @remarks
 * Both are consequences of what the Career actually did. Tokens are minted
 * once per settled run from the run's own finalized outcome, and the rank is
 * recomputed from the counters every time it is read rather than stored — so
 * no caller can name a rank, and a save cannot hold one its counters do not
 * support.
 */

import type { CareerState, ExpeditionCareerRank } from '../../types/career'
import type { GameState } from '../../types'

/**
 * Tokens a finalized run is worth, by how it ended.
 *
 * @remarks
 * Failing is not punished with a negative balance — it simply earns nothing,
 * which keeps the extraction decision about what the run is carrying rather
 * than about avoiding a penalty.
 */
const TOKENS_BY_OUTCOME_KIND = {
  failed: 0,
  extracted: 1,
  completed: 2
} as const

/** Extra token for the first run that reaches its end in a new Region. */
const NEW_REGION_TOKEN = 1 as const

/** Extra token for a run that carries a validated meta-unlock milestone. */
const META_UNLOCK_QUEST_TOKEN = 1 as const

/** The quest whose milestone the meta-unlock token is proven against. */
const META_UNLOCK_QUEST_ID = 'quest_expedition_meta_unlock' as const

/**
 * The furthest a persistent Rival feud has been driven.
 *
 * @param career - Career slice.
 * @returns The highest Nemesis level across every persisted Rival.
 */
export const getMaxPersistentNemesisLevel = (career: CareerState): number => {
  let max = 0
  for (const record of Object.values(career.rivalsById)) {
    const level = record?.history?.nemesisLevel
    if (typeof level === 'number' && level > max) max = level
  }
  return max
}

/**
 * Derives the Career rank from its accomplishments.
 *
 * @param career - Career slice.
 * @returns The rank those counters support.
 *
 * @remarks
 * Evaluated from the top so a Career that satisfies a higher rank is never
 * reported at a lower one. Every input is a counter the Career earned; Fame is
 * deliberately absent, because Fame is a pressure and access signal rather
 * than a progression currency.
 */
export const deriveExpeditionCareerRank = (
  career: CareerState
): ExpeditionCareerRank => {
  const completed = career.completedExpeditionRuns
  const regions = career.completedExpeditionRegionIds.length
  if (
    completed >= 10 &&
    regions >= 4 &&
    getMaxPersistentNemesisLevel(career) >= 3
  ) {
    return 'cult_legend'
  }
  if (completed >= 5 && regions >= 2) return 'headliner'
  if (career.finalizedExpeditionRuns >= 2 && completed >= 1) {
    return 'roadtested'
  }
  return 'rookie'
}

/** Reads the current Career rank off game state. */
const getExpeditionCareerRank = (state: GameState): ExpeditionCareerRank =>
  deriveExpeditionCareerRank(state.career)

/** Ranks in ascending order, so a gate can compare without a lookup table. */
const RANK_ORDER: readonly ExpeditionCareerRank[] = [
  'rookie',
  'roadtested',
  'headliner',
  'cult_legend'
]

/**
 * Whether the Career has reached at least a rank.
 *
 * @param state - Current game state.
 * @param minimum - Rank the caller requires.
 * @returns True when the derived rank is at or above it.
 */
export const hasExpeditionCareerRank = (
  state: GameState,
  minimum: ExpeditionCareerRank
): boolean =>
  RANK_ORDER.indexOf(getExpeditionCareerRank(state)) >=
  RANK_ORDER.indexOf(minimum)

/** What settling one run's Career result changes. */
export interface ExpeditionCareerSettlement {
  tourTokensAwarded: number
  finalizedExpeditionRuns: number
  completedExpeditionRuns: number
  completedExpeditionRegionIds: string[]
}

/**
 * Computes one run's Career settlement from its canonical evidence.
 *
 * @param state - Current game state.
 * @param runId - Run being settled.
 * @returns The settlement, or `null` when the run cannot be settled.
 *
 * @remarks
 * The run's own finalized outcome is the only source: the caller names which
 * run, never what it earned. A run already in `settledExpeditionRunIds` and a
 * run whose outcome does not match both return `null`, so a replay changes
 * nothing.
 */
export const resolveExpeditionCareerSettlement = (
  state: GameState,
  runId: unknown
): ExpeditionCareerSettlement | null => {
  if (typeof runId !== 'string' || runId.length === 0) return null
  const outcome = state.expedition.outcome
  if (!outcome || outcome.runId !== runId) return null
  if (state.career.settledExpeditionRunIds.includes(runId)) return null

  const career = state.career
  const reachedEnd =
    outcome.kind === 'completed' || outcome.kind === 'extracted'
  const regionId = state.expedition.loadout?.regionId ?? null
  const isNewRegion =
    reachedEnd &&
    typeof regionId === 'string' &&
    regionId.length > 0 &&
    !career.completedExpeditionRegionIds.includes(regionId)

  // The milestone is proven against the completed-quest record rather than a
  // payload flag, and the per-run cap is the settled-run guard above.
  const hasMetaUnlockMilestone =
    Array.isArray(state.completedQuestIds) &&
    state.completedQuestIds.includes(META_UNLOCK_QUEST_ID)

  return {
    tourTokensAwarded:
      TOKENS_BY_OUTCOME_KIND[outcome.kind] +
      (isNewRegion ? NEW_REGION_TOKEN : 0) +
      (hasMetaUnlockMilestone ? META_UNLOCK_QUEST_TOKEN : 0),
    finalizedExpeditionRuns: career.finalizedExpeditionRuns + 1,
    completedExpeditionRuns:
      career.completedExpeditionRuns + (outcome.kind === 'completed' ? 1 : 0),
    completedExpeditionRegionIds: isNewRegion
      ? [...career.completedExpeditionRegionIds, regionId]
      : [...career.completedExpeditionRegionIds]
  }
}
