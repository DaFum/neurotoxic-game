/**
 * @fileoverview G5 Task 1 — Career economy and derived rank.
 *
 * Tokens are minted from the run's own finalized outcome and the rank is
 * recomputed from the counters, so neither can be named by a caller or held by
 * a save that has not earned it.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { gameReducer } from '../../src/context/gameReducer.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import { createInitialCareerState } from '../../src/domain/expedition/career.ts'
import {
  deriveExpeditionCareerRank,
  getMaxPersistentNemesisLevel,
  hasExpeditionCareerRank,
  resolveExpeditionCareerSettlement
} from '../../src/domain/expedition/meta.ts'
import { sanitizeCareerState } from '../../src/context/reducers/careerSanitizers.ts'
import { startedState, walkTo } from '../expeditionLifecycleFixture.js'
import { firstExtractionRouteStep } from '../expeditionLifecycleFixture.js'

/** A Career with the counters a caller would need to claim a rank. */
const career = (overrides = {}) => ({
  ...createInitialCareerState(),
  ...overrides
})

/** A persisted Rival record at a given Nemesis level. */
const rivalAt = level => ({
  snapshot: {
    id: 'rival_1',
    name: 'Kranker Schrank',
    style: 'NEUTRAL',
    preferredRegionId: 'industrial_belt',
    signatureBehavior: 'aggressive',
    seed: 1
  },
  history: {
    relationship: 'rival',
    nemesisLevel: level,
    encounterCount: level,
    lastOutcome: 'hostile_win',
    lastSeenRunId: null,
    lastNemesisAdvanceRunId: null
  }
})

describe('G5 — Career rank is derived from accomplishments', () => {
  it('starts at rookie and needs both counters to leave it', () => {
    assert.equal(deriveExpeditionCareerRank(career()), 'rookie')
    // Finalizing runs alone is not progression: a Career that never completed
    // one has not proven anything.
    assert.equal(
      deriveExpeditionCareerRank(career({ finalizedExpeditionRuns: 9 })),
      'rookie'
    )
    assert.equal(
      deriveExpeditionCareerRank(
        career({ finalizedExpeditionRuns: 2, completedExpeditionRuns: 1 })
      ),
      'roadtested'
    )
  })

  it('requires breadth for headliner, not just volume', () => {
    const oneRegion = career({
      finalizedExpeditionRuns: 12,
      completedExpeditionRuns: 9,
      completedExpeditionRegionIds: ['industrial_belt']
    })
    assert.equal(deriveExpeditionCareerRank(oneRegion), 'roadtested')
    assert.equal(
      deriveExpeditionCareerRank({
        ...oneRegion,
        completedExpeditionRegionIds: ['industrial_belt', 'festival_fields']
      }),
      'headliner'
    )
  })

  it('reaches cult_legend only with a driven Nemesis feud', () => {
    const base = career({
      finalizedExpeditionRuns: 14,
      completedExpeditionRuns: 10,
      completedExpeditionRegionIds: ['a', 'b', 'c', 'd']
    })
    // Every counter is there except the feud.
    assert.equal(deriveExpeditionCareerRank(base), 'headliner')
    assert.equal(
      deriveExpeditionCareerRank({
        ...base,
        rivalsById: { rival_1: rivalAt(2) }
      }),
      'headliner'
    )
    const withFeud = { ...base, rivalsById: { rival_1: rivalAt(3) } }
    assert.equal(getMaxPersistentNemesisLevel(withFeud), 3)
    assert.equal(deriveExpeditionCareerRank(withFeud), 'cult_legend')
  })

  it('compares ranks in order for a gate', () => {
    const state = {
      career: career({ finalizedExpeditionRuns: 2, completedExpeditionRuns: 1 })
    }
    assert.equal(hasExpeditionCareerRank(state, 'rookie'), true)
    assert.equal(hasExpeditionCareerRank(state, 'roadtested'), true)
    assert.equal(hasExpeditionCareerRank(state, 'headliner'), false)
  })

  it('never reads a rank off a save that did not earn it', () => {
    // A crafted save can hold any counters it likes, but the rank is not one
    // of them: it is recomputed, so inventing the label buys nothing.
    const sanitized = sanitizeCareerState({
      rank: 'cult_legend',
      completedExpeditionRuns: 1,
      finalizedExpeditionRuns: 1
    })
    assert.equal(Object.hasOwn(sanitized, 'rank'), false)
    assert.equal(deriveExpeditionCareerRank(sanitized), 'rookie')
  })
})

describe('G5 — Tour Tokens are minted from the run outcome', () => {
  /** Extracts the fixture run so it carries a real finalized outcome. */
  const extractedRun = () => {
    const atWindow = walkTo(
      startedState({ money: 5000 }),
      firstExtractionRouteStep()
    )
    const extracted = gameReducer(atWindow, {
      type: ActionTypes.EXTRACT_EXPEDITION,
      payload: {
        expectedRouteStep: atWindow.expedition.routeStep,
        explicitRareRewardIds: []
      }
    })
    assert.equal(extracted.expedition.status, 'extracted')
    return extracted
  }

  it('leaves the run counters to exactly one settlement owner', () => {
    const extracted = extractedRun()
    const runId = extracted.expedition.outcome.runId

    // Both settlements carry independent replay guards, so if both advanced
    // the shared counters a single finalized run would count twice and pull
    // every rank and Crew-development gate forward at double speed.
    const crewSettled = gameReducer(extracted, {
      type: ActionTypes.SETTLE_EXPEDITION_CREW_CAREER,
      payload: { runId }
    })
    assert.equal(
      crewSettled.career.finalizedExpeditionRuns,
      extracted.career.finalizedExpeditionRuns,
      'the Crew settlement must not touch the shared run counters'
    )
    assert.equal(
      crewSettled.career.completedExpeditionRuns,
      extracted.career.completedExpeditionRuns
    )

    const bothSettled = gameReducer(crewSettled, {
      type: ActionTypes.SETTLE_EXPEDITION_CAREER_RESULT,
      payload: { runId }
    })
    assert.equal(bothSettled.career.finalizedExpeditionRuns, 1)
    assert.equal(bothSettled.career.completedExpeditionRuns, 0)
  })

  it('narrows a poisoned persisted balance instead of compounding it', () => {
    const extracted = extractedRun()
    const runId = extracted.expedition.outcome.runId
    for (const poisoned of [Number.NaN, Number.POSITIVE_INFINITY]) {
      const settled = gameReducer(
        {
          ...extracted,
          career: {
            ...extracted.career,
            tourTokens: poisoned,
            finalizedExpeditionRuns: poisoned,
            completedExpeditionRuns: poisoned
          }
        },
        {
          type: ActionTypes.SETTLE_EXPEDITION_CAREER_RESULT,
          payload: { runId }
        }
      )
      // `Math.max` cannot recover a sum that is already non-finite, so the
      // stored addend has to be narrowed before the arithmetic, not after.
      assert.equal(settled.career.tourTokens, 2)
      assert.equal(settled.career.finalizedExpeditionRuns, 1)
      assert.equal(settled.career.completedExpeditionRuns, 0)
    }
  })

  it('pays the outcome plus the first Region, once', () => {
    const extracted = extractedRun()
    const runId = extracted.expedition.outcome.runId
    const regionId = extracted.expedition.loadout.regionId

    const settled = gameReducer(extracted, {
      type: ActionTypes.SETTLE_EXPEDITION_CAREER_RESULT,
      payload: { runId }
    })
    // Extracted is worth 1, and this Region is new, so 2 in total.
    assert.equal(settled.career.tourTokens, 2)
    assert.equal(settled.career.finalizedExpeditionRuns, 1)
    // Extraction is not completion.
    assert.equal(settled.career.completedExpeditionRuns, 0)
    assert.deepEqual(settled.career.completedExpeditionRegionIds, [regionId])
    assert.deepEqual(settled.career.settledExpeditionRunIds, [runId])

    // A replay is an identity no-op rather than a second payout.
    assert.strictEqual(
      gameReducer(settled, {
        type: ActionTypes.SETTLE_EXPEDITION_CAREER_RESULT,
        payload: { runId }
      }),
      settled
    )
  })

  it('refuses a run the outcome does not name', () => {
    const extracted = extractedRun()
    assert.strictEqual(
      gameReducer(extracted, {
        type: ActionTypes.SETTLE_EXPEDITION_CAREER_RESULT,
        payload: { runId: 'run_invented' }
      }),
      extracted
    )
    // ...and a run with no finalized outcome at all.
    const active = startedState({ money: 5000 })
    assert.strictEqual(
      gameReducer(active, {
        type: ActionTypes.SETTLE_EXPEDITION_CAREER_RESULT,
        payload: { runId: active.expedition.runId }
      }),
      active
    )
  })

  it('adds the meta-unlock milestone token at most once per run', () => {
    const extracted = extractedRun()
    const runId = extracted.expedition.outcome.runId
    const withMilestone = {
      ...extracted,
      completedQuestIds: ['quest_expedition_meta_unlock']
    }
    const settlement = resolveExpeditionCareerSettlement(withMilestone, runId)
    // Extracted 1 + new Region 1 + milestone 1.
    assert.equal(settlement.tourTokensAwarded, 3)

    const settled = gameReducer(withMilestone, {
      type: ActionTypes.SETTLE_EXPEDITION_CAREER_RESULT,
      payload: { runId }
    })
    assert.equal(settled.career.tourTokens, 3)
    // The per-run cap is the settled-run guard, so the milestone cannot be
    // billed twice for the same run.
    assert.equal(resolveExpeditionCareerSettlement(settled, runId), null)
  })

  it('does not credit a Region the run already visited', () => {
    const extracted = extractedRun()
    const regionId = extracted.expedition.loadout.regionId
    const repeat = {
      ...extracted,
      career: {
        ...extracted.career,
        completedExpeditionRegionIds: [regionId]
      }
    }
    const settlement = resolveExpeditionCareerSettlement(
      repeat,
      extracted.expedition.outcome.runId
    )
    assert.equal(settlement.tourTokensAwarded, 1)
    assert.deepEqual(settlement.completedExpeditionRegionIds, [regionId])
  })
})
