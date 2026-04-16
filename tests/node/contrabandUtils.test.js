import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  pickRarity,
  pickRandomContrabandByRarity,
  computeDropChance,
  MAX_DROP_CHANCE
} from '../../src/utils/contrabandUtils.js'

describe('Contraband Utils', () => {
  describe('pickRarity', () => {
    it('returns common when rng returns 0', () => {
      const rng = () => 0
      assert.equal(pickRarity(rng), 'common')
    })

    it('returns a higher rarity when rng is near 1', () => {
      const rng = () => 0.9999
      assert.equal(pickRarity(rng), 'epic')
    })
  })

  describe('pickRandomContrabandByRarity', () => {
    it('returns an item ID from the pool', () => {
      const rng = () => 0.5
      const id = pickRandomContrabandByRarity('common', rng)
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
  })
})
