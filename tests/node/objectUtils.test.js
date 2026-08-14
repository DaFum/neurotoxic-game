import test from 'node:test'
import assert from 'node:assert/strict'

import {
  deepFreeze,
  hasForbiddenKeysDeep,
  isLooseRecord,
  isPlainRecord,
  sanitizeTraversableValue
} from '../../src/utils/objectUtils'

test('record guards expose loose and strict object semantics explicitly', () => {
  const nullProto = Object.create(null)
  const custom = new (class Custom {})()

  assert.equal(isLooseRecord(nullProto), true)
  assert.equal(isPlainRecord(nullProto), false)
  assert.equal(isLooseRecord(custom), true)
  assert.equal(isPlainRecord(custom), false)
  assert.equal(isLooseRecord([]), false)
  assert.equal(isPlainRecord([]), false)
})

test('hasForbiddenKeysDeep accepts shared child references', () => {
  const shared = { keep: true }
  const sharedArray = ['shared']

  assert.equal(hasForbiddenKeysDeep({ left: shared, right: shared }), false)
  assert.equal(hasForbiddenKeysDeep([shared, shared]), false)
  assert.equal(hasForbiddenKeysDeep({ a: sharedArray, b: sharedArray }), false)
  // A repeat on the active path is still a cycle.
  const cyclic = { nested: {} }
  cyclic.nested.back = cyclic
  assert.equal(hasForbiddenKeysDeep(cyclic), true)
})

test('hasForbiddenKeysDeep inspects non-enumerable own properties', () => {
  const hidden = { keep: true }
  Object.defineProperty(hidden, 'constructor', {
    enumerable: false,
    value: 'polluted'
  })
  assert.equal(hasForbiddenKeysDeep(hidden), true)

  const hiddenAccessor = { keep: true }
  let getterCalls = 0
  Object.defineProperty(hiddenAccessor, 'id', {
    enumerable: false,
    get() {
      getterCalls++
      throw new Error('getter must not run')
    }
  })
  assert.equal(hasForbiddenKeysDeep(hiddenAccessor), true)
  assert.equal(getterCalls, 0)

  // Array `length` is non-enumerable but benign.
  assert.equal(hasForbiddenKeysDeep({ list: [1, 2, 3] }), false)
})

test('sanitizeTraversableValue applies shared recursion rules', () => {
  const input = JSON.parse(
    '{"keep":"<ok><again>","secret":"hidden","__proto__":{"polluted":true},"constructor":"bad","prototype":"bad","nested":{"safe":true,"__proto__":{"nestedPolluted":true}}}'
  )
  input.self = input

  const result = sanitizeTraversableValue(input, {
    isRecord: isLooseRecord,
    createObject: () => Object.create(null),
    shouldSkipKey: key => key === 'secret',
    transformLeaf: value =>
      typeof value === 'string' ? value.replace(/</g, '&lt;') : value
  })

  assert.equal(result.keep, '&lt;ok>&lt;again>')
  assert.equal(result.secret, undefined)
  assert.equal(Object.hasOwn(result, '__proto__'), false)
  assert.equal(Object.hasOwn(result, 'constructor'), false)
  assert.equal(Object.hasOwn(result, 'prototype'), false)
  assert.equal(result.nested.safe, true)
  assert.equal(Object.hasOwn(result.nested, '__proto__'), false)
  assert.equal(result.self, '[REDACTED]')
  assert.equal(Object.getPrototypeOf(result), null)
  assert.equal(Object.getPrototypeOf(result.nested), null)
})

test('sanitizeTraversableValue defaults to null-prototype objects and strips forbidden keys', () => {
  const input = JSON.parse(
    '{"keep":true,"__proto__":{"polluted":true},"nested":{"constructor":"bad","safe":1}}'
  )

  const result = sanitizeTraversableValue(input)

  assert.equal(Object.getPrototypeOf(result), null)
  assert.equal(Object.hasOwn(result, '__proto__'), false)
  assert.equal(result.keep, true)
  assert.equal(Object.getPrototypeOf(result.nested), null)
  assert.equal(Object.hasOwn(result.nested, 'constructor'), false)
  assert.equal(result.nested.safe, 1)
})

test('sanitizeTraversableValue treats sibling aliases as shared values, not cycles', () => {
  const sharedObject = { keep: true }
  const sharedArray = ['shared']
  const input = {
    first: sharedObject,
    second: sharedObject,
    arrayA: sharedArray,
    arrayB: sharedArray
  }
  input.self = input

  const result = sanitizeTraversableValue(input)

  assert.equal(result.first.keep, true)
  assert.equal(result.second.keep, true)
  assert.deepEqual(result.arrayA, ['shared'])
  assert.deepEqual(result.arrayB, ['shared'])
  assert.equal(result.self, '[REDACTED]')
})

test('sanitizeTraversableValue handles sparse arrays by dropping missing indices', () => {
  // biome-ignore lint/suspicious/noSparseArray: Intentional sparse array for testing
  // eslint-disable-next-line no-sparse-arrays
  const sparseArray = [1, , 3] // index 1 is missing
  const input = { sparse: sparseArray }

  const result = sanitizeTraversableValue(input, {
    dropUndefinedLeaves: true
  })

  assert.deepStrictEqual(result.sparse, [1, 3])
})

test('deepFreeze freezes an object and its nested children', () => {
  const obj = { a: 1, nested: { b: 2, deep: { c: 3 } } }
  const result = deepFreeze(obj)
  assert.equal(result, obj)
  assert.equal(Object.isFrozen(result), true)
  assert.equal(Object.isFrozen(result.nested), true)
  assert.equal(Object.isFrozen(result.nested.deep), true)
})

test('deepFreeze traverses already frozen parent objects and freezes mutable children', () => {
  const child = { mutable: true, nested: { value: 42 } }
  const parent = Object.freeze({ child })
  assert.equal(Object.isFrozen(parent), true)
  assert.equal(Object.isFrozen(child), false)

  deepFreeze(parent)
  assert.equal(Object.isFrozen(parent), true)
  assert.equal(Object.isFrozen(child), true)
  assert.equal(Object.isFrozen(child.nested), true)
})
