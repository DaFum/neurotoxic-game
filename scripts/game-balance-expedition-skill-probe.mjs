/**
 * @fileoverview Paired Skill vs Management Probe (G6 Task 10).
 *
 * Holds route, management snapshot, Condition, injuries, Finale profile,
 * Crowd Hype and RNG constant while testing three skill tiers:
 * - low skill:       gig accuracy 45 | repair quality 0.35
 * - competent:       gig accuracy 70 | repair quality 0.70
 * - high skill:      gig accuracy 90 | repair quality 0.95
 */

import { runExpeditionSimulation } from './game-balance-expedition-runner.mjs'

export const SKILL_TIERS = {
  low: {
    skillLevel: 'low',
    overrideGigAccuracy: 45,
    overrideRepairQuality: 0.35
  },
  competent: {
    skillLevel: 'competent',
    overrideGigAccuracy: 70,
    overrideRepairQuality: 0.7
  },
  high: {
    skillLevel: 'high',
    overrideGigAccuracy: 90,
    overrideRepairQuality: 0.95
  }
}

/**
 * Runs a matched skill trio for one profile and seed, holding route and build constant.
 *
 * @param {import('../src/types').GameState} fixtureState
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile} profile
 * @param {number} seed
 * @returns {{
 *   profileId: string,
 *   seed: number,
 *   low: ReturnType<typeof runExpeditionSimulation>,
 *   competent: ReturnType<typeof runExpeditionSimulation>,
 *   high: ReturnType<typeof runExpeditionSimulation>,
 *   skillImprovesOutcome: boolean,
 *   skillReducesRepairSpend: boolean,
 *   skillPreservesCondition: boolean
 * }}
 */
export const runSkillMatchedTrio = (fixtureState, profile, seed) => {
  const low = runExpeditionSimulation(fixtureState, profile, seed, {
    skillLevel: 'low',
    overrideGigAccuracy: SKILL_TIERS.low.overrideGigAccuracy,
    overrideRepairQuality: SKILL_TIERS.low.overrideRepairQuality
  })

  const competent = runExpeditionSimulation(fixtureState, profile, seed, {
    skillLevel: 'competent',
    overrideGigAccuracy: SKILL_TIERS.competent.overrideGigAccuracy,
    overrideRepairQuality: SKILL_TIERS.competent.overrideRepairQuality
  })

  const high = runExpeditionSimulation(fixtureState, profile, seed, {
    skillLevel: 'high',
    overrideGigAccuracy: SKILL_TIERS.high.overrideGigAccuracy,
    overrideRepairQuality: SKILL_TIERS.high.overrideRepairQuality
  })

  const skillImprovesOutcome =
    (high.outcome === 'completed' && low.outcome !== 'completed') ||
    high.telemetry.retainedMoney >= low.telemetry.retainedMoney

  const skillPreservesCondition =
    high.telemetry.minTechnicalCondition >= low.telemetry.minTechnicalCondition

  const skillReducesRepairSpend =
    high.telemetry.repairSpend <= low.telemetry.repairSpend ||
    high.telemetry.minTechnicalCondition > low.telemetry.minTechnicalCondition

  return {
    profileId: profile.id,
    seed,
    low,
    competent,
    high,
    skillImprovesOutcome,
    skillReducesRepairSpend,
    skillPreservesCondition
  }
}

/**
 * Evaluates a cohort across profiles and seeds for skill vs management evidence.
 *
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile[]} profiles
 * @param {number[]} seeds
 * @returns {{
 *   triosCount: number,
 *   meanMoneyBySkill: { low: number, competent: number, high: number },
 *   meanFameBySkill: { low: number, competent: number, high: number },
 *   meanMinConditionBySkill: { low: number, competent: number, high: number },
 *   completionRateBySkill: { low: number, competent: number, high: number },
 *   trios: Array<ReturnType<typeof runSkillMatchedTrio>>
 * }}
 */
export const runSkillProbeCohort = (profiles, seeds) => {
  const trios = []

  let moneyLow = 0,
    moneyComp = 0,
    moneyHigh = 0
  let fameLow = 0,
    fameComp = 0,
    fameHigh = 0
  let condLow = 0,
    condComp = 0,
    condHigh = 0
  let compLow = 0,
    compComp = 0,
    compHigh = 0

  for (const profile of profiles) {
    for (const seed of seeds) {
      const trio = runSkillMatchedTrio(undefined, profile, seed)
      trios.push(trio)

      moneyLow += trio.low.telemetry.retainedMoney
      moneyComp += trio.competent.telemetry.retainedMoney
      moneyHigh += trio.high.telemetry.retainedMoney

      fameLow += trio.low.telemetry.retainedFame
      fameComp += trio.competent.telemetry.retainedFame
      fameHigh += trio.high.telemetry.retainedFame

      condLow += trio.low.telemetry.minTechnicalCondition
      condComp += trio.competent.telemetry.minTechnicalCondition
      condHigh += trio.high.telemetry.minTechnicalCondition

      if (trio.low.outcome === 'completed') compLow++
      if (trio.competent.outcome === 'completed') compComp++
      if (trio.high.outcome === 'completed') compHigh++
    }
  }

  const n = trios.length || 1

  return {
    triosCount: trios.length,
    meanMoneyBySkill: {
      low: moneyLow / n,
      competent: moneyComp / n,
      high: moneyHigh / n
    },
    meanFameBySkill: {
      low: fameLow / n,
      competent: fameComp / n,
      high: fameHigh / n
    },
    meanMinConditionBySkill: {
      low: condLow / n,
      competent: condComp / n,
      high: condHigh / n
    },
    completionRateBySkill: {
      low: compLow / n,
      competent: compComp / n,
      high: compHigh / n
    },
    trios
  }
}
