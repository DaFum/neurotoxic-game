import test from 'node:test'
import assert from 'node:assert/strict'

import {
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
