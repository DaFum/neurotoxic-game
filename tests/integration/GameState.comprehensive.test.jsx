import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import {
  GameStateProvider,
  useGameState
} from '../../src/context/GameState.tsx'
import { GAME_PHASES } from '../../src/context/gameConstants.js'

// Mock dependencies
vi.mock('../../src/utils/logger', () => ({
  logger: {
    setLevel: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn()
  },
  LOG_LEVELS: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
  }
}))

vi.mock('../../src/utils/mapGenerator', () => ({
  MapGenerator: class {
    generateMap() {
      return { nodes: {}, connections: [] }
    }
  }
}))

vi.mock('../../src/utils/unlockManager', () => ({
  addUnlock: vi.fn(() => true),
  getUnlocks: vi.fn(() => [])
}))

vi.mock('../../src/utils/upgradeUtils', () => ({
  hasUpgrade: vi.fn((upgrades, id) => upgrades.includes(id))
}))

vi.mock('../../src/hooks/useLeaderboardSync', () => ({
  useLeaderboardSync: vi.fn()
}))

vi.mock('../../src/utils/eventEngine', () => ({
  eventEngine: {
    checkEvent: vi.fn(),
    processOptions: vi.fn(event => event)
  },
  resolveEventChoice: vi.fn(choice => ({
    result: 'success',
    delta: choice.delta || {},
    outcomeText: choice.outcomeText || '',
    description: choice.description || ''
  }))
}))

vi.mock('../../src/utils/errorHandler', () => ({
  handleError: vi.fn(),
  StorageError: class StorageError extends Error {},
  StateError: class StateError extends Error {},
  safeStorageOperation: vi.fn((name, fn, fallback) => {
    try {
      return fn()
    } catch {
      return fallback
    }
  })
}))

vi.mock('../../src/utils/saveValidator', () => ({
  validateSaveData: vi.fn()
}))

describe('GameState Context - Core Actions', () => {
  let TestComponent

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    TestComponent = ({ action }) => {
      const gameState = useGameState()
      return (
        <div>
          <div data-testid='current-scene'>{gameState.currentScene}</div>
          <div data-testid='player-money'>{gameState.player?.money || 0}</div>
          <div data-testid='band-harmony'>{gameState.band?.harmony || 0}</div>
          <button type='button' onClick={() => action(gameState)}>
            Execute
          </button>
        </div>
      )
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('core state update actions (scene, player, band)', () => {
    let callCount = 0
    const action = gs => {
      if (callCount === 0) gs.changeScene(GAME_PHASES.GIG)
      if (callCount === 1) gs.updatePlayer({ money: 1500 })
      if (callCount === 2) gs.updateBand({ harmony: 85 })
      if (callCount === 3)
        gs.updatePlayer(prev => ({ money: prev.money + 500 }))
      callCount++
    }

    render(
      <GameStateProvider>
        <TestComponent action={action} />
      </GameStateProvider>
    )

    const button = screen.getByText('Execute')

    act(() => button.click())
    expect(screen.getByTestId('current-scene')).toHaveTextContent(
      GAME_PHASES.GIG
    )

    act(() => button.click())
    expect(screen.getByTestId('player-money')).toHaveTextContent('1500')

    act(() => button.click())
    expect(screen.getByTestId('band-harmony')).toHaveTextContent('85')

    const initialMoney = parseInt(
      screen.getByTestId('player-money').textContent
    )
    act(() => button.click())
    const finalMoney = parseInt(screen.getByTestId('player-money').textContent)
    expect(finalMoney).toBe(initialMoney + 500)
  })
})

describe('GameState Context - Event System', () => {
  let TestComponent

  beforeEach(() => {
    vi.clearAllMocks()

    TestComponent = () => {
      const gameState = useGameState()
      return (
        <div>
          <div data-testid='active-event'>
            {gameState.activeEvent?.id || 'none'}
          </div>
          <button type='button' onClick={() => gameState.triggerEvent('test')}>
            Trigger
          </button>
          <button
            type='button'
            onClick={() => gameState.setActiveEvent({ id: 'test-event' })}
          >
            Set Event
          </button>
          <button type='button' onClick={() => gameState.setActiveEvent(null)}>
            Clear
          </button>
        </div>
      )
    }
  })

  test('setActiveEvent sets and clears active event', () => {
    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    )

    act(() => {
      screen.getByText('Set Event').click()
    })
    expect(screen.getByTestId('active-event')).toHaveTextContent('test-event')

    act(() => {
      screen.getByText('Clear').click()
    })
    expect(screen.getByTestId('active-event')).toHaveTextContent('none')
  })

  test('triggerEvent does not trigger during GIG phase', async () => {
    const { eventEngine } = await import('../../src/utils/eventEngine')

    TestComponent = () => {
      const gameState = useGameState()
      return (
        <div>
          <button
            type='button'
            onClick={() => {
              gameState.changeScene(GAME_PHASES.GIG)
            }}
          >
            Go to Gig
          </button>
          <button
            type='button'
            onClick={() => gameState.triggerEvent('travel')}
          >
            Trigger Event
          </button>
        </div>
      )
    }

    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    )

    act(() => {
      screen.getByText('Go to Gig').click()
    })

    act(() => {
      screen.getByText('Trigger Event').click()
    })

    expect(eventEngine.checkEvent).not.toHaveBeenCalled()
  })
})

describe('GameState Context - Save/Load', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  test('save/load/delete flow functionality', async () => {
    const mockSaveData = {
      timestamp: Date.now(),
      currentScene: GAME_PHASES.OVERWORLD,
      player: { money: 999, day: 5 },
      band: { harmony: 75 },
      social: {},
      gameMap: null,
      setlist: [],
      settings: {}
    }

    const TestComponent = () => {
      const gameState = useGameState()
      return (
        <div>
          <div data-testid='player-money'>{gameState.player?.money || 0}</div>
          <button type='button' onClick={() => gameState.saveGame(false)}>
            Save
          </button>
          <button type='button' onClick={() => gameState.loadGame()}>
            Load
          </button>
          <button type='button' onClick={() => gameState.deleteSave()}>
            Delete
          </button>
          <button
            type='button'
            onClick={() => gameState.updatePlayer({ money: 5000 })}
          >
            Set Money
          </button>
          <button type='button' onClick={() => gameState.resetState()}>
            Reset
          </button>
        </div>
      )
    }

    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    )

    act(() => screen.getByText('Save').click())
    const saved = localStorage.getItem('neurotoxic_v3_save')
    expect(saved).toBeTruthy()
    const parsed = JSON.parse(saved)
    expect(parsed).toHaveProperty('timestamp')
    expect(parsed).toHaveProperty('player')
    expect(parsed).toHaveProperty('band')

    localStorage.setItem('neurotoxic_v3_save', JSON.stringify(mockSaveData))

    act(() => screen.getByText('Load').click())
    await waitFor(() => {
      expect(screen.getByTestId('player-money')).toHaveTextContent('999')
    })

    act(() => screen.getByText('Delete').click())
    expect(localStorage.getItem('neurotoxic_v3_save')).toBeNull()

    act(() => screen.getByText('Set Money').click())
    expect(screen.getByTestId('player-money')).toHaveTextContent('5000')

    act(() => screen.getByText('Reset').click())
    const resetMoney = parseInt(screen.getByTestId('player-money').textContent)
    expect(resetMoney).toBeLessThan(5000)
  })
})

describe('GameState Context - Gig Management', () => {
  test('gig lifecycle actions work correctly', () => {
    const TestComponent = () => {
      const gameState = useGameState()
      return (
        <div>
          <div data-testid='scene'>{gameState.currentScene}</div>
          <div data-testid='gig-name'>
            {gameState.currentGig?.name || 'none'}
          </div>
          <div data-testid='setlist-count'>
            {gameState.setlist?.length || 0}
          </div>
          <div data-testid='soundcheck'>
            {gameState.gigModifiers?.soundcheck ? 'yes' : 'no'}
          </div>

          <button
            type='button'
            onClick={() => gameState.startGig({ name: 'Test Venue' })}
          >
            Start
          </button>
          <button
            type='button'
            onClick={() =>
              gameState.setSetlist([{ id: 'song1' }, { id: 'song2' }])
            }
          >
            Set Setlist
          </button>
          <button
            type='button'
            onClick={() => gameState.setGigModifiers({ soundcheck: true })}
          >
            Set Modifiers
          </button>

          <button
            type='button'
            onClick={() =>
              gameState.setCurrentGig({ id: 'test', isPractice: true })
            }
          >
            Set Practice Gig
          </button>
          <button
            type='button'
            onClick={() =>
              gameState.setCurrentGig({ id: 'test', isPractice: false })
            }
          >
            Set Normal Gig
          </button>
          <button
            type='button'
            onClick={() => gameState.changeScene(GAME_PHASES.GIG)}
          >
            Set Gig Scene
          </button>
          <button type='button' onClick={() => gameState.endGig()}>
            End Gig
          </button>
        </div>
      )
    }

    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    )

    act(() => screen.getByText('Start').click())
    expect(screen.getByTestId('gig-name')).toHaveTextContent('Test Venue')

    act(() => screen.getByText('Set Setlist').click())
    expect(screen.getByTestId('setlist-count')).toHaveTextContent('2')

    act(() => screen.getByText('Set Modifiers').click())
    expect(screen.getByTestId('soundcheck')).toHaveTextContent('yes')

    // endGig practice
    act(() => screen.getByText('Set Gig Scene').click())
    act(() => screen.getByText('Set Practice Gig').click())
    act(() => screen.getByText('End Gig').click())
    expect(screen.getByTestId('scene')).toHaveTextContent(GAME_PHASES.OVERWORLD)

    // endGig normal
    act(() => screen.getByText('Set Gig Scene').click())
    act(() => screen.getByText('Set Normal Gig').click())
    act(() => screen.getByText('End Gig').click())
    expect(screen.getByTestId('scene')).toHaveTextContent(GAME_PHASES.POST_GIG)
  })
})

describe('GameState Context - Minigames', () => {
  test('startTravelMinigame is callable', () => {
    const TestComponent = () => {
      const gameState = useGameState()
      return (
        <button
          type='button'
          onClick={() => gameState.startTravelMinigame('node1')}
        >
          Start Travel
        </button>
      )
    }

    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    )

    expect(() => {
      act(() => {
        screen.getByText('Start Travel').click()
      })
    }).not.toThrow()
  })

  test('completeTravelMinigame is callable', () => {
    const TestComponent = () => {
      const gameState = useGameState()
      return (
        <button
          type='button'
          onClick={() => gameState.completeTravelMinigame(10, [])}
        >
          Complete Travel
        </button>
      )
    }

    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    )

    expect(() => {
      act(() => {
        screen.getByText('Complete Travel').click()
      })
    }).not.toThrow()
  })

  test('startRoadieMinigame is callable', () => {
    const TestComponent = () => {
      const gameState = useGameState()
      return (
        <button
          type='button'
          onClick={() => gameState.startRoadieMinigame('gig1')}
        >
          Start Roadie
        </button>
      )
    }

    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    )

    expect(() => {
      act(() => {
        screen.getByText('Start Roadie').click()
      })
    }).not.toThrow()
  })

  test('completeRoadieMinigame is callable', () => {
    const TestComponent = () => {
      const gameState = useGameState()
      return (
        <button
          type='button'
          onClick={() => gameState.completeRoadieMinigame(5)}
        >
          Complete Roadie
        </button>
      )
    }

    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    )

    expect(() => {
      act(() => {
        screen.getByText('Complete Roadie').click()
      })
    }).not.toThrow()
  })
})

describe('GameState Context - hasUpgrade utility', () => {
  test('hasUpgrade returns true for owned upgrades', () => {
    const TestComponent = () => {
      const gameState = useGameState()

      return (
        <div>
          <button
            type='button'
            onClick={() =>
              gameState.updatePlayer({
                van: { upgrades: ['upgrade1', 'upgrade2'] }
              })
            }
          >
            Add Upgrades
          </button>
          <div data-testid='has-upgrade'>
            {gameState.hasUpgrade('upgrade1') ? 'yes' : 'no'}
          </div>
        </div>
      )
    }

    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    )

    const button = screen.getByText('Add Upgrades')
    act(() => {
      button.click()
    })

    expect(screen.getByTestId('has-upgrade')).toHaveTextContent('yes')
  })
})
