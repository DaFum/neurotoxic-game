import { test, describe, beforeEach, afterEach } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  secureRandom,
  resetSecureRandomBatchForTesting,
  getSafeRandom,
  getSafeUUID
} from '../src/utils/crypto.js'

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
    resetSecureRandomBatchForTesting()

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

  test('should throw error when crypto is undefined', () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      configurable: true
    })

    assert.throws(() => {
      secureRandom()
    }, /Cryptographically secure random number generation is not supported in this environment./)
  })

  test('should throw error when getRandomValues is missing', () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: {},
      configurable: true
    })

    assert.throws(() => {
      secureRandom()
    }, /Cryptographically secure random number generation is not supported in this environment./)
  })

  test('getSafeRandom should use secureRandom when available', () => {
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

    const result = getSafeRandom()
    assert.equal(result, 1234567890 / 4294967296)
  })

  test('getSafeRandom should throw an error when crypto is unavailable', () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: () => 'logger-uuid'
      },
      configurable: true
    })

    // Mock getRandomValues as missing
    Object.defineProperty(globalThis.crypto, 'getRandomValues', {
      value: undefined,
      configurable: true
    })

    assert.throws(() => {
      getSafeRandom()
    }, /Cryptographically secure random number generation is not supported in this environment./)
  })

  test('getSafeUUID should use crypto.randomUUID when available', () => {
    const mockCrypto = {
      randomUUID: () => 'test-uuid-123'
    }

    Object.defineProperty(globalThis, 'crypto', {
      value: mockCrypto,
      configurable: true
    })

    const result = getSafeUUID()
    assert.equal(result, 'test-uuid-123')
  })

  test('getSafeUUID should fall back when randomUUID is unavailable', () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        // Mock only what logger needs to not crash during the fallback path
        randomUUID: () => 'logger-uuid',
        getRandomValues: array => {
          for (let i = 0; i < array.length; i++) {
            array[i] = 1234567890
          }
          return array
        }
      },
      configurable: true
    })

    // Mock randomUUID as missing specifically for getSafeUUID
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      value: undefined,
      configurable: true
    })

    const result = getSafeUUID()
    assert.ok(typeof result === 'string')
    assert.ok(result.length > 0)
  })
})
