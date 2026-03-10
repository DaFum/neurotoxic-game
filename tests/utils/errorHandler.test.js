import { describe, it, expect } from 'vitest'
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

      expect(addToastCalled).toBe(true)
      expect(toastType).toBe('error')
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

      expect(addToastCalled).toBe(false)
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
      expect(addToastCalled).toBe(true)
      expect(toastMessage).toBe('Fallback message used')
    })

    it('catches and falls back when internal mechanisms throw an error', () => {
      const originalFetch = global.fetch
      const originalWindow = global.window

      global.window = { navigator: { onLine: true } }
      global.fetch = () => {
        throw new Error('fetch error forced for test')
      }

      try {
        handleError(new Error('Test error'), {})
        expect(true).toBe(true)
      } catch (err) {
        throw new Error(`handleError threw an unexpected error: ${err.message}`)
      } finally {
        global.fetch = originalFetch
        global.window = originalWindow
      }
    })
  })
})
