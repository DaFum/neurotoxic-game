import assert from 'node:assert'
import { test } from 'node:test'
import { applyEventDelta } from '../src/utils/gameStateUtils.js'

test('applyEventDelta applies player updates', () => {
  const state = {
    player: { money: 100, time: 12, fame: 50, van: { fuel: 50, condition: 80 } }
  }
  const delta = {
    player: { money: -20, time: 2, fame: 10, van: { fuel: 10, condition: -5 } }
  }

  const nextState = applyEventDelta(state, delta)
  assert.equal(nextState.player.money, 80)
  assert.equal(nextState.player.time, 14)
  assert.equal(nextState.player.fame, 60)
  assert.equal(nextState.player.van.fuel, 60)
  assert.equal(nextState.player.van.condition, 75)
})

test('applyEventDelta clamps values', () => {
  const state = {
    player: { money: 10, van: { fuel: 90, condition: 10 } },
    band: { harmony: 10, members: [{ mood: 10, stamina: 10 }] }
  }
  const delta = {
    player: { money: -50, van: { fuel: 20, condition: -20 } },
    band: { harmony: -20, members: { moodChange: -20, staminaChange: -20 } }
  }

  const nextState = applyEventDelta(state, delta)
  assert.equal(nextState.player.money, 0) // min 0
  assert.equal(nextState.player.van.fuel, 100) // max 100
  assert.equal(nextState.player.van.condition, 0) // min 0
  assert.equal(nextState.band.harmony, 1) // min 1
  assert.equal(nextState.band.members[0].mood, 0) // min 0
  assert.equal(nextState.band.members[0].stamina, 0) // min 0
})

test('applyEventDelta handles band inventory updates', () => {
  const state = {
    band: { inventory: { shirts: 10, golden_pick: false } }
  }
  const delta = {
    band: { inventory: { shirts: 5, golden_pick: true } }
  }

  const nextState = applyEventDelta(state, delta)
  assert.equal(nextState.band.inventory.shirts, 15)
  assert.equal(nextState.band.inventory.golden_pick, true)
})

test('applyEventDelta handles social updates', () => {
  const state = {
    social: { instagram: 100, viral: 0 }
  }
  const delta = {
    social: { instagram: 50, viral: 1 }
  }
  const nextState = applyEventDelta(state, delta)
  assert.equal(nextState.social.instagram, 150)
  assert.equal(nextState.social.viral, 1)
})

test('applyEventDelta handles flags', () => {
  const state = {
    activeStoryFlags: [],
    pendingEvents: []
  }
  const delta = {
    flags: { addStoryFlag: 'MET_RIVAL', queueEvent: 'RIVAL_BATTLE' }
  }
  const nextState = applyEventDelta(state, delta)
  assert.ok(nextState.activeStoryFlags.includes('MET_RIVAL'))
  assert.ok(nextState.pendingEvents.includes('RIVAL_BATTLE'))
})
