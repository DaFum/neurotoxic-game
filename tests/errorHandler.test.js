/**
 * @fileoverview Tests for the error handler module
 */

import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import {
  GameError,
  StateError,
  AudioError,
  StorageError,
  RenderError,
  GameLogicError,
  ErrorSeverity,
  ErrorCategory,
  handleError,
  getErrorLog,
  clearErrorLog,
  withErrorHandling,
  withSyncErrorHandling,
  safeStorageOperation,
  validateRequiredFields,
  assertCondition
} from '../src/utils/errorHandler.js'

describe('Custom Error Classes', () => {
  describe('GameError', () => {
    it('should create error with default values', () => {
      const error = new GameError('Test error')

      assert.strictEqual(error.message, 'Test error')
      assert.strictEqual(error.name, 'GameError')
      assert.strictEqual(error.category, ErrorCategory.UNKNOWN)
      assert.strictEqual(error.severity, ErrorSeverity.MEDIUM)
      assert.strictEqual(error.recoverable, true)
      assert.ok(error.timestamp > 0)
    })

    it('should create error with custom options', () => {
      const error = new GameError('Test error', {
        category: ErrorCategory.STATE,
        severity: ErrorSeverity.HIGH,
        context: { key: 'value' },
        recoverable: false
      })

      assert.strictEqual(error.category, ErrorCategory.STATE)
      assert.strictEqual(error.severity, ErrorSeverity.HIGH)
      assert.deepStrictEqual(error.context, { key: 'value' })
      assert.strictEqual(error.recoverable, false)
    })

    it('should convert to log object', () => {
      const error = new GameError('Test error')
      const logObj = error.toLogObject()

      assert.strictEqual(logObj.name, 'GameError')
      assert.strictEqual(logObj.message, 'Test error')
      assert.ok(logObj.stack)
      assert.ok(logObj.timestamp)
    })
  })

  describe('StateError', () => {
    it('should have correct defaults', () => {
      const error = new StateError('State error')

      assert.strictEqual(error.name, 'StateError')
      assert.strictEqual(error.category, ErrorCategory.STATE)
      assert.strictEqual(error.severity, ErrorSeverity.HIGH)
    })
  })

  describe('AudioError', () => {
    it('should have correct defaults', () => {
      const error = new AudioError('Audio error')

      assert.strictEqual(error.name, 'AudioError')
      assert.strictEqual(error.category, ErrorCategory.AUDIO)
      assert.strictEqual(error.severity, ErrorSeverity.LOW)
    })
  })

  describe('StorageError', () => {
    it('should have correct defaults', () => {
      const error = new StorageError('Storage error')

      assert.strictEqual(error.name, 'StorageError')
      assert.strictEqual(error.category, ErrorCategory.STORAGE)
      assert.strictEqual(error.severity, ErrorSeverity.MEDIUM)
    })
  })

  describe('RenderError', () => {
    it('should have correct defaults', () => {
      const error = new RenderError('Render error')

      assert.strictEqual(error.name, 'RenderError')
      assert.strictEqual(error.category, ErrorCategory.RENDER)
      assert.strictEqual(error.severity, ErrorSeverity.HIGH)
      assert.strictEqual(error.recoverable, false)
    })
  })

  describe('GameLogicError', () => {
    it('should have correct defaults', () => {
      const error = new GameLogicError('Logic error')

      assert.strictEqual(error.name, 'GameLogicError')
      assert.strictEqual(error.category, ErrorCategory.GAME_LOGIC)
      assert.strictEqual(error.severity, ErrorSeverity.MEDIUM)
    })
  })
})

describe('handleError', () => {
  beforeEach(() => {
    clearErrorLog()
  })

  it('should log GameError to error log', () => {
    const error = new StateError('Test error')
    handleError(error, { silent: true })

    const log = getErrorLog()
    assert.strictEqual(log.length, 1)
    assert.strictEqual(log[0].message, 'Test error')
  })

  it('should handle regular Error', () => {
    const error = new Error('Regular error')
    const result = handleError(error, { silent: true })

    assert.strictEqual(result.message, 'Regular error')
    assert.strictEqual(result.category, ErrorCategory.UNKNOWN)
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
    const addToast = () => { toastCalled = true }

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
})

describe('Error Log', () => {
  beforeEach(() => {
    clearErrorLog()
  })

  it('should maintain error log', () => {
    handleError(new GameError('Error 1'), { silent: true })
    handleError(new GameError('Error 2'), { silent: true })

    const log = getErrorLog()
    assert.strictEqual(log.length, 2)
  })

  it('should clear error log', () => {
    handleError(new GameError('Error 1'), { silent: true })
    clearErrorLog()

    const log = getErrorLog()
    assert.strictEqual(log.length, 0)
  })

  it('should return a copy of error log', () => {
    handleError(new GameError('Error 1'), { silent: true })

    const log1 = getErrorLog()
    log1.push({ fake: true })

    const log2 = getErrorLog()
    assert.strictEqual(log2.length, 1)
  })
})

describe('withErrorHandling', () => {
  beforeEach(() => {
    clearErrorLog()
  })

  it('should handle async function success', async () => {
    const fn = async () => 'success'
    const wrapped = withErrorHandling(fn, { silent: true })

    const result = await wrapped()
    assert.strictEqual(result, 'success')
  })

  it('should handle async function error', async () => {
    const fn = async () => { throw new Error('Async error') }
    const wrapped = withErrorHandling(fn, { silent: true, swallowError: true })

    const result = await wrapped()
    assert.strictEqual(result, undefined)

    const log = getErrorLog()
    assert.strictEqual(log.length, 1)
  })

  it('should rethrow error when swallowError is false', async () => {
    const fn = async () => { throw new Error('Async error') }
    const wrapped = withErrorHandling(fn, { silent: true })

    await assert.rejects(wrapped(), /Async error/)
  })

  it('should return fallback value on error', async () => {
    const fn = async () => { throw new Error('Async error') }
    const wrapped = withErrorHandling(fn, {
      silent: true,
      swallowError: true,
      fallbackValue: 'fallback'
    })

    const result = await wrapped()
    assert.strictEqual(result, 'fallback')
  })
})

describe('withSyncErrorHandling', () => {
  beforeEach(() => {
    clearErrorLog()
  })

  it('should handle sync function success', () => {
    const fn = () => 'success'
    const wrapped = withSyncErrorHandling(fn, { silent: true })

    const result = wrapped()
    assert.strictEqual(result, 'success')
  })

  it('should handle sync function error', () => {
    const fn = () => { throw new Error('Sync error') }
    const wrapped = withSyncErrorHandling(fn, { silent: true, swallowError: true })

    const result = wrapped()
    assert.strictEqual(result, undefined)

    const log = getErrorLog()
    assert.strictEqual(log.length, 1)
  })
})

describe('safeStorageOperation', () => {
  beforeEach(() => {
    clearErrorLog()
  })

  it('should return result on success', () => {
    const result = safeStorageOperation('test', () => 'success')
    assert.strictEqual(result, 'success')
  })

  it('should return fallback on error', () => {
    const result = safeStorageOperation(
      'test',
      () => { throw new Error('Storage error') },
      'fallback'
    )
    assert.strictEqual(result, 'fallback')
  })

  it('should log error to error log', () => {
    safeStorageOperation(
      'test',
      () => { throw new Error('Storage error') }
    )

    const log = getErrorLog()
    assert.strictEqual(log.length, 1)
    assert.ok(log[0].message.includes('Storage operation failed'))
  })
})

describe('validateRequiredFields', () => {
  it('should not throw when all fields present', () => {
    const obj = { a: 1, b: 2, c: 3 }
    assert.doesNotThrow(() => {
      validateRequiredFields(obj, ['a', 'b', 'c'])
    })
  })

  it('should throw StateError when fields missing', () => {
    const obj = { a: 1 }
    assert.throws(
      () => validateRequiredFields(obj, ['a', 'b', 'c']),
      StateError
    )
  })

  it('should include missing fields in error', () => {
    const obj = { a: 1 }
    try {
      validateRequiredFields(obj, ['a', 'b', 'c'], 'TestObject')
    } catch (error) {
      assert.ok(error.message.includes('b'))
      assert.ok(error.message.includes('c'))
      assert.ok(error.message.includes('TestObject'))
    }
  })
})

describe('assertCondition', () => {
  it('should not throw when condition is true', () => {
    assert.doesNotThrow(() => {
      assertCondition(true, 'Should not throw')
    })
  })

  it('should throw GameLogicError when condition is false', () => {
    assert.throws(
      () => assertCondition(false, 'Condition failed'),
      GameLogicError
    )
  })

  it('should include context in error', () => {
    try {
      assertCondition(false, 'Condition failed', { key: 'value' })
    } catch (error) {
      assert.deepStrictEqual(error.context, { key: 'value' })
    }
  })
})

describe('ErrorSeverity', () => {
  it('should have all severity levels', () => {
    assert.strictEqual(ErrorSeverity.LOW, 'low')
    assert.strictEqual(ErrorSeverity.MEDIUM, 'medium')
    assert.strictEqual(ErrorSeverity.HIGH, 'high')
    assert.strictEqual(ErrorSeverity.CRITICAL, 'critical')
  })
})

describe('ErrorCategory', () => {
  it('should have all categories', () => {
    assert.strictEqual(ErrorCategory.STATE, 'state')
    assert.strictEqual(ErrorCategory.RENDER, 'render')
    assert.strictEqual(ErrorCategory.AUDIO, 'audio')
    assert.strictEqual(ErrorCategory.NETWORK, 'network')
    assert.strictEqual(ErrorCategory.STORAGE, 'storage')
    assert.strictEqual(ErrorCategory.INPUT, 'input')
    assert.strictEqual(ErrorCategory.GAME_LOGIC, 'game_logic')
    assert.strictEqual(ErrorCategory.UNKNOWN, 'unknown')
  })
})
