import { test, describe, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { isImageGenerationAvailable } from '../../src/utils/imageGen.ts'

describe('isImageGenerationAvailable', () => {
  test('should return true when isOnline is explicitly true', () => {
    assert.equal(isImageGenerationAvailable(true), true)
  })

  test('should return false when isOnline is explicitly false', () => {
    assert.equal(isImageGenerationAvailable(false), false)
  })

  describe('when isOnline is not provided (undefined)', () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')

    afterEach(() => {
      if (originalDescriptor) {
        Object.defineProperty(globalThis, 'navigator', originalDescriptor)
      } else {
        // @ts-ignore
        delete globalThis.navigator
      }
    })

    test('should return true if navigator is undefined (e.g. Node environment without mock)', () => {
      // @ts-ignore
      delete globalThis.navigator
      assert.equal(isImageGenerationAvailable(), true)
    })

    test('should return true if navigator.onLine is true', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { onLine: true },
        configurable: true,
        writable: true
      })
      assert.equal(isImageGenerationAvailable(), true)
    })

    test('should return false if navigator.onLine is false', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { onLine: false },
        configurable: true,
        writable: true
      })
      assert.equal(isImageGenerationAvailable(), false)
    })
  })
})
