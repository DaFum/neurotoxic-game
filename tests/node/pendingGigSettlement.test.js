import test from 'node:test'
import assert from 'node:assert/strict'
import { handleLoadGame } from '../../src/context/reducers/systemReducer'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { createInitialState } from '../../src/context/initialState'
import { GAME_PHASES } from '../../src/context/gameConstants'
import {
  advanceDay,
  createRecordPendingGigSettlementAction,
  createUpdatePlayerAction
} from '../../src/context/actionCreators'
import { calculateContinueStats } from '../../src/utils/postGig/performanceLogic'
import {
  BALANCE_CONSTANTS,
  calculateFameGain,
  calculateFameLevel,
  clampPlayerFame,
  clampPlayerMoney,
  finiteNumberOr
} from '../../src/utils/gameState'
import { createPersistedState } from '../../src/context/usePersistence'
import { startedState, walkToFinale } from '../expeditionLifecycleFixture.js'
import { capExpeditionSpendAtCashFloor } from '../../src/domain/expedition/loadout'

// A save written by the post-gig record save, before Continue settled it.
const buildPostGigSnapshot = (settlement = {}) => {
  const base = createInitialState()
  return {
    currentScene: GAME_PHASES.POST_GIG,
    player: {
      ...base.player,
      money: 500,
      fame: 100,
      currentNodeId: 'node_gig',
      lastGigNodeId: 'node_gig'
    },
    band: {
      ...base.band,
      inventory: { ...base.band.inventory, shirts: 10 }
    },
    gameMap: {
      nodes: {
        node_gig: { id: 'node_gig', type: 'GIG', x: 0, y: 0 }
      },
      connections: []
    },
    currentGig: { id: 'gig_venue', name: 'Gig Venue' },
    lastGigStats: { score: 9000, misses: 0, accuracy: 90, failed: false },
    pendingGigSettlement: {
      id: 'settlement-1',
      gigId: 'gig_venue',
      net: 300,
      perfScore: 80,
      misses: 0,
      dealFameMultiplier: 1,
      soldMerch: { shirts: 4 },
      ...settlement
    }
  }
}

test('pending gig settlement reconciliation on load', async t => {
  await t.test(
    'applies a positive net exactly once and lands on OVERWORLD',
    () => {
      const loaded = handleLoadGame(
        createInitialState(),
        buildPostGigSnapshot()
      )

      assert.equal(loaded.player.money, 800)
      assert.ok(loaded.player.fame > 100, 'fame gain from the gig is applied')
      assert.equal(loaded.band.inventory.shirts, 6)
      assert.equal(loaded.pendingGigSettlement, null)
      assert.equal(loaded.currentScene, GAME_PHASES.OVERWORLD)
      // The node stays played: the settlement does not reopen the gig.
      assert.equal(loaded.player.lastGigNodeId, 'node_gig')
    }
  )

  await t.test('applies a negative net', () => {
    const loaded = handleLoadGame(
      createInitialState(),
      buildPostGigSnapshot({ net: -200, perfScore: 10, misses: 0 })
    )

    assert.equal(loaded.player.money, 300)
    assert.ok(loaded.player.fame < 100, 'a bad gig costs fame')
    assert.equal(loaded.pendingGigSettlement, null)
    assert.equal(loaded.currentScene, GAME_PHASES.OVERWORLD)
  })

  await t.test('a negative net that bankrupts the band ends the game', () => {
    const loaded = handleLoadGame(
      createInitialState(),
      buildPostGigSnapshot({ net: -700 })
    )

    assert.equal(loaded.player.money, 0)
    assert.equal(loaded.currentScene, GAME_PHASES.GAMEOVER)
    assert.deepEqual(loaded.terminalOutcome, { reason: 'bankruptcy' })

    // The ending is durable: reloading the saved ending stays on GAMEOVER.
    const reloaded = handleLoadGame(
      createInitialState(),
      JSON.parse(JSON.stringify({ terminalOutcome: loaded.terminalOutcome }))
    )
    assert.equal(reloaded.currentScene, GAME_PHASES.GAMEOVER)
  })

  await t.test('completes a successful Career Finale', () => {
    const snapshot = buildPostGigSnapshot()
    snapshot.gameMap.nodes.node_gig.type = 'FINALE'
    const loaded = handleLoadGame(createInitialState(), snapshot)

    assert.equal(loaded.player.money, 800)
    assert.equal(loaded.player.stats.tourCompleted, true)
    assert.equal(loaded.currentScene, GAME_PHASES.GAMEOVER)
    assert.deepEqual(loaded.terminalOutcome, { reason: 'career_victory' })
  })

  await t.test('a failed Finale settles money but completes nothing', () => {
    const snapshot = buildPostGigSnapshot()
    snapshot.gameMap.nodes.node_gig.type = 'FINALE'
    snapshot.lastGigStats.failed = true
    const loaded = handleLoadGame(createInitialState(), snapshot)

    assert.equal(loaded.player.money, 800)
    assert.notEqual(loaded.player.stats.tourCompleted, true)
    assert.equal(loaded.currentScene, GAME_PHASES.OVERWORLD)
    assert.equal(loaded.terminalOutcome, null)
  })

  await t.test('does not settle twice', () => {
    const once = handleLoadGame(createInitialState(), buildPostGigSnapshot())
    // Saving the reconciled state and loading it again changes nothing.
    const twice = handleLoadGame(createInitialState(), {
      ...once,
      currentScene: GAME_PHASES.OVERWORLD
    })
    assert.equal(twice.player.money, 800)
    assert.equal(twice.band.inventory.shirts, 6)
    assert.equal(twice.pendingGigSettlement, null)
  })

  await t.test(
    'ignores a record for a different gig or malformed values',
    () => {
      for (const settlement of [
        { gigId: 'other_venue' },
        { net: Number.NaN },
        { net: '300' },
        { id: '' }
      ]) {
        const loaded = handleLoadGame(
          createInitialState(),
          buildPostGigSnapshot(settlement)
        )
        assert.equal(loaded.player.money, 500)
        assert.equal(loaded.band.inventory.shirts, 10)
        assert.equal(loaded.pendingGigSettlement, null)
      }
    }
  )

  await t.test(
    'pre-post recovery: energy_drink_cx deal decrement, sponsor expiry, and history update',
    () => {
      const base = createInitialState()
      const snapshot = {
        currentScene: GAME_PHASES.POST_GIG,
        player: {
          ...base.player,
          money: 500,
          fame: 100,
          day: 1,
          location: 'venues:berlin_so36.name',
          currentNodeId: 'node_gig',
          lastGigNodeId: 'node_gig'
        },
        band: { ...base.band },
        social: {
          ...base.social,
          activeDeals: [
            {
              id: 'energy_drink_cx',
              remainingGigs: 1,
              type: 'SPONSOR',
              offer: {}
            }
          ],
          regionalGigHistory: {}
        },
        gameMap: {
          nodes: { node_gig: { id: 'node_gig', type: 'GIG', x: 0, y: 0 } },
          connections: []
        },
        currentGig: { id: 'berlin_so36', name: 'SO36' },
        lastGigStats: { score: 9000, misses: 0, accuracy: 90, failed: false },
        pendingGigSettlement: {
          id: 'settlement-cx',
          gigId: 'berlin_so36',
          net: 300,
          perfScore: 80,
          misses: 0,
          dealFameMultiplier: 1,
          soldMerch: {},
          socialReconciled: false
        }
      }

      const loaded = handleLoadGame(createInitialState(), snapshot)

      assert.equal(loaded.player.money, 800)
      assert.equal(loaded.pendingGigSettlement, null)
      assert.equal(
        loaded.social.activeDeals.length,
        0,
        'expired sponsor removed'
      )
      assert.equal(loaded.social.lastGigDay, 1)
      assert.deepEqual(loaded.social.regionalGigHistory, { berlin: [1] })
    }
  )

  await t.test(
    'pre-post recovery: community_radio deal decrements loyalty from 10 to 13',
    () => {
      const base = createInitialState()
      const snapshot = {
        currentScene: GAME_PHASES.POST_GIG,
        player: {
          ...base.player,
          money: 500,
          day: 1,
          location: 'venues:berlin_so36.name'
        },
        band: { ...base.band },
        social: {
          ...base.social,
          loyalty: 10,
          activeDeals: [
            {
              id: 'community_radio',
              remainingGigs: 1,
              type: 'SPONSOR',
              offer: {}
            }
          ],
          regionalGigHistory: {}
        },
        currentGig: { id: 'berlin_so36', name: 'SO36' },
        lastGigStats: { score: 9000, misses: 0, accuracy: 90, failed: false },
        pendingGigSettlement: {
          id: 'settlement-radio',
          gigId: 'berlin_so36',
          net: 300,
          perfScore: 80,
          misses: 0,
          dealFameMultiplier: 1,
          soldMerch: {},
          socialReconciled: false
        }
      }

      const loaded = handleLoadGame(createInitialState(), snapshot)
      assert.equal(
        loaded.social.loyalty,
        13,
        'loyalty increased by per-gig bonus'
      )
    }
  )

  await t.test('post-post persistence round-trip with composite action', () => {
    const base = createInitialState()
    const rawPostState = {
      ...base,
      currentScene: GAME_PHASES.POST_GIG,
      player: {
        ...base.player,
        money: 500,
        day: 1,
        location: 'venues:berlin_so36.name'
      },
      social: {
        ...base.social,
        loyalty: 10,
        activeDeals: [
          {
            id: 'energy_drink_cx',
            remainingGigs: 1,
            type: 'SPONSOR',
            offer: {}
          }
        ],
        regionalGigHistory: {}
      },
      currentGig: { id: 'berlin_so36', name: 'SO36' },
      lastGigStats: { score: 9000, misses: 0, accuracy: 90, failed: false }
    }

    // 1. Record pending settlement
    const recordAction = createRecordPendingGigSettlementAction(
      {
        gigId: 'berlin_so36',
        net: 300,
        perfScore: 80,
        misses: 0,
        dealFameMultiplier: 1,
        soldMerch: {}
      },
      'settlement-composite-1'
    )
    assert.ok(recordAction)
    let state = gameReducer(rawPostState, recordAction)
    assert.equal(state.pendingGigSettlement?.socialReconciled, false)

    // 2. Apply composite action
    const compositeAction = {
      type: ActionTypes.APPLY_GIG_SOCIAL_RECONCILIATION,
      payload: {
        socialUpdate: {
          instagram: 1050,
          loyalty: 15,
          activeDeals: [],
          lastGigDay: 1
        },
        settlementId: 'settlement-composite-1'
      }
    }
    state = gameReducer(state, compositeAction)
    assert.equal(state.pendingGigSettlement?.socialReconciled, true)
    assert.equal(state.social.loyalty, 15)

    // 3. JSON round-trip createPersistedState and load
    const persisted = JSON.parse(JSON.stringify(createPersistedState(state)))
    const loaded = handleLoadGame(createInitialState(), persisted)

    assert.equal(loaded.player.money, 800, 'payout settled')
    assert.equal(
      loaded.social.loyalty,
      15,
      'loyalty unchanged from post-post social update'
    )
    assert.equal(loaded.social.activeDeals.length, 0)
    assert.equal(loaded.social.lastGigDay, 1)

    // 4. Replaying the action for an already reconciled settlement is a no-op
    const replayed = gameReducer(state, {
      type: ActionTypes.APPLY_GIG_SOCIAL_RECONCILIATION,
      payload: {
        socialUpdate: { loyalty: 99 },
        settlementId: 'settlement-composite-1'
      }
    })
    assert.strictEqual(replayed, state)

    // 5. An id that no longer names the pending record is a no-op
    const cleared = { ...state, pendingGigSettlement: null }
    const stale = gameReducer(cleared, {
      type: ActionTypes.APPLY_GIG_SOCIAL_RECONCILIATION,
      payload: {
        socialUpdate: { loyalty: 99 },
        settlementId: 'settlement-composite-1'
      }
    })
    assert.strictEqual(stale, cleared)
  })

  await t.test(
    'replay of already socialReconciled settlement on load does not double-count',
    () => {
      const base = createInitialState()
      const snapshot = {
        currentScene: GAME_PHASES.POST_GIG,
        player: { ...base.player, money: 500 },
        band: { ...base.band },
        social: {
          ...base.social,
          loyalty: 15,
          lastGigDay: 1,
          activeDeals: []
        },
        currentGig: { id: 'berlin_so36', name: 'SO36' },
        lastGigStats: { score: 9000, misses: 0, accuracy: 90, failed: false },
        pendingGigSettlement: {
          id: 'settlement-reconciled',
          gigId: 'berlin_so36',
          net: 300,
          perfScore: 80,
          misses: 0,
          dealFameMultiplier: 1,
          soldMerch: {},
          socialReconciled: true
        }
      }

      const loaded = handleLoadGame(createInitialState(), snapshot)
      assert.equal(loaded.player.money, 800)
      assert.equal(loaded.social.loyalty, 15)
      assert.equal(loaded.social.lastGigDay, 1)
    }
  )

  await t.test(
    'legacy record without the marker is not reconciled again once the gig day is stamped',
    () => {
      const base = createInitialState()
      const dealFor = {
        id: 'energy_drink_cx',
        remainingGigs: 3,
        type: 'SPONSOR',
        offer: {}
      }
      const makeSnapshot = lastGigDay => ({
        currentScene: GAME_PHASES.POST_GIG,
        player: { ...base.player, money: 500, day: 1 },
        band: { ...base.band },
        social: {
          ...base.social,
          lastGigDay,
          activeDeals: [dealFor],
          regionalGigHistory: {}
        },
        currentGig: { id: 'berlin_so36', name: 'SO36' },
        lastGigStats: { score: 9000, misses: 0, accuracy: 90, failed: false },
        pendingGigSettlement: {
          id: 'settlement-legacy',
          gigId: 'berlin_so36',
          net: 300,
          perfScore: 80,
          misses: 0,
          dealFameMultiplier: 1,
          soldMerch: {}
        }
      })

      const already = handleLoadGame(createInitialState(), makeSnapshot(1))
      assert.equal(
        already.social.activeDeals[0]?.remainingGigs,
        3,
        'no second decrement'
      )

      const missing = handleLoadGame(createInitialState(), makeSnapshot(0))
      assert.equal(
        missing.social.activeDeals[0]?.remainingGigs,
        2,
        'reconciled once'
      )
    }
  )

  // The legacy skip above is safe because a second paid gig on the same day is
  // unreachable: arrival runs `advanceDay` before `START_GIG`, and
  // `SET_LAST_GIG_STATS` stamps `lastGigNodeId` so the node cannot be replayed.
  // This pins the part the heuristic reads: after the arrival tick the day is
  // past the previous gig's stamp, so the next gig's legacy record reconciles.
  await t.test(
    'legacy record for a gig reached by travel reconciles after the arrival tick',
    () => {
      const base = createInitialState()
      let previous = {
        ...base,
        player: { ...base.player, money: 5000, day: 1 },
        social: { ...base.social, lastGigDay: 1 }
      }
      previous = gameReducer(previous, advanceDay(previous))
      assert.equal(previous.player.day, 2)
      assert.equal(previous.social.lastGigDay, 1)

      const loaded = handleLoadGame(createInitialState(), {
        currentScene: GAME_PHASES.POST_GIG,
        player: { ...previous.player, money: 500 },
        band: { ...previous.band },
        social: {
          ...previous.social,
          activeDeals: [
            {
              id: 'energy_drink_cx',
              remainingGigs: 3,
              type: 'SPONSOR',
              offer: {}
            }
          ],
          regionalGigHistory: {}
        },
        currentGig: { id: 'berlin_so36', name: 'SO36' },
        lastGigStats: { score: 9000, misses: 0, accuracy: 90, failed: false },
        pendingGigSettlement: {
          id: 'settlement-b',
          gigId: 'berlin_so36',
          net: 300,
          perfScore: 80,
          misses: 0,
          dealFameMultiplier: 1,
          soldMerch: {}
        }
      })
      assert.equal(loaded.social.activeDeals[0]?.remainingGigs, 2)
    }
  )

  await t.test(
    'a record carrying an unusable marker is reconciled, not read as legacy',
    () => {
      const base = createInitialState()
      const loaded = handleLoadGame(createInitialState(), {
        currentScene: GAME_PHASES.POST_GIG,
        player: { ...base.player, money: 500, day: 1 },
        band: { ...base.band },
        social: {
          ...base.social,
          lastGigDay: 1,
          activeDeals: [
            {
              id: 'energy_drink_cx',
              remainingGigs: 3,
              type: 'SPONSOR',
              offer: {}
            }
          ],
          regionalGigHistory: {}
        },
        currentGig: { id: 'berlin_so36', name: 'SO36' },
        lastGigStats: { score: 9000, misses: 0, accuracy: 90, failed: false },
        pendingGigSettlement: {
          id: 'settlement-null-marker',
          gigId: 'berlin_so36',
          net: 300,
          perfScore: 80,
          misses: 0,
          dealFameMultiplier: 1,
          soldMerch: {},
          socialReconciled: null
        }
      })
      // The lastGigDay heuristic only covers records with no marker field.
      assert.equal(loaded.social.activeDeals[0]?.remainingGigs, 2)
    }
  )

  await t.test(
    'two sequential settlements on the same day and region both reconcile',
    () => {
      const base = createInitialState()
      let state = {
        ...base,
        currentScene: GAME_PHASES.POST_GIG,
        player: {
          ...base.player,
          money: 500,
          day: 1,
          location: 'venues:berlin_so36.name'
        },
        social: {
          ...base.social,
          activeDeals: [
            {
              id: 'energy_drink_cx',
              remainingGigs: 2,
              type: 'SPONSOR',
              offer: {}
            }
          ],
          regionalGigHistory: {}
        },
        currentGig: { id: 'berlin_so36', name: 'SO36' },
        lastGigStats: { score: 9000, misses: 0, accuracy: 90, failed: false }
      }

      // Gig 1
      const rec1 = createRecordPendingGigSettlementAction(
        {
          gigId: 'berlin_so36',
          net: 300,
          perfScore: 80,
          misses: 0,
          dealFameMultiplier: 1,
          soldMerch: {}
        },
        'set-1'
      )
      state = gameReducer(state, rec1)
      state = handleLoadGame(createInitialState(), createPersistedState(state))
      assert.equal(state.social.activeDeals[0]?.remainingGigs, 1)

      // Gig 2 (same day, same region)
      state = {
        ...state,
        currentScene: GAME_PHASES.POST_GIG,
        currentGig: { id: 'berlin_so36', name: 'SO36' },
        lastGigStats: { score: 9000, misses: 0, accuracy: 90, failed: false }
      }
      const rec2 = createRecordPendingGigSettlementAction(
        {
          gigId: 'berlin_so36',
          net: 300,
          perfScore: 80,
          misses: 0,
          dealFameMultiplier: 1,
          soldMerch: {}
        },
        'set-2'
      )
      state = gameReducer(state, rec2)
      state = handleLoadGame(createInitialState(), createPersistedState(state))

      assert.equal(
        state.social.activeDeals.length,
        0,
        'deal decremented second time and expired'
      )
    }
  )

  await t.test(
    'missing and non-boolean status values sanitize to false',
    () => {
      for (const val of [undefined, null, 'true', 1, false]) {
        const snapshot = buildPostGigSnapshot({ socialReconciled: val })
        const sanitized = createRecordPendingGigSettlementAction(
          snapshot.pendingGigSettlement,
          'test-id'
        )
        assert.equal(sanitized?.payload?.socialReconciled, false)
      }
      const trueSnapshot = buildPostGigSnapshot({ socialReconciled: true })
      const trueSanitized = createRecordPendingGigSettlementAction(
        trueSnapshot.pendingGigSettlement,
        'test-id'
      )
      assert.equal(
        trueSanitized?.payload?.socialReconciled,
        false,
        'creator always initializes to false'
      )
    }
  )

  await t.test('mismatched composite action settlement ID is a no-op', () => {
    const base = createInitialState()
    const state = {
      ...base,
      currentScene: GAME_PHASES.POST_GIG,
      currentGig: { id: 'berlin_so36', name: 'SO36' },
      pendingGigSettlement: {
        id: 'settlement-actual',
        gigId: 'berlin_so36',
        net: 300,
        perfScore: 80,
        misses: 0,
        dealFameMultiplier: 1,
        soldMerch: {},
        socialReconciled: false
      }
    }

    const action = {
      type: ActionTypes.APPLY_GIG_SOCIAL_RECONCILIATION,
      payload: {
        socialUpdate: { instagram: 500 },
        settlementId: 'settlement-other'
      }
    }
    const next = gameReducer(state, action)
    assert.strictEqual(
      next,
      state,
      'an id that names no pending record is a no-op'
    )
    assert.equal(next.pendingGigSettlement?.socialReconciled, false)
  })
})

test('pending gig settlement actions', async t => {
  const postGigState = () => ({
    ...createInitialState(),
    currentScene: GAME_PHASES.POST_GIG,
    currentGig: { id: 'gig_venue', name: 'Gig Venue' },
    lastGigStats: { score: 9000, misses: 0, accuracy: 90, failed: false }
  })
  const record = {
    id: 'settlement-1',
    gigId: 'gig_venue',
    net: 300,
    perfScore: 80,
    misses: 0,
    dealFameMultiplier: 1,
    soldMerch: { shirts: 4 }
  }

  await t.test('records a well-formed settlement for the current gig', () => {
    const next = gameReducer(postGigState(), {
      type: ActionTypes.RECORD_PENDING_GIG_SETTLEMENT,
      payload: { ...record, socialReconciled: false }
    })
    assert.deepEqual(next.pendingGigSettlement, {
      ...record,
      socialReconciled: false
    })
  })

  await t.test(
    'rejects a record for another gig or with hostile values',
    () => {
      const state = postGigState()
      for (const payload of [
        { ...record, gigId: 'other_venue' },
        { ...record, net: Number.POSITIVE_INFINITY },
        { ...record, soldMerch: JSON.parse('{"__proto__": {"x": 1}}') },
        null
      ]) {
        const next = gameReducer(state, {
          type: ActionTypes.RECORD_PENDING_GIG_SETTLEMENT,
          payload
        })
        assert.equal(next, state)
      }
    }
  )

  await t.test('Continue clears only the matching record', () => {
    const recorded = { ...postGigState(), pendingGigSettlement: record }
    const stale = gameReducer(recorded, {
      type: ActionTypes.CLEAR_PENDING_GIG_SETTLEMENT,
      payload: { id: 'other' }
    })
    assert.equal(stale, recorded)
    const cleared = gameReducer(recorded, {
      type: ActionTypes.CLEAR_PENDING_GIG_SETTLEMENT,
      payload: { id: 'settlement-1' }
    })
    assert.equal(cleared.pendingGigSettlement, null)
    // A save taken after Continue loads without settling again.
    const loaded = handleLoadGame(createInitialState(), {
      ...cleared,
      player: { ...cleared.player, money: 800 }
    })
    assert.equal(loaded.player.money, 800)
  })
})

test('a Finale settlement leaving balance at protected Career Cash with insolvency gates Finale completion on load', () => {
  const walked = walkToFinale(
    startedState(
      { money: 400, fame: 100 },
      { build: { protectedCareerCash: 400 } }
    )
  )
  const routeStep = walked.expedition.routeStep
  const atResult = {
    ...walked,
    currentScene: GAME_PHASES.POST_GIG,
    player: { ...walked.player, money: 400 },
    currentGig: { id: 'finale_venue', name: 'Finale Venue' },
    lastGigStats: { score: 9000, misses: 0, accuracy: 90, failed: false },
    expedition: {
      ...walked.expedition,
      protectedCareerCash: 400,
      lastGigResolvedAtRouteStep: routeStep
    }
  }
  const action = createRecordPendingGigSettlementAction({
    gigId: 'finale_venue',
    net: -100,
    perfScore: 80,
    misses: 0,
    dealFameMultiplier: 1,
    soldMerch: {}
  })
  assert.ok(action)
  const recorded = gameReducer(atResult, action)
  assert.ok(recorded.pendingGigSettlement, 'the record is accepted')

  const loaded = handleLoadGame(
    createInitialState(),
    JSON.parse(JSON.stringify(createPersistedState(recorded)))
  )

  assert.equal(loaded.player.money, 400)
  assert.equal(loaded.expedition.status, 'active')
  assert.notEqual(loaded.expedition.status, 'completed')
  assert.ok(loaded.expedition.pendingFailure)
  assert.equal(loaded.expedition.pendingFailure.reason, 'bankruptcy')
  assert.equal(loaded.pendingGigSettlement, null)
})

test('a reload on an Expedition Finale result completes the run', async t => {
  // The real save path: the post-gig screen records the settlement, the
  // record-then-save writes the whitelisted slice, and the load settles it.
  const finaleSave = () => {
    const walked = walkToFinale(startedState({ money: 5000, fame: 100 }))
    const routeStep = walked.expedition.routeStep
    const atResult = {
      ...walked,
      currentScene: GAME_PHASES.POST_GIG,
      currentGig: { id: 'finale_venue', name: 'Finale Venue' },
      lastGigStats: { score: 9000, misses: 0, accuracy: 90, failed: false },
      expedition: {
        ...walked.expedition,
        lastGigResolvedAtRouteStep: routeStep
      }
    }
    const action = createRecordPendingGigSettlementAction({
      gigId: 'finale_venue',
      net: 300,
      perfScore: 80,
      misses: 0,
      dealFameMultiplier: 1,
      soldMerch: {}
    })
    assert.ok(action)
    const recorded = gameReducer(atResult, action)
    assert.ok(recorded.pendingGigSettlement, 'the record is accepted')
    return {
      routeStep,
      save: JSON.parse(JSON.stringify(createPersistedState(recorded)))
    }
  }

  await t.test('completes the run with the gig as Finale proof', () => {
    const { save } = finaleSave()
    const loaded = handleLoadGame(createInitialState(), save)

    assert.equal(loaded.expedition.status, 'completed')
    assert.equal(loaded.expedition.outcome?.finaleResultId, 'gig:finale_venue')
    assert.equal(loaded.pendingGigSettlement, null)
    assert.notEqual(loaded.currentScene, GAME_PHASES.POST_GIG)
  })

  await t.test('records the gig and finale Contract signals first', () => {
    const { save, routeStep } = finaleSave()
    const loaded = handleLoadGame(createInitialState(), save)
    const signals = loaded.expedition.resolvedObligationSignalIds

    assert.ok(
      signals.some(id => id.startsWith(`gig:finale_venue:${routeStep}:`)),
      `gig signal missing from ${JSON.stringify(signals)}`
    )
    assert.ok(signals.includes(`finale:finale_venue:${routeStep}`))
  })
})

test('load settles an active run under the protected Career Cash floor like Continue', () => {
  const started = startedState(
    { money: 5000, fame: 100 },
    { build: { protectedCareerCash: 4000 } }
  )
  const atResult = {
    ...started,
    currentScene: GAME_PHASES.POST_GIG,
    player: { ...started.player, money: 5000, fame: 100 },
    currentGig: { id: 'floor_venue', name: 'Floor Venue' },
    lastGigStats: { score: 1000, misses: 0, accuracy: 40, failed: false }
  }
  const settlement = {
    gigId: 'floor_venue',
    net: -2000,
    perfScore: 10,
    misses: 0,
    dealFameMultiplier: 1,
    soldMerch: {}
  }
  const action = createRecordPendingGigSettlementAction(settlement)
  assert.ok(action)
  const recorded = gameReducer(atResult, action)
  assert.equal(recorded.expedition.protectedCareerCash, 4000)
  assert.ok(recorded.pendingGigSettlement, 'the record is accepted')

  // Continue: the ledger UPDATE_PLAYER `useContinueHandler` dispatches.
  const stats = calculateContinueStats({
    player: recorded.player,
    perfScore: settlement.perfScore,
    financials: { net: settlement.net },
    misses: settlement.misses,
    bandStyle: finiteNumberOr(recorded.band.style, 0),
    dealFameMultiplier: settlement.dealFameMultiplier,
    calculateFameGain,
    calculateFameLevel,
    clampPlayerFame,
    clampPlayerMoney,
    BALANCE_CONSTANTS
  })
  const continued = gameReducer(
    recorded,
    createUpdatePlayerAction({
      // `useContinueHandler` caps the Cash at the floor; fame still lands.
      money: capExpeditionSpendAtCashFloor(
        recorded.expedition,
        recorded.player.money,
        stats.newMoney
      ),
      fame: stats.newFame,
      fameLevel: stats.fameLevel
    })
  )

  const loaded = handleLoadGame(
    createInitialState(),
    JSON.parse(JSON.stringify(createPersistedState(recorded)))
  )

  assert.equal(loaded.expedition.status, 'active')
  assert.equal(loaded.player.money, continued.player.money)
  assert.equal(loaded.player.fame, continued.player.fame)
  assert.equal(loaded.player.fameLevel, continued.player.fameLevel)
  // Only the Cash is refused; the fame the gig earned still lands.
  assert.equal(loaded.player.money, 5000)
  assert.notEqual(stats.newFame, 100, 'the fixture must move fame')
  assert.equal(loaded.player.fame, stats.newFame)
  assert.equal(loaded.pendingGigSettlement, null)
})

test('a tampered record is bounded to what the post-gig screen produces', () => {
  const baseline = handleLoadGame(createInitialState(), buildPostGigSnapshot())
  const tampered = handleLoadGame(
    createInitialState(),
    buildPostGigSnapshot({
      perfScore: 1e308,
      dealFameMultiplier: 1e308,
      misses: 1e308,
      net: 1e308
    })
  )

  assert.ok(
    tampered.player.fame > baseline.player.fame,
    `fame must grow, not wipe: ${tampered.player.fame}`
  )
  assert.ok(Number.isFinite(tampered.player.money))
  assert.ok(tampered.player.money > baseline.player.money)

  const record = {
    id: 'settlement-1',
    gigId: 'gig_venue',
    net: -1e308,
    perfScore: -5,
    misses: -3,
    dealFameMultiplier: 0.5,
    soldMerch: {}
  }
  const action = createRecordPendingGigSettlementAction(record, record.id)
  assert.ok(action)
  assert.deepEqual(action.payload, {
    ...record,
    net: -Number.MAX_SAFE_INTEGER,
    perfScore: 30,
    misses: 0,
    dealFameMultiplier: 1,
    socialReconciled: false
  })
})

test('capExpeditionSpendAtCashFloor fails closed on a corrupt protected slice', () => {
  for (const corrupt of [Number.NaN, -100]) {
    const run = { status: 'active', protectedCareerCash: corrupt }
    assert.equal(capExpeditionSpendAtCashFloor(run, 5000, 4500), 5000)
    assert.equal(capExpeditionSpendAtCashFloor(run, 5000, 0), 5000)
    assert.equal(capExpeditionSpendAtCashFloor(run, 3000, 3500), 3500)
    assert.equal(capExpeditionSpendAtCashFloor(run, 0, 0), 0)
  }
})

test('capExpeditionSpendAtCashFloor refuses only a spend that crosses the floor', () => {
  const run = { status: 'active', protectedCareerCash: 4000 }
  assert.equal(capExpeditionSpendAtCashFloor(run, 5000, 3000), 5000)
  assert.equal(capExpeditionSpendAtCashFloor(run, 5000, 4500), 4500)
  assert.equal(capExpeditionSpendAtCashFloor(run, 3000, 3500), 3500)
  assert.equal(capExpeditionSpendAtCashFloor(run, 3000, 2000), 3000)
  assert.equal(
    capExpeditionSpendAtCashFloor({ ...run, status: 'idle' }, 5000, 3000),
    3000
  )
  assert.equal(capExpeditionSpendAtCashFloor(undefined, 5000, 3000), 3000)
})

test('active-run protected loss settlement on load maintains active run without pending failure', () => {
  const started = startedState(
    { money: 500, fame: 100, van: { fuel: 100, fuelMax: 100 } },
    { build: { protectedCareerCash: 400 } }
  )
  const atResult = {
    ...started,
    currentScene: GAME_PHASES.POST_GIG,
    player: {
      ...started.player,
      money: 500,
      fame: 100,
      van: { ...started.player.van, fuel: 100, fuelMax: 100 }
    },
    currentGig: { id: 'protected_venue', name: 'Protected Venue' },
    lastGigStats: { score: 1000, misses: 58, accuracy: 30, failed: false }
  }
  const action = createRecordPendingGigSettlementAction({
    gigId: 'protected_venue',
    net: -600,
    perfScore: 30,
    misses: 58,
    dealFameMultiplier: 1,
    soldMerch: {}
  })
  assert.ok(action)
  const recorded = gameReducer(atResult, action)
  assert.equal(recorded.expedition.protectedCareerCash, 400)
  assert.ok(recorded.pendingGigSettlement, 'the record is accepted')

  const saved = createPersistedState(recorded)
  const loaded = handleLoadGame(
    createInitialState(),
    JSON.parse(JSON.stringify(saved))
  )

  assert.equal(loaded.player.money, 500)
  assert.notEqual(loaded.currentScene, GAME_PHASES.GAMEOVER)
  assert.equal(loaded.terminalOutcome, null)
  assert.equal(loaded.expedition.status, 'active')
  assert.equal(loaded.expedition.pendingFailure, null)
  assert.ok(loaded.player.fame !== 100, 'fame is updated')
  assert.equal(loaded.pendingGigSettlement, null)

  const reloaded = handleLoadGame(
    createInitialState(),
    JSON.parse(JSON.stringify(createPersistedState(loaded)))
  )
  assert.equal(reloaded.player.money, 500)
  assert.equal(reloaded.expedition.status, 'active')
  assert.equal(reloaded.expedition.pendingFailure, null)
  assert.equal(reloaded.pendingGigSettlement, null)
})

test('a bankrupting settlement on load for an active run raises pendingFailure', () => {
  const started = startedState({ money: 100, fame: 100 })
  const atResult = {
    ...started,
    currentScene: GAME_PHASES.POST_GIG,
    currentGig: { id: 'bust_venue', name: 'Bust Venue' },
    lastGigStats: { score: 1000, misses: 0, accuracy: 40, failed: false }
  }
  const action = createRecordPendingGigSettlementAction({
    gigId: 'bust_venue',
    net: -100000,
    perfScore: 10,
    misses: 0,
    dealFameMultiplier: 1,
    soldMerch: {}
  })
  assert.ok(action)
  const recorded = gameReducer(atResult, action)
  assert.ok(recorded.pendingGigSettlement, 'the record is accepted')

  const loaded = handleLoadGame(
    createInitialState(),
    JSON.parse(JSON.stringify(createPersistedState(recorded)))
  )
  assert.equal(loaded.expedition.status, 'active')
  assert.notEqual(loaded.currentScene, GAME_PHASES.GAMEOVER)
  assert.equal(loaded.terminalOutcome, null)
  assert.ok(loaded.expedition.pendingFailure)
  assert.equal(loaded.expedition.pendingFailure.reason, 'bankruptcy')

  const acceptAction = {
    type: ActionTypes.ACCEPT_EXPEDITION_FAILURE,
    payload: {
      pendingFailureId: loaded.expedition.pendingFailure.id,
      expectedRouteStep: loaded.expedition.routeStep
    }
  }
  const failedRun = gameReducer(loaded, acceptAction)
  assert.equal(failedRun.expedition.status, 'failed')

  const gameOverRun = gameReducer(failedRun, {
    type: ActionTypes.SET_TERMINAL_OUTCOME,
    payload: { reason: 'bankruptcy' }
  })
  assert.equal(gameOverRun.currentScene, GAME_PHASES.GAMEOVER)
  assert.deepEqual(gameOverRun.terminalOutcome, { reason: 'bankruptcy' })
})

test('a save that records an ending settles a run it left active', () => {
  const started = startedState({ money: 1000, fame: 100 })
  const hostile = {
    ...started,
    currentScene: GAME_PHASES.OVERWORLD,
    terminalOutcome: { reason: 'event_game_over', eventId: 'deal_devil' }
  }
  const loaded = handleLoadGame(
    createInitialState(),
    JSON.parse(JSON.stringify(createPersistedState(hostile)))
  )
  assert.equal(loaded.currentScene, GAME_PHASES.GAMEOVER)
  assert.equal(loaded.expedition.status, 'failed')
  assert.equal(loaded.expedition.outcome?.reason, 'event_game_over')
})

test('a save written at GAMEOVER before endings were recorded still ends the Career', () => {
  const base = createInitialState()
  const save = tourCompleted => ({
    currentScene: GAME_PHASES.GAMEOVER,
    player: {
      ...base.player,
      stats: { ...base.player.stats, tourCompleted }
    }
  })

  const victory = handleLoadGame(createInitialState(), save(true))
  assert.equal(victory.currentScene, GAME_PHASES.GAMEOVER)
  assert.deepEqual(victory.terminalOutcome, { reason: 'career_victory' })
  assert.equal(victory.player.stats.tourCompleted, true)

  const bust = handleLoadGame(createInitialState(), save(false))
  assert.equal(bust.currentScene, GAME_PHASES.GAMEOVER)
  assert.deepEqual(bust.terminalOutcome, { reason: 'bankruptcy' })
})

test('a victory claimed over a live run is dropped on load', () => {
  const started = startedState({ money: 1000, fame: 100 })
  const forged = {
    ...started,
    currentScene: GAME_PHASES.OVERWORLD,
    terminalOutcome: { reason: 'career_victory' },
    player: {
      ...started.player,
      stats: { ...started.player.stats, tourCompleted: true }
    }
  }
  const loaded = handleLoadGame(
    createInitialState(),
    JSON.parse(JSON.stringify(createPersistedState(forged)))
  )
  assert.equal(loaded.terminalOutcome, null)
  assert.notEqual(loaded.currentScene, GAME_PHASES.GAMEOVER)
  assert.equal(loaded.expedition.status, 'active')
  assert.equal(loaded.player.stats.tourCompleted, false)
})

test('clearing stale tourCompleted on load when save has no ending', async t => {
  await t.test(
    'load an OVERWORLD save with tourCompleted: true and idle expedition clears flag and leaves save unmutated',
    () => {
      const inputSave = {
        currentScene: GAME_PHASES.OVERWORLD,
        player: {
          stats: { tourCompleted: true }
        },
        expedition: { status: 'idle' }
      }
      const inputCopy = JSON.parse(JSON.stringify(inputSave))
      const loaded = handleLoadGame(createInitialState(), inputSave)

      assert.equal(loaded.currentScene, GAME_PHASES.OVERWORLD)
      assert.equal(loaded.terminalOutcome, null)
      assert.equal(loaded.player.stats.tourCompleted, false)
      assert.deepEqual(inputSave, inputCopy, 'input save must not be mutated')
    }
  )

  await t.test(
    'subsequent defeat from post-gig transition after clearing flag yields bankruptcy not career_victory',
    () => {
      const loaded = handleLoadGame(createInitialState(), {
        currentScene: GAME_PHASES.OVERWORLD,
        player: {
          stats: { tourCompleted: true }
        },
        expedition: { status: 'idle' }
      })
      const postGigState = {
        ...loaded,
        currentScene: GAME_PHASES.POST_GIG
      }
      const gameOverState = gameReducer(postGigState, {
        type: ActionTypes.CHANGE_SCENE,
        payload: GAME_PHASES.GAMEOVER
      })
      assert.deepEqual(gameOverState.terminalOutcome, { reason: 'bankruptcy' })
      assert.notDeepEqual(gameOverState.terminalOutcome, {
        reason: 'career_victory'
      })
    }
  )

  await t.test(
    'load a save with an invalid terminalOutcome clears stale tourCompleted flag',
    () => {
      for (const invalidOutcome of [
        { reason: 'unknown_reason' },
        'not_a_record',
        12345
      ]) {
        const loaded = handleLoadGame(createInitialState(), {
          currentScene: GAME_PHASES.OVERWORLD,
          terminalOutcome: invalidOutcome,
          player: {
            stats: { tourCompleted: true }
          }
        })
        assert.equal(loaded.player.stats.tourCompleted, false)
        assert.equal(loaded.terminalOutcome, null)
      }
    }
  )
})
