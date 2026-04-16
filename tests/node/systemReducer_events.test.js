import test from 'node:test'
import assert from 'node:assert/strict'
import { handleAdvanceDay } from '../../src/context/reducers/systemReducer.js'

test('systemReducer - handleAdvanceDay', async t => {
  await t.test('resets eventsTriggeredToday to 0 on advance day', () => {
    const initialState = {
      player: {
        money: 100,
        day: 1,
        eventsTriggeredToday: 2
      },
      band: { harmony: 80, fame: 10, members: [] },
      social: { controversyLevel: 0, loyalty: 0 },
      toasts: [],
      pendingEvents: [],
      activeStoryFlags: []
    }

    const nextState = handleAdvanceDay(initialState, { rng: Math.random })

    assert.equal(nextState.player.eventsTriggeredToday, 0)
    assert.notEqual(initialState.player, nextState.player)
  })
})
