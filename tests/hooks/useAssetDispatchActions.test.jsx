import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { ActionTypes } from '../../src/context/actionTypes'
import { useAssetDispatchActions } from '../../src/context/assets/useAssetDispatchActions'
import { sellChassis } from '../../src/context/assets/assetActionCreators'

vi.mock(
  '../../src/context/assets/assetActionCreators',
  async importOriginal => {
    const actual = await importOriginal()
    return { ...actual, sellChassis: vi.fn() }
  }
)

const renderAssetActions = () => {
  const dispatch = vi.fn()
  const addToast = vi.fn()
  const tRef = { current: vi.fn(key => `t:${key}`) }
  const stateRef = { current: { assets: [], liabilities: {} } }
  const { result } = renderHook(() =>
    useAssetDispatchActions({ dispatch, stateRef, addToast, tRef })
  )
  return { result, dispatch, addToast, stateRef }
}

describe('useAssetDispatchActions sellChassis', () => {
  it('surfaces a SELL_CHASSIS_FAILED reason as an error toast before dispatching', () => {
    const failed = {
      type: ActionTypes.SELL_CHASSIS_FAILED,
      payload: { assetId: 'asset_1', reason: 'LIABILITY_EXCEEDS_VALUE' }
    }
    vi.mocked(sellChassis).mockReturnValueOnce(failed)
    const { result, dispatch, addToast, stateRef } = renderAssetActions()

    result.current.sellChassis('asset_1')

    expect(sellChassis).toHaveBeenCalledWith('asset_1', stateRef.current)
    expect(addToast).toHaveBeenCalledTimes(1)
    expect(addToast).toHaveBeenCalledWith(
      't:assets:sellFailed.liability_exceeds_value',
      'error'
    )
    expect(dispatch).toHaveBeenCalledWith(failed)
  })

  it('dispatches a successful sale without a toast', () => {
    const sold = {
      type: ActionTypes.SELL_CHASSIS,
      payload: { assetId: 'asset_1' }
    }
    vi.mocked(sellChassis).mockReturnValueOnce(sold)
    const { result, dispatch, addToast } = renderAssetActions()

    result.current.sellChassis('asset_1')

    expect(addToast).not.toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith(sold)
  })
})

describe('useAssetDispatchActions removeModule', () => {
  it('toasts and skips the dispatch on the chassis the active run committed to', () => {
    const { result, dispatch, addToast, stateRef } = renderAssetActions()
    stateRef.current = {
      assets: [],
      liabilities: {},
      expedition: {
        status: 'active',
        loadout: { activeTourbusAssetId: 'asset_1' }
      }
    }

    result.current.removeModule('asset_1', 'slot_1')

    expect(dispatch).not.toHaveBeenCalled()
    expect(addToast).toHaveBeenCalledWith(
      't:assets:removeFailed.expedition_locked',
      'error'
    )
  })

  it('dispatches a removal on any other chassis', () => {
    const { result, dispatch, addToast } = renderAssetActions()

    result.current.removeModule('asset_1', 'slot_1')

    expect(addToast).not.toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: ActionTypes.REMOVE_MODULE })
    )
  })
})
