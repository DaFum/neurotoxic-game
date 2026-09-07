/**
 * @fileoverview Test suite for Skill vs Management Probe (Task 10).
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  SKILL_TIERS,
  runSkillMatchedTrio,
  runSkillProbeCohort
} from '../../scripts/game-balance-expedition-skill-probe.mjs'
import { EXPEDITION_BALANCE_PROFILES } from '../../scripts/game-balance-expedition-profiles.mjs'
import { resolveSimulatedGigPerformance } from '../../scripts/game-balance-expedition-runner.mjs'
import { calculatePostGigTechnicalWear } from '../../src/domain/expedition/condition.ts'
import { calculateAccuracy } from '../../src/utils/gigStats.ts'

describe('Skill vs Management Probe (G6 Task 10)', () => {
  it('defines the three distinct skill tiers', () => {
    assert.equal(SKILL_TIERS.low.overrideGigAccuracy, 45)
    assert.equal(SKILL_TIERS.low.overrideRepairQuality, 0.35)

    assert.equal(SKILL_TIERS.competent.overrideGigAccuracy, 70)
    assert.equal(SKILL_TIERS.competent.overrideRepairQuality, 0.7)

    assert.equal(SKILL_TIERS.high.overrideGigAccuracy, 90)
    assert.equal(SKILL_TIERS.high.overrideRepairQuality, 0.95)
  })

  it('runs a matched trio and demonstrates higher skill improves outcomes or condition retention', () => {
    const profile = EXPEDITION_BALANCE_PROFILES[0]
    const seed = 7001

    const trio = runSkillMatchedTrio(undefined, profile, seed)

    assert.equal(trio.low.telemetry.seed, seed)
    assert.equal(trio.competent.telemetry.seed, seed)
    assert.equal(trio.high.telemetry.seed, seed)

    assert.ok(
      trio.high.telemetry.retainedMoney >= trio.low.telemetry.retainedMoney
    )

    // Outcome *or* condition retention, as the probe's contract states. Skill
    // buys depth: a high-skill run pushes past the extraction window the low
    // tier takes and reaches the Finale, so it pays for two extra legs of
    // travel wear. Comparing raw min-Condition across unequal route depths
    // measures the length of the route, not the skill.
    const terminalRank = { failed: 0, extracted: 1, completed: 2 }
    assert.ok(
      terminalRank[trio.high.outcome] > terminalRank[trio.low.outcome] ||
        trio.high.telemetry.minTechnicalCondition >=
          trio.low.telemetry.minTechnicalCondition
    )
  })

  it('runs a cohort probe showing skill differentiation across seeds', () => {
    const profiles = [EXPEDITION_BALANCE_PROFILES[0]]
    const seeds = [7002, 7003]

    const cohort = runSkillProbeCohort(profiles, seeds)

    assert.equal(cohort.triosCount, 2)
    assert.ok(cohort.meanMoneyBySkill.high >= cohort.meanMoneyBySkill.low)
    // See the matched-trio case: depth confounds mean min-Condition once skill
    // starts converting into Finale completions, so completion rate carries
    // the differentiation the raw condition mean used to.
    assert.ok(
      cohort.completionRateBySkill.high >= cohort.completionRateBySkill.low
    )
  })

  it('drives each tier through the production rhythm scorers', () => {
    // The probe used to invent a note result locally and hand the counters to
    // the stats packager. `buildGigStatsSnapshot` packages and derives
    // accuracy; it is not the hit/combo/Hype gameplay owner. Every field below
    // now comes out of `rhythmGameScoringUtils` note by note, so a change to
    // production combo or Overload behaviour moves these numbers.
    const tiers = [45, 72, 90].map(accuracy => ({
      accuracy,
      result: resolveSimulatedGigPerformance(accuracy, 0)
    }))

    for (const { accuracy, result } of tiers) {
      const stats = result.stats
      assert.ok(stats.misses > 0, `tier ${accuracy} reported no misses`)
      assert.ok(stats.perfectHits > 0)
      assert.ok(stats.maxCombo > 0)
      // Accuracy is the production owner's, computed over the notes actually
      // struck rather than echoed back from the requested tier.
      assert.ok(stats.accuracy > 0 && stats.accuracy <= 100)
      assert.ok(
        stats.accuracy >= calculateAccuracy(stats.perfectHits, stats.misses)
      )
      // Timing precision tracks the requested tier rather than being asserted
      // into existence: the harness only decides how precisely notes are
      // struck.
      assert.ok(Math.abs(stats.accuracy - accuracy) <= 10)
    }

    const [low, competent, high] = tiers.map(t => t.result)
    // Monotone in skill, all derived by production scorers.
    assert.ok(low.stats.misses > competent.stats.misses)
    assert.ok(competent.stats.misses > high.stats.misses)
    assert.ok(high.stats.maxCombo > low.stats.maxCombo)
    assert.ok(high.stats.score > low.stats.score)

    // The Hype/combo contribution is measured, not initialized and forgotten.
    assert.ok(low.realizedHypeComboBonus > 0)
    assert.ok(high.realizedHypeComboBonus > low.realizedHypeComboBonus)
  })

  it('keeps miss-heavy play costly no matter how high Hype climbs', () => {
    // Task 10's acceptance criterion: Hype amplifies successful execution but
    // must not rescue miss-heavy play.
    const low = resolveSimulatedGigPerformance(45, 0).stats
    const high = resolveSimulatedGigPerformance(90, 0).stats

    assert.ok(low.misses > high.misses)

    const lowWear = calculatePostGigTechnicalWear(low)
    const highWear = calculatePostGigTechnicalWear(high)

    // Low-skill play takes strictly more wear on the groups its accuracy
    // thresholds penalise, and no amount of Hype appears in that derivation.
    assert.ok(lowWear.pa > highWear.pa)
    assert.ok(lowWear.stageGear > highWear.stageGear)

    // Pinning the mechanism: forcing the miss-heavy run to maximum Hype
    // changes nothing about the wear it takes.
    const lowAtMaxHype = { ...low, peakHype: 100, maxCombo: 999 }
    assert.deepEqual(calculatePostGigTechnicalWear(lowAtMaxHype), lowWear)
  })
})
