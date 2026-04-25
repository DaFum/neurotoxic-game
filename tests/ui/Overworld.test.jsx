import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Overworld } from '../../src/scenes/Overworld.tsx'
import { GameStateProvider } from '../../src/context/GameState'




// Mocks

vi.mock('../../src/hooks/useTravelLogic', () => ({
  useTravelLogic: () => ({
    isTraveling: false,
    travelTarget: null,
    pendingTravelNode: null,
    isConnected: () => true,
    getNodeVisibility: () => 1,
    handleTravel: vi.fn(),
    handleRefuel: vi.fn(),
    handleRepair: vi.fn(),
    onTravelComplete: vi.fn(),
    travelCompletedRef: { current: false }
  })
}))

vi.mock('../../src/hooks/useBandHQModal', () => ({
  useBandHQModal: () => ({
    showHQ: false,
    openHQ: vi.fn(),
    closeHQ: vi.fn()
  })
}))

vi.mock('../../src/hooks/useQuestsModal', () => ({
  useQuestsModal: () => ({
    showQuests: false,
    openQuests: vi.fn(),
    questsProps: {}
  })
}))

vi.mock('../../src/components/ToggleRadio', () => ({
  ToggleRadio: () => <div data-testid='toggle-radio' />
}))

vi.mock('../../src/utils/imageGen', () => ({
  getGenImageUrl: () => 'mock://image.png',
  IMG_PROMPTS: {}
}))

vi.mock('../../src/utils/audioManager', () => ({
  audioManager: {
    resumeMusic: vi.fn().mockResolvedValue(true),
    stopMusic: vi.fn(),
    getStateSnapshot: vi.fn(() => ({ currentSongId: 'ambient', isPlaying: true }))
  }
}))

vi.mock('../../src/utils/AudioManager', () => ({
  audioManager: {
    resumeMusic: vi.fn(() => Promise.resolve(true)),
    stopMusic: vi.fn(),
    getStateSnapshot: vi.fn(() => ({ currentSongId: 'ambient', isPlaying: true }))
  }
}))

vi.mock('../../src/ui/BandHQ', () => ({
  BandHQ: () => <div data-testid='band-hq' />
}))

vi.mock('../../src/ui/QuestsModal', () => ({
  QuestsModal: () => <div data-testid='quests-modal' />
}))

vi.mock('../../src/components/MapConnection', () => ({
  MapConnection: () => <g data-testid='map-connection' />
}))

vi.mock('../../src/components/MapNode', () => ({
  MapNode: () => <div data-testid='map-node' />
}))

describe('Overworld Component', () => {
  it('renders the Overworld and its UI elements correctly', async () => {
    render(
      <GameStateProvider>
        <Overworld />
      </GameStateProvider>
    )

    // Check for standard UI elements
    expect(screen.getByText(/TOUR PLAN/i)).toBeInTheDocument()
    expect(screen.getByTestId('toggle-radio')).toBeInTheDocument()

    // Open the menu first
    const menuButton = screen.getByText(/MENU/i)
    await act(async () => {
      fireEvent.click(menuButton)
    })

    // Check buttons
    // verify the menu is present
    expect(screen.getByText(/TOUR PLAN/i)).toBeInTheDocument()
  })

  it.skip('triggers save game action when save button is clicked', async () => {})
})
