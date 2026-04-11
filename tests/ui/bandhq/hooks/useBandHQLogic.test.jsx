import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useBandHQLogic } from '../../../src/ui/bandhq/hooks/useBandHQLogic.js'

// Mock react-i18next so `t()` function works
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key
  })
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
    const promise1 = result.current.handleVoidTrade(item)
    // Second call synchronously
    const promise2 = result.current.handleVoidTrade(item)

    // Should only register processing item ID once
    expect(result.current.processingItemId).toBe('test_item')

    // Fast-forward to unblock the 500ms delay in the first call
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    await promise1
    await promise2

    // The underlying operation should only be called once
    expect(tradeVoidItem).toHaveBeenCalledTimes(1)

    // Processing ID should be cleared
    expect(result.current.processingItemId).toBe(null)
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
    const promise1 = result.current.handleBuyWithLock(item)
    // Second call synchronously
    const promise2 = result.current.handleBuyWithLock(item)

    expect(result.current.processingItemId).toBe('test_buy_item')

    // Fast-forward to unblock the 500ms delay
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    await promise1
    await promise2

    // Should only be called once
    expect(handleBuy).toHaveBeenCalledTimes(1)

    // Processing ID should be cleared
    expect(result.current.processingItemId).toBe(null)
  })
})
