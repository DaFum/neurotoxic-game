import test from 'node:test'
import assert from 'node:assert/strict'
import { applyEventDelta } from '../src/utils/gameStateUtils.js'

const buildState = () => ({
  player: {
    money: 50,
    day: 1,
    time: 12,
    fame: 5,
    location: 'Stendal',
    currentNodeId: 'node_0_0',
    van: {
      fuel: 20,
      condition: 80,
      upgrades: []
    }
  },
  band: {
    members: [
      { id: 'alpha', mood: 50, stamina: 50 },
      { id: 'beta', mood: 60, stamina: 40 }
    ],
    harmony: 90,
    inventory: {}
  },
  social: {
    instagram: 10,
    tiktok: 0,
    youtube: 3,
    newsletter: 0,
    viral: 0
  },
  activeStoryFlags: [],
  pendingEvents: []
})

test('applyEventDelta clamps player and band values', () => {
  const state = buildState()
  const delta = {
    player: {
      money: -100,
      fame: -10,
      day: 2,
      van: {
        fuel: -50,
        condition: 30
      }
    },
    band: {
      harmony: 20
    }
  }

  const result = applyEventDelta(state, delta)

  assert.equal(result.player.money, 0)
  assert.equal(result.player.fame, 0)
  assert.equal(result.player.day, 3)
  assert.equal(result.player.van.fuel, 0)
  assert.equal(result.player.van.condition, 100)
  assert.equal(result.band.harmony, 100)
})

test('applyEventDelta updates social channels safely', () => {
  const state = buildState()
  const delta = {
    social: {
      instagram: 5,
      youtube: -10,
      newsletter: 2
    }
  }

  const result = applyEventDelta(state, delta)

  assert.equal(result.social.instagram, 15)
  assert.equal(result.social.youtube, 0)
  assert.equal(result.social.newsletter, 2)
})
