import { expect, test, vi } from 'vitest'
import { translateContextKeys } from '../../src/utils/translationUtils.js'

test('translateContextKeys translates valid keys and ignores others', () => {
  const t = vi.fn(key => `translated:${key}`)
  const context = {
    validKey: 'ui:test',
    invalidKey: 'other:test',
    notAKey: 'normal string'
  }

  const result = translateContextKeys(context, t)

  expect(result.validKey).toBe('translated:ui:test')
  expect(result.invalidKey).toBe('other:test')
  expect(result.notAKey).toBe('normal string')
  expect(t).toHaveBeenCalledWith('ui:test')
})

test('translateContextKeys translates valid traits keys', () => {
  const t = vi.fn(key => `translated:${key}`)
  const context = {
    traitKey: 'traits:grudgeHolder.name',
    traitKeyNested: { name: 'traits:peacemaker.name' }
  }

  const result = translateContextKeys(context, t)

  expect(result.traitKey).toBe('translated:traits:grudgeHolder.name')
  expect(result.traitKeyNested.name).toBe('translated:traits:peacemaker.name')
  expect(t).toHaveBeenCalledWith('traits:grudgeHolder.name')
  expect(t).toHaveBeenCalledWith('traits:peacemaker.name')
})

test('translateContextKeys handles nested objects and arrays', () => {
  const t = vi.fn(key => `translated:${key}`)
  const context = {
    nested: {
      key: 'events:boom'
    },
    arr: ['ui:one', 'normal', { deep: 'venues:place' }]
  }

  const result = translateContextKeys(context, t)

  expect(result.nested.key).toBe('translated:events:boom')
  expect(result.arr[0]).toBe('translated:ui:one')
  expect(result.arr[1]).toBe('normal')
  expect(result.arr[2].deep).toBe('translated:venues:place')
})

test('translateContextKeys filters forbidden keys', () => {
  const t = vi.fn(key => key)
  // Use JSON.parse to ensure these are own properties
  const context = JSON.parse(`{
    "normal": "value",
    "__proto__": { "polluted": true },
    "constructor": { "prototype": { "polluted": true } },
    "prototype": { "polluted": true }
  }`)

  const result = translateContextKeys(context, t)

  expect(result.normal).toBe('value')
  expect(Object.hasOwn(result, '__proto__')).toBe(false)
  expect(Object.hasOwn(result, 'constructor')).toBe(false)
  expect(Object.hasOwn(result, 'prototype')).toBe(false)
})

test('translateContextKeys filters forbidden keys in nested objects', () => {
  const t = vi.fn(key => key)
  const context = {
    nested: JSON.parse(`{
      "normal": "value",
      "__proto__": { "polluted": true }
    }`)
  }

  const result = translateContextKeys(context, t)

  expect(result.nested.normal).toBe('value')
  expect(Object.hasOwn(result.nested, '__proto__')).toBe(false)
})

test('translateContextKeys handles non-object types', () => {
  const t = vi.fn()
  expect(translateContextKeys(null, t)).toBeNull()
  expect(translateContextKeys(undefined, t)).toBeUndefined()
  expect(translateContextKeys(123, t)).toBe(123)
  expect(translateContextKeys('string', t)).toBe('string')
})

test('translateContextKeys ignores inherited properties', () => {
  const proto = { inherited: 'ui:key' }
  const context = Object.create(proto)
  context.own = 'ui:own'

  const result = translateContextKeys(context, (key) => `translated:${key}`)

  expect(result.own).toBe('translated:ui:own')
  expect(Object.hasOwn(result, 'inherited')).toBe(false)
  expect(result.inherited).toBeUndefined()
})

test('translateContextKeys handles arrays at top level', () => {
  const t = vi.fn(key => `translated:${key}`)
  const context = ['ui:key', 'normal']
  const result = translateContextKeys(context, t)
  expect(result).toEqual(['translated:ui:key', 'normal'])
})
