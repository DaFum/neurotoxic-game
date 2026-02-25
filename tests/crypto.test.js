import { test, describe, beforeEach, afterEach } from 'node:test'
import { strict as assert } from 'node:assert'
import { secureRandom } from '../src/utils/crypto.js'

describe('secureRandom', () => {
  let originalCryptoDescriptor
  let originalWindowDescriptor
  let originalRandom

  beforeEach(() => {
    // Save original globals
    originalCryptoDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'crypto'
    )
    originalWindowDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'window'
    )
    originalRandom = Math.random

    // Polyfill window if not present to avoid ReferenceError in tests
    // In Node.js, accessing an undeclared 'window' variable throws ReferenceError
    if (!originalWindowDescriptor) {
      globalThis.window = undefined
    }
  })

  afterEach(() => {
    // Restore globals
    if (originalCryptoDescriptor) {
      Object.defineProperty(globalThis, 'crypto', originalCryptoDescriptor)
    } else {
      // If it didn't exist before, remove it (though in Node it likely did)
      delete globalThis.crypto
    }

    if (originalWindowDescriptor) {
      Object.defineProperty(globalThis, 'window', originalWindowDescriptor)
    } else {
      delete globalThis.window
    }

    Math.random = originalRandom
  })

  test('should use crypto.getRandomValues when available', () => {
    const mockCrypto = {
      getRandomValues: array => {
        array[0] = 1234567890
        return array
      }
    }

    Object.defineProperty(globalThis, 'crypto', {
      value: mockCrypto,
      configurable: true
    })

    const result = secureRandom()
    assert.equal(result, 1234567890 / 4294967296)
  })

  test('should return 0 when random value is 0', () => {
    const mockCrypto = {
      getRandomValues: array => {
        array[0] = 0
        return array
      }
    }

    Object.defineProperty(globalThis, 'crypto', {
      value: mockCrypto,
      configurable: true
    })

    const result = secureRandom()
    assert.equal(result, 0)
  })

  test('should return correct value for max uint32', () => {
    const mockCrypto = {
      getRandomValues: array => {
        array[0] = 0xffffffff
        return array
      }
    }

    Object.defineProperty(globalThis, 'crypto', {
      value: mockCrypto,
      configurable: true
    })

    const result = secureRandom()
    assert.equal(result, 0xffffffff / 4294967296)
  })

  test('should fallback to Math.random when crypto is undefined', () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      configurable: true
    })

    // Ensure window is also undefined/null so window.crypto is not used
    // (Already handled by beforeEach setting globalThis.window = undefined if missing)

    Math.random = () => 0.5

    const result = secureRandom()
    assert.equal(result, 0.5)
  })

  test('should fallback to Math.random when getRandomValues is missing', () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: {},
      configurable: true
    })

    Math.random = () => 0.25

    const result = secureRandom()
    assert.equal(result, 0.25)
  })
})
