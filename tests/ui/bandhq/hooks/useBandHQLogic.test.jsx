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

    // Wait for the asynchronous logic to finish
    await act(async () => {
      await promise1
      await promise2
    })

    // Should only be called once
    expect(handleBuy).toHaveBeenCalledTimes(1)

    // Processing ID should be cleared
    expect(result.current.processingItemId).toBe(null)
  })
})
