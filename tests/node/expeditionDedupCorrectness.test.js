/**
 * @fileoverview Regression tests for the Task 3 expedition dedup/correctness
 * pass: payload guards, NaN-safe insurance claims and the creators/helpers that
 * were merged onto a single implementation.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import {
  claimExpeditionInsurance,
  createPrepareExpeditionSponsorOffersAction,
  prepareExpeditionSponsorOffers
} from '../../src/context/expeditionActionCreators.ts'
import { EXPEDITION_INSURANCE_RESTORED_CONDITION } from '../../src/domain/expedition/insurance.ts'
import {
  EXPEDITION_TOW_FUEL_RESTORED,
  getAvailableTechnicalRecoveryControls,
  composeExpeditionFailureSignal
} from '../../src/domain/expedition/failure.ts'
import {
  canStartExpeditionPreGig,
  getExpeditionConditionTier
} from '../../src/domain/expedition/condition.ts'
import { getConditionBand } from '../../src/domain/expedition/inspections.ts'
import { getExpeditionRunResources } from '../../src/domain/expedition/runResources.ts'
import { doesLegacyHqItemTouchExpedition } from '../../src/domain/expedition/legacyHqPolicy.ts'
import { getUnifiedUpgradeCatalog } from '../../src/data/upgradeCatalog.ts'
import { getQuestDefinition } from '../../src/data/questRegistry.ts'
import {
  QUEST_EXPEDITION_META_UNLOCK,
  QUEST_EXPEDITION_NEMESIS,
  QUEST_EXPEDITION_RUN_GOAL
} from '../../src/data/questsConstants.ts'
import {
  canPerformExpeditionGig,
  getCriticallyInjuredBandMemberId
} from '../../src/domain/expedition/injuryGate.ts'
import {
  FIXTURE_REGION_ID,
  fixtureMap,
  FIXTURE_TOUR_ID,
  preparedState,
  startedState
} from '../expeditionLifecycleFixture.js'

describe('expedition reducer payload guards', () => {
  const guardedActions = [
    ActionTypes.RECORD_EXPEDITION_OBLIGATION_SIGNAL,
    ActionTypes.DOUBLE_DOWN_EXPEDITION_OBLIGATION,
    ActionTypes.OFFER_EXPEDITION_DRAFT,
    ActionTypes.SELECT_EXPEDITION_DRAFT,
    ActionTypes.RESOLVE_EXPEDITION_SOCIAL_RESULT,
    ActionTypes.CREATE_SOCIAL_INTEL_GRANT
  ]

  for (const type of guardedActions) {
    it(`${type} ignores a payloadless dispatch`, () => {
      const state = startedState()
      for (const payload of [undefined, null, 'text', 7]) {
        assert.doesNotThrow(() => gameReducer(state, { type, payload }))
        assert.equal(gameReducer(state, { type, payload }), state)
      }
    })
  }

  it('CREATE_SOCIAL_INTEL_GRANT never reads inherited result keys', () => {
    // The handler only reaches the registry lookup with a live, unconsumed
    // proof at the current step, so build exactly that. The proof names an
    // inherited key as its result, and Object.prototype is poisoned with the
    // one field a real result would need: without the Object.hasOwn guard the
    // inherited value would authorize an Intel grant.
    const base = startedState()
    const map = fixtureMap()
    const nodeId = map.connections.find(
      edge => edge.from === base.player.currentNodeId
    )?.to
    assert.ok(nodeId, 'the fixture start node must have a neighbour')
    const grantFor = resultId => {
      const state = {
        ...base,
        expedition: {
          ...base.expedition,
          lastSocialResult: {
            id: `proof:${resultId}`,
            postOptionId: 'x',
            resultId,
            resolvedAtRouteStep: base.expedition.routeStep,
            intelConsumed: false
          }
        }
      }
      return {
        state,
        next: gameReducer(state, {
          type: ActionTypes.CREATE_SOCIAL_INTEL_GRANT,
          payload: {
            expectedRouteStep: state.expedition.routeStep,
            postOptionId: 'x',
            resultId,
            nodeId
          }
        })
      }
    }

    Object.prototype.intelTargetLevel = 'full'
    try {
      for (const resultId of ['__proto__', 'constructor', 'toString']) {
        const { state, next } = grantFor(resultId)
        assert.equal(next, state, resultId)
        assert.equal(next.expedition.intelGrants.length, 0, resultId)
      }
    } finally {
      delete Object.prototype.intelTargetLevel
    }
  })
})
describe('insurance claim NaN safety', () => {
  it('repairs NaN van fuel and condition instead of writing them back', () => {
    const state = startedState(
      { money: 1000 },
      { insurancePolicyId: 'roadside' }
    )
    state.player.van.fuel = Number.NaN
    state.player.van.condition = Number.NaN

    const action = claimExpeditionInsurance(state, { claimType: 'vehicle' })
    assert.ok(action)
    const next = gameReducer(state, action)

    assert.equal(next.player.van.fuel, EXPEDITION_TOW_FUEL_RESTORED)
    assert.equal(
      next.player.van.condition,
      EXPEDITION_INSURANCE_RESTORED_CONDITION
    )
    assert.equal(next.expedition.insuranceClaimConsumed, true)
  })

  it('keeps a healthy van condition untouched on a fuel-only claim', () => {
    const state = startedState(
      { money: 1000 },
      { insurancePolicyId: 'roadside' }
    )
    state.player.van.fuel = 0
    state.player.van.condition = 61

    const next = gameReducer(
      state,
      claimExpeditionInsurance(state, { claimType: 'vehicle' })
    )
    assert.equal(next.player.van.condition, 61)
  })

  it('restores a zero-Condition technical group to the shared constant', () => {
    const state = startedState(
      { money: 1000 },
      { insurancePolicyId: 'equipment' }
    )
    state.expedition.technicalCondition.pa = 0
    const next = gameReducer(
      state,
      claimExpeditionInsurance(state, {
        claimType: 'technical',
        targetGroup: 'pa'
      })
    )
    assert.equal(
      next.expedition.technicalCondition.pa,
      EXPEDITION_INSURANCE_RESTORED_CONDITION
    )
    assert.equal(next.expedition.technicalFailureAccepted, false)
  })
})

describe('sponsor offer action creator', () => {
  it('returns null instead of throwing for a non-finite seed', () => {
    for (const seed of [undefined, null, Number.NaN, Infinity, '12', {}]) {
      assert.equal(createPrepareExpeditionSponsorOffersAction(seed), null)
    }
  })

  it('prepareExpeditionSponsorOffers returns null for a corrupt state seed', () => {
    const prep = preparedState()
    prep.runSeed = Number.NaN
    assert.equal(
      prepareExpeditionSponsorOffers(prep, FIXTURE_REGION_ID, FIXTURE_TOUR_ID),
      null
    )
  })

  it('still builds the action for a finite seed', () => {
    const action = createPrepareExpeditionSponsorOffersAction(4242, 'a', 'b')
    assert.equal(action?.type, ActionTypes.PREPARE_EXPEDITION_SPONSOR_OFFERS)
    assert.equal(action?.payload.expectedRunSeed, 4242)
  })
})

describe('critical band injury has one owner', () => {
  const withCritical = state => {
    const memberId = state.band.members[0].id
    return {
      memberId,
      state: {
        ...state,
        expedition: {
          ...state.expedition,
          bandInjuryByMemberId: { [memberId]: 'critical' }
        }
      }
    }
  }

  it('gig gate, pre-gig start and crew-collapse signal agree', () => {
    const healthy = startedState()
    assert.equal(getCriticallyInjuredBandMemberId(healthy), null)
    assert.equal(canPerformExpeditionGig(healthy), true)
    assert.equal(canStartExpeditionPreGig(healthy), true)

    const { memberId, state } = withCritical(healthy)
    assert.equal(getCriticallyInjuredBandMemberId(state), memberId)
    assert.equal(canPerformExpeditionGig(state), false)
    assert.equal(canStartExpeditionPreGig(state), false)
    const signal = composeExpeditionFailureSignal(state)
    assert.equal(signal?.reason, 'crew_collapse')
    assert.equal(signal?.sourceId, memberId)
  })

  it('ignores the injury outside an active run', () => {
    const { state } = withCritical(startedState())
    const idle = {
      ...state,
      expedition: { ...state.expedition, status: 'idle' }
    }
    assert.equal(getCriticallyInjuredBandMemberId(idle), null)
    assert.equal(canPerformExpeditionGig(idle), true)
  })
})

describe('Salvage Rights recovery control', () => {
  const withSalvageRights = consumed => {
    const base = startedState()
    return {
      ...base,
      career: { ...base.career, legendaryIds: ['salvage_rights'] },
      expedition: {
        ...base.expedition,
        consumedLegendaryIds: consumed ? ['salvage_rights'] : []
      }
    }
  }

  it('is reported once the Legendary is owned and unspent', () => {
    assert.equal(
      getAvailableTechnicalRecoveryControls(startedState(), 'pa').salvageRights,
      false
    )
    assert.equal(
      getAvailableTechnicalRecoveryControls(withSalvageRights(false), 'pa')
        .salvageRights,
      true
    )
  })

  it('is withdrawn once spent for the run', () => {
    assert.equal(
      getAvailableTechnicalRecoveryControls(withSalvageRights(true), 'pa')
        .salvageRights,
      false
    )
  })
})

describe('condition bands share one threshold table', () => {
  const samples = [
    [100, 'healthy', 'good', 'optimal'],
    [70, 'healthy', 'good', 'optimal'],
    [69, 'worn', 'worn', 'degraded'],
    [40, 'worn', 'worn', 'degraded'],
    [39, 'critical', 'critical', 'critical'],
    [20, 'critical', 'critical', 'critical'],
    [19, 'breaking', 'breaking', 'critical'],
    [1, 'breaking', 'breaking', 'critical'],
    [0, 'disabled', 'breaking', 'disabled']
  ]

  for (const [value, tier, hudBand, inspectionBand] of samples) {
    it(`maps ${value} onto ${tier} / ${hudBand} / ${inspectionBand}`, () => {
      assert.equal(getExpeditionConditionTier(value), tier)
      assert.equal(getConditionBand(value), inspectionBand)

      const state = startedState()
      state.expedition.technicalCondition = {
        ...state.expedition.technicalCondition,
        pa: value,
        instruments: value,
        stageGear: value
      }
      // The HUD summary averages the van with the three technical groups.
      state.player.van.condition = value
      assert.equal(getExpeditionRunResources(state).conditionBand, hudBand)
    })
  }

  it('treats non-finite condition as dead rather than optimal', () => {
    assert.equal(getExpeditionConditionTier(Number.NaN), 'disabled')
    assert.equal(getConditionBand(Number.NaN), 'disabled')
  })
})

describe('legacy HQ policy keys on item ids', () => {
  const catalog = getUnifiedUpgradeCatalog()
  const touches = id => {
    const item = catalog.find(entry => String(entry.id) === id)
    assert.ok(item, `${id} must be in the catalog`)
    return doesLegacyHqItemTouchExpedition(item)
  }

  it('flags every unlock item a daily tick reads, including soundproofing', () => {
    for (const id of [
      'hq_room_coffee',
      'hq_room_sofa',
      'hq_room_old_couch',
      'hq_room_cheap_beer_fridge',
      'hq_room_diy_soundproofing',
      'pr_manager_contract'
    ]) {
      assert.equal(touches(id), true, id)
    }
  })

  it('leaves an unlock nothing reads untouched', () => {
    assert.equal(touches('hq_room_label'), false)
  })
})

describe('Expedition quest ids come from the shared constants', () => {
  it('registers each quest under its constant', () => {
    for (const id of [
      QUEST_EXPEDITION_RUN_GOAL,
      QUEST_EXPEDITION_NEMESIS,
      QUEST_EXPEDITION_META_UNLOCK
    ]) {
      assert.ok(getQuestDefinition(id), id)
    }
  })
})
