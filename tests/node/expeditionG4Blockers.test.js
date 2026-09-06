import assert from 'node:assert/strict'
import test from 'node:test'

import { createInitialState } from '../../src/context/initialState.ts'
import {
  handleApplyExpeditionEventDelta,
  handleOfferExpeditionDraft,
  handleRecordExpeditionObligationSignal,
  handleResolveExpeditionSocialResult,
  handleCreateSocialIntelGrant
} from '../../src/context/reducers/expeditionReducer.ts'
import { selectExpeditionFinaleType } from '../../src/domain/expedition/finales.ts'
import { sanitizeCareerState } from '../../src/context/reducers/careerSanitizers.ts'
import { sanitizeExpeditionState } from '../../src/context/reducers/expeditionSanitizers.ts'
import {
  applyExpeditionEventHeat,
  getExpeditionRunResources
} from '../../src/domain/expedition/runResources.ts'
import { getAvailableAuthoritySafeExits } from '../../src/domain/expedition/authority.ts'
import {
  preparedState,
  startedState,
  fixtureLoadout,
  fixtureMap,
  firstExtractionRouteStep,
  walkTo,
  walkToFinale
} from '../expeditionLifecycleFixture.js'
import {
  applyExpeditionPressureEventResolution,
  resolveExpeditionPressureDirectorStep,
  selectPressureEvent
} from '../../src/domain/expedition/pressure.ts'
import { EXPEDITION_PRESSURE_EVENTS } from '../../src/data/expedition/pressureEvents.ts'
import { getEffectiveExpeditionRoute } from '../../src/domain/expedition/routeOverlay.ts'
import { buildPreparedExpeditionSponsorOffers } from '../../src/domain/expedition/sponsors.ts'
import {
  BASE_EXPEDITION_REGION_ID,
  BASE_EXPEDITION_TOUR_TYPE_ID
} from '../../src/domain/expedition/defaults.ts'
import { EXPEDITION_PRESSURE_EVENTS_DB } from '../../src/data/events/expeditionPressure.ts'
import { QUEST_REGISTRY } from '../../src/data/questRegistry.ts'
import { isExpeditionEventResultId } from '../../src/domain/expedition/eventDeltas.ts'
import { POST_OPTIONS } from '../../src/data/postOptions.ts'
import { deriveExpeditionSocialResultId } from '../../src/domain/expedition/social.ts'
import { settleExpedition } from '../../src/domain/expedition/extraction.ts'
import { getEffectiveExpeditionRules } from '../../src/domain/expedition/effectiveRules.ts'
import { applyExpeditionRouteAdvance } from '../../src/context/reducers/expeditionReducer.ts'
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
      lastGigResolvedAtRouteStep: 1,
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
  // PREPARE deliberately stages nothing: it runs before the player has chosen
  // a Region or Tour, so any set it stored would describe the baseline route
  // rather than the one being built. The set is derived from those two ids.
  assert.deepEqual(prepared.expedition.preparedSponsorOffers, [])

  const canonical = buildPreparedExpeditionSponsorOffers(
    prepared,
    BASE_EXPEDITION_REGION_ID,
    BASE_EXPEDITION_TOUR_TYPE_ID
  )
  assert.ok(canonical.length > 0)
  const forged = structuredClone(canonical)
  forged.reverse()
  assert.deepEqual(
    validatePreparedExpeditionSponsorOffers(prepared, forged),
    []
  )
})

test('sponsor staging follows the selected Region and Tour', () => {
  const initial = createInitialState()
  const prepared = gameReducer(initial, {
    type: ActionTypes.PREPARE_EXPEDITION_RUN,
    payload: { prepId: 'prep', runSeed: 123 }
  })
  // Corporate leans on Contracts (sponsor weight 1.3) and stages one more
  // offer than baseline; Underground keeps its distance (0.9) and stages one
  // fewer. Reading the loadout instead of the selection made both of these
  // resolve the baseline count in production.
  const offersFor = (regionId, tourTypeId) =>
    buildPreparedExpeditionSponsorOffers(prepared, regionId, tourTypeId).length
  const baseline = offersFor(
    BASE_EXPEDITION_REGION_ID,
    BASE_EXPEDITION_TOUR_TYPE_ID
  )
  assert.ok(
    offersFor('underground_scene', 'underground_tour') < baseline,
    'a Region and Tour that avoid brands must stage fewer offers'
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
    social: { ...started.social, pendingSocialOptionId: 'perf_moshpit_chaos' },
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
    social: {
      ...startedWithGig.social,
      pendingSocialOptionId: 'perf_moshpit_chaos'
    },
    expedition: {
      ...startedWithGig.expedition,
      pendingSocialSettlement: { routeStep: 0, gigId: null }
    }
  }

  // A post option the canonical Social owner never selected is rejected, even
  // with the settlement window open: the payload is not its own provenance.
  assert.strictEqual(
    handleResolveExpeditionSocialResult(
      {
        ...startedWithProof,
        social: {
          ...startedWithProof.social,
          pendingSocialOptionId: 'perf_crowd_surf'
        }
      },
      {
        resultId: 'push',
        postOptionId: 'perf_moshpit_chaos',
        expectedRouteStep: 0
      }
    ).expedition.lastSocialResult,
    null
  )

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

  // Walk the canonical path first, then take a gig node *from that path*.
  // Picking one out of meta order and assuming the greedy walk reaches it is
  // what broke here: a gig node can exist on a branch this walk never takes,
  // and which branch carries one legitimately changes with route generation.
  const walkedNodeIds = [startNodeId]
  let cursor = startNodeId
  for (
    let step = 1;
    step <= canonicalMap.meta[canonicalMap.finaleNodeId].routeStep;
    step++
  ) {
    const nextEdge = canonicalMap.connections.find(
      conn =>
        conn.from === cursor && canonicalMap.meta[conn.to]?.routeStep === step
    )
    if (!nextEdge) break
    cursor = nextEdge.to
    walkedNodeIds.push(cursor)
  }
  const gigRouteStep = walkedNodeIds.findIndex(id => {
    const entry = canonicalMap.meta[id]
    return (
      id !== startNodeId &&
      (entry?.nodeClass === 'CLUB_GIG' ||
        entry?.nodeClass === 'FESTIVAL' ||
        entry?.nodeClass === 'FINALE')
    )
  })
  assert.ok(gigRouteStep > 0, 'the walked route must reach a gig node')
  const visitedNodeIds = walkedNodeIds.slice(0, gigRouteStep + 1)
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
    sanitizedHistorical.activeObligations[0].progressByConstraintId
      .three_good_gigs.value,
    0
  )
})

const keepItCleanState = () => {
  const state = activeState()
  const obligation = state.expedition.activeObligations[0]
  obligation.id = 'run-1:contract_keep_it_clean'
  obligation.sourceId = 'contract_keep_it_clean'
  obligation.constraints = [
    { id: 'keep_heat_clean', kind: 'max_heat', maxHeat: 40 }
  ]
  obligation.progressByConstraintId = {
    keep_heat_clean: {
      constraintId: 'keep_heat_clean',
      value: 0,
      satisfied: false,
      failed: false
    }
  }
  state.player.currentNodeId = 'node-a'
  return state
}

test('a max_heat contract pays at the Finale, not on the first safe signal', () => {
  const state = keepItCleanState()
  state.expedition.pressure.heat = 10
  const safe = handleRecordExpeditionObligationSignal(state, {
    signalType: 'gig',
    sourceId: 'gig-proof',
    expectedRouteStep: 1
  })
  assert.equal(safe.expedition.activeObligations[0].status, 'active')
  assert.equal(safe.expedition.activeObligations[0].settled, false)
  assert.equal(safe.player.money, state.player.money)

  // A Heat spike after that early safe signal still fails the contract.
  const hot = {
    ...safe,
    expedition: {
      ...safe.expedition,
      pressure: { ...safe.expedition.pressure, heat: 55 }
    }
  }
  const failed = handleRecordExpeditionObligationSignal(hot, {
    signalType: 'arrival',
    sourceId: 'node-a',
    expectedRouteStep: 1
  })
  assert.equal(failed.expedition.activeObligations[0].status, 'failed')
  assert.equal(failed.expedition.activeObligations[0].settled, true)
  assert.equal(failed.player.money, state.player.money)

  // Reaching the Finale under the cap is what completes and pays it.
  const completed = handleRecordExpeditionObligationSignal(safe, {
    signalType: 'finale',
    sourceId: 'gig-proof',
    expectedRouteStep: 1
  })
  assert.equal(completed.expedition.activeObligations[0].status, 'completed')
  assert.equal(completed.player.money, state.player.money + 1800)
})

test('one gig cannot re-signal an obligation after a route advance', () => {
  const state = activeState()
  const once = handleRecordExpeditionObligationSignal(state, {
    signalType: 'gig',
    sourceId: 'gig-proof',
    expectedRouteStep: 1
  })
  assert.equal(
    once.expedition.activeObligations[0].progressByConstraintId.three_good_gigs
      .value,
    1
  )
  // `lastGigStats` and `currentGig` both survive the advance, so only the
  // resolution stamp stops the same gig counting a second time.
  const advanced = {
    ...once,
    expedition: { ...once.expedition, routeStep: 2 }
  }
  assert.strictEqual(
    handleRecordExpeditionObligationSignal(advanced, {
      signalType: 'gig',
      sourceId: 'gig-proof',
      expectedRouteStep: 2
    }),
    advanced
  )
})

test('reckless_encore trades extraction retention for its Finale multiplier', () => {
  const state = activeState()
  state.player.money = 5000
  state.player.fame = 2000
  state.expedition.startingMoney = 4000
  state.expedition.startingFame = 1000
  const drafted = {
    ...state,
    expedition: { ...state.expedition, runDraftTraitIds: ['reckless_encore'] }
  }

  const base = settleExpedition(state, 'extracted')
  const withDraft = settleExpedition(drafted, 'extracted')
  assert.equal(base.retentionRate, 0.6)
  assert.equal(withDraft.retentionRate, 0.6 * 0.85)
  assert.ok(withDraft.moneyRetained < base.moneyRetained)
  assert.ok(withDraft.fameRetained < base.fameRetained)

  // The penalty is the price of bailing out, so finishing the run keeps the
  // canonical base rate and the Finale multiplier is the payoff.
  assert.equal(settleExpedition(drafted, 'completed').retentionRate, 1)
  assert.equal(
    getEffectiveExpeditionRules(drafted).numeric.finaleRewardMultiplier,
    1.2
  )
  assert.equal(
    getEffectiveExpeditionRules(state).numeric.finaleRewardMultiplier,
    1
  )
})

test('sanitizeExpeditionState refuses forged terminal-contract progress', () => {
  const prepared = preparedState()
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: prepared.expedition.prep.prepId,
      expectedRunSeed: prepared.runSeed,
      loadout: {
        ...fixtureLoadout(),
        nativeContracts: [
          { templateId: 'contract_keep_it_clean', targetNodeId: null }
        ]
      }
    }
  })
  const forgedObligation = {
    id: `${started.expedition.runId}:contract_keep_it_clean`,
    sourceType: 'native',
    sourceId: 'contract_keep_it_clean',
    constraints: [{ id: 'keep_heat_clean', kind: 'max_heat', maxHeat: 40 }],
    progressByConstraintId: {
      keep_heat_clean: {
        constraintId: 'keep_heat_clean',
        value: 0,
        satisfied: true,
        failed: false
      }
    },
    status: 'completed',
    settled: false,
    doubleDown: null
  }

  // No canonical Finale signal in the run: the satisfied flag is not evidence.
  const forged = sanitizeExpeditionState(
    { ...started.expedition, activeObligations: [forgedObligation] },
    started.runSeed
  )
  assert.equal(forged.activeObligations.length, 1)
  assert.equal(
    forged.activeObligations[0].progressByConstraintId.keep_heat_clean
      .satisfied,
    false
  )
  assert.equal(forged.activeObligations[0].status, 'active')

  // With the signal proof the progress is honoured, but `settled` is derived
  // from the terminal status rather than trusted, so the reward cannot be
  // collected a second time after the reload.
  const proven = sanitizeExpeditionState(
    {
      ...started.expedition,
      resolvedObligationSignalIds: ['finale:venue:0'],
      activeObligations: [forgedObligation]
    },
    started.runSeed
  )
  assert.equal(proven.activeObligations[0].status, 'completed')
  assert.equal(proven.activeObligations[0].settled, true)

  // A persisted Heat breach re-fails the contract even when the save says it
  // never happened.
  const breached = sanitizeExpeditionState(
    {
      ...started.expedition,
      pressure: { ...started.expedition.pressure, heat: 70 },
      resolvedObligationSignalIds: ['finale:venue:0'],
      activeObligations: [forgedObligation]
    },
    started.runSeed
  )
  assert.equal(breached.activeObligations[0].status, 'failed')
})

test('the Underground detour opens only once the player resolves the invite', () => {
  const prepared = preparedState()
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: prepared.expedition.prep.prepId,
      expectedRunSeed: prepared.runSeed,
      loadout: fixtureLoadout()
    }
  })
  const map = fixtureMap()
  const hot = {
    ...started,
    expedition: {
      ...started.expedition,
      pressure: {
        ...started.expedition.pressure,
        heat: 70,
        pendingDirectorEventId: 'expedition_underground_invite'
      }
    }
  }

  // Selection alone changes nothing the player can act on.
  assert.equal(hot.expedition.pressure.temporaryRouteOpportunity, null)

  const resolvedPressure = applyExpeditionPressureEventResolution(
    hot,
    'expedition_underground_invite',
    map
  )
  const opportunity = resolvedPressure.temporaryRouteOpportunity
  assert.ok(opportunity, 'resolving the invite must open the detour')
  assert.equal(opportunity.subtype, 'UNDERGROUND_MARKET')
  assert.equal(map.meta[opportunity.targetNodeId]?.routeStep, 1)
  // Resolving consumes the pick, so it cannot open a second time.
  assert.equal(resolvedPressure.pendingDirectorEventId, null)

  const withOpportunity = {
    ...hot,
    expedition: { ...hot.expedition, pressure: resolvedPressure }
  }
  assert.strictEqual(
    applyExpeditionPressureEventResolution(
      withOpportunity,
      'expedition_underground_invite',
      map
    ),
    resolvedPressure
  )

  // The overlay makes it traversable; the base map stays untouched.
  const from = started.expedition.visitedNodeIds.at(-1)
  const effective = getEffectiveExpeditionRoute(withOpportunity, map)
  assert.ok(
    effective.connections.some(
      edge => edge.from === from && edge.to === opportunity.targetNodeId
    )
  )
  assert.equal(map.meta[opportunity.targetNodeId].specialSubtype ?? null, null)
  const travelled = applyExpeditionRouteAdvance(
    withOpportunity,
    opportunity.targetNodeId
  )
  assert.equal(travelled.player.currentNodeId, opportunity.targetNodeId)
  assert.equal(travelled.expedition.pressure.temporaryRouteOpportunity, null)

  // Below the Heat gate resolving the same invite opens nothing.
  const cold = {
    ...hot,
    expedition: {
      ...hot.expedition,
      pressure: { ...hot.expedition.pressure, heat: 59 }
    }
  }
  assert.equal(
    applyExpeditionPressureEventResolution(
      cold,
      'expedition_underground_invite',
      map
    ).temporaryRouteOpportunity,
    null
  )
})

test('severe relief follows the resolved event, never the selection alone', () => {
  const prepared = preparedState()
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: prepared.expedition.prep.prepId,
      expectedRunSeed: prepared.runSeed,
      loadout: fixtureLoadout()
    }
  })
  const selected = {
    ...started,
    expedition: {
      ...started.expedition,
      pressure: {
        ...started.expedition.pressure,
        pendingDirectorEventId: 'expedition_technical_collapse'
      }
    }
  }
  // A run that never resolved the event gets no anti-frustration relief for it.
  assert.equal(selected.expedition.pressure.severeReliefUntilRouteStep, null)
  assert.equal(selected.expedition.pressure.lastSevereEventId, null)

  const resolved = applyExpeditionPressureEventResolution(
    selected,
    'expedition_technical_collapse'
  )
  assert.equal(resolved.lastSevereEventId, 'expedition_technical_collapse')
  assert.equal(resolved.severeReliefUntilRouteStep, 2)
  assert.equal(resolved.pendingDirectorEventId, null)

  // An id the Director did not select resolves nothing.
  assert.strictEqual(
    applyExpeditionPressureEventResolution(
      selected,
      'expedition_authority_patrol'
    ),
    selected.expedition.pressure
  )
})

test('the Director never selects an event the run is not eligible for', () => {
  const prepared = preparedState()
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: prepared.expedition.prep.prepId,
      expectedRunSeed: prepared.runSeed,
      loadout: fixtureLoadout()
    }
  })
  const ambush = EXPEDITION_PRESSURE_EVENTS.filter(
    event => event.id === 'expedition_rival_ambush'
  )
  assert.equal(ambush.length, 1)

  // With a Rival the pool is eligible; without one the Director must not spend
  // the step on an event the authored condition would then refuse.
  const withoutRival = { ...started, rivalBand: null }
  for (let step = 0; step < 12; step++) {
    const at = state => ({
      ...state,
      expedition: { ...state.expedition, routeStep: step }
    })
    assert.notEqual(
      resolveExpeditionPressureDirectorStep(at(withoutRival), ambush)
        .pendingDirectorEventId,
      'expedition_rival_ambush'
    )
  }
  assert.ok(started.rivalBand)
})

test('a Nemesis at level 2 opens a Rival shortcut the base route lacks', () => {
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
  const map = fixtureMap()
  const from = started.expedition.visitedNodeIds.at(-1)

  // Level 1 changes event weighting only; the route is untouched.
  assert.equal(
    Object.keys(getEffectiveExpeditionRoute(started, map).subtypeByNodeId)
      .length,
    0
  )

  const atTierTwo = {
    ...started,
    career: {
      ...started.career,
      rivalsById: {
        ...started.career.rivalsById,
        [started.rivalBand.id]: {
          ...started.career.rivalsById[started.rivalBand.id],
          history: {
            ...started.career.rivalsById[started.rivalBand.id].history,
            nemesisLevel: 2
          }
        }
      }
    }
  }
  const effective = getEffectiveExpeditionRoute(atTierTwo, map)
  const [shortcutNodeId] = Object.keys(effective.subtypeByNodeId)
  assert.ok(shortcutNodeId, 'Nemesis level 2 must open a Rival route option')
  assert.equal(effective.subtypeByNodeId[shortcutNodeId], 'RIVAL_ENCOUNTER')
  assert.equal(map.meta[shortcutNodeId]?.routeStep, 1)
  // The base route is never edited - the subtype lives only in the overlay.
  assert.equal(map.meta[shortcutNodeId].specialSubtype ?? null, null)
  assert.ok(
    effective.connections.some(
      edge => edge.from === from && edge.to === shortcutNodeId
    )
  )
  // Deterministic: the same run resolves the same shortcut every time.
  assert.deepEqual(
    getEffectiveExpeditionRoute(atTierTwo, map).connections,
    effective.connections
  )
  assert.notStrictEqual(
    applyExpeditionRouteAdvance(atTierTwo, shortcutNodeId),
    atTierTwo
  )
})

test('the Director weights by Cash pressure and route depth', () => {
  const base = keepItCleanState()
  base.expedition.pressure.heat = 20
  const contract = {
    id: 'expedition_contract_squeeze',
    severity: 'normal',
    pressureFamily: 'contract',
    baseWeight: 10,
    negative: true
  }
  const social = {
    id: 'expedition_underground_invite',
    severity: 'normal',
    pressureFamily: 'social',
    baseWeight: 10,
    negative: false
  }
  const severe = {
    id: 'expedition_technical_collapse',
    severity: 'severe',
    pressureFamily: 'technical',
    baseWeight: 4,
    negative: true
  }

  // Twenty-four independent seeded draws, so the comparison is about the
  // weighting rather than one lucky roll.
  const draws = (state, pool, routeStep, match) =>
    Array.from({ length: 24 }, (_, i) =>
      selectPressureEvent(
        {
          ...state,
          runSeed: 1000 + i,
          expedition: { ...state.expedition, routeStep }
        },
        pool
      )
    ).filter(event => event !== null && match(event)).length

  // A run out of spendable Cash feels it through its obligations.
  const solvent = { ...base, player: { ...base.player, money: 5000 } }
  const broke = {
    ...base,
    player: { ...base.player, money: 0 },
    expedition: { ...base.expedition, protectedCareerCash: 0 }
  }
  const byContract = event => event.pressureFamily === 'contract'
  assert.ok(
    draws(broke, [contract, social], 1, byContract) >
      draws(solvent, [contract, social], 1, byContract),
    'Cash pressure must reach the obligation family'
  )

  // A deeper run draws harsher events; route depth lifts severe weights only.
  const bySeverity = event => event.severity === 'severe'
  const deepSevere = draws(solvent, [severe, social], 8, bySeverity)
  const shallowSevere = draws(solvent, [severe, social], 0, bySeverity)
  assert.ok(
    deepSevere > shallowSevere,
    `route depth must lift severe weights (${deepSevere} vs ${shallowSevere})`
  )
})

test('a route advance runs one deterministic Director step', () => {
  const prepared = preparedState()
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: prepared.expedition.prep.prepId,
      expectedRunSeed: prepared.runSeed,
      loadout: fixtureLoadout()
    }
  })
  const from =
    started.expedition.visitedNodeIds[
      started.expedition.visitedNodeIds.length - 1
    ]
  const edge = fixtureMap().connections.find(item => item.from === from)
  assert.ok(edge)

  const advanced = applyExpeditionRouteAdvance(started, edge.to)
  assert.equal(advanced.expedition.routeStep, 1)

  // The Director is consulted for the step the run entered, not the one it
  // left, and the same advance re-selects the same event instead of rolling
  // a second one.
  const selected = selectPressureEvent(
    {
      ...advanced,
      expedition: {
        ...advanced.expedition,
        pressure: started.expedition.pressure
      }
    },
    EXPEDITION_PRESSURE_EVENTS
  )
  assert.ok(selected, 'the Director selected no event for the entered step')
  if (selected.severity === 'severe' && selected.negative) {
    assert.equal(advanced.expedition.pressure.lastSevereEventId, selected.id)
    assert.equal(advanced.expedition.pressure.severeReliefUntilRouteStep, 3)
  } else {
    assert.equal(advanced.expedition.pressure.lastSevereEventId, null)
  }
  assert.deepEqual(
    applyExpeditionRouteAdvance(started, edge.to).expedition.pressure,
    advanced.expedition.pressure
  )
})

test('a forged temporary route opportunity does not survive a load', () => {
  const prepared = preparedState()
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: prepared.expedition.prep.prepId,
      expectedRunSeed: prepared.runSeed,
      loadout: fixtureLoadout()
    }
  })
  const map = fixtureMap()
  // A genuinely earned opportunity: high Heat, the Director's pick, resolved.
  const hot = {
    ...started,
    expedition: {
      ...started.expedition,
      pressure: {
        ...started.expedition.pressure,
        heat: 70,
        pendingDirectorEventId: 'expedition_underground_invite'
      }
    }
  }
  const earnedPressure = applyExpeditionPressureEventResolution(
    hot,
    'expedition_underground_invite',
    map
  )
  const opportunity = earnedPressure.temporaryRouteOpportunity
  assert.ok(opportunity)

  const loadWith = pressure =>
    sanitizeExpeditionState(
      { ...started.expedition, pressure },
      started.runSeed
    ).pressure.temporaryRouteOpportunity

  // The earned one round-trips.
  assert.deepEqual(loadWith(earnedPressure), opportunity)

  // A different next-step target is the exploit: the save picks the node it
  // wants an edge to and supplies the trivially derived id. The load re-derives
  // the target from the seed, so the forged one is replaced, never granted.
  const otherNextStep = Object.keys(map.meta).find(
    nodeId =>
      map.meta[nodeId]?.routeStep === 1 && nodeId !== opportunity.targetNodeId
  )
  assert.ok(otherNextStep, 'the fixture route needs a second node at step 1')
  assert.equal(
    loadWith({
      ...earnedPressure,
      temporaryRouteOpportunity: {
        ...opportunity,
        targetNodeId: otherNextStep
      }
    }).targetNodeId,
    opportunity.targetNodeId
  )

  // A forged id is still refused outright.
  assert.equal(
    loadWith({
      ...earnedPressure,
      temporaryRouteOpportunity: { ...opportunity, id: 'forged' }
    }),
    null
  )

  // Heat below the invite's own threshold could not have produced one.
  assert.equal(loadWith({ ...earnedPressure, heat: 59 }), null)

  // The opportunity is spent by travelling it and expires on the next advance,
  // so a live one always belongs to the current step: any other step is stale.
  const step = opportunity.createdAtRouteStep
  for (const claimed of [step + 1, step + 2]) {
    assert.equal(
      loadWith({
        ...earnedPressure,
        temporaryRouteOpportunity: {
          id: `UNDERGROUND_MARKET:${started.expedition.runId}:${claimed}`,
          subtype: 'UNDERGROUND_MARKET',
          targetNodeId: opportunity.targetNodeId,
          createdAtRouteStep: claimed
        }
      }),
      null
    )
  }

  // The other two subtypes have no producer at all, so a save naming one is
  // inventing it.
  for (const subtype of ['BLACK_MARKET', 'RIVAL_ENCOUNTER']) {
    assert.equal(
      loadWith({
        ...earnedPressure,
        temporaryRouteOpportunity: {
          id: `${subtype}:${started.expedition.runId}:${opportunity.createdAtRouteStep}`,
          subtype,
          targetNodeId: opportunity.targetNodeId,
          createdAtRouteStep: opportunity.createdAtRouteStep
        }
      }),
      null
    )
  }
})

test('Nemesis advances at most one tier per run and L4 opens the Rival Finale', () => {
  const prepared = preparedState()
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: prepared.expedition.prep.prepId,
      expectedRunSeed: prepared.runSeed,
      loadout: fixtureLoadout()
    }
  })
  assert.ok(started.rivalBand, 'START must materialize a Rival')
  const rivalId = started.rivalBand.id
  assert.equal(started.career.rivalsById[rivalId].history.nemesisLevel, 0)

  // L4 is what makes the Rival Finale reachable, which is the far end of the
  // circularity this progression exists to break.
  assert.equal(selectExpeditionFinaleType({ nemesisLevel: 4 }), 'rival_battle')
  assert.notEqual(
    selectExpeditionFinaleType({ nemesisLevel: 3 }),
    'rival_battle'
  )

  // The per-run guard is `lastNemesisAdvanceRunId`: a run that already advanced
  // this Rival cannot advance it again, whichever canonical outcome gets there.
  const alreadyAdvanced = {
    ...started,
    career: {
      ...started.career,
      rivalsById: {
        ...started.career.rivalsById,
        [rivalId]: {
          ...started.career.rivalsById[rivalId],
          history: {
            ...started.career.rivalsById[rivalId].history,
            nemesisLevel: 2,
            lastNemesisAdvanceRunId: started.expedition.runId
          }
        }
      }
    }
  }
  const atFinale = walkToFinale({
    ...alreadyAdvanced,
    expedition: { ...alreadyAdvanced.expedition, finaleType: 'rival_battle' }
  })
  const completed = gameReducer(atFinale, {
    type: ActionTypes.COMPLETE_EXPEDITION,
    payload: {
      finaleResultId: 'finale_result_fixture',
      expectedRouteStep: atFinale.expedition.routeStep
    }
  })
  assert.equal(
    completed.career.rivalsById[rivalId].history.nemesisLevel,
    2,
    'a Nemesis tier must not be farmable twice inside one run'
  )
})

test('the four Expedition quest producers fire from their canonical owners', () => {
  const prepared = preparedState()
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: prepared.expedition.prep.prepId,
      expectedRunSeed: prepared.runSeed,
      loadout: fixtureLoadout()
    }
  })
  const from = started.expedition.visitedNodeIds.at(-1)
  const edge = fixtureMap().connections.find(item => item.from === from)
  assert.ok(edge)

  // nodeResolved fires on a committed advance and on none of its refusals.
  const advanced = applyExpeditionRouteAdvance(started, edge.to)
  assert.equal(advanced.player.currentNodeId, edge.to)
  assert.strictEqual(
    applyExpeditionRouteAdvance(started, 'not_a_neighbour'),
    started,
    'a refused advance must progress nothing'
  )

  // extracted fires only on a settlement that actually happened.
  const atWindow = walkTo(started, firstExtractionRouteStep())
  const extracted = gameReducer(atWindow, {
    type: ActionTypes.EXTRACT_EXPEDITION,
    payload: {
      expectedRouteStep: atWindow.expedition.routeStep,
      explicitRareRewardIds: []
    }
  })
  assert.equal(extracted.expedition.status, 'extracted')
  assert.strictEqual(
    gameReducer(extracted, {
      type: ActionTypes.EXTRACT_EXPEDITION,
      payload: {
        expectedRouteStep: atWindow.expedition.routeStep,
        explicitRareRewardIds: []
      }
    }),
    extracted,
    'a replayed extraction must be a no-op'
  )

  // finaleCompleted fires on a committed completion, which now requires the
  // resolved non-failed Finale gig the terminal transition is proven by.
  const walkedToFinale = walkToFinale(started)
  const atFinale = {
    ...walkedToFinale,
    currentGig: { id: 'finale_venue' },
    lastGigStats: { score: 1000, accuracy: 80, failed: false },
    expedition: {
      ...walkedToFinale.expedition,
      lastGigResolvedAtRouteStep: walkedToFinale.expedition.routeStep
    }
  }
  const completed = gameReducer(atFinale, {
    type: ActionTypes.COMPLETE_EXPEDITION,
    payload: {
      finaleResultId: 'finale_result_fixture',
      expectedRouteStep: atFinale.expedition.routeStep
    }
  })
  assert.equal(completed.expedition.status, 'completed')
  assert.strictEqual(
    gameReducer(completed, {
      type: ActionTypes.COMPLETE_EXPEDITION,
      payload: {
        finaleResultId: 'finale_result_fixture',
        expectedRouteStep: atFinale.expedition.routeStep
      }
    }),
    completed,
    'a replayed completion must be a no-op'
  )
})

test('a Nemesis at level 3 takes one staged Sponsor offer off the table', () => {
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
  const rivalId = started.rivalBand.id

  const atTier = level => ({
    ...started,
    career: {
      ...started.career,
      rivalsById: {
        ...started.career.rivalsById,
        [rivalId]: {
          ...started.career.rivalsById[rivalId],
          history: {
            ...started.career.rivalsById[rivalId].history,
            nemesisLevel: level
          }
        }
      }
    }
  })

  const baseline = buildPreparedExpeditionSponsorOffers(atTier(0))
  assert.equal(baseline.length, 3)
  // Tiers below 3 do not interfere; the offers stay identical, not merely
  // equal in count.
  assert.deepEqual(buildPreparedExpeditionSponsorOffers(atTier(2)), baseline)

  const interfered = buildPreparedExpeditionSponsorOffers(atTier(3))
  assert.equal(interfered.length, 2)
  // The Rival takes one off the table rather than reshuffling the staging, so
  // the surviving offers are the same deterministic ones.
  assert.deepEqual(interfered, baseline.slice(0, 2))
  assert.deepEqual(buildPreparedExpeditionSponsorOffers(atTier(4)), interfered)
})

test('a Rival climbs 0 to 4 across linked runs, one tier per run', () => {
  // The Rival-targeted post is what makes `weaponize` - and therefore the whole
  // ladder - reachable through the canonical Social path.
  const rivalPostOption = POST_OPTIONS.find(
    option => deriveExpeditionSocialResultId(option) === 'weaponize'
  )
  assert.ok(rivalPostOption, 'a production post option must resolve weaponize')

  // Real run identities, never rewritten: START stamps the Rival record's
  // `lastSeenRunId` with the id it is about to give the run, so a guard that
  // reads that field rejects the run's own first encounter. Only a chain of
  // genuinely STARTed runs shows that.
  const startLinkedRun = (career, prepId) => {
    const fresh = createInitialState()
    fresh.player.money = 5000
    fresh.player.fame = 100
    fresh.player.van.fuel = 100
    const prepared = gameReducer(
      { ...fresh, career },
      {
        type: ActionTypes.PREPARE_EXPEDITION_RUN,
        payload: { prepId, runSeed: 4242 }
      }
    )
    const started = gameReducer(prepared, {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId,
        expectedRunSeed: 4242,
        loadout: fixtureLoadout()
      }
    })
    assert.equal(started.expedition.status, 'active')
    assert.equal(started.expedition.runId, prepId)
    return started
  }

  const encounter = state =>
    handleResolveExpeditionSocialResult(
      {
        ...state,
        lastGigStats: { score: 1000, accuracy: 80, failed: false },
        social: {
          ...state.social,
          pendingSocialOptionId: rivalPostOption.id
        },
        expedition: {
          ...state.expedition,
          lastSocialResult: null,
          pendingSocialSettlement: {
            routeStep: state.expedition.routeStep,
            gigId: null
          }
        }
      },
      {
        resultId: 'weaponize',
        postOptionId: rivalPostOption.id,
        expectedRouteStep: state.expedition.routeStep
      }
    )

  const first = startLinkedRun(createInitialState().career, 'run_link_1')
  assert.ok(first.rivalBand)
  const rivalId = first.rivalBand.id
  assert.equal(first.career.rivalsById[rivalId].history.nemesisLevel, 0)
  assert.equal(rivalPostOption.condition({ ...first }), true)
  // START already wrote this run's id here, which is exactly why it cannot also
  // be the advance guard.
  assert.equal(
    first.career.rivalsById[rivalId].history.lastSeenRunId,
    first.expedition.runId
  )

  let current = first
  for (let run = 1; run <= 4; run++) {
    if (run > 1) {
      current = startLinkedRun(current.career, `run_link_${run}`)
      assert.equal(
        current.rivalBand?.id,
        rivalId,
        'a linked run must meet the same persistent Rival'
      )
    }
    current = encounter(current)
    assert.equal(
      current.career.rivalsById[rivalId].history.nemesisLevel,
      run,
      `run ${run} must advance the persistent Rival record exactly one tier`
    )
    assert.equal(
      current.career.rivalsById[rivalId].history.lastNemesisAdvanceRunId,
      current.expedition.runId
    )
    // A second canonical result inside the same run does not advance again.
    assert.equal(
      encounter(current).career.rivalsById[rivalId].history.nemesisLevel,
      run,
      'a Nemesis tier must not be farmable inside one run'
    )
  }

  assert.equal(
    current.career.rivalsById[rivalId].history.relationship,
    'nemesis'
  )
  assert.equal(selectExpeditionFinaleType({ nemesisLevel: 4 }), 'rival_battle')
})

test('a pending Run Draft holds the route until the player picks', () => {
  const walked = walkTo(startedState(), 1)
  const nodeId = walked.player.currentNodeId
  const started = {
    ...walked,
    gameMap: {
      ...walked.gameMap,
      nodes: { ...walked.gameMap?.nodes, [nodeId]: { type: 'SUPPLY_STOP' } }
    }
  }
  const offered = handleOfferExpeditionDraft(started, {
    sourceType: 'supply',
    sourceKey: nodeId,
    expectedRouteStep: started.expedition.routeStep
  })
  assert.ok(
    offered.expedition.pendingRunDraftOffer,
    'the fixture must actually produce a pending offer'
  )
  const map = fixtureMap()
  const nextNodeId = Object.keys(map.meta).find(
    id => map.meta[id]?.routeStep === offered.expedition.routeStep + 1
  )
  assert.ok(nextNodeId)

  // Travelling first used to strand the offer forever: SELECT then failed its
  // route-step check while OFFER stayed blocked by the non-null offer.
  assert.equal(
    applyExpeditionRouteAdvance(offered, nextNodeId),
    offered,
    'the route must not advance while a Run Draft is pending'
  )

  const traitId = offered.expedition.pendingRunDraftOffer.candidateTraitIds[0]
  const picked = gameReducer(offered, {
    type: ActionTypes.SELECT_EXPEDITION_DRAFT,
    payload: { traitId, expectedRouteStep: offered.expedition.routeStep }
  })
  assert.equal(picked.expedition.pendingRunDraftOffer, null)
  assert.ok(picked.expedition.runDraftTraitIds.includes(traitId))

  const advanced = applyExpeditionRouteAdvance(picked, nextNodeId)
  assert.equal(
    advanced.expedition.routeStep,
    picked.expedition.routeStep + 1,
    'the same advance must succeed once the Draft is resolved'
  )
})

test('the Director and the authored events share one draw', () => {
  const prepared = preparedState()
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: prepared.expedition.prep.prepId,
      expectedRunSeed: prepared.runSeed,
      loadout: fixtureLoadout()
    }
  })

  // Registry and authored definitions are the same four ids, so the pick and
  // the surfaced event cannot drift apart.
  assert.deepEqual(
    EXPEDITION_PRESSURE_EVENTS_DB.map(event => event.id).sort(),
    EXPEDITION_PRESSURE_EVENTS.map(event => event.id).sort()
  )

  for (const event of EXPEDITION_PRESSURE_EVENTS_DB) {
    // Options name a canonical result and never carry numbers of their own.
    assert.ok(event.options.length >= 1, `${event.id} needs an option`)
    for (const option of event.options) {
      assert.equal(option.effect.type, 'expedition')
      assert.ok(isExpeditionEventResultId(option.effect.result))
    }
    // No second probability: the Director already decided, so the condition is
    // simply "am I the pick".
    assert.equal(event.chance, 1)
    assert.equal(event.condition(prepared), false)
    assert.equal(event.condition(started), false)
    const selected = {
      ...started,
      expedition: {
        ...started.expedition,
        pressure: {
          ...started.expedition.pressure,
          pendingDirectorEventId: event.id
        }
      }
    }
    assert.equal(
      event.condition(selected),
      true,
      `${event.id} must surface when it is the Director's pick`
    )
    // And no other authored event may surface on that same step.
    for (const other of EXPEDITION_PRESSURE_EVENTS_DB) {
      if (other.id === event.id) continue
      assert.equal(other.condition(selected), false)
    }
  }
})

test('a forged event delta cannot mint effects or clear the Director pick', () => {
  const prepared = preparedState()
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: prepared.expedition.prep.prepId,
      expectedRunSeed: prepared.runSeed,
      loadout: fixtureLoadout()
    }
  })
  // The Director has picked the severe technical event for this step.
  const pending = {
    ...started,
    activeEvent: { id: 'expedition_technical_collapse' },
    expedition: {
      ...started.expedition,
      pressure: {
        ...started.expedition.pressure,
        pendingDirectorEventId: 'expedition_technical_collapse'
      }
    }
  }
  const base = {
    expectedRouteStep: pending.expedition.routeStep,
    sourceEventId: 'expedition_technical_collapse',
    sourceOptionId: 'push_the_rig'
  }
  // The option the fixture leans on must really declare that result, otherwise
  // the negative cases below would pass for the wrong reason.
  const collapse = EXPEDITION_PRESSURE_EVENTS_DB.find(
    event => event.id === 'expedition_technical_collapse'
  )
  const pushTheRig = collapse.options.find(
    option => option.id === 'push_the_rig'
  )
  assert.ok(pushTheRig, 'the fixture must name a real option')

  // A result that option never declares: no wear, no cargo, no Heat, and the
  // pending pick survives, so relief cannot be opened for an unseen encounter.
  const forgedResult = handleApplyExpeditionEventDelta(pending, {
    ...base,
    resultIds: ['spare_parts_scavenged']
  })
  assert.strictEqual(forgedResult, pending)

  // A real result of a real option, but of an event the run is not resolving.
  const wrongEvent = {
    ...pending,
    activeEvent: { id: 'expedition_authority_patrol' }
  }
  assert.strictEqual(
    handleApplyExpeditionEventDelta(wrongEvent, {
      ...base,
      resultIds: [pushTheRig.effect.result]
    }),
    wrongEvent
  )

  // An option that does not exist on the resolving event.
  assert.strictEqual(
    handleApplyExpeditionEventDelta(pending, {
      ...base,
      sourceOptionId: 'opt_invented',
      resultIds: [pushTheRig.effect.result]
    }),
    pending
  )

  // With no event resolving at all.
  const noEvent = { ...pending, activeEvent: null }
  assert.strictEqual(
    handleApplyExpeditionEventDelta(noEvent, {
      ...base,
      resultIds: [pushTheRig.effect.result]
    }),
    noEvent
  )

  // The canonical resolution applies the consequence exactly once and consumes
  // the pick, so a replay finds nothing pending to resolve.
  const resolved = handleApplyExpeditionEventDelta(pending, {
    ...base,
    resultIds: [pushTheRig.effect.result]
  })
  assert.equal(resolved.expedition.pressure.pendingDirectorEventId, null)
  assert.equal(
    resolved.expedition.pressure.lastSevereEventId,
    'expedition_technical_collapse'
  )
  assert.equal(
    handleApplyExpeditionEventDelta(resolved, {
      ...base,
      resultIds: [pushTheRig.effect.result]
    }).expedition.pressure.lastSevereEventId,
    'expedition_technical_collapse'
  )
})

test("the Director's pick expires with the step it was drawn for", () => {
  const prepared = preparedState()
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: prepared.expedition.prep.prepId,
      expectedRunSeed: prepared.runSeed,
      loadout: fixtureLoadout()
    }
  })
  const from = started.expedition.visitedNodeIds.at(-1)
  const edge = fixtureMap().connections.find(item => item.from === from)
  assert.ok(edge)

  const pending = {
    ...started,
    expedition: {
      ...started.expedition,
      pressure: {
        ...started.expedition.pressure,
        pendingDirectorEventId: 'expedition_underground_invite'
      }
    }
  }
  const advanced = applyExpeditionRouteAdvance(pending, edge.to)
  assert.equal(advanced.expedition.routeStep, pending.expedition.routeStep + 1)
  // The stale pick did not follow the run: it was either replaced by this
  // step's own draw or cleared, never carried forward as the old step's
  // decision.
  assert.notEqual(
    advanced.expedition.pressure.pendingDirectorEventId,
    'expedition_underground_invite'
  )
  // And no consequence of it leaked across the move.
  assert.equal(advanced.expedition.pressure.severeReliefUntilRouteStep, null)
  assert.equal(advanced.expedition.pressure.temporaryRouteOpportunity, null)

  // A stale id from an earlier step can no longer claim its consequence.
  assert.strictEqual(
    applyExpeditionPressureEventResolution(
      advanced,
      'expedition_underground_invite'
    ),
    advanced.expedition.pressure
  )
})

test('the Expedition quest families are registered against real events', () => {
  const families = [
    ['quest_expedition_run_goal', 'expedition.nodeResolved'],
    ['quest_expedition_nemesis', 'expedition.rivalOutcome'],
    ['quest_expedition_meta_unlock', 'expedition.finaleCompleted']
  ]
  for (const [questId, eventType] of families) {
    const quest = QUEST_REGISTRY[questId]
    assert.ok(quest, `${questId} must be in the production registry`)
    assert.ok(
      quest.progressRules.some(rule => rule.event === eventType),
      `${questId} must progress on ${eventType}`
    )
    assert.ok(quest.required > 0)
    assert.ok(quest.rewards.length > 0)
  }
})
