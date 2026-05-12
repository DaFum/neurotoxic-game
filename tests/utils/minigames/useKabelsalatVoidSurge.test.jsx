import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useKabelsalatVoidSurge } from '../../../src/scenes/kabelsalat/hooks/useKabelsalatVoidSurge'

describe('useKabelsalatVoidSurge', () => {
  let triggerShockMock
  let tMock

  beforeEach(() => {
    vi.useFakeTimers()
    triggerShockMock = vi.fn()
    tMock = vi.fn((key) => key)
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('initializes at 0 and increments every second when active', () => {
    const { result } = renderHook(() =>
      useKabelsalatVoidSurge(false, false, false, triggerShockMock, tMock)
    )

    expect(result.current.voidSurge).toBe(0)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.voidSurge).toBe(5)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.voidSurge).toBe(15)
  })

  it('triggers shock and resets when reaching 100', () => {
    const { result } = renderHook(() =>
      useKabelsalatVoidSurge(false, false, false, triggerShockMock, tMock)
    )

    act(() => {
      vi.advanceTimersByTime(20000) // 20 * 5 = 100
    })

    expect(triggerShockMock).toHaveBeenCalledTimes(1)
    expect(triggerShockMock).toHaveBeenCalledWith(expect.stringMatching(/ui:minigames\.kabelsalat/i))
    expect(result.current.voidSurge).toBe(0)
  })

  it('does not increment when inactive', () => {
    const { result } = renderHook(() =>
      useKabelsalatVoidSurge(true, false, false, triggerShockMock, tMock) // isPoweredOn = true -> inactive
    )

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.voidSurge).toBe(0)
  })

  it('can be purged manually, incrementing the purged count', () => {
    const { result } = renderHook(() =>
      useKabelsalatVoidSurge(false, false, false, triggerShockMock, tMock)
    )

    act(() => {
      vi.advanceTimersByTime(5000) // should be 25
    })

    expect(result.current.voidSurge).toBe(25)
    expect(result.current.voidSurgesPurged).toBe(0)

    act(() => {
      result.current.purgeVoidSurge()
    })

    expect(result.current.voidSurge).toBe(0)
    expect(result.current.voidSurgesPurged).toBe(1)
  })
})
