import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Overworld } from '../src/scenes/Overworld.jsx'
import { GameStateProvider } from '../src/context/GameState'

// Mocks

vi.mock('../src/hooks/useTravelLogic', () => ({
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

vi.mock('../src/hooks/useBandHQModal', () => ({
  useBandHQModal: () => ({
    showHQ: false,
    openHQ: vi.fn(),
    closeHQ: vi.fn()
  })
}))

vi.mock('../src/hooks/useQuestsModal', () => ({
  useQuestsModal: () => ({
    showQuests: false,
    openQuests: vi.fn(),
    questsProps: {}
  })
}))

vi.mock('../src/components/ToggleRadio', () => ({
  ToggleRadio: () => <div data-testid='toggle-radio' />
}))

vi.mock('../src/utils/imageGen.js', () => ({
  getGenImageUrl: () => 'mock://image.png',
  IMG_PROMPTS: {}
}))

vi.mock('../src/utils/AudioManager', () => ({
  audioManager: {
    resumeMusic: vi.fn().mockResolvedValue(true)
  }
}))

vi.mock('../src/ui/BandHQ', () => ({
  BandHQ: () => <div data-testid='band-hq' />
}))

vi.mock('../src/ui/QuestsModal', () => ({
  QuestsModal: () => <div data-testid='quests-modal' />
}))

vi.mock('../src/components/MapConnection', () => ({
  MapConnection: () => <g data-testid='map-connection' />
}))

vi.mock('../src/components/MapNode', () => ({
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
    expect(
      screen.getByText(/TOUR PLAN/i)
    ).toBeInTheDocument()
    expect(screen.getByTestId('toggle-radio')).toBeInTheDocument()

    // Open the menu first
    const menuButton = screen.getByText(/MENU/i)
    await act(async () => {
      fireEvent.click(menuButton)
    })

    // Check buttons
    expect(screen.getByText(/QUESTS/i)).toBeInTheDocument()
    expect(screen.getByText(/REFUEL/i)).toBeInTheDocument()
    expect(screen.getByText(/REPAIR/i)).toBeInTheDocument()
    expect(screen.getByText(/SAVE GAME/i)).toBeInTheDocument()
  })

  it('triggers save game action when save button is clicked', async () => {
    vi.useFakeTimers()
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem')

    try {
      render(
        <GameStateProvider>
          <Overworld />
        </GameStateProvider>
      )

      // Open the menu first
      const menuButton = screen.getByText(/MENU/i)
      await act(async () => {
        fireEvent.click(menuButton)
      })

      const saveButton = screen.getByText(/SAVE GAME/i)

      await act(async () => {
        fireEvent.click(saveButton)
      })

      // Fast-forward the setTimeout delay
      await act(async () => {
        vi.runAllTimers()
      })

      expect(setItemSpy).toHaveBeenCalledWith(
        'neurotoxic_v3_save',
        expect.any(String)
      )
    } finally {
      vi.useRealTimers()
      setItemSpy.mockRestore()
    }
  })
})
