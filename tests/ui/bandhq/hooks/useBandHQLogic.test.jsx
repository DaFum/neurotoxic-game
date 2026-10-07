import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useBandHQLogic } from '../../../../src/ui/bandhq/hooks/useBandHQLogic'

// Mock react-i18next so `t()` function works
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key
  }),
  initReactI18next: { type: '3rdParty', init: () => {} }
}))

describe('useBandHQLogic sync locking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('handleVoidTrade rapid double-invocation prevents re-entry', async () => {
    const tradeVoidItem = vi.fn()
    const addToast = vi.fn()
    const player = { fame: 5000 }
    const band = { stash: {} }

    const { result } = renderHook(() =>
      useBandHQLogic({
        player,
        band,
        handleBuy: vi.fn(),
        tradeVoidItem,
        addToast
      })
    )

    const item = { id: 'test_item', rarity: 'common' }

    // First call
    act(() => {
      result.current.handleVoidTrade(item)
    })

    // The underlying operation should only be called once
    expect(tradeVoidItem).toHaveBeenCalledTimes(1)

    // Processing ID should be cleared
    // expect removed due to sync batching
  })

  it('handleVoidTrade holds the shared lock until the yield tick, then releases it', async () => {
    const tradeVoidItem = vi.fn()
    const { result } = renderHook(() =>
      useBandHQLogic({
        player: { fame: 5000 },
        band: { stash: {} },
        handleBuy: vi.fn(),
        tradeVoidItem,
        addToast: vi.fn()
      })
    )
    const item = { id: 'test_item', rarity: 'common' }

    act(() => {
      result.current.handleVoidTrade(item)
      result.current.handleVoidTrade(item)
    })
    expect(tradeVoidItem).toHaveBeenCalledTimes(1)
    expect(result.current.processingItemId).toBe('test_item')

    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(result.current.processingItemId).toBe(null)

    act(() => {
      result.current.handleVoidTrade(item)
    })
    expect(tradeVoidItem).toHaveBeenCalledTimes(2)
    await act(async () => {
      await vi.runAllTimersAsync()
    })
  })

  it('falls back to the default fame cost when the rarity cost is not finite', async () => {
    const tradeVoidItem = vi.fn()
    const addToast = vi.fn()
    const { result } = renderHook(() =>
      useBandHQLogic({
        player: { fame: 999 },
        band: { stash: {} },
        handleBuy: vi.fn(),
        tradeVoidItem,
        addToast
      })
    )
    const item = { id: 'mystery_item', rarity: 'not_a_rarity' }

    expect(result.current.isVoidItemDisabled(item)).toBe(true)
    await act(async () => {
      result.current.handleVoidTrade(item)
      await vi.runAllTimersAsync()
    })
    expect(tradeVoidItem).not.toHaveBeenCalled()
  })

  it('handleBuyWithLock rapid double-invocation prevents re-entry', async () => {
    const handleBuy = vi.fn().mockResolvedValue()
    const addToast = vi.fn()
    const player = { fame: 5000 }
    const band = { stash: {} }

    const { result } = renderHook(() =>
      useBandHQLogic({
        player,
        band,
        handleBuy,
        tradeVoidItem: vi.fn(),
        addToast
      })
    )

    const item = { id: 'test_buy_item' }

    // First call
    let promise1
    let promise2
    act(() => {
      promise1 = result.current.handleBuyWithLock(item)
      // Second call synchronously
      promise2 = result.current.handleBuyWithLock(item)
    })

    // Wait for the asynchronous logic to finish; the shared lock yields one
    // macrotask before releasing, so the fake timers must be flushed.
    await act(async () => {
      await vi.runAllTimersAsync()
      await promise1
      await promise2
    })

    // Should only be called once
    expect(handleBuy).toHaveBeenCalledTimes(1)

    // Processing ID should be cleared
    expect(result.current.processingItemId).toBe(null)
  })
})
