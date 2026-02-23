import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import { useGigEffects } from '../src/hooks/useGigEffects.js'

describe('useGigEffects', () => {
  beforeEach(() => {
    setupJSDOM()
    global.requestAnimationFrame = mock.fn((cb) => setTimeout(cb, 0))
    global.cancelAnimationFrame = mock.fn()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
    mock.restoreAll()
  })

  test('triggerBandAnimation uses refs instead of DOM query', () => {
    const stats = { isToxicMode: false, overload: 0 }
    const { result } = renderHook(() => useGigEffects(stats))

    // Check if setBandMemberRef is returned
    assert.equal(typeof result.current.setBandMemberRef, 'function', 'setBandMemberRef should be returned')

    // Create a mock element
    const mockElement = document.createElement('div')

    // Mock animate
    const animMock = {
        cancel: mock.fn(),
        play: mock.fn(),
        effect: { target: mockElement }
    }
    mockElement.animate = mock.fn(() => animMock)

    // Set the ref
    act(() => {
      result.current.setBandMemberRef(0)(mockElement)
    })

    // Spy on getElementById
    const getElementByIdSpy = mock.method(document, 'getElementById')

    // Trigger animation
    act(() => {
      result.current.triggerBandAnimation(0)
    })

    // Assertions
    assert.equal(getElementByIdSpy.mock.callCount(), 0, 'Should not query DOM by ID')
    assert.equal(mockElement.animate.mock.callCount(), 1, 'Should call animate on the element')
  })
})
