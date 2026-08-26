/**
 * Table-driven golden-path day loop.
 *
 * A compact pure-state driver over the real reducer and real action creators:
 * no DOM, no hooks, no async, no Playwright. Each row asserts only the fields
 * that stage owns, so an economy regression cannot break the travel assertion
 * and vice versa.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { GAME_PHASES } from '../../src/context/gameConstants'
import { createChangeSceneAction } from '../../src/context/actionCreators'
import {
  applySequence,
  createDeterministicState
} from '../utils/applySequence.js'
import {
  buildArrivalStep,
  buildGigStartStep,
  buildMapNode,
  buildPostGigStep,
  buildTravelStep,
  withMapNode
} from '../utils/dayLoopSteps.js'
import { checkInvariants } from '../utils/checkInvariants.js'

const readPath = (state, path) =>
  path.split('.').reduce((node, key) => node?.[key], state)

/**
 * Builds the day-loop fixture table.
 *
 * Each row is `[stepName, buildActions, expectedStateDelta]`: `buildActions`
 * turns the state before the step into the actions the step dispatches, and
 * `expectedStateDelta` names only the fields that step owns, as either a
 * literal value or a `(before, after) => boolean` predicate.
 */
const buildDayLoopFixture = node => [
  {
    stepName: 'intro',
    buildActions: () => [createChangeSceneAction(GAME_PHASES.INTRO)],
    expectedStateDelta: { currentScene: GAME_PHASES.INTRO }
  },
  {
    stepName: 'menu',
    buildActions: () => [createChangeSceneAction(GAME_PHASES.MENU)],
    expectedStateDelta: { currentScene: GAME_PHASES.MENU }
  },
  {
    stepName: 'enter overworld',
    buildActions: () => [createChangeSceneAction(GAME_PHASES.OVERWORLD)],
    expectedStateDelta: {
      currentScene: GAME_PHASES.OVERWORLD
    }
  },
  {
    stepName: 'travel',
    buildActions: state => {
      const { actions, blocked } = buildTravelStep(state, node)
      assert.equal(blocked, null, 'travel must be affordable in this fixture')
      return actions
    },
    // Travel owns money, van fuel, location, and the day counter.
    expectedStateDelta: {
      'player.money': (before, after) => after < before,
      'player.van.fuel': (before, after) => after < before,
      'player.location': `venues:${node.venue.id}.name`,
      'player.currentNodeId': node.id,
      'player.day': (before, after) => after === before + 1
    }
  },
  {
    stepName: 'arrival',
    buildActions: state => buildArrivalStep(state),
    // Arrival owns band harmony only; a band without travel regen is a no-op.
    expectedStateDelta: {
      'band.harmony': (before, after) => after >= before
    }
  },
  {
    stepName: 'pre-gig',
    buildActions: () => [createChangeSceneAction(GAME_PHASES.PRE_GIG)],
    expectedStateDelta: { currentScene: GAME_PHASES.PRE_GIG }
  },
  {
    stepName: 'gig start',
    buildActions: () => buildGigStartStep(node.venue),
    // Gig start owns the scene, the current venue, and the setlist.
    expectedStateDelta: {
      currentScene: GAME_PHASES.GIG,
      'currentGig.capacity': node.venue.capacity,
      'currentGig.id': node.venue.id
    }
  },
  {
    stepName: 'post-gig continue',
    buildActions: state => buildPostGigStep(state).actions,
    // Economy owns money and fame; routing owns the terminal scene.
    expectedStateDelta: {
      'player.money': (before, after) => after > before,
      'player.fame': (before, after) => after > before,
      'lastGigStats.accuracy': (_before, after) =>
        typeof after === 'number' && after >= 0 && after <= 100,
      currentScene: GAME_PHASES.OVERWORLD
    }
  }
]

const runFixture = (t, state, fixture) => {
  for (const { stepName, buildActions, expectedStateDelta } of fixture) {
    const before = state
    state = applySequence(before, buildActions(before))

    for (const [path, expected] of Object.entries(expectedStateDelta)) {
      const actual = readPath(state, path)
      if (typeof expected === 'function') {
        assert.ok(
          expected(readPath(before, path), actual),
          `${stepName}: ${path} delta not satisfied (before=${JSON.stringify(readPath(before, path))}, after=${JSON.stringify(actual)})`
        )
      } else {
        assert.deepEqual(actual, expected, `${stepName}: ${path}`)
      }
    }

    assert.deepEqual(
      checkInvariants(state),
      [],
      `${stepName}: state invariants violated`
    )
    t.diagnostic(`${stepName}: ok`)
  }
  return state
}

test('Golden Path: pure day-loop driver runs a full cycle', async t => {
  const node = buildMapNode()
  const finalState = runFixture(
    t,
    withMapNode(createDeterministicState(), node),
    buildDayLoopFixture(node)
  )

  assert.equal(
    finalState.currentScene,
    GAME_PHASES.OVERWORLD,
    'the solvent path returns to OVERWORLD'
  )
})

test('Golden Path: an insolvent post-gig routes to GAMEOVER', () => {
  const node = buildMapNode({ venue: { capacity: 1, price: 0, pay: 0 } })
  let state = applySequence(withMapNode(createDeterministicState(), node), [
    createChangeSceneAction(GAME_PHASES.OVERWORLD)
  ])
  state = applySequence(state, buildTravelStep(state, node).actions)
  state = applySequence(state, buildArrivalStep(state))
  state = applySequence(state, buildGigStartStep(node.venue))

  // Strand the player with no cash while daily obligations still stand, so the
  // bankruptcy branch is the one the post-gig step computes.
  state = { ...state, player: { ...state.player, money: 0 } }
  const postGig = buildPostGigStep(state, {
    score: 0,
    perfectHits: 0,
    misses: 40
  })

  assert.equal(postGig.bankrupt, true, 'fixture must reach the bankrupt branch')

  const finalState = applySequence(state, postGig.actions)
  assert.equal(finalState.currentScene, GAME_PHASES.GAMEOVER)
  assert.deepEqual(checkInvariants(finalState), [])
})

test('Golden Path: the driver is deterministic across runs', () => {
  const node = buildMapNode()
  const runOnce = () => {
    let state = applySequence(withMapNode(createDeterministicState(), node), [
      createChangeSceneAction(GAME_PHASES.OVERWORLD)
    ])
    state = applySequence(state, buildTravelStep(state, node).actions)
    state = applySequence(state, buildArrivalStep(state))
    state = applySequence(state, buildGigStartStep(node.venue))
    return applySequence(state, buildPostGigStep(state).actions)
  }

  const a = runOnce()
  const b = runOnce()

  assert.equal(a.player.money, b.player.money)
  assert.equal(a.player.fame, b.player.fame)
  assert.equal(a.player.day, b.player.day)
  assert.equal(a.currentScene, b.currentScene)
})

test('Golden Path: multiple day loops keep resource bounds', () => {
  let state = applySequence(createDeterministicState(), [
    createChangeSceneAction(GAME_PHASES.OVERWORLD)
  ])

  for (let day = 0; day < 5; day++) {
    // Spread the destinations out. `calculateDistance` reads `node.x/y` — a
    // `venue.dist` override is inert — and once `withMapNode` has seeded the
    // previous stop, the origin resolves for real. Co-located nodes would make
    // every trip after the first a ~20km hop and drain the fuel pressure this
    // test exists to apply.
    const node = buildMapNode({
      id: `node_${day + 1}_0`,
      x: 20 + day * 15,
      y: 15 + day * 12,
      venue: { id: `venue_${day}`, name: `Venue ${day}` }
    })

    state = withMapNode(state, node)
    const travel = buildTravelStep(state, node)
    if (travel.blocked) break
    state = applySequence(state, travel.actions)
    state = applySequence(state, buildArrivalStep(state))
    state = applySequence(state, buildGigStartStep(node.venue))
    state = applySequence(state, buildPostGigStep(state).actions)

    assert.deepEqual(
      checkInvariants(state),
      [],
      `invariants violated after loop ${day}`
    )
  }

  assert.ok(state.player.day >= 2, 'the loop advanced at least one day')
})

test('Golden Path: an unaffordable destination blocks travel and changes nothing', () => {
  let state = applySequence(createDeterministicState(), [
    createChangeSceneAction(GAME_PHASES.OVERWORLD)
  ])
  state = { ...state, player: { ...state.player, money: 0 } }

  const travel = buildTravelStep(state, buildMapNode({ venue: { dist: 900 } }))

  assert.ok(travel.blocked, 'travel must be refused')
  assert.deepEqual(travel.actions, [], 'a refused travel dispatches nothing')
  assert.deepEqual(applySequence(state, travel.actions), state)
})

test('Golden Path: the driver runs a full day loop in single-digit milliseconds', () => {
  const node = buildMapNode()
  const start = process.hrtime.bigint()

  let state = applySequence(withMapNode(createDeterministicState(), node), [
    createChangeSceneAction(GAME_PHASES.OVERWORLD)
  ])
  state = applySequence(state, buildTravelStep(state, node).actions)
  state = applySequence(state, buildArrivalStep(state))
  state = applySequence(state, buildGigStartStep(node.venue))
  applySequence(state, buildPostGigStep(state).actions)

  const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6

  assert.ok(elapsedMs < 100, `day loop took ${elapsedMs.toFixed(2)}ms`)
})
