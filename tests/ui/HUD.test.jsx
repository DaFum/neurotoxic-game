import { render, screen, cleanup } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest'

const mockUpdateBand = vi.hoisted(() => vi.fn())
const mockGameState = vi.hoisted(() => ({
  player: {
    money: 100,
    day: 1,
    location: 'venues:stendal_proberaum.name',
    van: { fuel: 100, condition: 100 }
  },
  band: {
    harmony: 80,
    members: []
  }
}))

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: selector => selector(mockGameState),
  useGameActions: () => ({
    updateBand: mockUpdateBand
  })
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
    mockUpdateBand.mockClear()
    mockGameState.band.members = []
  })

  test('renders the localized fallback for unnamed members', async () => {
    mockGameState.band.members = [
      { id: 'member-no-name', name: '', mood: 50, stamina: 60 }
    ]

    render(<HUD />)

    expect(screen.getByText('Member')).toBeInTheDocument()
  })

  test('shows player info and band status', async () => {
    render(<HUD />)

    expect(screen.getByLabelText('Fuel Level')).toBeInTheDocument()
    expect(screen.getByLabelText('Van Condition')).toBeInTheDocument()
    expect(
      screen.getByText(/venues:stendal_proberaum\.name/)
    ).toBeInTheDocument()
    expect(screen.getByText('BAND STATUS')).toBeInTheDocument()
  })
})
