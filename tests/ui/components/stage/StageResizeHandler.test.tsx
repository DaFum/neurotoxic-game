import { describe, it, expect, vi, afterEach } from 'vitest'
import { StageResizeHandler } from '../../../../src/components/stage/StageResizeHandler'

describe('StageResizeHandler', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('should use ResizeObserver when available', () => {
    const mockObserve = vi.fn()
    const mockDisconnect = vi.fn()
    let capturedCallback: (() => void) | undefined

    class MockResizeObserver implements ResizeObserver {
      observe = mockObserve
      disconnect = mockDisconnect
      unobserve = vi.fn()
      constructor(callback: ResizeObserverCallback) {
        capturedCallback = callback as unknown as () => void
      }
    }

    vi.stubGlobal('ResizeObserver', MockResizeObserver)

    const handleResize = vi.fn()
    const handler = new StageResizeHandler(handleResize)
    const element = document.createElement('div')

    handler.setup(element)

    expect(mockObserve).toHaveBeenCalledWith(element)

    // Trigger the callback via the captured reference without accessing private properties
    capturedCallback?.()

    expect(handleResize).toHaveBeenCalled()

    handler.cleanup()
    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('should fallback to window resize when ResizeObserver is not available', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const handleResize = vi.fn()
    const handler = new StageResizeHandler(handleResize)
    const element = document.createElement('div')

    handler.setup(element)

    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', handleResize)

    // Trigger window resize
    window.dispatchEvent(new Event('resize'))
    expect(handleResize).toHaveBeenCalled()

    handler.cleanup()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', handleResize)
  })
})
