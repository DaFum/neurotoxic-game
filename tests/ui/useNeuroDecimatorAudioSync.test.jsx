import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const mockSetNeuroDecimator = vi.hoisted(() => vi.fn())
const mockGameState = vi.hoisted(() => ({
  band: { neuroDecimatorActive: false, inventory: { neuroDecimator: true } }
}))

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: selector => selector(mockGameState),
  useGameSelectorOptional: selector => selector(mockGameState)
}))

vi.mock('../../src/utils/audio/audioEngine', () => ({
  audioService: { setNeuroDecimator: mockSetNeuroDecimator }
}))

describe('useNeuroDecimatorAudioSync', () => {
  let useNeuroDecimatorAudioSync

  beforeEach(async () => {
    mockSetNeuroDecimator.mockClear()
    mockGameState.band = {
      neuroDecimatorActive: false,
      inventory: { neuroDecimator: true }
    }
    ;({ useNeuroDecimatorAudioSync } =
      await import('../../src/hooks/useNeuroDecimatorAudioSync'))
  })

  test('applies a restored active flag on mount without a click', () => {
    mockGameState.band.neuroDecimatorActive = true

    renderHook(() => useNeuroDecimatorAudioSync())

    expect(mockSetNeuroDecimator).toHaveBeenLastCalledWith(true)
  })

  test('clears the engine state when a fresh run resets the flag', () => {
    mockGameState.band.neuroDecimatorActive = true
    const { rerender } = renderHook(() => useNeuroDecimatorAudioSync())

    mockGameState.band = {
      neuroDecimatorActive: false,
      inventory: {}
    }
    rerender()

    expect(mockSetNeuroDecimator).toHaveBeenLastCalledWith(false)
  })

  test('stays off while the pedal is not owned', () => {
    mockGameState.band = {
      neuroDecimatorActive: true,
      inventory: {}
    }

    renderHook(() => useNeuroDecimatorAudioSync())

    expect(mockSetNeuroDecimator).toHaveBeenLastCalledWith(false)
  })
})
