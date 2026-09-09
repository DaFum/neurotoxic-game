/**
 * @fileoverview G5 Task 10 — Ascension is earned, and it gates Tour Pressure.
 *
 * Two contracts. Ascension is a *consequence*: no caller supplies the boolean,
 * and the reducer recomputes every term from what the Career actually did.
 * Tour Pressure is a trade: each modifier pays more and costs something named,
 * at most three of them, and the reward ceiling is knowable from the registry.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { createUnlockExpeditionAscensionAction } from '../../src/context/careerActionCreators'
import {
  EXPEDITION_PRESSURE_MODIFIERS,
  EXPEDITION_PRESSURE_MODIFIER_IDS,
  MAX_EXPEDITION_PRESSURE_MODIFIERS,
  MAX_EXPEDITION_PRESSURE_REWARD_MULTIPLIER,
  getExpeditionPressureModifier,
  isExpeditionPressureModifierId
} from '../../src/data/expedition/pressureModifiers'
import {
  EXPEDITION_META_UNLOCK_QUEST_ID,
  isExpeditionAscensionEligible
} from '../../src/domain/expedition/meta'
import {
  getAvailablePressureModifierIds,
  validateExpeditionBuildCommitment
} from '../../src/domain/expedition/loadout'
import { getEffectiveExpeditionRules } from '../../src/domain/expedition/effectiveRules'
import { createInitialState } from '../../src/context/initialState'
import {
  FIXTURE_RUN_SEED,
  fixtureLoadout,
  fixtureMap,
  preparedState
} from '../expeditionLifecycleFixture.js'

/** A Career that satisfies every Ascension prerequisite. */
const eligibleState = (overrides = {}) => {
  const base = createInitialState()
  return {
    ...base,
    completedQuestIds: [EXPEDITION_META_UNLOCK_QUEST_ID],
    career: {
      ...base.career,
      // headliner: 5 completed runs across 2 Regions.
      finalizedExpeditionRuns: 5,
      completedExpeditionRuns: 5,
      completedExpeditionRegionIds: ['home_turf', 'festival_fields'],
      settledExpeditionRunIds: ['run_evidence'],
      unlockedSetIds: [
        'mechanic_network',
        'industry_network',
        'festival_network'
      ],
      ...overrides
    }
  }
}

const unlock = (state, runId = 'run_evidence') =>
  gameReducer(state, createUnlockExpeditionAscensionAction(runId))

describe('G5 — the pressure registry is a trade, not a bonus', () => {
  it('makes every modifier pay and cost something named', () => {
    for (const id of EXPEDITION_PRESSURE_MODIFIER_IDS) {
      const modifier = EXPEDITION_PRESSURE_MODIFIERS[id]
      assert.ok(modifier.rewardBonus > 0, `${id} pays nothing`)
      const hasCost =
        Object.keys(modifier.numeric).length > 0 ||
        Object.keys(modifier.flags ?? {}).length > 0
      assert.ok(hasCost, `${id} costs nothing`)
    }
  })

  it('derives the reward ceiling from the three richest bonuses', () => {
    // 0.25 + 0.20 + 0.20 = 0.65. Published rather than written twice, so
    // re-costing a modifier cannot silently raise the cap.
    assert.equal(MAX_EXPEDITION_PRESSURE_REWARD_MULTIPLIER, 1.65)
  })

  it('narrows only its own ids', () => {
    assert.equal(isExpeditionPressureModifierId('bad_roads'), true)
    assert.equal(isExpeditionPressureModifierId('__proto__'), false)
    assert.equal(getExpeditionPressureModifier('safe_harbor'), null)
  })
})

describe('G5 — Ascension is earned, never asserted', () => {
  it('is closed for a Career that has met none of the terms', () => {
    const fresh = createInitialState()
    assert.equal(isExpeditionAscensionEligible(fresh), false)
    assert.equal(unlock(fresh).career.ascensionUnlocked, false)
  })

  it('opens once rank, three sets and the quest all hold', () => {
    const state = eligibleState()
    assert.equal(isExpeditionAscensionEligible(state), true)
    assert.equal(unlock(state).career.ascensionUnlocked, true)
  })

  it('refuses each missing term on its own', () => {
    // Rank: a Career one completed run short of headliner.
    const belowRank = eligibleState({
      completedExpeditionRuns: 4,
      completedExpeditionRegionIds: ['home_turf']
    })
    assert.equal(unlock(belowRank).career.ascensionUnlocked, false)

    // Sets: two is not three.
    const twoSets = eligibleState({
      unlockedSetIds: ['mechanic_network', 'industry_network']
    })
    assert.equal(unlock(twoSets).career.ascensionUnlocked, false)

    // Quest: never completed.
    const noQuest = { ...eligibleState(), completedQuestIds: [] }
    assert.equal(unlock(noQuest).career.ascensionUnlocked, false)
  })

  it('counts duplicates and unknown ids as the one set they are', () => {
    const padded = eligibleState({
      unlockedSetIds: [
        'mechanic_network',
        'mechanic_network',
        'not_a_set',
        '__proto__'
      ]
    })
    assert.equal(unlock(padded).career.ascensionUnlocked, false)
  })

  it('refuses a run the Career never settled', () => {
    const state = eligibleState()
    assert.equal(
      unlock(state, 'never_happened').career.ascensionUnlocked,
      false
    )
    assert.equal(unlock(state, '').career.ascensionUnlocked, false)
  })

  it('is idempotent and carries no boolean of its own', () => {
    const once = unlock(eligibleState())
    assert.equal(unlock(once), once)
    // A payload cannot assert the conclusion: the only field is a run id.
    assert.deepEqual(
      Object.keys(
        createUnlockExpeditionAscensionAction('run_evidence').payload
      ),
      ['runId']
    )
  })
})

describe('G5 — Tour Pressure is unreachable until Ascension opens', () => {
  const ascended = state => ({
    ...state,
    career: { ...state.career, ascensionUnlocked: true }
  })

  it('offers nothing before Ascension and everything after', () => {
    const prepared = preparedState({ money: 5000 })
    assert.deepEqual(getAvailablePressureModifierIds(prepared), [])
    assert.deepEqual(
      [...getAvailablePressureModifierIds(ascended(prepared))].sort(),
      [...EXPEDITION_PRESSURE_MODIFIER_IDS].sort()
    )
  })

  const commit = (state, pressureModifierIds) =>
    validateExpeditionBuildCommitment(
      state,
      fixtureLoadout({ pressureModifierIds }),
      fixtureMap()
    )

  it('refuses a modifier a Career without Ascension names', () => {
    const prepared = preparedState({ money: 5000 })
    assert.equal(
      commit(prepared, ['bad_roads']).reason,
      'PRESSURE_MODIFIERS_INVALID'
    )
    // An empty list stays legal, so a pre-Ascension run commits normally.
    assert.equal(commit(prepared, []).valid, true)
  })

  it('refuses a fourth modifier, a duplicate and an unknown id', () => {
    const state = ascended(preparedState({ money: 5000 }))
    assert.equal(
      commit(state, [...EXPEDITION_PRESSURE_MODIFIER_IDS].slice(0, 4)).reason,
      'PRESSURE_MODIFIERS_INVALID'
    )
    assert.equal(
      commit(state, ['bad_roads', 'bad_roads']).reason,
      'PRESSURE_MODIFIERS_INVALID'
    )
    assert.equal(
      commit(state, ['not_a_modifier']).reason,
      'PRESSURE_MODIFIERS_INVALID'
    )
    assert.equal(
      commit(state, [...EXPEDITION_PRESSURE_MODIFIER_IDS].slice(0, 3)).valid,
      true
    )
  })
})

describe('G5 — a committed modifier changes the rules it names', () => {
  /** Starts the fixture run with the given Tour Pressure committed. */
  const startWithPressure = pressureModifierIds => {
    const prepared = preparedState({ money: 5000 })
    const started = gameReducer(
      {
        ...prepared,
        career: { ...prepared.career, ascensionUnlocked: true }
      },
      {
        type: ActionTypes.START_EXPEDITION,
        payload: {
          prepId: 'run_fixture',
          expectedRunSeed: FIXTURE_RUN_SEED,
          loadout: fixtureLoadout({ pressureModifierIds })
        }
      }
    )
    assert.equal(started.expedition.status, 'active')
    return started
  }

  it('pays 1 + the sum of the bonuses, not their product', () => {
    const baseline = getEffectiveExpeditionRules(startWithPressure([])).numeric
    assert.equal(baseline.pressureRewardMultiplier, 1)

    const two = getEffectiveExpeditionRules(
      startWithPressure(['bad_roads', 'media_frenzy'])
    ).numeric
    // Summed: 1 + 0.15 + 0.20. Multiplied it would be 1.38.
    assert.ok(Math.abs(two.pressureRewardMultiplier - 1.35) < 1e-9)
  })

  it('never exceeds the registry ceiling', () => {
    const three = getEffectiveExpeditionRules(
      startWithPressure(['no_safety_net', 'media_frenzy', 'hostile_territory'])
    ).numeric
    assert.equal(
      three.pressureRewardMultiplier,
      MAX_EXPEDITION_PRESSURE_REWARD_MULTIPLIER
    )
  })

  it('applies each modifier to exactly the rule it names', () => {
    const baseline = getEffectiveExpeditionRules(startWithPressure([])).numeric
    const cases = [
      ['bad_roads', 'roadWearMultiplier', 1.3],
      ['media_frenzy', 'exposureGainMultiplier', 2],
      ['union_trouble', 'crewStressMultiplier', 1.25],
      ['hostile_territory', 'rivalEventWeightMultiplier', 1.5],
      ['no_safety_net', 'extractionRetentionMultiplier', 0.75]
    ]
    for (const [modifierId, key, factor] of cases) {
      const rules = getEffectiveExpeditionRules(
        startWithPressure([modifierId])
      ).numeric
      assert.ok(
        Math.abs(rules[key] - baseline[key] * factor) < 1e-9,
        `${modifierId} did not scale ${key}`
      )
    }
  })

  it('turns the severe-relief bypass on only for no_safety_net', () => {
    assert.equal(
      getEffectiveExpeditionRules(startWithPressure([])).flags
        .severeReliefBypass,
      false
    )
    assert.equal(
      getEffectiveExpeditionRules(startWithPressure(['bad_roads'])).flags
        .severeReliefBypass,
      false
    )
    assert.equal(
      getEffectiveExpeditionRules(startWithPressure(['no_safety_net'])).flags
        .severeReliefBypass,
      true
    )
  })

  it('caps the composition at three even if more are somehow stored', () => {
    // The validator refuses a fourth, so this is the belt to that braces: a
    // save carrying more must not compose into a larger multiplier.
    const started = startWithPressure(['bad_roads'])
    const overloaded = {
      ...started,
      expedition: {
        ...started.expedition,
        loadout: {
          ...started.expedition.loadout,
          pressureModifierIds: [...EXPEDITION_PRESSURE_MODIFIER_IDS]
        }
      }
    }
    const rules = getEffectiveExpeditionRules(overloaded).numeric
    const firstThree =
      1 +
      EXPEDITION_PRESSURE_MODIFIER_IDS.slice(
        0,
        MAX_EXPEDITION_PRESSURE_MODIFIERS
      ).reduce(
        (sum, id) => sum + EXPEDITION_PRESSURE_MODIFIERS[id].rewardBonus,
        0
      )
    assert.ok(
      Math.abs(rules.pressureRewardMultiplier - firstThree) < 1e-9,
      'only the first three stored modifiers may compose'
    )
    assert.ok(
      rules.pressureRewardMultiplier <=
        MAX_EXPEDITION_PRESSURE_REWARD_MULTIPLIER
    )
  })
})
