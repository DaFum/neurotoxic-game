import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { isCatalogEffect } from '../../src/utils/catalogEffectUtils'

describe('isCatalogEffect', () => {
  test('accepts supported purchase effect shapes', () => {
    assert.equal(
      isCatalogEffect({
        type: 'stat_modifier',
        target: 'player',
        stat: 'fame',
        value: 100
      }),
      true
    )
    assert.equal(
      isCatalogEffect({
        type: 'inventory_add',
        item: 'strings',
        value: 1
      }),
      true
    )
    assert.equal(
      isCatalogEffect({ type: 'passive', key: 'roadie_bonus' }),
      true
    )
  })

  test('rejects malformed or unsupported effect shapes', () => {
    assert.equal(isCatalogEffect(null), false)
    assert.equal(
      isCatalogEffect({ type: 'stat_modifier', target: 'crew' }),
      false
    )
    assert.equal(
      isCatalogEffect({ type: 'inventory_add', item: 'strings' }),
      false
    )
    assert.equal(isCatalogEffect({ type: 'unknown', key: 'x' }), false)
  })
})
