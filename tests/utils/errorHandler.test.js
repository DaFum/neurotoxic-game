import { describe, it, vi } from "vitest";
import assert from 'node:assert'
import { handleError, StateError } from '../../src/utils/errorHandler.js'

describe('errorHandler', () => {
  describe('handleError', () => {
    it('calls addToast on ErrorSeverity.HIGH', () => {
      let addToastCalled = false
      let toastType = null
      const mockAddToast = (message, type) => {
        addToastCalled = true
        toastType = type
      }

      handleError(new StateError('Test error'), { addToast: mockAddToast })

      assert.strictEqual(addToastCalled, true)
      assert.strictEqual(toastType, 'error')
    })

    it('suppresses toast when silent option is true', () => {
      let addToastCalled = false
      const mockAddToast = () => {
        addToastCalled = true
      }

      handleError(new Error('Test error'), {
        addToast: mockAddToast,
        silent: true
      })

      assert.strictEqual(addToastCalled, false)
    })

    it('uses fallbackMessage for non-Error instances without a message property', () => {
      let addToastCalled = false
      let toastMessage = null
      const mockAddToast = message => {
        addToastCalled = true
        toastMessage = message
      }

      handleError(
        { someOtherProp: 'weird object' },
        { addToast: mockAddToast, fallbackMessage: 'Fallback message used' }
      )
      assert.strictEqual(addToastCalled, true)
      assert.strictEqual(toastMessage, 'Fallback message used')
    })

    it('catches and falls back when internal mechanisms throw an error', () => {
      const originalFetch = global.fetch
      const originalWindow = global.window

      global.window = { navigator: { onLine: true } }
      global.fetch = () => {
        throw new Error('fetch error forced for test')
      }

      try {
        const result = handleError(new Error('Test error'), {})
        assert.ok(result !== undefined)
        assert.strictEqual(result.message, 'Test error')
      } catch (err) {
        assert.fail(`handleError threw an unexpected error: ${err.message}`)
      } finally {
        global.fetch = originalFetch
        global.window = originalWindow
      }
    })
  })
})
