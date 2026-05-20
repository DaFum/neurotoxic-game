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
  const input = { keep: '<ok>', secret: 'hidden', nested: { safe: true } }
  input.self = input

  const result = sanitizeTraversableValue(input, {
    isRecord: isLooseRecord,
    createObject: () => Object.create(null),
    shouldSkipKey: key => key === 'secret',
    transformLeaf: value =>
      typeof value === 'string' ? value.replace('<', '&lt;') : value
  })

  assert.equal(result.keep, '&lt;ok>')
  assert.equal(result.secret, undefined)
  assert.equal(result.nested.safe, true)
  assert.equal(result.self, '[REDACTED]')
  assert.equal(Object.getPrototypeOf(result), null)
  assert.equal(Object.getPrototypeOf(result.nested), null)
})
