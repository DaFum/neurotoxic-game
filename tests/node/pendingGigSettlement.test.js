import test from 'node:test'
import assert from 'node:assert/strict'
import { handleLoadGame } from '../../src/context/reducers/systemReducer'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { createInitialState } from '../../src/context/initialState'
import { GAME_PHASES } from '../../src/context/gameConstants'
import {
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
      payload: record
    })
    assert.deepEqual(next.pendingGigSettlement, record)
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
    dealFameMultiplier: 1
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
