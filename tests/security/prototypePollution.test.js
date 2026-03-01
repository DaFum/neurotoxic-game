import assert from 'node:assert'
import { test } from 'node:test'
import { applyEventDelta } from '../../src/utils/gameStateUtils.js'

test('applyEventDelta should not allow prototype pollution via player.stats', () => {
  const state = {
    player: {
      stats: { existing: 1 },
      money: 100,
      van: { fuel: 100, condition: 100 }
    }
  }
  // Using JSON.parse to simulate untrusted input that can contain __proto__
  const delta = JSON.parse('{"player": {"stats": {"__proto__": {"polluted": "yes"}}}}')

  const nextState = applyEventDelta(state, delta)

  // Check if the object's prototype was changed
  // In a vulnerable state, nextState.player.stats.polluted would be "yes"
  assert.strictEqual(nextState.player.stats.polluted, undefined, 'Property from __proto__ should not be accessible')

  // Ensure it's not an own property either
  assert.ok(!Object.prototype.hasOwnProperty.call(nextState.player.stats, '__proto__'), '__proto__ should not be an own property')
})

test('applyEventDelta should not allow prototype pollution via band.inventory', () => {
  const state = {
    band: {
      inventory: { shirts: 1 },
      members: []
    }
  }
  const delta = JSON.parse('{"band": {"inventory": {"__proto__": {"polluted": "yes"}}}}')

  const nextState = applyEventDelta(state, delta)

  assert.strictEqual(nextState.band.inventory.polluted, undefined, 'Property from __proto__ should not be accessible')
  assert.ok(!Object.prototype.hasOwnProperty.call(nextState.band.inventory, '__proto__'), '__proto__ should not be an own property')
})

test('applyEventDelta should not allow prototype pollution via social', () => {
  const state = {
    social: { instagram: 100 }
  }
  const delta = JSON.parse('{"social": {"__proto__": {"polluted": "yes"}}}')

  const nextState = applyEventDelta(state, delta)

  assert.strictEqual(nextState.social.polluted, undefined, 'Property from __proto__ should not be accessible')
  assert.ok(!Object.prototype.hasOwnProperty.call(nextState.social, '__proto__'), '__proto__ should not be an own property')
})

test('applyEventDelta should not allow setting constructor or prototype keys', () => {
  const state = { social: { instagram: 100 } }
  const delta = JSON.parse('{"social": {"constructor": {"polluted": "yes"}, "prototype": {"polluted": "yes"}}}')

  const nextState = applyEventDelta(state, delta)

  assert.ok(!Object.prototype.hasOwnProperty.call(nextState.social, 'constructor'), 'constructor should not be overwritten')
  assert.ok(!Object.prototype.hasOwnProperty.call(nextState.social, 'prototype'), 'prototype should not be set')
})
