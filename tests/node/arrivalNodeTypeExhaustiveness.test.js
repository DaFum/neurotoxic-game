import assert from 'node:assert/strict'
import { test, mock, describe } from 'node:test'
import { handleNodeArrival } from '../../src/utils/arrivalUtils'
import { MAP_NODE_TYPES } from '../../src/utils/mapNodeTypes'
import { GAME_PHASES } from '../../src/context/gameConstants'
import { logger } from '../../src/utils/logger'

/**
 * Cases are derived from `MAP_NODE_TYPES`, which is compile-time locked to the
 * `MapNodeType` union. Adding a type to the union without adding a
 * `handleNodeArrival` case makes this suite fail instead of silently routing
 * the player back to OVERWORLD.
 */
describe('handleNodeArrival node-type exhaustiveness', () => {
  const buildParams = type => ({
    node: {
      type,
      venue: { id: 'venue_test', name: 'Test Venue', capacity: 100, pay: 100 }
    },
    band: { harmony: 100, members: [{ stamina: 50, mood: 50 }] },
    player: { fame: 50 },
    updateBand: mock.fn(),
    updatePlayer: mock.fn(),
    triggerEvent: mock.fn(() => false),
    startGig: mock.fn(),
    addToast: mock.fn(),
    onShowHQ: mock.fn(),
    onShowSupplyStop: mock.fn(),
    rng: () => 1
  })

  for (const type of MAP_NODE_TYPES) {
    test(`${type} is handled explicitly`, () => {
      const warn = mock.method(logger, 'warn', () => {})
      try {
        const result = handleNodeArrival(buildParams(type))

        assert.equal(typeof result.scene, 'string')
        assert.equal(typeof result.gigStarted, 'boolean')

        const unhandled = warn.mock.calls.some(call =>
          String(call.arguments[1] ?? '').includes('Unhandled node type')
        )
        assert.equal(
          unhandled,
          false,
          `node type "${type}" fell through to the unhandled branch`
        )
      } finally {
        warn.mock.restore()
      }
    })
  }

  test('an unknown node type logs and still routes to OVERWORLD', () => {
    const warn = mock.method(logger, 'warn', () => {})
    try {
      const result = handleNodeArrival(buildParams('NOT_A_REAL_NODE_TYPE'))

      assert.deepStrictEqual(result, {
        scene: GAME_PHASES.OVERWORLD,
        gigStarted: false
      })
      assert.equal(
        warn.mock.calls.some(call =>
          String(call.arguments[1] ?? '').includes('Unhandled node type')
        ),
        true
      )
    } finally {
      warn.mock.restore()
    }
  })

  test('venue-bearing node types start a gig', () => {
    for (const type of ['GIG', 'FESTIVAL', 'FINALE', 'CITY']) {
      const params = buildParams(type)
      const result = handleNodeArrival(params)

      assert.equal(result.gigStarted, true, `${type} should start a gig`)
      assert.equal(params.startGig.mock.calls.length, 1)
    }
  })

  test('REST is treated as REST_STOP', () => {
    const params = buildParams('REST')
    handleNodeArrival(params)

    assert.equal(params.updateBand.mock.calls.length, 1)
    const [update] = params.updateBand.mock.calls[0].arguments
    assert.equal(update.members[0].stamina, 70)
    assert.equal(update.members[0].mood, 60)
  })
})
