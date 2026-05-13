import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

const mockToggleNeuroDecimator = vi.hoisted(() => vi.fn())
const mockUpdateBand = vi.hoisted(() => vi.fn())
const mockSetNeuroDecimator = vi.hoisted(() => vi.fn())

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: selector =>
    selector({
      player: {
        money: 100,
        day: 1,
        location: 'venues:stendal_proberaum.name',
        van: { fuel: 100, condition: 100 }
      },
      band: {
        harmony: 80,
        neuroDecimatorActive: false,
        inventory: { neuroDecimator: true },
        members: []
      }
    }),
  useGameActions: () => ({
    updateBand: mockUpdateBand
  }),
  useGameDispatch: () => ({
    toggleNeuroDecimator: mockToggleNeuroDecimator
  })
}))

vi.mock('../../src/utils/audio/audioEngine', () => ({
  audioManager: {
    setNeuroDecimator: mockSetNeuroDecimator
  }
}))

vi.mock('../../src/hooks/useAudioControl', () => ({
  useAudioControl: () => ({
    audioState: { musicVol: 1, sfxVol: 1, isMuted: false },
    handleAudioChange: {
      setMusic: vi.fn(),
      setSfx: vi.fn(),
      toggleMute: vi.fn()
    }
  })
}))

vi.mock('../../src/utils/locationI18n', () => ({
  translateLocation: (_t, location) => location
}))

describe('HUD', () => {
  afterEach(() => {
    cleanup()
    mockToggleNeuroDecimator.mockClear()
    mockUpdateBand.mockClear()
    mockSetNeuroDecimator.mockClear()
  })

  test('dispatches the dedicated decimator toggle action from the HUD button', async () => {
    const { HUD } = await import('../../src/ui/HUD')

    render(<HUD />)

    fireEvent.click(screen.getByRole('button', { name: /toggle decimator/i }))

    expect(mockToggleNeuroDecimator).toHaveBeenCalledWith(true)
    expect(mockUpdateBand).not.toHaveBeenCalled()
    expect(mockSetNeuroDecimator).toHaveBeenCalledWith(true)
  })
})
