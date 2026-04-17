import assert from 'node:assert'
import { test } from 'vitest'
import { applyEventDelta } from '../../src/utils/gameStateUtils'

test('applyEventDelta should not allow prototype pollution via player.stats', () => {
  const state = {
    player: {
      stats: { existing: 1 },
      money: 100,
      van: { fuel: 100, condition: 100 }
    }
  }
  // Using JSON.parse to simulate untrusted input that can contain __proto__
  const delta = JSON.parse(
    '{"player": {"stats": {"__proto__": {"polluted": "yes"}}}}'
  )

  const nextState = applyEventDelta(state, delta)

  // Check if the object's prototype was changed
  // In a vulnerable state, nextState.player.stats.polluted would be "yes"
  assert.strictEqual(
    nextState.player.stats.polluted,
    undefined,
    'Property from __proto__ should not be accessible'
  )

  // Ensure it's not an own property either
  assert.ok(
    !Object.prototype.hasOwnProperty.call(nextState.player.stats, '__proto__'),
    '__proto__ should not be an own property'
  )
})

test('applyEventDelta should not allow prototype pollution via band.inventory', () => {
  const state = {
    band: {
      inventory: { shirts: 1 },
      members: []
    }
  }
  const delta = JSON.parse(
    '{"band": {"inventory": {"__proto__": {"polluted": "yes"}}}}'
  )

  const nextState = applyEventDelta(state, delta)

  assert.strictEqual(
    nextState.band.inventory.polluted,
    undefined,
    'Property from __proto__ should not be accessible'
  )
  assert.ok(
    !Object.prototype.hasOwnProperty.call(
      nextState.band.inventory,
      '__proto__'
    ),
    '__proto__ should not be an own property'
  )
})

test('applyEventDelta should not allow prototype pollution via social', () => {
  const state = {
    social: { instagram: 100 }
  }
  const delta = JSON.parse('{"social": {"__proto__": {"polluted": "yes"}}}')

  const nextState = applyEventDelta(state, delta)

  assert.strictEqual(
    nextState.social.polluted,
    undefined,
    'Property from __proto__ should not be accessible'
  )
  assert.ok(
    !Object.prototype.hasOwnProperty.call(nextState.social, '__proto__'),
    '__proto__ should not be an own property'
  )
})

test('applyEventDelta should not allow setting constructor or prototype keys', () => {
  const state = { social: { instagram: 100 } }
  const delta = JSON.parse(
    '{"social": {"constructor": {"polluted": "yes"}, "prototype": {"polluted": "yes"}}}'
  )

  const nextState = applyEventDelta(state, delta)

  assert.ok(
    !Object.prototype.hasOwnProperty.call(nextState.social, 'constructor'),
    'constructor should not be overwritten'
  )
  assert.ok(
    !Object.prototype.hasOwnProperty.call(nextState.social, 'prototype'),
    'prototype should not be set'
  )
})

test('applyEventDelta should not allow prototype pollution via band.relationshipChange', () => {
  const state = {
    band: {
      members: [
        { name: 'Alice', relationships: { Bob: 50 } },
        { name: 'Bob', relationships: { Alice: 50 } }
      ]
    }
  }

  // Attempting to pollute '__proto__' as the other member
  const delta = {
    band: {
      relationshipChange: [
        { member1: 'Alice', member2: '__proto__', change: 10 },
        { member1: 'Bob', member2: 'constructor', change: 10 },
        { member1: 'Alice', member2: 'prototype', change: 10 }
      ]
    }
  }

  const nextState = applyEventDelta(state, delta)

  const alice = nextState.band.members.find(m => m.name === 'Alice')
  const bob = nextState.band.members.find(m => m.name === 'Bob')

  assert.ok(
    !Object.prototype.hasOwnProperty.call(alice.relationships, '__proto__'),
    '__proto__ should not be added to relationships'
  )
  assert.ok(
    !Object.prototype.hasOwnProperty.call(alice.relationships, 'prototype'),
    'prototype should not be added to relationships'
  )
  assert.ok(
    !Object.prototype.hasOwnProperty.call(bob.relationships, 'constructor'),
    'constructor should not be added to relationships'
  )
})
