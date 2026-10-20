import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKabelsalatShuffle } from '../../src/scenes/kabelsalat/hooks/useKabelsalatShuffle'

const CONNECTIONS = {}
const WINNING_REF = { current: false }

const renderShuffle = (setSocketOrder, isCableSelected) =>
  renderHook(
    ({ selected }) =>
      useKabelsalatShuffle(
        false,
        false,
        false,
        CONNECTIONS,
        WINNING_REF,
        setSocketOrder,
        selected
      ),
    { initialProps: { selected: isCableSelected } }
  )

describe('useKabelsalatShuffle', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shuffles sockets every 2s while no cable is selected', () => {
    vi.useFakeTimers()
    const setSocketOrder = vi.fn()
    renderShuffle(setSocketOrder, false)

    vi.advanceTimersByTime(2000)

    expect(setSocketOrder).toHaveBeenCalledTimes(1)
  })

  it('pauses the shuffle while a cable is selected and restarts a full 2s interval after deselection', () => {
    vi.useFakeTimers()
    const setSocketOrder = vi.fn()
    const { rerender } = renderShuffle(setSocketOrder, true)

    vi.advanceTimersByTime(6000)
    expect(setSocketOrder).not.toHaveBeenCalled()

    rerender({ selected: false })
    vi.advanceTimersByTime(1999)
    expect(setSocketOrder).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(setSocketOrder).toHaveBeenCalledTimes(1)
  })
})
