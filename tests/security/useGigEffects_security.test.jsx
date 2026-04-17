import { test, describe, beforeEach, afterEach, vi, expect } from 'vitest'
import { renderHook, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from '../testUtils'
import { useGigEffects } from '../../src/hooks/useGigEffects'

describe('useGigEffects Security', () => {
  beforeEach(() => {
    setupJSDOM()
    global.cancelAnimationFrame = vi.fn()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
    vi.restoreAllMocks()
    if (global.requestAnimationFrame?.mockRestore) {
      global.requestAnimationFrame.mockRestore()
    }
  })

  test('Chaos Mode should NOT use Math.random', async () => {
    const stats = { isToxicMode: true, overload: 0 }

    // Spy on Math.random
    const randomSpy = vi.spyOn(Math, 'random')

    // We need to capture the RAF callback
    let rafCallback
    global.requestAnimationFrame = vi.fn(cb => {
      rafCallback = cb
      return 1
    })

    const { result } = renderHook(() => useGigEffects(stats))

    // Set the ref so the code path is reached
    result.current.chaosContainerRef.current = { style: {} }

    // Trigger the RAF callback manually
    if (rafCallback) {
      rafCallback()
    }

    // Assert Math.random was NOT called
    expect(randomSpy).not.toHaveBeenCalled()
  })
})
