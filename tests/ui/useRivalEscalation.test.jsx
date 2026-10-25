import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRivalEscalation } from '../../src/hooks/overworld/useRivalEscalation'
import { sanitizeRivalBandUpdates } from '../../src/context/reducers/sanitizers/stateSanitizers'

describe('useRivalEscalation', () => {
  it.each([NaN, Infinity, -Infinity, undefined])(
    'recovers invalid persisted power %s before escalating once',
    powerLevel => {
      const updateRivalBand = vi.fn()
      const rivalBand = { currentLocationId: 'node-1', powerLevel }
      const { rerender } = renderHook(() =>
        useRivalEscalation(rivalBand, 'node-1', updateRivalBand)
      )
      expect(updateRivalBand).toHaveBeenCalledExactlyOnceWith({
        powerLevel: 5,
        lastEscalatedNodeId: 'node-1'
      })
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
    expect(updateRivalBand).toHaveBeenCalledExactlyOnceWith({
      powerLevel: 17,
      lastEscalatedNodeId: 'node-1'
    })
    rerender({ node: 'node-2' })
    rerender({ node: 'node-1' })
    expect(updateRivalBand).toHaveBeenCalledTimes(2)
  })

  it('does not escalate again when the scene remounts at the same node', () => {
    const updateRivalBand = vi.fn()
    // What the first mount persisted.
    const rivalBand = {
      currentLocationId: 'node-1',
      powerLevel: 5,
      lastEscalatedNodeId: 'node-1'
    }

    const first = renderHook(() =>
      useRivalEscalation(rivalBand, 'node-1', updateRivalBand)
    )
    first.unmount()
    renderHook(() => useRivalEscalation(rivalBand, 'node-1', updateRivalBand))

    expect(updateRivalBand).not.toHaveBeenCalled()
  })

  it('escalates once across a real unmount and remount', () => {
    let rival = { currentLocationId: 'node-1', powerLevel: 10 }
    const updateRivalBand = vi.fn(patch => {
      rival = { ...rival, ...sanitizeRivalBandUpdates(patch) }
    })

    const first = renderHook(() =>
      useRivalEscalation(rival, 'node-1', updateRivalBand)
    )
    first.rerender()
    first.unmount()
    const second = renderHook(() =>
      useRivalEscalation(rival, 'node-1', updateRivalBand)
    )
    second.rerender()

    expect(rival.powerLevel).toBe(15)
    expect(updateRivalBand).toHaveBeenCalledTimes(1)
  })

  it('clears the marker once the player leaves, so the next meeting escalates', () => {
    const updateRivalBand = vi.fn()
    const rivalBand = {
      currentLocationId: 'node-1',
      powerLevel: 5,
      lastEscalatedNodeId: 'node-1'
    }
    renderHook(() => useRivalEscalation(rivalBand, 'node-2', updateRivalBand))

    expect(updateRivalBand).toHaveBeenCalledExactlyOnceWith({
      lastEscalatedNodeId: null
    })
  })
})
