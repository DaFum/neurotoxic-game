import assert from 'node:assert/strict'
import { test, mock, describe } from 'node:test'
import {
  handleNodeArrival,
  processTravelEvents,
  requestArrivalGigStart
} from '../../src/utils/arrivalUtils'
import { BALANCE_CONSTANTS } from '../../src/utils/gameState'
import { logger } from '../../src/utils/logger'

describe('handleNodeArrival', () => {
  const getMocks = () => ({
    updateBand: mock.fn(),
    updatePlayer: mock.fn(),
    triggerEvent: mock.fn(),
    addToast: mock.fn(),
    onShowHQ: mock.fn()
  })

  test('REST_STOP - updates band stamina and mood', () => {
    const mocks = getMocks()
    const band = {
      members: [
        { id: 'a', stamina: 50, mood: 50 },
        { id: 'b', stamina: 90, mood: 95 }
      ]
    }
    const node = { type: 'REST_STOP' }

    const result = handleNodeArrival({
      node,
      band,
      ...mocks
    })
    assert.deepStrictEqual(result, { kind: 'overworld' })

    assert.strictEqual(mocks.updateBand.mock.calls.length, 1)
    // A functional update: rest applies to the reducer's current members.
    const updatedMembers =
      mocks.updateBand.mock.calls[0].arguments[0](band).members
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

    const result = handleNodeArrival({
      node,
      ...mocks
    })
    assert.deepStrictEqual(result, { kind: 'overworld' })

    assert.strictEqual(mocks.onShowHQ.mock.calls.length, 1)
    assert.strictEqual(mocks.addToast.mock.calls.length, 1)
    assert.strictEqual(mocks.addToast.mock.calls[0].arguments[1], 'success')
  })

  test('SPECIAL - triggers event when none active', () => {
    const mocks = getMocks()
    mocks.triggerEvent.mock.mockImplementation(() => ({ id: 'some-event' }))
    const node = { type: 'SPECIAL' }

    const result = handleNodeArrival({
      node,
      eventAlreadyActive: false,
      ...mocks
    })
    assert.deepStrictEqual(result, { kind: 'overworld' })

    assert.strictEqual(mocks.triggerEvent.mock.calls.length, 1)
    assert.strictEqual(mocks.triggerEvent.mock.calls[0].arguments[0], 'special')
    // Without a trigger point the filter is skipped and post_gig specials
    // become eligible at a node with no gig.
    assert.strictEqual(
      mocks.triggerEvent.mock.calls[0].arguments[1],
      'special_location'
    )
    assert.strictEqual(mocks.addToast.mock.calls.length, 0)
  })

  test('SPECIAL - does not trigger event when already active', () => {
    const mocks = getMocks()
    const node = { type: 'SPECIAL' }

    const result = handleNodeArrival({
      node,
      eventAlreadyActive: true,
      ...mocks
    })
    assert.deepStrictEqual(result, { kind: 'overworld' })

    assert.strictEqual(mocks.triggerEvent.mock.calls.length, 0)
  })

  test('SPECIAL - adds toast if no event triggered', () => {
    const mocks = getMocks()
    mocks.triggerEvent.mock.mockImplementation(() => null)
    const node = { type: 'SPECIAL' }

    const result = handleNodeArrival({
      node,
      eventAlreadyActive: false,
      ...mocks
    })
    assert.deepStrictEqual(result, { kind: 'overworld' })

    assert.strictEqual(mocks.triggerEvent.mock.calls.length, 1)
    assert.strictEqual(mocks.addToast.mock.calls.length, 1)
    assert.strictEqual(mocks.addToast.mock.calls[0].arguments[1], 'info')
  })

  const gigTypes = ['GIG', 'FESTIVAL', 'FINALE']
  test('first reachable gig starts without a prior-performance prerequisite', () => {
    const mocks = getMocks()
    const venue = { id: 'first_reachable', name: 'First Reachable Venue' }
    const result = handleNodeArrival({
      node: { type: 'GIG', venue },
      band: { harmony: 80 },
      player: { fame: 0, stats: { gigsPlayed: 0 } },
      rng: () => 1,
      ...mocks
    })

    assert.equal(result.kind, 'gig')
    assert.equal(result.venue, venue)
  })

  gigTypes.forEach(type => {
    test(`${type} - starts gig if harmony > 0`, () => {
      const mocks = getMocks()
      const venue = { id: 'the_club', name: 'The Club' }
      const node = { type, venue }
      const band = { harmony: 50 }

      const result = handleNodeArrival({
        node,
        band,
        ...mocks
      })
      assert.strictEqual(result.kind, 'gig')
      assert.strictEqual(result.venue, venue)
    })

    test(`${type} - fails to start gig if harmony <= 1`, () => {
      const mocks = getMocks()
      const node = { type, venue: { id: 'the_club', name: 'The Club' } }
      const band = { harmony: 1 }
      const player = { fame: 100 }

      const result = handleNodeArrival({
        node,
        band,
        player,
        ...mocks
      })
      assert.deepStrictEqual(result, { kind: 'overworld' })
      assert.strictEqual(mocks.addToast.mock.calls.length, 1)
      assert.strictEqual(mocks.addToast.mock.calls[0].arguments[1], 'error')

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
      const node = { type, venue: { id: 'the_club', name: 'The Club' } }
      const band = { harmony: 10 }
      const player = { fame: 100 }
      const rng = () => 0.1 // Triggers cancellation

      const result = handleNodeArrival({
        node,
        band,
        player,
        rng,
        ...mocks
      })
      assert.deepStrictEqual(result, { kind: 'overworld' })
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
      const node = { type, venue: { id: 'the_club', name: 'The Club' } }
      const band = { harmony: 10 }
      const player = { fame: 100 }
      const rng = () => 0.3 // Does NOT trigger cancellation

      const result = handleNodeArrival({
        node,
        band,
        player,
        rng,
        ...mocks
      })
      assert.strictEqual(result.kind, 'gig')
      assert.strictEqual(mocks.updatePlayer.mock.calls.length, 0)
    })

    test(`${type} - band tourSuccess scales down the cancellation chance`, () => {
      const mocks = getMocks()
      const node = { type, venue: { id: 'the_club', name: 'The Club' } }
      // tourSuccess 0.5 halves the 0.2 base chance to 0.1, so a 0.15 roll
      // that would otherwise cancel now lets the show go on.
      const band = { harmony: 10, tourSuccess: 0.5 }
      const player = { fame: 100 }
      const rng = () => 0.15

      const result = handleNodeArrival({
        node,
        band,
        player,
        rng,
        ...mocks
      })
      assert.strictEqual(result.kind, 'gig')
    })

    test(`${type} - harmony <= 1 still cancels despite tourSuccess`, () => {
      const mocks = getMocks()
      const node = { type, venue: { id: 'the_club', name: 'The Club' } }
      const band = { harmony: 1, tourSuccess: 1 }
      const player = { fame: 100 }
      const rng = () => 0.99

      const result = handleNodeArrival({
        node,
        band,
        player,
        rng,
        ...mocks
      })
      assert.deepStrictEqual(result, { kind: 'overworld' })
    })
  })

  test('GIG - resolves legacy venue string before starting gig', () => {
    const mocks = getMocks()
    const node = { type: 'GIG', venue: 'venues:stendal_proberaum.name' }
    const band = { harmony: 50 }

    const result = handleNodeArrival({
      node,
      band,
      ...mocks
    })

    assert.strictEqual(result.kind, 'gig')
    assert.strictEqual(result.venue.id, 'stendal_proberaum')
  })

  test('GIG - rejects unresolved legacy venue string', () => {
    const mocks = getMocks()
    const node = { type: 'GIG', venue: 'venues:missing_venue.name' }
    const band = { harmony: 50 }

    const result = handleNodeArrival({
      node,
      band,
      ...mocks
    })

    assert.deepStrictEqual(result, { kind: 'overworld' })
    assert.strictEqual(mocks.addToast.mock.calls.length, 1)
    assert.strictEqual(mocks.addToast.mock.calls[0].arguments[1], 'error')
  })

  // START_GIG refuses a venue without a non-empty id and name, so arrival must
  // not decide `gig` on one: that left the deferred arrival path stalled.
  const unbookableInlineVenues = [
    { name: 'The Club' },
    { id: '', name: 'The Club' },
    { id: 'the_club', name: '' },
    { id: 7, name: 'The Club' }
  ]
  unbookableInlineVenues.forEach(venue => {
    test(`GIG - inline venue ${JSON.stringify(venue)} routes to overworld with an error`, () => {
      const mocks = getMocks()
      const result = handleNodeArrival({
        node: { type: 'GIG', venue },
        band: { harmony: 50 },
        ...mocks
      })

      assert.deepStrictEqual(result, { kind: 'overworld' })
      assert.strictEqual(mocks.addToast.mock.calls.length, 1)
      assert.strictEqual(mocks.addToast.mock.calls[0].arguments[1], 'error')
    })
  })

  test('requestArrivalGigStart requests the start and reports success', () => {
    const mocks = getMocks()
    const venue = { id: 'club', name: 'The Club' }
    const startGig = mock.fn()

    assert.strictEqual(
      requestArrivalGigStart(venue, startGig, mocks.addToast),
      true
    )
    assert.strictEqual(startGig.mock.calls.length, 1)
    assert.strictEqual(startGig.mock.calls[0].arguments[0], venue)
    assert.strictEqual(mocks.addToast.mock.calls.length, 0)
  })

  test('requestArrivalGigStart reports a start that throws', () => {
    const mocks = getMocks()
    const venue = { id: 'club', name: 'The Club' }
    const error = new Error('Failed to load song')
    const startGig = mock.fn(() => {
      throw error
    })

    assert.strictEqual(
      requestArrivalGigStart(venue, startGig, mocks.addToast),
      false
    )

    assert.strictEqual(startGig.mock.calls.length, 1)
    // handleError toasts the localized fallback; the raw Error message is
    // developer text and stays in the log.
    assert.strictEqual(mocks.addToast.mock.calls.length, 1)
    const toastMessage = mocks.addToast.mock.calls[0].arguments[0]
    assert.ok(
      toastMessage === 'Failed to start Gig.' ||
        toastMessage === 'ui:arrival.failedToStartGig',
      toastMessage
    )
    assert.ok(!toastMessage.includes('Failed to load song'))
  })

  test('requestArrivalGigStart refuses a start the check refuses', () => {
    const mocks = getMocks()
    const venue = { id: 'club', name: 'The Club' }
    const startGig = mock.fn()
    const checkStartGig = mock.fn(() => 'node_converted')

    assert.strictEqual(
      requestArrivalGigStart(venue, startGig, mocks.addToast, checkStartGig),
      false
    )
    assert.strictEqual(checkStartGig.mock.calls.length, 1)
    assert.strictEqual(checkStartGig.mock.calls[0].arguments[0], venue)
    assert.strictEqual(startGig.mock.calls.length, 0)
    assert.strictEqual(mocks.addToast.mock.calls.length, 0)
  })

  test('requestArrivalGigStart starts unchanged when the check passes', () => {
    const mocks = getMocks()
    const venue = { id: 'club', name: 'The Club' }
    const startGig = mock.fn()

    assert.strictEqual(
      requestArrivalGigStart(venue, startGig, mocks.addToast, () => null),
      true
    )
    assert.strictEqual(startGig.mock.calls.length, 1)
    assert.strictEqual(startGig.mock.calls[0].arguments[0], venue)
    assert.strictEqual(mocks.addToast.mock.calls.length, 0)
  })

  test('requestArrivalGigStart runs the check after the start log and right before startGig', t => {
    const order = []
    t.mock.method(logger, 'info', () => order.push('log'))
    t.mock.method(logger, 'warn', () => order.push('warn'))
    const venue = { id: 'club', name: 'The Club' }

    requestArrivalGigStart(
      venue,
      () => order.push('start'),
      () => order.push('toast'),
      () => {
        order.push('check')
        return null
      }
    )

    assert.deepStrictEqual(order, ['log', 'check', 'start'])
  })

  test('requestArrivalGigStart reports a check that throws', () => {
    const mocks = getMocks()
    const venue = { id: 'club', name: 'The Club' }
    const startGig = mock.fn()

    assert.strictEqual(
      requestArrivalGigStart(venue, startGig, mocks.addToast, () => {
        throw new Error('check failed')
      }),
      false
    )
    assert.strictEqual(startGig.mock.calls.length, 0)
    // The existing `catch` reports it through `handleError`'s toast.
    assert.strictEqual(mocks.addToast.mock.calls.length, 1)
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

  test('can use the legacy policy that triggers travel events for gig nodes', () => {
    const triggerEvent = mock.fn((category, tag) => {
      assert.strictEqual(category, 'transport')
      assert.strictEqual(tag, 'travel')
      return true
    })

    const result = processTravelEvents({ type: 'GIG' }, triggerEvent, {
      includeGigNodes: true
    })

    assert.strictEqual(result, true)
    assert.strictEqual(triggerEvent.mock.calls.length, 1)
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

describe('handleNodeArrival NaN recovery', () => {
  test('REST_STOP recovers corrupt mood/stamina to the sanitizer defaults', () => {
    const updateBand = mock.fn()
    handleNodeArrival({
      node: { type: 'REST_STOP' },
      band: {
        members: [{ id: 'a', stamina: NaN, mood: NaN, staminaMax: 100 }]
      },
      updateBand,
      updatePlayer: mock.fn(),
      triggerEvent: mock.fn(),
      addToast: mock.fn(),
      onShowHQ: mock.fn()
    })
    const [member] = updateBand.mock.calls[0].arguments[0]({
      members: [{ id: 'a', stamina: NaN, mood: NaN, staminaMax: 100 }]
    }).members
    // stamina: 100 default + 20 -> clamped 100; mood: 50 default + 10 -> 60
    assert.strictEqual(member.stamina, 100)
    assert.strictEqual(member.mood, 60)
  })
})
