import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from '../testUtils.js'
import { useGigEffects } from '../../src/hooks/useGigEffects.js'

describe('useGigEffects Security', () => {
  beforeEach(() => {
    setupJSDOM()
    // Mock RAF to NOT trigger immediately to avoid loop in tests if not handled
    global.requestAnimationFrame = mock.fn(() => {
      // Just store the callback but don't call it automatically if we want to control timing
      return 1
    })
    global.cancelAnimationFrame = mock.fn()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
    mock.restoreAll()
  })

  test('Chaos Mode should NOT use Math.random', async () => {
    const stats = { isToxicMode: true, overload: 0 }

    // Spy on Math.random
    const randomSpy = mock.method(Math, 'random')

    // We need to capture the RAF callback
    let rafCallback
    global.requestAnimationFrame = mock.fn(cb => {
      rafCallback = cb
      return 1
    })

    const { result } = renderHook(() => useGigEffects(stats), {
      initialProps: stats
    })

    // Set the ref so the code path is reached
    result.current.chaosContainerRef.current = { style: {} }

    // Trigger the RAF callback manually
    if (rafCallback) {
      rafCallback()
    }

    // Assert Math.random was NOT called
    assert.equal(
      randomSpy.mock.callCount(),
      0,
      'Math.random() should not be used for Chaos Mode visuals'
    )
  })
})
