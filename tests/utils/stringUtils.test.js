import { describe, it } from 'vitest'
import assert from 'node:assert'
import { hashString } from '../../src/utils/stringUtils.ts'

describe('hashString', () => {
  const testCases = [
    { input: 'test', expected: 3556498 },
    { input: 'hello world', expected: 1794106052 },
    { input: '', expected: 0 }
  ]

  for (const { input, expected } of testCases) {
    it(`returns ${expected} for input string "${input}"`, () => {
      assert.strictEqual(hashString(input), expected)
    })
  }
})
