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
})
