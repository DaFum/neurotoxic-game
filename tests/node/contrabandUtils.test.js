import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  pickRarity,
  pickRandomContrabandByRarity,
  pickRandomContraband,
  computeDropChance,
  MAX_DROP_CHANCE,
  DROP_BASE_CHANCE
} from '../../src/utils/contrabandUtils'
import { CONTRABAND_BY_RARITY } from '../../src/data/contraband'

describe('Contraband Utils', () => {
  describe('pickRarity', () => {
    it('returns common when rng returns 0', () => {
      const rng = () => 0
      assert.equal(pickRarity(rng), 'common')
    })

    it('returns uncommon when rng returns 0.70', () => {
      const rng = () => 0.7
      assert.equal(pickRarity(rng), 'uncommon')
    })

    it('returns rare when rng returns 0.95', () => {
      const rng = () => 0.95
      assert.equal(pickRarity(rng), 'rare')
    })

    it('returns a higher rarity when rng is near 1', () => {
      const rng = () => 0.9999
      assert.equal(pickRarity(rng), 'epic')
    })

    it('returns common as fallback for unexpected rng > 1', () => {
      const rng = () => 1.5
      assert.equal(pickRarity(rng), 'common')
    })

    it('works with default rng', () => {
      const rarity = pickRarity()
      assert.ok(['common', 'uncommon', 'rare', 'epic'].includes(rarity))
    })
  })

  describe('pickRandomContraband', () => {
    it('uses rng for both rarity and item selection', () => {
      const pool = CONTRABAND_BY_RARITY.common
      const expectedId = pool[pool.length - 1].id

      // First call (rarity) gets 0 (common)
      // Second call (item selection) gets a value that dynamically targets the last item
      const lastItemRng = (pool.length - 0.5) / pool.length
      const values = [0, lastItemRng]
      let callCount = 0
      const statefulRng = () => values[callCount++]

      const id = pickRandomContraband(statefulRng)

      assert.equal(callCount, 2, 'rng should be called twice')
      assert.equal(id, expectedId, 'should return the last common item')
    })

    it('can pick an epic item if rng dictates', () => {
      // First call (rarity) gets 0.9999 (epic)
      // Second call (item selection) gets 0 (first item)
      const values = [0.9999, 0]
      let callCount = 0
      const statefulRng = () => values[callCount++]

      const pool = CONTRABAND_BY_RARITY.epic
      const expectedId = pool[0].id

      const id = pickRandomContraband(statefulRng)

      assert.equal(callCount, 2, 'rng should be called twice')
      assert.equal(id, expectedId, 'should return the first epic item')
    })

    it('works with default rng', () => {
      const id = pickRandomContraband()
      assert.ok(typeof id === 'string' || id === null)
    })
  })

  describe('pickRandomContrabandByRarity', () => {
    it('returns an item ID from the pool', () => {
      const rng = () => 0.5
      const id = pickRandomContrabandByRarity('common', rng)
      assert.ok(typeof id === 'string')
    })

    it('returns the first item when rng is 0', () => {
      const rng = () => 0
      const id = pickRandomContrabandByRarity('common', rng)
      assert.equal(id, CONTRABAND_BY_RARITY.common[0].id)
    })

    it('returns the last item when rng is near 1', () => {
      const rng = () => 0.9999
      const pool = CONTRABAND_BY_RARITY.common
      const id = pickRandomContrabandByRarity('common', rng)
      assert.equal(id, pool[pool.length - 1].id)
    })

    it('works with default rng', () => {
      const id = pickRandomContrabandByRarity('common')
      assert.ok(typeof id === 'string')
    })

    it('returns null for an empty/unknown rarity pool', () => {
      const id = pickRandomContrabandByRarity('mythic', () => 0)
      assert.equal(id, null)
    })
  })

  describe('computeDropChance', () => {
    it('calculates drop chance correctly based on luck', () => {
      const base = 0.15
      const luck = 10
      const chance = computeDropChance(base, luck)
      assert.equal(chance, 0.2)
    })

    it('clamps the chance to the max drop chance', () => {
      const chance = computeDropChance(0.15, 1000)
      assert.equal(chance, MAX_DROP_CHANCE)
    })

    it('uses default parameters when called with no arguments', () => {
      const chance = computeDropChance()
      assert.equal(chance, DROP_BASE_CHANCE)
    })

    it('clamps the chance to 0 when luck is highly negative', () => {
      const chance = computeDropChance(0, -1)
      assert.equal(chance, 0)
    })

    it('safely handles falsy or undefined luck values', () => {
      const chanceWithUndefined = computeDropChance(0.15, undefined)
      assert.equal(chanceWithUndefined, 0.15)

      const chanceWithNull = computeDropChance(0.15, null)
      assert.equal(chanceWithNull, 0.15)
    })

    it('treats non-finite luck as the fallback value', () => {
      const chanceWithInfinity = computeDropChance(0.15, Infinity)
      assert.equal(chanceWithInfinity, 0.15)

      const chanceWithNegativeInfinity = computeDropChance(0.15, -Infinity)
      assert.equal(chanceWithNegativeInfinity, 0.15)
    })
  })
})
