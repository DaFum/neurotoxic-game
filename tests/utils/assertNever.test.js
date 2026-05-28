import { describe, it, expect } from 'vitest'
import { assertNever } from '../../src/utils/assertNever'

describe('assertNever', () => {
  it('throws an error with unknown type when a primitive is passed', () => {
    expect(() => assertNever('foo')).toThrow(/Unhandled action type: unknown/)
    expect(() => assertNever(123)).toThrow(/Unhandled action type: unknown/)
    expect(() => assertNever(null)).toThrow(/Unhandled action type: unknown/)
    expect(() => assertNever(undefined)).toThrow(/Unhandled action type: unknown/)
  })

  it('throws an error with the action type if an object with a type property is passed', () => {
    expect(() => assertNever({ type: 'FOO_ACTION' })).toThrow(
      /Unhandled action type: FOO_ACTION/
    )
  })

  it('throws an error with unknown if an object without a type property is passed', () => {
    expect(() => assertNever({ some: 'prop' })).toThrow(
      /Unhandled action type: unknown/
    )
  })
})
