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
})
