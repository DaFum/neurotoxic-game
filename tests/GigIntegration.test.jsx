import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('tone', () => {
  return {
    getTransport: () => ({
      stop: vi.fn(),
      position: 0,
      cancel: vi.fn(),
      state: 'stopped'
    }),
    getDestination: () => ({
      mute: false
    })
  }
})

vi.mock('../src/components/PixiStage.jsx', () => ({
  PixiStage: () => <div data-testid='pixi-stage-mock'>Pixi Stage</div>
}))

vi.mock('../src/utils/imageGen.js', () => ({
  getGenImageUrl: () => 'mock-url',
  IMG_PROMPTS: {}
}))

vi.mock('../src/context/GameState.jsx', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    useGameState: () => ({
      currentGig: { name: 'Test Gig', diff: 1, songId: 'test_song' },
      band: { harmony: 50 },
      player: {},
      settings: { volume: 50 },
      addToast: vi.fn(),
      changeScene: vi.fn(),
      setLastGigStats: vi.fn(),
      endGig: vi.fn(),
      activeEvent: null,
      setActiveEvent: vi.fn()
    })
  }
})

import { Gig } from '../src/scenes/Gig.jsx'
import { GameStateProvider } from '../src/context/GameState.jsx'

describe('Gig Component Integration', () => {
  it('renders standard composition elements of the gig scene', () => {
    render(
      <GameStateProvider>
        <Gig />
      </GameStateProvider>
    )

    // Check if critical compositions are mounted correctly
    expect(screen.getByTestId('pixi-stage-mock')).toBeInTheDocument()
    // It should render some band member imagery
    expect(screen.getAllByRole('img').length).toBeGreaterThanOrEqual(3)
  })
})
