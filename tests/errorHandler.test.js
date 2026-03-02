/**
 * @fileoverview Tests for the error handler module
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  StateError,
  StorageError,
  AudioError,
  ErrorCategory,
  ErrorSeverity,
  handleError,
  safeStorageOperation
} from '../src/utils/errorHandler.js'

describe('Custom Error Classes', () => {
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
