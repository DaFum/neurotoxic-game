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
  getExpeditionInsurancePremium,
  resolveExpeditionInsuranceClaim
} from '../../src/domain/expedition/insurance.ts'
import {
  claimExpeditionInsurance,
  resolveExpeditionCrisis
} from '../../src/context/expeditionActionCreators.ts'
import { validateExpeditionBuildCommitment } from '../../src/domain/expedition/loadout.ts'
import {
  EXPEDITION_TOW_FUEL_RESTORED,
  deriveExpeditionPendingFailure,
  getExpeditionMobilityFailureSignal
} from '../../src/domain/expedition/failure.ts'
import { getExpeditionCheapestOnwardLegFuel } from '../../src/domain/expedition/travel.ts'
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
    state.player.money = 5000
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

  it('follows the crisis being derived, not the one stored, when authority_crisis becomes technical_shutdown', () => {
    const state = startedState({}, { insurancePolicyId: 'equipment' })
    state.expedition.technicalCondition.pa = 0
    state.expedition = {
      ...state.expedition,
      pendingFailure: {
        id: 'crisis_1',
        reason: 'authority_crisis',
        sourceId: 'contraband_seizure',
        raisedAtRouteStep: 0,
        choices: ['accept_failure']
      }
    }

    // Reading the stored crisis would exclude the claim for good.
    assert.equal(canClaimExpeditionInsurance(state, 'technical', 'pa'), false)
    // The derivation that replaces it names the new reason.
    assert.equal(
      canClaimExpeditionInsurance(state, 'technical', 'pa', {
        crisisReason: 'technical_shutdown'
      }),
      true
    )
  })

  it('excludes an authority crisis being derived even when a technical shutdown is stored', () => {
    const state = startedState({}, { insurancePolicyId: 'equipment' })
    state.expedition.technicalCondition.pa = 0
    state.expedition = {
      ...state.expedition,
      pendingFailure: {
        id: 'crisis_1',
        reason: 'technical_shutdown',
        sourceId: 'pa',
        raisedAtRouteStep: 0,
        choices: ['accept_failure']
      }
    }

    assert.equal(canClaimExpeditionInsurance(state, 'technical', 'pa'), true)
    assert.equal(
      canClaimExpeditionInsurance(state, 'technical', 'pa', {
        crisisReason: 'authority_crisis'
      }),
      false
    )
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

  it('offers insurance_claim on the first derivation of a stranded crisis with fuel left', () => {
    const raw = walkTo(
      startedState({ money: 5000 }, { insurancePolicyId: 'roadside' }),
      1
    )
    const state = strandPlayer(raw)
    // Some fuel and a running van: the claim is only legal because the crisis
    // being derived is a stranding, and nothing has been stored yet.
    state.player.van.fuel = 3
    state.player.van.condition = 60
    state.expedition.pendingFailure = null

    const signal = getExpeditionMobilityFailureSignal(state)
    assert.ok(signal)
    assert.equal(signal.reason, 'fuel_stranded')
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

/**
 * A run whose last leg the protected-Cash floor refused: the stranded crisis
 * exists only because of `blockedTravelAtRouteStep`, with a full-enough tank
 * and a running van unless the caller says otherwise.
 */
const cashBlockedState = ({ fuel = 80, condition = 90 } = {}) => {
  const state = walkTo(
    startedState({ money: 5000 }, { insurancePolicyId: 'touring' }),
    1
  )
  state.player.van.fuel = fuel
  state.player.van.condition = condition
  state.expedition.blockedTravelAtRouteStep = state.expedition.routeStep
  state.expedition.pendingFailure = null
  // Stored as play stores it, so a refused action returns the same reference
  // instead of one the root reducer's crisis sync rebuilt.
  state.expedition.pendingFailure = deriveExpeditionPendingFailure(state)
  return state
}

/** Dispatches the crisis response without the action creator's choice filter. */
const rawCrisisClaim = state => {
  const pending = deriveExpeditionPendingFailure(state)
  assert.ok(pending)
  return gameReducer(state, {
    type: ActionTypes.RESOLVE_EXPEDITION_CRISIS,
    payload: {
      pendingFailureId: pending.id,
      choice: 'insurance_claim',
      expectedRouteStep: state.expedition.routeStep
    }
  })
}

describe('vehicle claim needs mobility evidence, not a cash-blocked leg (#3457)', () => {
  it('does not offer or accept a claim when the cash floor is the only evidence', () => {
    const state = cashBlockedState()
    const cheapest = getExpeditionCheapestOnwardLegFuel(state)
    assert.ok(cheapest !== null && cheapest < 80)

    const signal = getExpeditionMobilityFailureSignal(state)
    assert.ok(signal)
    assert.equal(signal.reason, 'fuel_stranded')
    assert.equal(signal.choices.includes('insurance_claim'), false)
    assert.equal(
      canClaimExpeditionInsurance(state, 'vehicle', undefined, {
        crisisReason: 'fuel_stranded'
      }),
      false
    )

    // The crisis response is refused: the choice is not offered.
    assert.equal(rawCrisisClaim(state), state)

    // A direct claim is refused even against the stored stranded crisis.
    assert.equal(state.expedition.pendingFailure?.reason, 'fuel_stranded')
    const direct = gameReducer(
      state,
      claimExpeditionInsurance(state, { claimType: 'vehicle' })
    )
    assert.equal(direct, state)
    assert.equal(direct.expedition.insuranceClaimConsumed, false)
    assert.equal(direct.expedition.claimConsumed, false)
    assert.equal(direct.player.van.fuel, 80)
    assert.equal(
      direct.expedition.blockedTravelAtRouteStep,
      state.expedition.routeStep
    )
  })

  it('still offers and accepts the claim on an empty tank', () => {
    const state = cashBlockedState({ fuel: 0 })
    const signal = getExpeditionMobilityFailureSignal(state)
    assert.ok(signal?.choices.includes('insurance_claim'))

    const next = rawCrisisClaim(state)
    assert.notEqual(next, state)
    assert.equal(next.player.van.fuel, EXPEDITION_TOW_FUEL_RESTORED)
    assert.equal(next.expedition.insuranceClaimConsumed, true)
    assert.equal(next.expedition.claimConsumed, true)
  })

  it('still offers and accepts the claim on a broken van', () => {
    const state = cashBlockedState({ condition: 0 })
    const signal = getExpeditionMobilityFailureSignal(state)
    assert.ok(signal?.choices.includes('insurance_claim'))

    const next = rawCrisisClaim(state)
    assert.notEqual(next, state)
    assert.equal(next.player.van.condition, 25)
    assert.equal(next.player.van.fuel, 80)
    assert.equal(next.expedition.insuranceClaimConsumed, true)
  })

  it('offers the claim when fuel is below the cheapest onward leg, not at it', () => {
    const cheapest = getExpeditionCheapestOnwardLegFuel(cashBlockedState())
    assert.ok(cheapest !== null && cheapest > 1)

    const short = cashBlockedState({ fuel: cheapest - 1 })
    assert.ok(
      getExpeditionMobilityFailureSignal(short)?.choices.includes(
        'insurance_claim'
      )
    )
    const next = rawCrisisClaim(short)
    assert.equal(
      next.player.van.fuel,
      Math.max(EXPEDITION_TOW_FUEL_RESTORED, Math.ceil(cheapest))
    )
    assert.equal(next.expedition.insuranceClaimConsumed, true)
    assert.equal(next.expedition.claimConsumed, true)

    const exact = cashBlockedState({ fuel: cheapest })
    const exactSignal = getExpeditionMobilityFailureSignal(exact)
    assert.ok(exactSignal)
    assert.equal(exactSignal.choices.includes('insurance_claim'), false)
    assert.equal(rawCrisisClaim(exact), exact)
  })

  it('reports no onward leg outside an active run or off the map', () => {
    const state = cashBlockedState()
    assert.equal(
      getExpeditionCheapestOnwardLegFuel({ ...state, gameMap: null }),
      null
    )
    assert.equal(
      getExpeditionCheapestOnwardLegFuel({
        ...state,
        expedition: { ...state.expedition, status: 'idle' }
      }),
      null
    )
    assert.equal(
      getExpeditionCheapestOnwardLegFuel({
        ...state,
        player: { ...state.player, currentNodeId: 'no_such_node' }
      }),
      null
    )
  })
})

/**
 * A touring-insured run at route step 1 with the onward nodes derived from the
 * built map: `gigId` is an onward GIG node, `otherId` another onward node.
 * `positions` moves them by role (`gig`, `other`).
 */
const onwardLegState = (positions, { fuel = 80 } = {}) => {
  const state = walkTo(
    startedState({ money: 5000 }, { insurancePolicyId: 'touring' }),
    1
  )
  const outgoing = state.gameMap.connections
    .filter(edge => edge.from === state.player.currentNodeId)
    .map(edge => edge.to)
  const gigId = outgoing.find(id => state.gameMap.nodes[id].type === 'GIG')
  const otherId = outgoing.find(id => id !== gigId)
  assert.ok(gigId && otherId, 'fixture needs an onward GIG and one more node')
  const ids = { gig: gigId, other: otherId }
  for (const [role, position] of Object.entries(positions)) {
    state.gameMap.nodes[ids[role]] = {
      ...state.gameMap.nodes[ids[role]],
      ...position
    }
  }
  state.player.van.fuel = fuel
  return {
    state,
    gigId,
    otherId,
    gigVenueId: state.gameMap.nodes[gigId].venueId
  }
}

/** Drops the consumed-claim flags, to ask whether the tank is still short. */
const withUnspentClaim = state => ({
  ...state,
  expedition: {
    ...state.expedition,
    insuranceClaimConsumed: false,
    claimConsumed: false
  }
})

describe('vehicle claim is sized and gated by the cheapest reachable leg (#3476)', () => {
  // Off the 0-100 grid on purpose: the fixture has no leg this long, and the
  // distance is what makes the cheapest onward leg cost about 50 litres.
  const FAR = { x: 36, y: 132.5 }

  it('tops the tank up to the cheapest onward leg when it costs more than the tow', () => {
    const { state } = onwardLegState({ other: FAR, gig: FAR }, { fuel: 40 })
    const cheapest = getExpeditionCheapestOnwardLegFuel(state)
    assert.ok(cheapest !== null && cheapest >= 50)
    assert.ok(cheapest > EXPEDITION_TOW_FUEL_RESTORED)
    assert.equal(canClaimExpeditionInsurance(state, 'vehicle'), true)

    const next = gameReducer(
      state,
      claimExpeditionInsurance(state, { claimType: 'vehicle' })
    )
    assert.equal(next.expedition.insuranceClaimConsumed, true)
    assert.equal(next.expedition.claimConsumed, true)
    assert.equal(next.player.van.fuel, Math.ceil(cheapest))
    assert.ok(next.player.van.fuel >= 50)
    // The claim resolved the shortage: an unspent claim would not qualify again.
    assert.equal(
      canClaimExpeditionInsurance(withUnspentClaim(next), 'vehicle'),
      false
    )
  })

  it('ignores a refused cheaper leg when deciding whether the tank is short', () => {
    // The GIG leg stays short; the other onward leg is the long one.
    const { state: open } = onwardLegState({ other: FAR })
    const openCheapest = getExpeditionCheapestOnwardLegFuel(open)
    const { state: blockedState, gigVenueId } = onwardLegState({ other: FAR })
    blockedState.venueBlacklist = [gigVenueId]
    const reachable = getExpeditionCheapestOnwardLegFuel(blockedState)
    assert.ok(openCheapest !== null && reachable !== null)
    assert.ok(openCheapest < reachable)

    // Enough for the refused GIG leg, short of the only reachable one.
    const fuel = Math.ceil(openCheapest)
    assert.ok(fuel < reachable)
    open.player.van.fuel = fuel
    blockedState.player.van.fuel = fuel
    assert.equal(canClaimExpeditionInsurance(open, 'vehicle'), false)
    assert.equal(canClaimExpeditionInsurance(blockedState, 'vehicle'), true)

    const next = gameReducer(
      blockedState,
      claimExpeditionInsurance(blockedState, { claimType: 'vehicle' })
    )
    assert.equal(next.expedition.insuranceClaimConsumed, true)
    assert.equal(next.player.van.fuel, Math.ceil(reachable))
  })

  it('reports no onward leg when every leg is refused', () => {
    const { state, otherId, gigVenueId } = onwardLegState({})
    state.venueBlacklist = [gigVenueId]
    state.gameMap.nodes[otherId] = {
      ...state.gameMap.nodes[otherId],
      type: 'GIG',
      venueId: gigVenueId
    }
    assert.equal(getExpeditionCheapestOnwardLegFuel(state), null)
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

  it('resolves claim directly via resolveExpeditionInsuranceClaim', () => {
    const state = startedState(
      { money: 1000 },
      { insurancePolicyId: 'roadside' }
    )
    state.player.van.fuel = 0
    const resolution = resolveExpeditionInsuranceClaim(state, {
      claimType: 'vehicle'
    })
    assert.equal(resolution.ok, true)
    if (resolution.ok) {
      assert.equal(resolution.claimType, 'vehicle')
      assert.equal(resolution.restoredValue, EXPEDITION_TOW_FUEL_RESTORED)
    }

    const badResolution = resolveExpeditionInsuranceClaim(state, {
      claimType: 'technical',
      targetGroup: 'instruments'
    })
    assert.equal(badResolution.ok, false)
  })
})
