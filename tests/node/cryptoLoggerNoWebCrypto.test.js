import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { getSafeRandom, getSafeUUID } from '../../src/utils/crypto.ts'
import { getSafeUUID as getSafeUUIDDirect } from '../../src/utils/safeUUID.ts'
import { logger } from '../../src/utils/logger.ts'
import { resetSecureRandomBatchForTesting } from '../helpers/cryptoTestUtils.js'

// Real crypto -> errorHandler -> logger -> safeUUID chain, no module mocks.
// Bytes 0x00..0x0f with the v4 version nibble and RFC 4122 variant applied.
const EXPECTED_FALLBACK_UUID = '00010203-0405-4607-8809-0a0b0c0d0e0f'
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('getSafeRandom with Web Crypto unavailable', () => {
  let originalCryptoDescriptor
  let originalRandom
  let randomCalls

  beforeEach(() => {
    assert.equal(process.env.NODE_ENV, 'test')
    originalCryptoDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'crypto'
    )
    originalRandom = Math.random
    // Neither randomUUID nor getRandomValues exists.
    Object.defineProperty(globalThis, 'crypto', {
      value: {},
      configurable: true
    })
    // Call n returns n / 256, so the UUID fallback draws bytes 0, 1, ..., 15.
    randomCalls = 0
    Math.random = () => randomCalls++ / 256
    resetSecureRandomBatchForTesting()
    logger.clear()
    mock.method(console, 'warn', () => {})
  })

  afterEach(() => {
    mock.restoreAll()
    Math.random = originalRandom
    if (originalCryptoDescriptor) {
      Object.defineProperty(globalThis, 'crypto', originalCryptoDescriptor)
    } else {
      delete globalThis.crypto
    }
    logger.clear()
    resetSecureRandomBatchForTesting()
  })

  test('falls back without throwing and logs one warning with a Math.random UUID', () => {
    let first
    let second
    assert.doesNotThrow(() => {
      first = getSafeRandom()
      second = getSafeRandom()
    })

    // The 16 UUID bytes are drawn first, then each call returns Math.random().
    assert.equal(first, 16 / 256)
    assert.equal(second, 17 / 256)

    const warnings = logger.logs.filter(entry => entry.level === 'WARN')
    assert.equal(warnings.length, 1)
    assert.equal(warnings[0].channel, 'ErrorHandler')
    assert.match(warnings[0].id, UUID_V4_PATTERN)
    assert.equal(warnings[0].id, EXPECTED_FALLBACK_UUID)
  })

  test('crypto.ts re-exports the dependency-free getSafeUUID', () => {
    assert.equal(getSafeUUID, getSafeUUIDDirect)
    assert.equal(getSafeUUIDDirect(), EXPECTED_FALLBACK_UUID)
  })
})
