import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useOverworldSave } from '../../src/hooks/overworld/useOverworldSave'

describe('manual overworld saves', () => {
  it('writes before navigation can unmount the scene', async () => {
    const save = vi.fn()
    const { result, unmount } = renderHook(() => useOverworldSave(save))
    act(() => result.current.handleSaveWithDelay())
    expect(save).toHaveBeenCalledTimes(1)
    unmount()
    await act(async () => {})
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('guards repeated clicks until the asynchronous save settles', async () => {
    const pending = Promise.withResolvers()
    const save = vi.fn(() => pending.promise)
    const { result } = renderHook(() => useOverworldSave(save))
    act(() => {
      result.current.handleSaveWithDelay()
      result.current.handleSaveWithDelay()
    })
    expect(save).toHaveBeenCalledTimes(1)
    expect(result.current.isSaving).toBe(true)
    await act(async () => pending.resolve())
    expect(result.current.isSaving).toBe(false)
  })
})
