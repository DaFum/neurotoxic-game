import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { assertNever } from '../../src/utils/assertNever'

describe('assertNever', () => {
  it('throws an error with unknown type when a primitive is passed', () => {
    assert.throws(
      () => assertNever('foo'),
      /Unhandled action type: unknown/
    )
    assert.throws(
      () => assertNever(123),
      /Unhandled action type: unknown/
    )
    assert.throws(
      () => assertNever(null),
      /Unhandled action type: unknown/
    )
    assert.throws(
      () => assertNever(undefined),
      /Unhandled action type: unknown/
    )
  })

  it('throws an error with the action type if an object with a type property is passed', () => {
    assert.throws(
      () => assertNever({ type: 'FOO_ACTION' }),
      /Unhandled action type: FOO_ACTION/
    )
  })

  it('throws an error with unknown if an object without a type property is passed', () => {
    assert.throws(
      () => assertNever({ some: 'prop' }),
      /Unhandled action type: unknown/
    )
  })
})
