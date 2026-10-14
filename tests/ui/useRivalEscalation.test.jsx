import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRivalEscalation } from '../../src/hooks/overworld/useRivalEscalation'

describe('useRivalEscalation', () => {
  it.each([NaN, Infinity, -Infinity, undefined])(
    'recovers invalid persisted power %s before escalating once',
    powerLevel => {
      const updateRivalBand = vi.fn()
      const rivalBand = { currentLocationId: 'node-1', powerLevel }
      const { rerender } = renderHook(() =>
        useRivalEscalation(rivalBand, 'node-1', updateRivalBand)
      )
      expect(updateRivalBand).toHaveBeenCalledExactlyOnceWith({ powerLevel: 5 })
      rerender()
      expect(updateRivalBand).toHaveBeenCalledTimes(1)
    }
  )

  it('adds encounter power to valid stored power and permits the next encounter', () => {
    const updateRivalBand = vi.fn()
    const { rerender } = renderHook(
      ({ node }) =>
        useRivalEscalation(
          { currentLocationId: 'node-1', powerLevel: 12 },
          node,
          updateRivalBand
        ),
      { initialProps: { node: 'node-1' } }
    )
    expect(updateRivalBand).toHaveBeenCalledExactlyOnceWith({ powerLevel: 17 })
    rerender({ node: 'node-2' })
    rerender({ node: 'node-1' })
    expect(updateRivalBand).toHaveBeenCalledTimes(2)
  })
})
