// TODO: Implement this
/**
 * @fileoverview Tests for the error handler module
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  GameError,
  StateError,
  StorageError,
  AudioError,
  ErrorCategory,
  ErrorSeverity,
  handleError,
  safeStorageOperation,
  withRetry,
  initGlobalErrorHandling
} from '../src/utils/errorHandler.js'

describe('Custom Error Classes', () => {
  describe('GameError', () => {
    it('should initialize with default values', () => {
      const error = new GameError('Default error')
      assert.strictEqual(error.name, 'GameError')
      assert.strictEqual(error.message, 'Default error')
      assert.strictEqual(error.category, ErrorCategory.UNKNOWN)
      assert.strictEqual(error.severity, ErrorSeverity.MEDIUM)
      assert.deepStrictEqual(error.context, {})
      assert.strictEqual(error.recoverable, true)
      assert.ok(typeof error.timestamp === 'number')
    })

    it('should initialize with custom values', () => {
      const context = { foo: 'bar' }
      const error = new GameError('Custom error', {
        category: ErrorCategory.STATE,
        severity: ErrorSeverity.HIGH,
        context,
        recoverable: false
      })
      assert.strictEqual(error.category, ErrorCategory.STATE)
      assert.strictEqual(error.severity, ErrorSeverity.HIGH)
      assert.deepStrictEqual(error.context, context)
      assert.strictEqual(error.recoverable, false)
    })

    it('should produce a complete log object via toLogObject', () => {
      const context = { data: 123 }
      const error = new GameError('Log test', {
        category: ErrorCategory.GAME_LOGIC,
        severity: ErrorSeverity.CRITICAL,
        context,
        recoverable: true
      })
      const log = error.toLogObject()
      assert.strictEqual(log.name, 'GameError')
      assert.strictEqual(log.message, 'Log test')
      assert.strictEqual(log.category, ErrorCategory.GAME_LOGIC)
      assert.strictEqual(log.severity, ErrorSeverity.CRITICAL)
      assert.deepStrictEqual(log.context, context)
      assert.strictEqual(log.recoverable, true)
      assert.strictEqual(log.timestamp, error.timestamp)
      assert.strictEqual(log.stack, error.stack)
    })
  })

  describe('StateError', () => {
    it('should have correct name', () => {
      const error = new StateError('State error')
      assert.strictEqual(error.name, 'StateError')
    })
  })

  describe('StorageError', () => {
    it('should have correct name', () => {
      const error = new StorageError('Storage error')
      assert.strictEqual(error.name, 'StorageError')
    })
  })

  describe('AudioError', () => {
    it('should have correct name and category', () => {
      const error = new AudioError('Missing OGG')
      assert.strictEqual(error.name, 'AudioError')
      assert.strictEqual(error.category, ErrorCategory.AUDIO)
      assert.strictEqual(error.severity, ErrorSeverity.MEDIUM)
      assert.strictEqual(error.recoverable, true)
    })

    it('should store context for missing OGG asset diagnostics', () => {
      const ctx = {
        songName: '01 Kranker Schrank',
        oggFilename: '01 Kranker Schrank.ogg'
      }
      const error = new AudioError('Audio asset not found', ctx)
      assert.strictEqual(error.context.songName, '01 Kranker Schrank')
      assert.strictEqual(error.context.oggFilename, '01 Kranker Schrank.ogg')
    })

    it('should produce a complete log object via toLogObject', () => {
      const error = new AudioError('decode failed', { codec: 'vorbis' })
      const log = error.toLogObject()
      assert.strictEqual(log.name, 'AudioError')
      assert.strictEqual(log.message, 'decode failed')
      assert.strictEqual(log.category, ErrorCategory.AUDIO)
      assert.strictEqual(log.context.codec, 'vorbis')
      assert.ok(typeof log.timestamp === 'number')
      assert.ok(typeof log.stack === 'string')
    })
  })
})

describe('handleError', () => {
  it('should sanitize cyclic arrays in context', () => {
    const cyclicArray = []
    cyclicArray.push(cyclicArray)

    const result = handleError(new Error('Cyclic array'), {
      silent: true,
      errorInfo: { arr: cyclicArray }
    })

    assert.strictEqual(result.context.arr[0], '[REDACTED]')
  })

  it('should sanitize generic non-plain object payload', () => {
    class CustomObj {
      constructor() {
        this.secret = 'my-secret'
        this.safe = 'ok'
      }
    }
    const result = handleError(new Error('Custom object'), {
      silent: true,
      errorInfo: new CustomObj()
    })
    assert.strictEqual(result.context.secret, '[REDACTED]')
    assert.strictEqual(result.context.safe, 'ok')
  })

  it('should fallback to Unhandled Promise Rejection for reason stringification errors', () => {
    const originalWindow = globalThis.window
    const INIT_SYMBOL = Symbol.for('neurotoxic:initGlobalErrorHandlingDone')
    const originalSymbolValue = originalWindow
      ? originalWindow[INIT_SYMBOL]
      : undefined

    let addedListener = null
    try {
      globalThis.window = {
        addEventListener: (evt, listener) => {
          if (evt === 'unhandledrejection') addedListener = listener
        },
        dispatchEvent: () => {}
      }
      globalThis.window[INIT_SYMBOL] = undefined
      initGlobalErrorHandling()

      const unstringifiable = Object.create(null)
      unstringifiable.toString = () => {
        throw new Error('Cannot stringify')
      }

      assert.doesNotThrow(() => {
        addedListener({ reason: unstringifiable })
      })
    } finally {
      globalThis.window = originalWindow
      if (globalThis.window) {
        globalThis.window[INIT_SYMBOL] = originalSymbolValue
      }
    }
  })

  it('should return empty object for non-object payload when sanitizing', () => {
    const result = handleError(new Error('String payload'), {
      silent: true,
      errorInfo: 'this is a string not an object'
    })
    assert.deepStrictEqual(result.context, {})
  })

  it('should gracefully handle unstringifiable reasons in global error handling', () => {
    const originalWindow = globalThis.window
    const INIT_SYMBOL = Symbol.for('neurotoxic:initGlobalErrorHandlingDone')
    const originalSymbolValue = originalWindow
      ? originalWindow[INIT_SYMBOL]
      : undefined

    let addedListener = null
    try {
      globalThis.window = {
        addEventListener: (evt, listener) => {
          if (evt === 'unhandledrejection') addedListener = listener
        },
        dispatchEvent: () => {}
      }
      globalThis.window[INIT_SYMBOL] = undefined
      initGlobalErrorHandling()

      const reasonObj = Object.create(null)
      reasonObj[Symbol.toPrimitive] = () => {
        throw new Error('Not stringifiable')
      }

      assert.doesNotThrow(() => {
        addedListener({ reason: reasonObj })
      })
    } finally {
      globalThis.window = originalWindow
      if (globalThis.window) {
        globalThis.window[INIT_SYMBOL] = originalSymbolValue
      }
    }
  })

  it('should truncate errorLog to MAX_ERROR_LOG_SIZE', () => {
    for (let i = 0; i < 105; i++) {
      handleError(new Error('Log size test ' + i), { silent: true })
    }
    assert.ok(true)
  })

  it('should log locally to logger.debug for ErrorSeverity.LOW', async () => {
    const { logger } = await import('../src/utils/logger.js')
    const originalDebug = logger.debug
    let debugCalled = false
    let loggedChannel = ''
    let loggedMsg = ''

    logger.debug = (channel, msg, _data) => {
      debugCalled = true
      loggedChannel = channel
      loggedMsg = msg
    }

    try {
      handleError(new Error('Low severity error'), {
        silent: true,
        severity: ErrorSeverity.LOW
      })
      assert.strictEqual(
        debugCalled,
        true,
        'logger.debug should have been called'
      )
      assert.strictEqual(loggedChannel, 'ErrorHandler')
      assert.strictEqual(loggedMsg, 'Low severity error')
    } finally {
      logger.debug = originalDebug
    }
  })

  it('should safely catch fetch async failures during reportErrorRemote', () => {
    const originalWindow = globalThis.window
    const originalFetch = globalThis.fetch

    let fetchCalled = false
    globalThis.window = {
      navigator: { onLine: true },
      dispatchEvent: () => true
    }
    globalThis.fetch = () => {
      fetchCalled = true
      return Promise.reject(new Error('Fetch failed'))
    }

    try {
      const result = handleError(new Error('Remote fetch fail test'), {
        silent: true
      })
      assert.strictEqual(fetchCalled, true, 'fetch should have been called')
      assert.strictEqual(result.message, 'Remote fetch fail test')
    } finally {
      globalThis.window = originalWindow
      globalThis.fetch = originalFetch
    }
  })

  it('should safely catch fetch synchronous throw during reportErrorRemote', () => {
    const originalWindow = globalThis.window
    const originalFetch = globalThis.fetch

    let fetchCalled = false
    globalThis.window = {
      navigator: { onLine: true },
      dispatchEvent: () => true
    }
    globalThis.fetch = () => {
      fetchCalled = true
      throw new Error('Fetch sync failed')
    }

    try {
      const result = handleError(new Error('Remote fetch sync fail test'), {
        silent: true
      })
      assert.strictEqual(fetchCalled, true, 'fetch should have been called')
      assert.strictEqual(result.message, 'Remote fetch sync fail test')
    } finally {
      globalThis.window = originalWindow
      globalThis.fetch = originalFetch
    }
  })

  it('should safely catch sendBeacon failures during reportErrorRemote', () => {
    const originalWindow = globalThis.window
    const originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'navigator'
    )

    let beaconCalled = false
    globalThis.window = {
      navigator: { onLine: true },
      dispatchEvent: () => true
    }
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      writable: true,
      value: {
        sendBeacon: () => {
          beaconCalled = true
          throw new Error('Beacon failed')
        }
      }
    })

    try {
      const result = handleError(new Error('Remote beacon fail test'), {
        silent: true
      })
      assert.strictEqual(
        beaconCalled,
        true,
        'sendBeacon should have been called'
      )
      assert.strictEqual(result.message, 'Remote beacon fail test')
    } finally {
      globalThis.window = originalWindow
      if (originalNavigatorDescriptor) {
        Object.defineProperty(
          globalThis,
          'navigator',
          originalNavigatorDescriptor
        )
      } else {
        delete globalThis.navigator
      }
    }
  })

  it('should call addToast when not silent', () => {
    let toastCalled = false
    let toastMessage = ''
    let toastType = ''

    const addToast = (message, type) => {
      toastCalled = true
      toastMessage = message
      toastType = type
    }

    const error = new StateError('Test error')
    handleError(error, { addToast })

    assert.strictEqual(toastCalled, true)
    assert.strictEqual(toastMessage, 'Test error')
    assert.strictEqual(toastType, 'error')
  })

  it('should not call addToast when silent', () => {
    let toastCalled = false
    const addToast = () => {
      toastCalled = true
    }

    const error = new StateError('Test error')
    handleError(error, { addToast, silent: true })

    assert.strictEqual(toastCalled, false)
  })

  it('should use fallback message for errors without message', () => {
    const error = new Error()
    const result = handleError(error, {
      silent: true,
      fallbackMessage: 'Fallback'
    })

    assert.strictEqual(result.message, 'Fallback')
  })

  it('should allow severity override when options.severity is valid', () => {
    const error = new StateError('Severity override')
    const result = handleError(error, {
      silent: true,
      severity: 'critical'
    })

    assert.strictEqual(result.severity, ErrorSeverity.CRITICAL)
  })

  it('should ignore invalid errorInfo payload types', () => {
    const error = new StateError('Invalid errorInfo')
    const result = handleError(error, {
      silent: true,
      errorInfo: 'not-an-object'
    })

    assert.deepStrictEqual(result.context, {})
  })

  it('should ignore unrecognized severity override and preserve original error severity', () => {
    const error = new StateError('Bad severity')
    const result = handleError(error, {
      silent: true,
      severity: 'SEVERE'
    })

    assert.strictEqual(result.severity, error.severity)
  })

  it('should preserve diagnostics from Error context objects', () => {
    const wrappedError = new Error('Original context error')
    const gameError = new StateError('Context wrapper')
    gameError.context = wrappedError

    const result = handleError(gameError, { silent: true })

    assert.strictEqual(result.context.name, 'Error')
    assert.strictEqual(result.context.message, 'Original context error')
    assert.ok(typeof result.context.stack === 'string')
  })

  it('should redact sensitive keys matched by substring patterns', () => {
    const error = new Error('Pattern redaction')
    const result = handleError(error, {
      silent: true,
      errorInfo: {
        accessToken: 'abc',
        refresh_token: 'def',
        clientSecret: 'ghi',
        apiKey: 'jkl',
        nested: { authHeader: 'Bearer x' }
      }
    })

    assert.strictEqual(result.context.accessToken, '[REDACTED]')
    assert.strictEqual(result.context.refresh_token, '[REDACTED]')
    assert.strictEqual(result.context.clientSecret, '[REDACTED]')
    assert.strictEqual(result.context.apiKey, '[REDACTED]')
    assert.strictEqual(result.context.nested.authHeader, '[REDACTED]')
  })

  it('should short-circuit cyclic context structures', () => {
    const cyclic = { safe: 'ok' }
    cyclic.self = cyclic

    const result = handleError(new Error('Cyclic context'), {
      silent: true,
      errorInfo: cyclic
    })

    assert.strictEqual(result.context.safe, 'ok')
    assert.strictEqual(result.context.self, '[REDACTED]')
  })

  it('should dispatch critical event with sanitized payload', () => {
    const dispatchCalls = []
    const originalWindow = globalThis.window
    globalThis.window = {
      dispatchEvent: event => {
        dispatchCalls.push(event)
        return true
      }
    }

    try {
      const result = handleError(new Error('Critical event'), {
        silent: true,
        severity: 'critical',
        errorInfo: { token: 'secret-token', nested: { email: 'a@b.com' } }
      })

      assert.strictEqual(result.context.token, '[REDACTED]')
      assert.strictEqual(result.context.nested.email, '[REDACTED]')
      assert.strictEqual(dispatchCalls.length, 1)
      assert.strictEqual(dispatchCalls[0].type, 'app:error:critical')
      assert.deepStrictEqual(dispatchCalls[0].detail, {
        message: 'Critical event',
        code: ErrorCategory.UNKNOWN,
        timestamp: result.timestamp
      })
    } finally {
      globalThis.window = originalWindow
    }
  })

  it('should sanitize remote telemetry payload and exclude user agent', () => {
    const originalWindow = globalThis.window
    const originalFetch = globalThis.fetch
    const originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'navigator'
    )

    const fetchCalls = []
    const beaconCalls = []

    globalThis.fetch = (url, options) => {
      fetchCalls.push({ url, options })
      return Promise.resolve({ ok: true })
    }
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      writable: true,
      value: {
        userAgent: 'sensitive-agent',
        sendBeacon: (url, payload) => {
          beaconCalls.push({ url, payload })
          return true
        }
      }
    })
    globalThis.window = {
      navigator: { onLine: true },
      dispatchEvent: () => true
    }

    try {
      handleError(new Error('Sensitive info: token=SECRET123'), {
        silent: true
      })

      assert.strictEqual(fetchCalls.length, 1)
      assert.strictEqual(fetchCalls[0].url, '/api/analytics/error')
      const fetchPayload = JSON.parse(fetchCalls[0].options.body)
      assert.deepStrictEqual(fetchPayload, {
        message: 'Error captured',
        code: ErrorCategory.UNKNOWN,
        timestamp: fetchPayload.timestamp
      })

      assert.strictEqual(beaconCalls.length, 1)
      assert.strictEqual(beaconCalls[0].url, '/api/analytics/error')
      const beaconPayload = JSON.parse(beaconCalls[0].payload)
      assert.deepStrictEqual(beaconPayload, {
        event: 'error',
        error: {
          message: 'Error captured',
          code: ErrorCategory.UNKNOWN,
          timestamp: beaconPayload.error.timestamp
        }
      })
      assert.strictEqual(beaconPayload.userAgent, undefined)
    } finally {
      globalThis.window = originalWindow
      globalThis.fetch = originalFetch

      if (originalNavigatorDescriptor) {
        Object.defineProperty(
          globalThis,
          'navigator',
          originalNavigatorDescriptor
        )
      } else {
        delete globalThis.navigator
      }
    }
  })

  it('should safely handle null options object', () => {
    const error = new Error('Null options')
    const result = handleError(error, null)

    assert.strictEqual(result.message, 'Null options')
    assert.deepStrictEqual(result.context, {})
  })
  it('should handle AudioError with silent mode and preserve context', () => {
    let toastCalled = false
    const addToast = () => {
      toastCalled = true
    }

    const error = new AudioError(
      'Audio asset not found for "01 Kranker Schrank": looked up "01 Kranker Schrank.ogg"',
      { songName: '01 Kranker Schrank', oggFilename: '01 Kranker Schrank.ogg' }
    )
    const result = handleError(error, {
      addToast,
      silent: true,
      fallbackMessage: 'Missing OGG audio asset'
    })

    assert.strictEqual(toastCalled, false)
    assert.strictEqual(result.category, ErrorCategory.AUDIO)
    assert.strictEqual(result.context.songName, '01 Kranker Schrank')
  })
})

describe('initGlobalErrorHandling', () => {
  it('should initialize and catch unhandled promise rejections', () => {
    const originalWindow = globalThis.window
    const INIT_SYMBOL = Symbol.for('neurotoxic:initGlobalErrorHandlingDone')
    const originalSymbolValue = originalWindow
      ? originalWindow[INIT_SYMBOL]
      : undefined

    // Simulate window and listener registration
    let addedListener = null
    let registrationCount = 0

    try {
      globalThis.window = {
        addEventListener: (evt, listener) => {
          if (evt === 'unhandledrejection') {
            addedListener = listener
            registrationCount++
          }
        },
        dispatchEvent: () => {}
      }

      // reset symbol
      globalThis.window[INIT_SYMBOL] = undefined

      initGlobalErrorHandling()

      assert.ok(
        addedListener !== null,
        'Should have registered unhandledrejection listener'
      )
      assert.strictEqual(
        globalThis.window[INIT_SYMBOL],
        true,
        'Should mark as initialized'
      )

      // Call again to test idempotence
      initGlobalErrorHandling()

      // Verify it was only registered once
      assert.strictEqual(
        registrationCount,
        1,
        'Should only register the listener once'
      )

      // Test the listener directly with an Error
      const errorEvent = { reason: new Error('unhandled error test') }
      assert.doesNotThrow(() => {
        addedListener(errorEvent)
      }, 'The unhandledrejection listener should process the error without throwing')

      // Test with non-Error string
      const stringEvent = { reason: 'some string reason' }
      addedListener(stringEvent)

      // Test with generic object
      const objEvent = { reason: { foo: 'bar' } }
      addedListener(objEvent)
    } finally {
      globalThis.window = originalWindow
      if (globalThis.window) {
        globalThis.window[INIT_SYMBOL] = originalSymbolValue
      }
    }
  })
})

describe('safeStorageOperation', () => {
  it('should return result on success', () => {
    const result = safeStorageOperation('test', () => 'success')
    assert.strictEqual(result, 'success')
  })

  it('should return fallback on error', () => {
    const result = safeStorageOperation(
      'test',
      () => {
        throw new Error('Storage error')
      },
      'fallback'
    )
    assert.strictEqual(result, 'fallback')
  })

  it('should return null as default fallback when error is thrown and no fallback provided', () => {
    const result = safeStorageOperation('test', () => {
      throw new Error('Storage error without explicit fallback')
    })
    assert.strictEqual(result, null)
  })
})

describe('withRetry', () => {
  it('should resolve immediately if the function succeeds on the first try', async () => {
    const fn = async () => 'success'
    const result = await withRetry(fn)
    assert.strictEqual(result, 'success')
  })

  it('should retry on failure and resolve if it eventually succeeds', async () => {
    let attempts = 0
    const fn = async () => {
      attempts++
      if (attempts < 3) throw new Error('temporary error')
      return 'eventual success'
    }
    const result = await withRetry(fn, { retries: 3, delay: 10 })
    assert.strictEqual(result, 'eventual success')
    assert.strictEqual(attempts, 3)
  })

  it('should throw the error if the maximum number of retries is exceeded', async () => {
    let attempts = 0
    const fn = async () => {
      attempts++
      throw new Error(`error on attempt ${attempts}`)
    }

    await assert.rejects(
      async () => await withRetry(fn, { retries: 2, delay: 10 }),
      { message: 'error on attempt 3' }
    )
    assert.strictEqual(attempts, 3) // 1 initial + 2 retries
  })

  it('should not retry if the error is a non-recoverable GameError', async () => {
    let attempts = 0
    const fn = async () => {
      attempts++
      throw new GameError('fatal error', { recoverable: false })
    }

    await assert.rejects(
      async () => await withRetry(fn, { retries: 5, delay: 10 }),
      { message: 'fatal error' }
    )
    assert.strictEqual(attempts, 1) // Should fail immediately
  })

  it('should handle fractional and infinite retry values gracefully', async () => {
    let attempts = 0
    const fn = async () => {
      attempts++
      if (attempts < 2) throw new Error('temp error')
      return 'success'
    }

    const resultFractional = await withRetry(fn, { retries: 1.5, delay: 10 })
    assert.strictEqual(resultFractional, 'success')
    assert.strictEqual(attempts, 2)

    let attemptsInf = 0
    const fnInf = async () => {
      attemptsInf++
      throw new Error('fail')
    }

    // Infinity should be handled and default to 3 safe retries (4 maxAttempts)
    await assert.rejects(
      async () => await withRetry(fnInf, { retries: Infinity, delay: 1 }),
      { message: 'fail' }
    )
    assert.strictEqual(attemptsInf, 4)
  })
})
