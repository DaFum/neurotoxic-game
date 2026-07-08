import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest'

const mockToggleNeuroDecimator = vi.hoisted(() => vi.fn())
const mockUpdateBand = vi.hoisted(() => vi.fn())
const mockSetNeuroDecimator = vi.hoisted(() => vi.fn())
const mockGameState = vi.hoisted(() => ({
  currentScene: 'OVERWORLD',
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
}))

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: selector => selector(mockGameState),
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
  },
  audioService: {
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
  let HUD

  beforeAll(async () => {
    ;({ HUD } = await import('../../src/ui/HUD'))
  })

  afterEach(() => {
    cleanup()
    mockToggleNeuroDecimator.mockClear()
    mockUpdateBand.mockClear()
    mockSetNeuroDecimator.mockClear()
    mockGameState.band.members = []
    mockGameState.band.neuroDecimatorActive = false
    mockGameState.currentScene = 'OVERWORLD'
  })

  test('dispatches the dedicated decimator toggle action from the HUD button', async () => {
    render(<HUD />)

    fireEvent.click(screen.getByRole('button', { name: /toggle decimator/i }))

    expect(mockToggleNeuroDecimator).toHaveBeenCalledWith(true)
    expect(mockUpdateBand).not.toHaveBeenCalled()
    expect(mockSetNeuroDecimator).toHaveBeenCalledWith(true)
  })

  test('renders the localized fallback for unnamed members', async () => {
    mockGameState.band.members = [
      { id: 'member-no-name', name: '', mood: 50, stamina: 60 }
    ]

    render(<HUD />)

    expect(screen.getByText('Member')).toBeInTheDocument()
  })

  test('shows player info and band status outside the gig scene', async () => {
    render(<HUD />)

    expect(screen.getByLabelText('Fuel Level')).toBeInTheDocument()
    expect(screen.getByLabelText('Van Condition')).toBeInTheDocument()
    expect(
      screen.getByText(/venues:stendal_proberaum\.name/)
    ).toBeInTheDocument()
    expect(screen.getByText('BAND STATUS')).toBeInTheDocument()
  })

  test('hides the player info and band status panels during the practice scene', async () => {
    mockGameState.currentScene = 'PRACTICE'

    render(<HUD />)

    expect(screen.queryByLabelText('Fuel Level')).not.toBeInTheDocument()
    expect(
      screen.queryByText(/venues:stendal_proberaum\.name/)
    ).not.toBeInTheDocument()
    expect(screen.queryByText('BAND STATUS')).not.toBeInTheDocument()
  })

  test('hides the player info and band status panels during the gig scene', async () => {
    mockGameState.currentScene = 'GIG'

    render(<HUD />)

    expect(screen.queryByLabelText('Fuel Level')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Van Condition')).not.toBeInTheDocument()
    expect(
      screen.queryByText(/venues:stendal_proberaum\.name/)
    ).not.toBeInTheDocument()
    expect(screen.queryByText('BAND STATUS')).not.toBeInTheDocument()
  })

  test('keeps the decimator toggle clickable during the gig scene', async () => {
    mockGameState.currentScene = 'GIG'

    render(<HUD />)

    fireEvent.click(screen.getByRole('button', { name: /toggle decimator/i }))

    expect(mockToggleNeuroDecimator).toHaveBeenCalledWith(true)
    expect(mockSetNeuroDecimator).toHaveBeenCalledWith(true)
  })
})
