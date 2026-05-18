import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  isCatalogEffect,
  normalizeCatalogEffect
} from '../../src/utils/catalogEffectUtils'

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
    assert.equal(
      isCatalogEffect({ type: 'inventory_set', item: 'strings' }),
      true
    )
    assert.equal(isCatalogEffect({ type: 'unlock_upgrade', id: 'amp' }), true)
    assert.equal(isCatalogEffect({ type: 'unlock_hq', id: 'cellar' }), true)
  })

  test('rejects malformed or unsupported effect shapes', () => {
    assert.equal(isCatalogEffect(null), false)
    assert.equal(isCatalogEffect(undefined), false)
    assert.equal(isCatalogEffect('not an object'), false)
    assert.equal(isCatalogEffect(42), false)
    assert.equal(
      isCatalogEffect({ type: 'stat_modifier', target: 'crew' }),
      false
    )
    assert.equal(
      isCatalogEffect({ type: 'inventory_add', item: 'strings' }),
      false
    )
    assert.equal(isCatalogEffect({ type: 'unknown', key: 'x' }), false)
    assert.equal(isCatalogEffect({}), false)
  })

  test('rejects non-finite numeric effect values', () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.equal(
        isCatalogEffect({ type: 'inventory_add', item: 'strings', value }),
        false
      )
      assert.equal(
        isCatalogEffect({
          type: 'stat_modifier',
          target: 'player',
          stat: 'fame',
          value
        }),
        false
      )
      assert.equal(
        isCatalogEffect({ type: 'inventory_set', item: 'strings', value }),
        false
      )
    }

    assert.equal(
      isCatalogEffect({ type: 'inventory_set', item: 'strings', value: true }),
      true
    )
  })

  test('rejects payloads whose discriminator only exists on the prototype', () => {
    const proto = { type: 'passive', key: 'roadie_bonus' }
    const payload = Object.create(proto)
    assert.equal(isCatalogEffect(payload), false)
  })
})

describe('normalizeCatalogEffect', () => {
  test('returns a sanitized clone of valid inventory_add input', () => {
    const result = normalizeCatalogEffect(
      { type: 'inventory_add', item: 'strings', value: 3 },
      'guitar_pack'
    )
    assert.deepEqual(result, {
      type: 'inventory_add',
      item: 'strings',
      value: 3
    })
  })

  test('returns a sanitized clone of valid stat_modifier input', () => {
    const result = normalizeCatalogEffect(
      { type: 'stat_modifier', target: 'player', stat: 'fame', value: 100 },
      'fame_boost'
    )
    assert.deepEqual(result, {
      type: 'stat_modifier',
      target: 'player',
      stat: 'fame',
      value: 100
    })
  })

  test('preserves optional `value` on passive when present', () => {
    const withValue = normalizeCatalogEffect(
      { type: 'passive', key: 'roadie_bonus', value: 0.25 },
      'roadie_perk'
    )
    assert.deepEqual(withValue, {
      type: 'passive',
      key: 'roadie_bonus',
      value: 0.25
    })

    const withoutValue = normalizeCatalogEffect(
      { type: 'passive', key: 'roadie_bonus' },
      'roadie_perk_basic'
    )
    assert.deepEqual(withoutValue, { type: 'passive', key: 'roadie_bonus' })
    assert.equal(Object.hasOwn(withoutValue, 'value'), false)
  })

  test('throws when the input is invalid', () => {
    assert.throws(
      () => normalizeCatalogEffect(null, 'x'),
      /Invalid catalog effect for item "x"/
    )
    assert.throws(
      () => normalizeCatalogEffect({ type: 'unknown' }, 42),
      /Invalid catalog effect for item "42"/
    )
    assert.throws(
      () =>
        normalizeCatalogEffect(
          { type: 'inventory_add', item: 'strings' },
          'no_value'
        ),
      /Invalid catalog effect for item "no_value"/
    )
    assert.throws(
      () =>
        normalizeCatalogEffect(
          { type: 'stat_modifier', target: 'player', stat: 'fame', value: NaN },
          'nan_stat'
        ),
      /Invalid catalog effect for item "nan_stat"/
    )
  })

  test('strips prototype-pollution keys from the returned clone', () => {
    const hostile = JSON.parse(
      '{"type":"stat_modifier","target":"player","stat":"fame","value":1,"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}}'
    )
    const result = normalizeCatalogEffect(hostile, 'hostile_item')

    // The returned object should contain ONLY the validated fields.
    assert.deepEqual(Object.keys(result).sort(), [
      'stat',
      'target',
      'type',
      'value'
    ])
    assert.equal(Object.hasOwn(result, '__proto__'), false)
    assert.equal(Object.hasOwn(result, 'constructor'), false)
    assert.equal(result.__proto__, Object.prototype)
    assert.equal({}.polluted, undefined)
  })

  test('rejects inputs whose discriminator only lives on the prototype', () => {
    const proto = { type: 'passive', key: 'roadie_bonus' }
    const payload = Object.create(proto)
    assert.throws(
      () => normalizeCatalogEffect(payload, 'prototype_payload'),
      /Invalid catalog effect for item "prototype_payload"/
    )
  })
})
