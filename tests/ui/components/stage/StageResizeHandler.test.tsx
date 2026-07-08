import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { StageResizeHandler } from '../../../../src/components/stage/StageResizeHandler'

describe('StageResizeHandler', () => {
  let originalResizeObserver: any

  beforeEach(() => {
    originalResizeObserver = global.ResizeObserver
  })

  afterEach(() => {
    global.ResizeObserver = originalResizeObserver
    vi.restoreAllMocks()
  })

  it('should use ResizeObserver when available', () => {
    const mockObserve = vi.fn()
    const mockDisconnect = vi.fn()

    // We need to implement it as a class to be used with 'new'
    class MockResizeObserver {
      observe = mockObserve
      disconnect = mockDisconnect
      constructor(public callback: any) {}
    }

    global.ResizeObserver = MockResizeObserver as any

    const handleResize = vi.fn()
    const handler = new StageResizeHandler(handleResize)
    const element = document.createElement('div')

    handler.setup(element)

    expect(mockObserve).toHaveBeenCalledWith(element)

    // Trigger the callback
    // Access the instance of MockResizeObserver created by handler
    const observerInstance = (handler as any).resizeObserver
    observerInstance.callback()

    expect(handleResize).toHaveBeenCalled()

    handler.cleanup()
    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('should fallback to window resize when ResizeObserver is not available', () => {
    global.ResizeObserver = undefined as any
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const handleResize = vi.fn()
    const handler = new StageResizeHandler(handleResize)
    const element = document.createElement('div')

    handler.setup(element)

    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    // Trigger window resize
    window.dispatchEvent(new Event('resize'))
    expect(handleResize).toHaveBeenCalled()

    handler.cleanup()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
