import { describe, it } from 'node:test'
import assert from 'node:assert'
import { computeStashBustRisk } from '../../../src/utils/contrabandUtils.ts'

describe('computeStashBustRisk', () => {
  it('returns zero/nulls for falsy or non-object input', () => {
    assert.deepEqual(computeStashBustRisk(null), {
      bustChance: 0,
      highestRiskItemId: null,
      highestRarity: null
    })
    assert.deepEqual(computeStashBustRisk(undefined), {
      bustChance: 0,
      highestRiskItemId: null,
      highestRarity: null
    })
    assert.deepEqual(computeStashBustRisk('not-an-object'), {
      bustChance: 0,
      highestRiskItemId: null,
      highestRarity: null
    })
    assert.deepEqual(computeStashBustRisk(123), {
      bustChance: 0,
      highestRiskItemId: null,
      highestRarity: null
    })
  })

  it('returns zero/nulls for empty stash', () => {
    assert.deepEqual(computeStashBustRisk({}), {
      bustChance: 0,
      highestRiskItemId: null,
      highestRarity: null
    })
  })

  it('ignores invalid items in stash', () => {
    const stash = {
      item1: null,
      item2: 'string',
      item3: 123,
      '': { rarity: 'rare' } // Empty string key
    }
    assert.deepEqual(computeStashBustRisk(stash), {
      bustChance: 0,
      highestRiskItemId: null,
      highestRarity: null
    })
  })

  it('ignores items with missing or invalid rarity', () => {
    const stash = {
      item1: {},
      item2: { rarity: null },
      item3: { rarity: 123 },
      item4: { rarity: 'legendary' } // Not in BUST_CHANCE_BY_RARITY
    }
    assert.deepEqual(computeStashBustRisk(stash), {
      bustChance: 0,
      highestRiskItemId: null,
      highestRarity: null
    })
  })

  it('correctly calculates bust chance for valid items', () => {
    const stash = {
      item1: { rarity: 'common' }, // 0
      item2: { rarity: 'uncommon' } // 0.05
    }
    assert.deepEqual(computeStashBustRisk(stash), {
      bustChance: 0.05,
      highestRiskItemId: 'item2',
      highestRarity: 'uncommon'
    })
  })

  it('returns the item with the highest bust chance', () => {
    const stash = {
      item1: { rarity: 'uncommon' }, // 0.05
      item2: { rarity: 'epic' }, // 0.3
      item3: { rarity: 'rare' } // 0.15
    }
    assert.deepEqual(computeStashBustRisk(stash), {
      bustChance: 0.3,
      highestRiskItemId: 'item2',
      highestRarity: 'epic'
    })
  })
})
