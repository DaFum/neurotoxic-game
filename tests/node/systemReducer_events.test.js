import test from 'node:test'
import assert from 'node:assert/strict'
import { handleAdvanceDay } from '../../src/context/reducers/systemReducer'

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

  await t.test('drains member mood from high stress and decays stress', () => {
    const initialState = {
      player: { money: 100, day: 1, eventsTriggeredToday: 0 },
      band: {
        harmony: 80,
        stress: 50,
        members: [{ id: 'm1', name: 'M1', mood: 60, stamina: 80 }]
      },
      social: { controversyLevel: 0, loyalty: 0 },
      toasts: [],
      pendingEvents: [],
      activeStoryFlags: []
    }

    const nextState = handleAdvanceDay(initialState, { rng: Math.random })

    // Daily drift toward 50 costs 2 mood, then floor(50 / 25) = 2 stress
    // penalty on top; stress itself decays by 2.
    assert.equal(nextState.band.members[0].mood, 56)
    assert.equal(nextState.band.stress, 48)
  })

  await t.test('low stress decays without draining mood', () => {
    const initialState = {
      player: { money: 100, day: 1, eventsTriggeredToday: 0 },
      band: {
        harmony: 80,
        stress: 10,
        members: [{ id: 'm1', name: 'M1', mood: 60, stamina: 80 }]
      },
      social: { controversyLevel: 0, loyalty: 0 },
      toasts: [],
      pendingEvents: [],
      activeStoryFlags: []
    }

    const nextState = handleAdvanceDay(initialState, { rng: Math.random })

    // Only the daily drift toward 50 applies (no stress mood penalty < 25)
    assert.equal(nextState.band.members[0].mood, 58)
    assert.equal(nextState.band.stress, 8)
  })
})
