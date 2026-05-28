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
    const originalNavigator = global.navigator

    afterEach(() => {
      global.navigator = originalNavigator
    })

    test('should return true if navigator is undefined (e.g. Node environment without mock)', () => {
      // @ts-ignore
      delete global.navigator
      assert.equal(isImageGenerationAvailable(), true)
    })

    test('should return true if navigator.onLine is true', () => {
      global.navigator = { onLine: true }
      assert.equal(isImageGenerationAvailable(), true)
    })

    test('should return false if navigator.onLine is false', () => {
      global.navigator = { onLine: false }
      assert.equal(isImageGenerationAvailable(), false)
    })
  })
})
