/**
 * @fileoverview Test suite for Expedition insurance policies and claims.
 *
 * Verifies policies, premiums, upfront deductions at START, eligibility checks,
 * exclusions (Contraband/sabotage), technical zero-Condition rescues, vehicle rescues,
 * and integration with the crisis resolution shell.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import {
  EXPEDITION_INSURANCE_POLICIES,
  EXPEDITION_INSURANCE_POLICY_IDS,
  canClaimExpeditionInsurance,
  getAvailableInsurancePolicyIds,
  getExpeditionInsurancePolicy,
  getExpeditionInsurancePremium
} from '../../src/domain/expedition/insurance.ts'
import {
  claimExpeditionInsurance,
  resolveExpeditionCrisis
} from '../../src/context/expeditionActionCreators.ts'
import { validateExpeditionBuildCommitment } from '../../src/domain/expedition/loadout.ts'
import {
  EXPEDITION_TOW_FUEL_RESTORED,
  getExpeditionMobilityFailureSignal
} from '../../src/domain/expedition/failure.ts'
import {
  FIXTURE_RUN_SEED,
  fixtureLoadout,
  fixtureMap,
  preparedState,
  startedState,
  walkTo
} from '../expeditionLifecycleFixture.js'
import { createInitialState } from '../../src/context/initialState.ts'

const map = fixtureMap()

describe('insurance policies and definitions', () => {
  it('defines the three canonical insurance policies', () => {
    assert.deepEqual([...EXPEDITION_INSURANCE_POLICY_IDS].sort(), [
      'equipment',
      'roadside',
      'touring'
    ])

    const roadside = EXPEDITION_INSURANCE_POLICIES.roadside
    assert.equal(roadside.id, 'roadside')
    assert.equal(roadside.premium, 300)
    assert.equal(roadside.coverage, 'vehicle')

    const equipment = EXPEDITION_INSURANCE_POLICIES.equipment
    assert.equal(equipment.id, 'equipment')
    assert.equal(equipment.premium, 350)
    assert.equal(equipment.coverage, 'technical')

    const touring = EXPEDITION_INSURANCE_POLICIES.touring
    assert.equal(touring.id, 'touring')
    assert.equal(touring.premium, 550)
    assert.equal(touring.coverage, 'either')
  })

  it('provides helpers to look up policy and premium', () => {
    assert.equal(getExpeditionInsurancePremium('roadside'), 300)
    assert.equal(getExpeditionInsurancePremium('equipment'), 350)
    assert.equal(getExpeditionInsurancePremium('touring'), 550)
    assert.equal(getExpeditionInsurancePremium(null), 0)
    assert.equal(getExpeditionInsurancePremium('unknown'), 0)

    assert.equal(getExpeditionInsurancePolicy('roadside')?.premium, 300)
    assert.equal(getExpeditionInsurancePolicy('unknown'), null)
    assert.equal(getExpeditionInsurancePolicy(null), null)

    assert.deepEqual([...getAvailableInsurancePolicyIds()].sort(), [
      'equipment',
      'roadside',
      'touring'
    ])
  })
})

describe('loadout validation for insurance', () => {
  it('accepts valid insurance policies and null', () => {
    const state = createInitialState()
    for (const policyId of [null, 'roadside', 'equipment', 'touring']) {
      const candidate = fixtureLoadout({ insurancePolicyId: policyId })
      const res = validateExpeditionBuildCommitment(state, candidate, map)
      assert.equal(res.valid, true)
      assert.equal(res.normalized.insurancePolicyId, policyId)
    }
  })

  it('rejects an invalid insurance policy id', () => {
    const state = createInitialState()
    for (const invalid of ['fake_insurance', 'comprehensive', 123, true]) {
      const candidate = fixtureLoadout({ insurancePolicyId: invalid })
      const res = validateExpeditionBuildCommitment(state, candidate, map)
      assert.equal(res.valid, false)
      assert.equal(res.reason, 'MALFORMED_CANDIDATE')
    }
  })
})

describe('START_EXPEDITION premium deduction and run state initialization', () => {
  it('deducts the insurance premium once at start', () => {
    const prep = preparedState({ money: 2000, fuel: 100 })
    const started = gameReducer(prep, {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId: 'run_fixture',
        expectedRunSeed: FIXTURE_RUN_SEED,
        loadout: fixtureLoadout({ insurancePolicyId: 'roadside' })
      }
    })

    assert.equal(started.expedition.status, 'active')
    assert.equal(started.expedition.insurancePolicyId, 'roadside')
    assert.equal(started.expedition.insuranceClaimConsumed, false)
    assert.equal(started.expedition.claimConsumed, false)
    // 2000 - 300 = 1700
    assert.equal(started.player.money, 1700)
    assert.equal(started.expedition.startingMoney, 1700)
  })

  it('charges premium in addition to starting fuel top-up', () => {
    const prep = preparedState({ money: 2000, fuel: 60 })
    // Fuel from 60 to 100 is 40L @ 1.75 = 70 EUR. Equipment premium is 350. Total = 420.
    const started = gameReducer(prep, {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId: 'run_fixture',
        expectedRunSeed: FIXTURE_RUN_SEED,
        loadout: fixtureLoadout({
          insurancePolicyId: 'equipment',
          build: { startingFuelTarget: 100 }
        })
      }
    })

    assert.equal(started.expedition.status, 'active')
    assert.equal(started.player.money, 2000 - 420)
    assert.equal(started.expedition.startingMoney, 2000 - 420)
  })

  it('refuses start if money after upfront cost falls below protectedCareerCash', () => {
    const prep = preparedState({ money: 1000, fuel: 100 })
    // Touring premium is 550. If protectedCareerCash is 600, 1000 - 550 = 450 < 600.
    const refused = gameReducer(prep, {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId: 'run_fixture',
        expectedRunSeed: FIXTURE_RUN_SEED,
        loadout: fixtureLoadout({
          insurancePolicyId: 'touring',
          build: { protectedCareerCash: 600 }
        })
      }
    })

    assert.equal(refused, prep)
    assert.equal(refused.expedition.status, 'prepared')
  })
})

describe('insurance eligibility and exclusions', () => {
  it('returns false when no policy is held', () => {
    const state = startedState({ money: 2000 })
    assert.equal(canClaimExpeditionInsurance(state, 'vehicle'), false)
    assert.equal(canClaimExpeditionInsurance(state, 'technical', 'pa'), false)
  })

  it('returns false when claim is already consumed', () => {
    let state = startedState({}, { insurancePolicyId: 'touring' })
    state = {
      ...state,
      expedition: { ...state.expedition, insuranceClaimConsumed: true }
    }
    assert.equal(canClaimExpeditionInsurance(state, 'vehicle'), false)
    assert.equal(canClaimExpeditionInsurance(state, 'technical', 'pa'), false)
  })

  it('enforces policy coverage constraints', () => {
    const roadsideRun = startedState({}, { insurancePolicyId: 'roadside' })
    const equipmentRun = startedState({}, { insurancePolicyId: 'equipment' })

    // Roadside cannot cover technical
    assert.equal(
      canClaimExpeditionInsurance(roadsideRun, 'technical', 'pa'),
      false
    )

    // Equipment cannot cover vehicle
    assert.equal(canClaimExpeditionInsurance(equipmentRun, 'vehicle'), false)
  })

  it('excludes Contraband / intentional sabotage Authority outcomes', () => {
    let state = startedState({}, { insurancePolicyId: 'roadside' })
    state.player.van.fuel = 0

    assert.equal(
      canClaimExpeditionInsurance(state, 'vehicle', undefined, {
        isContrabandOrSabotage: true
      }),
      false
    )

    // Simulated authority crisis
    state = {
      ...state,
      expedition: {
        ...state.expedition,
        pendingFailure: {
          id: 'crisis_1',
          reason: 'authority_crisis',
          sourceId: 'contraband_seizure',
          raisedAtRouteStep: 0,
          choices: ['accept_failure']
        }
      }
    }
    assert.equal(canClaimExpeditionInsurance(state, 'vehicle'), false)
  })

  it('requires target technical group to be at zero (zero-Condition rescue)', () => {
    const state = startedState({}, { insurancePolicyId: 'equipment' })
    // PA default is 100
    assert.equal(canClaimExpeditionInsurance(state, 'technical', 'pa'), false)

    // When PA reaches 0
    state.expedition.technicalCondition.pa = 0
    assert.equal(canClaimExpeditionInsurance(state, 'technical', 'pa'), true)
  })

  it('requires vehicle to be stranded/broken for vehicle claim', () => {
    const state = startedState({}, { insurancePolicyId: 'roadside' })
    // Healthy van
    assert.equal(canClaimExpeditionInsurance(state, 'vehicle'), false)

    // Empty tank
    state.player.van.fuel = 0
    assert.equal(canClaimExpeditionInsurance(state, 'vehicle'), true)
  })
})

describe('CLAIM_EXPEDITION_INSURANCE execution', () => {
  it('rescues a zero-Condition technical group to 25 and marks claim consumed', () => {
    const state = startedState(
      { money: 1000 },
      { insurancePolicyId: 'equipment' }
    )
    const initialMoney = state.player.money // 1000 - 350 = 650
    state.expedition.technicalCondition.pa = 0

    const action = claimExpeditionInsurance(state, {
      claimType: 'technical',
      targetGroup: 'pa'
    })
    assert.ok(action)

    const next = gameReducer(state, action)
    assert.equal(next.expedition.technicalCondition.pa, 25)
    assert.equal(next.expedition.insuranceClaimConsumed, true)
    assert.equal(next.expedition.claimConsumed, true)
    assert.equal(next.player.money, initialMoney) // no money spent on claim

    // Cannot claim again
    assert.equal(
      canClaimExpeditionInsurance(next, 'technical', 'instruments'),
      false
    )
    const secondAction = claimExpeditionInsurance(next, {
      claimType: 'technical',
      targetGroup: 'instruments'
    })
    assert.equal(gameReducer(next, secondAction), next)
  })

  it('rescues stranded vehicle to fuel 35 and marks claim consumed', () => {
    const state = startedState(
      { money: 1000 },
      { insurancePolicyId: 'roadside' }
    )
    const initialMoney = state.player.money // 1000 - 300 = 700
    state.player.van.fuel = 0

    const action = claimExpeditionInsurance(state, {
      claimType: 'vehicle'
    })
    assert.ok(action)

    const next = gameReducer(state, action)
    assert.equal(next.player.van.fuel, EXPEDITION_TOW_FUEL_RESTORED)
    assert.equal(next.expedition.insuranceClaimConsumed, true)
    assert.equal(next.expedition.claimConsumed, true)
    assert.equal(next.player.money, initialMoney)
  })

  it('restores van condition to 25 if condition was 0 on vehicle rescue', () => {
    const state = startedState(
      { money: 1000 },
      { insurancePolicyId: 'roadside' }
    )
    state.player.van.condition = 0
    state.player.van.fuel = 0

    const action = claimExpeditionInsurance(state, { claimType: 'vehicle' })
    const next = gameReducer(state, action)
    assert.equal(next.player.van.condition, 25)
    assert.equal(next.player.van.fuel, EXPEDITION_TOW_FUEL_RESTORED)
  })
})

const strandPlayer = state => {
  state.player.van.fuel = 0
  state.player.money = 50
  state.player.lastGigNodeId = state.player.currentNodeId
  state.band.members = []
  state.social = { ...(state.social ?? {}), youtube: 100000 }
  return gameReducer(state, {
    type: ActionTypes.UPDATE_PLAYER,
    payload: { money: 50 }
  })
}

describe('integration with crisis resolution shell', () => {
  it('exposes insurance_claim choice during a mobility crisis when covered', () => {
    const raw = walkTo(
      startedState({ money: 5000 }, { insurancePolicyId: 'roadside' }),
      1
    )
    const state = strandPlayer(raw)

    const signal = getExpeditionMobilityFailureSignal(state)
    assert.ok(signal)
    assert.ok(signal.choices.includes('insurance_claim'))
  })

  it('resolves mobility crisis via insurance_claim without cash charge', () => {
    const raw = walkTo(
      startedState({ money: 5000 }, { insurancePolicyId: 'roadside' }),
      1
    )
    const state = strandPlayer(raw)

    const crisisAction = resolveExpeditionCrisis(state, 'insurance_claim')
    assert.ok(crisisAction)

    const resolved = gameReducer(state, crisisAction)
    assert.equal(resolved.player.van.fuel, EXPEDITION_TOW_FUEL_RESTORED)
    assert.equal(resolved.expedition.insuranceClaimConsumed, true)
    assert.equal(resolved.expedition.pendingFailure, null)
    assert.equal(resolved.player.money, 50)
  })

  it('refuses crisis resolution if insurance does not cover vehicle', () => {
    const raw = walkTo(
      startedState({ money: 5000 }, { insurancePolicyId: 'equipment' }),
      1
    )
    const state = strandPlayer(raw)

    const signal = getExpeditionMobilityFailureSignal(state)
    assert.ok(signal)
    assert.equal(signal.choices.includes('insurance_claim'), false)
  })
})

describe('touring policy flexibility', () => {
  it('can be used for technical rescue and consumes the claim for vehicle rescue', () => {
    const state = startedState(
      { money: 1000 },
      { insurancePolicyId: 'touring' }
    )
    state.expedition.technicalCondition.instruments = 0

    // Claim technical rescue
    const action = claimExpeditionInsurance(state, {
      claimType: 'technical',
      targetGroup: 'instruments'
    })
    const afterTech = gameReducer(state, action)
    assert.equal(afterTech.expedition.technicalCondition.instruments, 25)
    assert.equal(afterTech.expedition.insuranceClaimConsumed, true)

    // Now empty fuel - cannot use touring insurance again
    afterTech.player.van.fuel = 0
    assert.equal(canClaimExpeditionInsurance(afterTech, 'vehicle'), false)
  })
})
