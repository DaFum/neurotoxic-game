import assert from 'node:assert/strict'
import test from 'node:test'

import { createInitialState } from '../../src/context/initialState.ts'
import {
  handleOfferExpeditionDraft,
  handleRecordExpeditionObligationSignal,
  handleResolveExpeditionSocialResult,
  handleCreateSocialIntelGrant
} from '../../src/context/reducers/expeditionReducer.ts'
import { sanitizeCareerState } from '../../src/context/reducers/careerSanitizers.ts'
import { sanitizeExpeditionState } from '../../src/context/reducers/expeditionSanitizers.ts'
import {
  applyExpeditionEventHeat,
  getExpeditionRunResources
} from '../../src/domain/expedition/runResources.ts'
import { getAvailableAuthoritySafeExits } from '../../src/domain/expedition/authority.ts'
import {
  preparedState,
  fixtureLoadout,
  walkToFinale
} from '../expeditionLifecycleFixture.js'
import { gameReducer } from '../../src/context/gameReducer.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import { calculateFinalScore } from '../../src/utils/rhythmGameScoringUtils.ts'
import { validatePreparedExpeditionSponsorOffers } from '../../src/domain/expedition/sponsors.ts'

const activeState = () => {
  const state = createInitialState()
  return {
    ...state,
    runSeed: 123,
    currentGig: { id: 'gig-proof' },
    lastGigStats: { accuracy: 80 },
    expedition: {
      ...state.expedition,
      status: 'active',
      runId: 'run-1',
      routeStep: 1,
      activeObligations: [
        {
          id: 'run-1:contract_three_good_gigs',
          sourceType: 'native',
          sourceId: 'contract_three_good_gigs',
          constraints: [
            {
              id: 'three_good_gigs',
              kind: 'gig_accuracy_count',
              minAccuracy: 65,
              requiredCount: 3
            }
          ],
          progressByConstraintId: {
            three_good_gigs: {
              constraintId: 'three_good_gigs',
              value: 0,
              satisfied: false,
              failed: false
            }
          },
          status: 'active',
          settled: false,
          doubleDown: null
        }
      ]
    }
  }
}

test('obligation signal consumes canonical source evidence exactly once', () => {
  const state = activeState()
  const payload = {
    signalType: 'gig',
    sourceId: 'gig-proof',
    expectedRouteStep: 1
  }
  const once = handleRecordExpeditionObligationSignal(state, payload)
  const replay = handleRecordExpeditionObligationSignal(once, payload)
  assert.equal(
    once.expedition.activeObligations[0].progressByConstraintId.three_good_gigs
      .value,
    1
  )
  assert.strictEqual(replay, once)
})

test('completed native obligation settles its reward exactly once', () => {
  const state = activeState()
  state.expedition.activeObligations[0].progressByConstraintId.three_good_gigs.value = 2
  const payload = {
    signalType: 'gig',
    sourceId: 'gig-proof',
    expectedRouteStep: 1
  }
  const settled = handleRecordExpeditionObligationSignal(state, payload)
  assert.equal(settled.player.money, state.player.money + 1500)
  assert.equal(settled.player.fame, state.player.fame + 500)
  assert.equal(settled.expedition.activeObligations[0].settled, true)
  assert.strictEqual(
    handleRecordExpeditionObligationSignal(settled, payload),
    settled
  )
})

test('accepted Double Down rule is enforced from its stored constraint', () => {
  const state = activeState()
  state.player.currentNodeId = 'rest-node'
  state.expedition.activeObligations[0].constraints = []
  state.expedition.activeObligations[0].progressByConstraintId = {}
  state.expedition.activeObligations[0].doubleDown = {
    acceptedOfferId: 'accepted',
    derivationKey: 'stored',
    addedConstraint: { kind: 'no_more_rest' },
    rewardMultiplier: 1.25,
    failureHeatBonus: 8,
    acceptedAtRouteStep: 0
  }
  const failed = handleRecordExpeditionObligationSignal(state, {
    signalType: 'rest',
    sourceId: 'rest-node',
    expectedRouteStep: 1
  })
  assert.equal(failed.expedition.activeObligations[0].status, 'failed')
  assert.equal(failed.expedition.activeObligations[0].settled, true)
  assert.equal(failed.expedition.pressure.heat, 16)
})

test('draft offer rejects an unproven caller-selected source key', () => {
  const state = activeState()
  const result = handleOfferExpeditionDraft(state, {
    sourceType: 'rare_event',
    sourceKey: 'forged',
    expectedRouteStep: 1
  })
  assert.strictEqual(result, state)
})

test('Heat production updates pressure and the canonical HUD reader', () => {
  const state = activeState()
  const next = applyExpeditionEventHeat(state, 12)
  assert.equal(next.expedition.pressure.heat, 12)
  assert.equal(getExpeditionRunResources(next).heat, 12)
  assert.strictEqual(applyExpeditionEventHeat(next, Number.NaN), next)
})

test('Authority crew exits use canonical crew roles and hidden compartments', () => {
  const state = activeState()
  state.expedition.loadout = { crewIds: ['yara'], nativeContracts: [] }
  state.expedition.activeObligations = []
  state.player.money = 0
  state.player.van.fuel = 0
  assert.ok(getAvailableAuthoritySafeExits(state).includes('crew'))

  state.expedition.loadout.crewIds = []
  state.assets = [
    {
      id: 'bus',
      kind: 'tourbus_chassis',
      chassisFlavor: 'diy',
      chassisTier: 1,
      slots: [{ id: 'hidden', slotType: 'tb_hidden', installedModuleId: null }]
    }
  ]
  state.expedition.loadout.activeTourbusAssetId = 'bus'
  assert.ok(
    getAvailableAuthoritySafeExits(state).includes('hidden_compartment')
  )
})

test('career rival sanitizer rejects coercible enum impostors', () => {
  const malformed = {
    rivalsById: {
      rival: {
        snapshot: {
          id: 'rival',
          name: 'R',
          style: 'x',
          preferredRegionId: 'industrial_belt',
          signatureBehavior: ['aggressive'],
          seed: 1
        },
        history: {
          relationship: ['rival'],
          nemesisLevel: 1,
          encounterCount: 1,
          lastOutcome: null,
          lastSeenRunId: null
        }
      }
    }
  }
  assert.deepEqual(Object.keys(sanitizeCareerState(malformed).rivalsById), [])
})

test('active obligations survive validated load sanitization', () => {
  const prepared = preparedState()
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: prepared.expedition.prep.prepId,
      expectedRunSeed: prepared.runSeed,
      loadout: {
        ...fixtureLoadout(),
        nativeContracts: [
          { templateId: 'contract_three_good_gigs', targetNodeId: null }
        ]
      }
    }
  })
  const state = {
    ...started,
    expedition: {
      ...started.expedition,
      activeObligations: activeState().expedition.activeObligations.map(
        obligation => ({
          ...obligation,
          id: `${started.expedition.runId}:contract_three_good_gigs`
        })
      )
    }
  }
  const sanitized = sanitizeExpeditionState(state.expedition, state.runSeed)
  assert.equal(sanitized.activeObligations.length, 1)
})

test('START materializes and snapshots one deterministic expedition rival', () => {
  const prepared = preparedState()
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: prepared.expedition.prep.prepId,
      expectedRunSeed: prepared.runSeed,
      loadout: fixtureLoadout()
    }
  })
  assert.ok(started.rivalBand)
  assert.ok(started.career.rivalsById[started.rivalBand.id])
  assert.equal(
    started.career.rivalsById[started.rivalBand.id].history.encounterCount,
    1
  )
})

test('Crowd Hype multiplies combo-derived points without changing base score', () => {
  assert.equal(calculateFinalScore(100, 0, false, false, 100, false, 1.25), 100)
  assert.equal(
    calculateFinalScore(100, 10, false, false, 100, false, 1.25),
    225
  )
})

test('Finale profile enters the production gig lifecycle and applies success Heat', () => {
  const prepared = preparedState()
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: prepared.expedition.prep.prepId,
      expectedRunSeed: prepared.runSeed,
      loadout: fixtureLoadout()
    }
  })
  const atFinale = walkToFinale(started)
  const hotFinale = {
    ...atFinale,
    expedition: {
      ...atFinale.expedition,
      pressure: { ...atFinale.expedition.pressure, heat: 75 }
    }
  }
  const preGig = gameReducer(hotFinale, {
    type: ActionTypes.START_GIG,
    payload: { id: 'finale-gig', name: 'Finale' }
  })
  assert.equal(preGig.expedition.finaleType, 'illegal_show')
  assert.equal(preGig.expedition.pressure.crowdHype, 10)
  const completed = gameReducer(preGig, {
    type: ActionTypes.SET_LAST_GIG_STATS,
    payload: { score: 1000, accuracy: 80, failed: false }
  })
  assert.equal(completed.expedition.pressure.heat, 87)
})

test('persisted sponsor offers must equal the deterministic canonical offer set', () => {
  const initial = createInitialState()
  const prepared = gameReducer(initial, {
    type: ActionTypes.PREPARE_EXPEDITION_RUN,
    payload: { prepId: 'prep', runSeed: 123 }
  })
  assert.ok(prepared.expedition.preparedSponsorOffers.length > 0)
  const forged = structuredClone(prepared.expedition.preparedSponsorOffers)
  forged.reverse()
  assert.deepEqual(
    validatePreparedExpeditionSponsorOffers(prepared, forged),
    []
  )
})

test('Social Intel requires a canonical just-resolved source and is replay-safe', () => {
  const prepared = preparedState()
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: prepared.expedition.prep.prepId,
      expectedRunSeed: prepared.runSeed,
      loadout: fixtureLoadout()
    }
  })
  const targetNodeId = started.gameMap.connections.find(
    edge => edge.from === started.player.currentNodeId
  )?.to
  assert.ok(targetNodeId)

  // Without gig evidence, social result is rejected
  const unproven = handleResolveExpeditionSocialResult(started, {
    resultId: 'push',
    postOptionId: 'expedition-social-1',
    expectedRouteStep: 0
  })
  assert.strictEqual(unproven, started)

  // With canonical gig evidence:
  const startedWithGig = {
    ...started,
    lastGigStats: { score: 1000, accuracy: 80, failed: false }
  }
  const resolved = handleResolveExpeditionSocialResult(startedWithGig, {
    resultId: 'push',
    postOptionId: 'expedition-social-1',
    expectedRouteStep: 0
  })
  const forged = handleCreateSocialIntelGrant(startedWithGig, {
    postOptionId: 'expedition-social-1',
    resultId: 'push',
    nodeId: targetNodeId,
    expectedRouteStep: 0
  })
  assert.strictEqual(forged, startedWithGig)
  const granted = handleCreateSocialIntelGrant(resolved, {
    postOptionId: 'expedition-social-1',
    resultId: 'push',
    nodeId: targetNodeId,
    expectedRouteStep: 0
  })
  assert.equal(granted.expedition.intelGrants.length, 1)
  assert.strictEqual(
    handleCreateSocialIntelGrant(granted, {
      postOptionId: 'expedition-social-1',
      resultId: 'push',
      nodeId: targetNodeId,
      expectedRouteStep: 0
    }),
    granted
  )
})
