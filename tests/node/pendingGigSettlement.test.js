import test from 'node:test'
import assert from 'node:assert/strict'
import { handleLoadGame } from '../../src/context/reducers/systemReducer'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { createInitialState } from '../../src/context/initialState'
import { GAME_PHASES } from '../../src/context/gameConstants'

// A save written by the GIG -> POST_GIG autosave, before Continue settled it.
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
  })

  await t.test('completes a successful Career Finale', () => {
    const snapshot = buildPostGigSnapshot()
    snapshot.gameMap.nodes.node_gig.type = 'FINALE'
    const loaded = handleLoadGame(createInitialState(), snapshot)

    assert.equal(loaded.player.money, 800)
    assert.equal(loaded.player.stats.tourCompleted, true)
    assert.equal(loaded.currentScene, GAME_PHASES.GAMEOVER)
  })

  await t.test('a failed Finale settles money but completes nothing', () => {
    const snapshot = buildPostGigSnapshot()
    snapshot.gameMap.nodes.node_gig.type = 'FINALE'
    snapshot.lastGigStats.failed = true
    const loaded = handleLoadGame(createInitialState(), snapshot)

    assert.equal(loaded.player.money, 800)
    assert.notEqual(loaded.player.stats.tourCompleted, true)
    assert.equal(loaded.currentScene, GAME_PHASES.OVERWORLD)
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
