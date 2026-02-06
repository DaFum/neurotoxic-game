/**
 * @fileoverview Tests for the error handler module
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  StateError,
  StorageError,
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
})
