import { test, describe } from 'vitest'
import assert from 'node:assert/strict'

import { checkInvariants } from '../utils/checkInvariants'
import { HOSTILE_PAYLOAD_CASES } from '../utils/hostilePayloadCases'
import { driveHostileCase } from '../utils/hostilePayloadDriver'

describe('structural fuzz - hostile payloads', () => {
  test('covers at least 20 payload shapes', () => {
    assert.ok(
      HOSTILE_PAYLOAD_CASES.length >= 20,
      `expected >= 20 cases, got ${HOSTILE_PAYLOAD_CASES.length}`
    )
  })

  for (const testCase of HOSTILE_PAYLOAD_CASES) {
    test(`${testCase.boundary}: ${testCase.name}`, () => {
      let state
      assert.doesNotThrow(() => {
        state = driveHostileCase(testCase)
      })

      // "Did not throw" is not the assertion that matters — silent corruption
      // is what this harness exists to catch.
      assert.deepEqual(checkInvariants(state), [])

      if (testCase.pollution) {
        assert.equal({}.polluted, undefined)
        assert.equal(Object.hasOwn(state, 'polluted'), false)
        assert.equal(Object.hasOwn(state.player, 'polluted'), false)
        assert.equal(Object.hasOwn(Object.prototype, 'polluted'), false)
      }
    })
  }
})
