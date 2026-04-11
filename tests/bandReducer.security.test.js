import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { handleConsumeItem } from '../src/context/reducers/bandReducer.js'

describe('bandReducer Security - Prototype Pollution', () => {
  it('should reject forbidden keys in handleConsumeItem', () => {
    const baseState = {
      band: {
        inventory: {
          test: 1
        }
      }
    }

    // Try to "consume" a forbidden key
    const forbiddenKeys = ['__proto__', 'constructor', 'prototype']

    forbiddenKeys.forEach(key => {
      const nextState = handleConsumeItem(baseState, key)
      // If it's blocked, it should return the original state
      assert.strictEqual(nextState, baseState, `Key ${key} should be blocked`)
    })
  })

  it('should reject empty or non-string keys in handleConsumeItem', () => {
    const baseState = {
      band: {
        inventory: {
          test: 1
        }
      }
    }

    const invalidKeys = ['', null, undefined, 123, {}, []]

    invalidKeys.forEach(key => {
      const nextState = handleConsumeItem(baseState, key)
      assert.strictEqual(nextState, baseState, `Key ${key} should be rejected`)
    })
  })
})
