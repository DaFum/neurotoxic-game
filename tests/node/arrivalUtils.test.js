import assert from 'node:assert/strict'
import { test, mock, describe } from 'node:test'
import {
  handleNodeArrival,
  processTravelEvents
} from '../../src/utils/arrivalUtils'
import { GAME_PHASES } from '../../src/context/gameConstants'
import { BALANCE_CONSTANTS } from '../../src/utils/gameStateUtils'

describe('handleNodeArrival', () => {
  const getMocks = () => ({
    updateBand: mock.fn(),
    updatePlayer: mock.fn(),
    triggerEvent: mock.fn(),
    startGig: mock.fn(),
    addToast: mock.fn(),
    changeScene: mock.fn(),
    onShowHQ: mock.fn()
  })

  test('REST_STOP - updates band stamina and mood', () => {
    const mocks = getMocks()
    const band = {
      members: [
        { stamina: 50, mood: 50 },
        { stamina: 90, mood: 95 }
      ]
    }
    const node = { type: 'REST_STOP' }

    handleNodeArrival({
      node,
      band,
      ...mocks
    })

    assert.strictEqual(mocks.updateBand.mock.calls.length, 1)
    const updatedMembers = mocks.updateBand.mock.calls[0].arguments[0].members
    // Member 1: 50+20=70, 50+10=60
    assert.strictEqual(updatedMembers[0].stamina, 70)
    assert.strictEqual(updatedMembers[0].mood, 60)
    // Member 2: 90+20=110 -> 100, 95+10=105 -> 100
    assert.strictEqual(updatedMembers[1].stamina, 100)
    assert.strictEqual(updatedMembers[1].mood, 100)

    assert.strictEqual(mocks.addToast.mock.calls.length, 1)
    assert.strictEqual(mocks.addToast.mock.calls[0].arguments[1], 'success')
  })

  test('START - calls onShowHQ and adds toast', () => {
    const mocks = getMocks()
    const node = { type: 'START' }

    handleNodeArrival({
      node,
      ...mocks
    })

    assert.strictEqual(mocks.onShowHQ.mock.calls.length, 1)
    assert.strictEqual(mocks.addToast.mock.calls.length, 1)
    assert.strictEqual(mocks.addToast.mock.calls[0].arguments[1], 'success')
  })

  test('SPECIAL - triggers event when none active', () => {
    const mocks = getMocks()
    mocks.triggerEvent.mock.mockImplementation(() => ({ id: 'some-event' }))
    const node = { type: 'SPECIAL' }

    handleNodeArrival({
      node,
      eventAlreadyActive: false,
      ...mocks
    })

    assert.strictEqual(mocks.triggerEvent.mock.calls.length, 1)
    assert.strictEqual(mocks.triggerEvent.mock.calls[0].arguments[0], 'special')
    assert.strictEqual(mocks.addToast.mock.calls.length, 0)
  })

  test('SPECIAL - does not trigger event when already active', () => {
    const mocks = getMocks()
    const node = { type: 'SPECIAL' }

    handleNodeArrival({
      node,
      eventAlreadyActive: true,
      ...mocks
    })

    assert.strictEqual(mocks.triggerEvent.mock.calls.length, 0)
  })

  test('SPECIAL - adds toast if no event triggered', () => {
    const mocks = getMocks()
    mocks.triggerEvent.mock.mockImplementation(() => null)
    const node = { type: 'SPECIAL' }

    handleNodeArrival({
      node,
      eventAlreadyActive: false,
      ...mocks
    })

    assert.strictEqual(mocks.triggerEvent.mock.calls.length, 1)
    assert.strictEqual(mocks.addToast.mock.calls.length, 1)
    assert.strictEqual(mocks.addToast.mock.calls[0].arguments[1], 'info')
  })

  const gigTypes = ['GIG', 'FESTIVAL', 'FINALE']
  gigTypes.forEach(type => {
    test(`${type} - starts gig if harmony > 0`, () => {
      const mocks = getMocks()
      const venue = { name: 'The Club' }
      const node = { type, venue }
      const band = { harmony: 50 }

      handleNodeArrival({
        node,
        band,
        ...mocks
      })

      assert.strictEqual(mocks.startGig.mock.calls.length, 1)
      assert.strictEqual(mocks.startGig.mock.calls[0].arguments[0], venue)
    })

    test(`${type} - fails to start gig if harmony <= 1`, () => {
      const mocks = getMocks()
      const node = { type, venue: { name: 'The Club' } }
      const band = { harmony: 1 }
      const player = { fame: 100 }

      handleNodeArrival({
        node,
        band,
        player,
        ...mocks
      })

      assert.strictEqual(mocks.startGig.mock.calls.length, 0)
      assert.strictEqual(mocks.addToast.mock.calls.length, 1)
      assert.strictEqual(mocks.addToast.mock.calls[0].arguments[1], 'error')
      assert.strictEqual(mocks.changeScene.mock.calls.length, 1)
      assert.strictEqual(
        mocks.changeScene.mock.calls[0].arguments[0],
        GAME_PHASES.OVERWORLD
      )

      // Check fame penalty (double bad gig loss)
      assert.strictEqual(mocks.updatePlayer.mock.calls.length, 1)
      const fameUpdate = mocks.updatePlayer.mock.calls[0].arguments[0].fame
      assert.strictEqual(
        fameUpdate,
        player.fame - BALANCE_CONSTANTS.FAME_LOSS_BAD_GIG * 2
      )
    })

    test(`${type} - luck-based cancellation (harmony < threshold, rng < chance)`, () => {
      const mocks = getMocks()
      const node = { type, venue: { name: 'The Club' } }
      const band = { harmony: 10 }
      const player = { fame: 100 }
      const rng = () => 0.1 // Triggers cancellation

      handleNodeArrival({
        node,
        band,
        player,
        rng,
        ...mocks
      })

      assert.strictEqual(mocks.startGig.mock.calls.length, 0)
      assert.strictEqual(mocks.addToast.mock.calls.length, 1)
      assert.strictEqual(mocks.addToast.mock.calls[0].arguments[1], 'error')

      // Check fame penalty (double bad gig loss)
      assert.strictEqual(mocks.updatePlayer.mock.calls.length, 1)
      const fameUpdate = mocks.updatePlayer.mock.calls[0].arguments[0].fame
      // Fame penalty is double the standard bad gig loss
      assert.strictEqual(
        fameUpdate,
        player.fame - BALANCE_CONSTANTS.FAME_LOSS_BAD_GIG * 2
      )
    })

    test(`${type} - no cancellation (harmony < threshold, rng >= chance)`, () => {
      const mocks = getMocks()
      const node = { type, venue: { name: 'The Club' } }
      const band = { harmony: 10 }
      const player = { fame: 100 }
      const rng = () => 0.3 // Does NOT trigger cancellation

      handleNodeArrival({
        node,
        band,
        player,
        rng,
        ...mocks
      })

      assert.strictEqual(mocks.startGig.mock.calls.length, 1)
      assert.strictEqual(mocks.updatePlayer.mock.calls.length, 0)
    })
  })

  test('GIG - handles startGig error', () => {
    const mocks = getMocks()
    const node = { type: 'GIG', venue: { name: 'The Club' } }
    const band = { harmony: 100 }
    const error = new Error('Failed to load song')
    mocks.startGig.mock.mockImplementation(() => {
      throw error
    })

    handleNodeArrival({
      node,
      band,
      ...mocks
    })

    assert.strictEqual(mocks.startGig.mock.calls.length, 1)
    // handleError should be called and it should call addToast
    assert.strictEqual(mocks.addToast.mock.calls.length, 1)
    assert.ok(
      mocks.addToast.mock.calls[0].arguments[0].includes('Failed to load song')
    )
  })
})

describe('processTravelEvents', () => {
  test('returns false and does not trigger events for gig nodes', () => {
    const triggerEvent = mock.fn(() => true)
    const node = { type: 'GIG' }

    const result = processTravelEvents(node, triggerEvent)

    assert.strictEqual(result, false)
    assert.strictEqual(triggerEvent.mock.calls.length, 0)
  })

  test('triggers transport first and short-circuits when active', () => {
    const triggerEvent = mock.fn((category, tag) => {
      assert.strictEqual(category, 'transport')
      assert.strictEqual(tag, 'travel')
      return true
    })

    const result = processTravelEvents({ type: 'REST_STOP' }, triggerEvent)

    assert.strictEqual(result, true)
    assert.strictEqual(triggerEvent.mock.calls.length, 1)
  })

  test('falls back to band travel event when transport does not activate', () => {
    const triggerEvent = mock.fn((category, tag) => {
      assert.strictEqual(tag, 'travel')
      return category === 'band'
    })

    const result = processTravelEvents({ type: 'SPECIAL' }, triggerEvent)

    assert.strictEqual(result, true)
    assert.strictEqual(triggerEvent.mock.calls.length, 2)
    assert.strictEqual(triggerEvent.mock.calls[0].arguments[0], 'transport')
    assert.strictEqual(triggerEvent.mock.calls[1].arguments[0], 'band')
  })

  test('handles undefined node using non-gig fallback behavior', () => {
    const triggerEvent = mock.fn(() => false)

    const result = processTravelEvents(undefined, triggerEvent)

    assert.strictEqual(result, false)
    assert.strictEqual(triggerEvent.mock.calls.length, 2)
  })
})
