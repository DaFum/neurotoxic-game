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
import { buildExpeditionMap } from '../../src/domain/expedition/map.ts'

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
    postOptionId: 'perf_moshpit_chaos',
    expectedRouteStep: 0
  })
  assert.strictEqual(unproven, started)

  // With canonical gig evidence:
  const startedWithGig = {
    ...started,
    lastGigStats: { score: 1000, accuracy: 80, failed: false },
    expedition: {
      ...started.expedition,
      pendingSocialSettlement: { routeStep: 0, gigId: null }
    }
  }
  const resolved = handleResolveExpeditionSocialResult(startedWithGig, {
    resultId: 'push',
    postOptionId: 'perf_moshpit_chaos',
    expectedRouteStep: 0
  })
  const forged = handleCreateSocialIntelGrant(startedWithGig, {
    postOptionId: 'perf_moshpit_chaos',
    resultId: 'push',
    nodeId: targetNodeId,
    expectedRouteStep: 0
  })
  assert.strictEqual(forged, startedWithGig)
  const granted = handleCreateSocialIntelGrant(resolved, {
    postOptionId: 'perf_moshpit_chaos',
    resultId: 'push',
    nodeId: targetNodeId,
    expectedRouteStep: 0
  })
  assert.equal(granted.expedition.intelGrants.length, 1)
  assert.strictEqual(
    handleCreateSocialIntelGrant(granted, {
      postOptionId: 'perf_moshpit_chaos',
      resultId: 'push',
      nodeId: targetNodeId,
      expectedRouteStep: 0
    }),
    granted
  )
})

test('handleResolveExpeditionSocialResult rejects caller-authored mismatch or unproven resultId', () => {
  const prepared = preparedState()
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: prepared.expedition.prep.prepId,
      expectedRunSeed: prepared.runSeed,
      loadout: fixtureLoadout()
    }
  })
  const startedWithGig = {
    ...started,
    lastGigStats: { score: 1000, accuracy: 80, failed: false }
  }

  // Without pendingSocialSettlement in expedition state, direct dispatch must be REJECTED (no-op)
  const unprovenResult = handleResolveExpeditionSocialResult(startedWithGig, {
    resultId: 'push',
    postOptionId: 'perf_moshpit_chaos',
    expectedRouteStep: 0
  })
  assert.strictEqual(unprovenResult, startedWithGig)

  // With pendingSocialSettlement set from gig completion:
  const startedWithProof = {
    ...startedWithGig,
    expedition: {
      ...startedWithGig.expedition,
      pendingSocialSettlement: { routeStep: 0, gigId: null }
    }
  }

  // Mismatched resultId 'monetize' must be rejected
  const forgedResult = handleResolveExpeditionSocialResult(startedWithProof, {
    resultId: 'monetize',
    postOptionId: 'perf_moshpit_chaos',
    expectedRouteStep: 0
  })
  assert.strictEqual(forgedResult, startedWithProof)

  // Matching canonical resultId 'push' succeeds
  const canonicalResult = handleResolveExpeditionSocialResult(
    startedWithProof,
    {
      resultId: 'push',
      postOptionId: 'perf_moshpit_chaos',
      expectedRouteStep: 0
    }
  )
  assert.notStrictEqual(canonicalResult, startedWithProof)
  assert.equal(canonicalResult.expedition.lastSocialResult?.resultId, 'push')
  assert.equal(canonicalResult.expedition.pendingSocialSettlement, null)
})

test('sanitizeExpeditionState rejects gig_accuracy_count progress when accuracy fails minAccuracy or is forged', () => {
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

  const startNodeId =
    started.player.currentNodeId || started.expedition.visitedNodeIds[0]
  assert.ok(startNodeId, 'startNodeId must exist')

  // Build the canonical map for started's loadout to get valid DAG connections and meta
  const loadout = started.expedition.loadout
  assert.ok(loadout, 'loadout must exist')
  const canonicalMap = buildExpeditionMap(
    started.runSeed,
    loadout.tourTypeId,
    loadout.regionId
  )
  started.gameMap = structuredClone({
    nodes: canonicalMap.nodes,
    connections: canonicalMap.connections,
    meta: canonicalMap.meta
  })

  // Find a node in canonicalMap that is a gig class (CLUB_GIG, FESTIVAL, or FINALE) and reachable from startNodeId
  const gigEntry = Object.entries(canonicalMap.meta).find(
    ([id, meta]) =>
      id !== startNodeId &&
      (meta.nodeClass === 'CLUB_GIG' ||
        meta.nodeClass === 'FESTIVAL' ||
        meta.nodeClass === 'FINALE')
  )
  assert.ok(gigEntry, 'gig node must exist in canonical map')
  const [targetGigNodeId, gigMeta] = gigEntry
  const gigRouteStep = gigMeta.routeStep

  // Build a valid connected path from startNodeId to targetGigNodeId using canonicalMap connections
  const visitedNodeIds = [startNodeId]
  let current = startNodeId
  for (let step = 1; step <= gigRouteStep; step++) {
    const nextEdge = canonicalMap.connections.find(
      conn =>
        conn.from === current &&
        canonicalMap.meta[conn.to]?.routeStep === step
    )
    assert.ok(nextEdge, `edge at step ${step} must exist`)
    current = nextEdge.to
    visitedNodeIds.push(current)
  }
  assert.equal(current, targetGigNodeId)
  const actualGigNodeId = visitedNodeIds[gigRouteStep]
  const gigVenueId =
    canonicalMap.nodes[actualGigNodeId]?.venueId || actualGigNodeId

  // Test 1: Save file contains forged gigOutcomeByStep accuracy: 100, but lastGigStats is missing/unverified
  const stateWithForgedOutcome = {
    ...started,
    lastGigStats: null,
    expedition: {
      ...started.expedition,
      visitedNodeIds,
      routeStep: gigRouteStep,
      resolvedObligationSignalIds: [],
      gigOutcomeByStep: {
        [gigRouteStep]: { venueId: gigVenueId, accuracy: 100 } // Forged in save file!
      },
      activeObligations: [
        {
          id: `${started.expedition.runId}:contract_three_good_gigs`,
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
              value: 1, // Forged progress in save file!
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

  const sanitizedForged = sanitizeExpeditionState(
    stateWithForgedOutcome.expedition,
    started.runSeed,
    null
  )
  // Unverified outcome without canonical lastGigStats evidence is dropped (failed closed), progress reset to 0!
  assert.equal(
    sanitizedForged.activeObligations[0].progressByConstraintId.three_good_gigs
      .value,
    0
  )

  // Test 2: Canonical lastGigStats is present matching step 1 with accuracy 100
  const stateWithValidOutcome = {
    ...stateWithForgedOutcome,
    lastGigStats: { score: 1000, accuracy: 100, failed: false }
  }

  const sanitizedValid = sanitizeExpeditionState(
    stateWithValidOutcome.expedition,
    started.runSeed,
    stateWithValidOutcome.lastGigStats
  )
  assert.equal(
    sanitizedValid.activeObligations[0].progressByConstraintId.three_good_gigs
      .value,
    1
  )

  // Test 3: Historical gig accuracy without signal proof is rejected during load
  const stateWithForgedHistorical = {
    ...started,
    lastGigStats: null,
    expedition: {
      ...started.expedition,
      visitedNodeIds,
      routeStep: gigRouteStep + 1, // Historical step
      resolvedObligationSignalIds: [], // Missing signal proof!
      gigOutcomeByStep: {
        [gigRouteStep]: { venueId: gigVenueId, accuracy: 100 }
      },
      activeObligations: [
        {
          id: `${started.expedition.runId}:contract_three_good_gigs`,
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
              value: 1,
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

  // Add step + 1 to visited path so routeStep = gigRouteStep + 1 is valid
  const stepPlus1Edge = canonicalMap.connections.find(
    conn => conn.from === visitedNodeIds[gigRouteStep]
  )
  if (stepPlus1Edge) {
    stateWithForgedHistorical.expedition.visitedNodeIds = [
      ...visitedNodeIds,
      stepPlus1Edge.to
    ]
  }

  const sanitizedHistorical = sanitizeExpeditionState(
    stateWithForgedHistorical.expedition,
    started.runSeed,
    null
  )
  assert.equal(
    sanitizedHistorical.activeObligations[0].progressByConstraintId.three_good_gigs
      .value,
    0
  )
})
