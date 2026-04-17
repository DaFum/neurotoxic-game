import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from '../testUtils'
import { useGigEffects } from '../../src/hooks/useGigEffects'

describe('useGigEffects', () => {
  beforeEach(() => {
    setupJSDOM()
    global.requestAnimationFrame = mock.fn(cb => setTimeout(cb, 0))
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
    assert.equal(
      typeof result.current.setBandMemberRef,
      'function',
      'setBandMemberRef should be returned'
    )

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
    assert.equal(
      getElementByIdSpy.mock.callCount(),
      0,
      'Should not query DOM by ID'
    )
    assert.equal(
      mockElement.animate.mock.callCount(),
      1,
      'Should call animate on the element'
    )
  })

  test('chaosStyle memoization check', () => {
    const { result, rerender } = renderHook(props => useGigEffects(props), {
      initialProps: { overload: 40, isToxicMode: false }
    })

    const style1 = result.current.chaosStyle
    assert.deepEqual(style1, {}, 'Initial style should be empty')

    // Same props -> Same reference
    rerender({ overload: 40, isToxicMode: false })
    assert.strictEqual(
      result.current.chaosStyle,
      style1,
      'Style ref should be same'
    )

    // Different overload -> New reference
    rerender({ overload: 60, isToxicMode: false })
    const style2 = result.current.chaosStyle
    assert.notStrictEqual(style2, style1, 'Style ref should change')
    assert.ok(style2.filter.includes('saturate'), 'Should have saturate')

    // Same overload -> Same reference as style2
    rerender({ overload: 60, isToxicMode: false })
    assert.strictEqual(
      result.current.chaosStyle,
      style2,
      'Style ref should be same as style2'
    )
  })
})

describe('calculateChaosStyle', async () => {
  const { calculateChaosStyle } = await import('../../src/hooks/useGigEffects')

  test('returns full chaos style for toxic mode', () => {
    const style = calculateChaosStyle(true, 0)
    assert.equal(style.filter, 'invert(0.1) contrast(1.5) saturate(2)')
  })

  test('returns subtle hue shift for overload > 80', () => {
    const style = calculateChaosStyle(false, 90)
    assert.ok(style.filter.includes('hue-rotate(10deg)'))
    assert.ok(style.filter.includes('saturate('))
  })

  test('returns saturate shift for overload > 50', () => {
    const style = calculateChaosStyle(false, 60)
    assert.ok(style.filter.includes('saturate('))
    assert.ok(!style.filter.includes('hue-rotate'))
  })

  test('returns empty style for low overload', () => {
    const style = calculateChaosStyle(false, 40)
    assert.deepEqual(style, {})
  })
})

describe('applyChaosJitter', async () => {
  beforeEach(() => {
    setupJSDOM()
  })
  afterEach(() => {
    teardownJSDOM()
  })
  const { applyChaosJitter } = await import('../../src/hooks/useGigEffects')

  test('applies translate transform in toxic mode', () => {
    const el = document.createElement('div')
    const mockRandom = () => 0.5 // Returns 0 (0.5 * 4 - 2 = 0)

    const result = applyChaosJitter(el, true, mockRandom)

    assert.equal(result, true)
    assert.equal(el.style.transform, 'translate(0px, 0px)')
  })

  test('removes transform when not in toxic mode', () => {
    const el = document.createElement('div')
    el.style.transform = 'translate(10px, 10px)'

    const result = applyChaosJitter(el, false, () => 0)

    assert.equal(result, true)
    assert.equal(el.style.transform, 'none')
  })

  test('handles errors gracefully', () => {
    const el = document.createElement('div')
    const mockRandom = () => {
      throw new Error('Random error')
    }
    const mockOnError = mock.fn()

    const result = applyChaosJitter(el, true, mockRandom, mockOnError)

    assert.equal(result, false)
    assert.equal(el.style.transform, 'none')
    assert.equal(mockOnError.mock.callCount(), 1)
  })
})
