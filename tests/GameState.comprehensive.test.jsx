import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { GameStateProvider, useGameState } from '../src/context/GameState.jsx'
import { GAME_PHASES } from '../src/context/gameConstants.js'

// Mock dependencies
vi.mock('../src/utils/logger', () => ({
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

vi.mock('../src/utils/mapGenerator', () => ({
  MapGenerator: class {
    generateMap() {
      return { nodes: {}, connections: [] }
    }
  }
}))

vi.mock('../src/utils/unlockManager', () => ({
  addUnlock: vi.fn(() => true),
  getUnlocks: vi.fn(() => [])
}))

vi.mock('../src/utils/upgradeUtils', () => ({
  hasUpgrade: vi.fn((upgrades, id) => upgrades.includes(id))
}))

vi.mock('../src/hooks/useLeaderboardSync', () => ({
  useLeaderboardSync: vi.fn()
}))

vi.mock('../src/utils/eventEngine', () => ({
  eventEngine: {
    checkEvent: vi.fn(),
    processOptions: vi.fn((event) => event)
  },
  resolveEventChoice: vi.fn((choice) => ({
    result: 'success',
    delta: choice.delta || {},
    outcomeText: choice.outcomeText || '',
    description: choice.description || ''
  }))
}))

vi.mock('../src/utils/errorHandler', () => ({
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

vi.mock('../src/utils/saveValidator', () => ({
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
          <div data-testid="current-scene">{gameState.currentScene}</div>
          <div data-testid="player-money">{gameState.player?.money || 0}</div>
          <div data-testid="band-harmony">{gameState.band?.harmony || 0}</div>
          <button onClick={() => action(gameState)}>Execute</button>
        </div>
      )
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('changeScene updates current scene', () => {
    const action = (gs) => gs.changeScene(GAME_PHASES.GIG)

    render(
      <GameStateProvider>
        <TestComponent action={action} />
      </GameStateProvider>
    )

    const button = screen.getByText('Execute')
    act(() => {
      button.click()
    })

    expect(screen.getByTestId('current-scene')).toHaveTextContent(GAME_PHASES.GIG)
  })

  test('updatePlayer modifies player state', () => {
    const action = (gs) => gs.updatePlayer({ money: 1500 })

    render(
      <GameStateProvider>
        <TestComponent action={action} />
      </GameStateProvider>
    )

    const button = screen.getByText('Execute')
    act(() => {
      button.click()
    })

    expect(screen.getByTestId('player-money')).toHaveTextContent('1500')
  })

  test('updateBand modifies band state', () => {
    const action = (gs) => gs.updateBand({ harmony: 85 })

    render(
      <GameStateProvider>
        <TestComponent action={action} />
      </GameStateProvider>
    )

    const button = screen.getByText('Execute')
    act(() => {
      button.click()
    })

    expect(screen.getByTestId('band-harmony')).toHaveTextContent('85')
  })

  test('updatePlayer with function callback works', () => {
    const action = (gs) => gs.updatePlayer(prev => ({ money: prev.money + 500 }))

    render(
      <GameStateProvider>
        <TestComponent action={action} />
      </GameStateProvider>
    )

    const initialMoney = parseInt(screen.getByTestId('player-money').textContent)

    const button = screen.getByText('Execute')
    act(() => {
      button.click()
    })

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
          <div data-testid="active-event">{gameState.activeEvent?.id || 'none'}</div>
          <button onClick={() => gameState.triggerEvent('test')}>Trigger</button>
          <button onClick={() => gameState.setActiveEvent({ id: 'test-event' })}>Set Event</button>
          <button onClick={() => gameState.setActiveEvent(null)}>Clear</button>
        </div>
      )
    }
  })

  test('setActiveEvent sets active event', () => {
    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    )

    act(() => {
      screen.getByText('Set Event').click()
    })

    expect(screen.getByTestId('active-event')).toHaveTextContent('test-event')
  })

  test('setActiveEvent can clear event', () => {
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
    const { eventEngine } = await import('../src/utils/eventEngine')

    TestComponent = () => {
      const gameState = useGameState()
      return (
        <div>
          <button onClick={() => {
            gameState.changeScene(GAME_PHASES.GIG)
          }}>Go to Gig</button>
          <button onClick={() => gameState.triggerEvent('travel')}>Trigger Event</button>
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

  test('saveGame persists state to localStorage', () => {
    const TestComponent = () => {
      const gameState = useGameState()
      return (
        <button onClick={() => gameState.saveGame(false)}>Save</button>
      )
    }

    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    )

    act(() => {
      screen.getByText('Save').click()
    })

    const saved = localStorage.getItem('neurotoxic_v3_save')
    expect(saved).toBeTruthy()

    const parsed = JSON.parse(saved)
    expect(parsed).toHaveProperty('timestamp')
    expect(parsed).toHaveProperty('player')
    expect(parsed).toHaveProperty('band')
  })

  test('loadGame loads state from localStorage', async () => {
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

    localStorage.setItem('neurotoxic_v3_save', JSON.stringify(mockSaveData))

    const TestComponent = () => {
      const gameState = useGameState()
      return (
        <div>
          <div data-testid="player-money">{gameState.player?.money || 0}</div>
          <button onClick={() => gameState.loadGame()}>Load</button>
        </div>
      )
    }

    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    )

    act(() => {
      screen.getByText('Load').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('player-money')).toHaveTextContent('999')
    })
  })

  test('deleteSave removes save from localStorage', () => {
    localStorage.setItem('neurotoxic_v3_save', 'test-data')

    const TestComponent = () => {
      const gameState = useGameState()
      return (
        <button onClick={() => gameState.deleteSave()}>Delete</button>
      )
    }

    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    )

    act(() => {
      screen.getByText('Delete').click()
    })

    expect(localStorage.getItem('neurotoxic_v3_save')).toBeNull()
  })

  test('resetState clears state to initial values', () => {
    const TestComponent = () => {
      const gameState = useGameState()
      return (
        <div>
          <div data-testid="player-money">{gameState.player?.money || 0}</div>
          <button onClick={() => gameState.updatePlayer({ money: 5000 })}>Set Money</button>
          <button onClick={() => gameState.resetState()}>Reset</button>
        </div>
      )
    }

    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    )

    act(() => {
      screen.getByText('Set Money').click()
    })
    expect(screen.getByTestId('player-money')).toHaveTextContent('5000')

    act(() => {
      screen.getByText('Reset').click()
    })

    const resetMoney = parseInt(screen.getByTestId('player-money').textContent)
    expect(resetMoney).toBeLessThan(5000)
  })
})

describe('GameState Context - Gig Management', () => {
  test('startGig updates current gig', () => {
    const TestComponent = () => {
      const gameState = useGameState()
      return (
        <div>
          <div data-testid="gig-name">{gameState.currentGig?.name || 'none'}</div>
          <button onClick={() => gameState.startGig({ name: 'Test Venue' })}>Start</button>
        </div>
      )
    }

    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    )

    act(() => {
      screen.getByText('Start').click()
    })

    expect(screen.getByTestId('gig-name')).toHaveTextContent('Test Venue')
  })

  test('setSetlist updates setlist', () => {
    const TestComponent = () => {
      const gameState = useGameState()
      return (
        <div>
          <div data-testid="setlist-count">{gameState.setlist?.length || 0}</div>
          <button onClick={() => gameState.setSetlist([{ id: 'song1' }, { id: 'song2' }])}>Set</button>
        </div>
      )
    }

    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    )

    act(() => {
      screen.getByText('Set').click()
    })

    expect(screen.getByTestId('setlist-count')).toHaveTextContent('2')
  })

  test('endGig transitions to POST_GIG scene', () => {
    const TestComponent = () => {
      const gameState = useGameState()
      return (
        <div>
          <div data-testid="scene">{gameState.currentScene}</div>
          <button onClick={() => {
            gameState.setCurrentGig({ id: 'test', isPractice: false })
            gameState.endGig()
          }}>End Gig</button>
        </div>
      )
    }

    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    )

    act(() => {
      screen.getByText('End Gig').click()
    })

    expect(screen.getByTestId('scene')).toHaveTextContent(GAME_PHASES.POST_GIG)
  })

  test('endGig with practice mode goes to OVERWORLD', () => {
    const TestComponent = () => {
      const gameState = useGameState()
      return (
        <div>
          <div data-testid="scene">{gameState.currentScene}</div>
          <button onClick={() => {
            gameState.setCurrentGig({ id: 'test', isPractice: true })
            gameState.endGig()
          }}>End Practice</button>
        </div>
      )
    }

    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    )

    act(() => {
      screen.getByText('End Practice').click()
    })

    expect(screen.getByTestId('scene')).toHaveTextContent(GAME_PHASES.OVERWORLD)
  })

  test('setGigModifiers updates modifiers', () => {
    const TestComponent = () => {
      const gameState = useGameState()
      return (
        <div>
          <div data-testid="soundcheck">{gameState.gigModifiers?.soundcheck ? 'yes' : 'no'}</div>
          <button onClick={() => gameState.setGigModifiers({ soundcheck: true })}>Toggle</button>
        </div>
      )
    }

    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    )

    act(() => {
      screen.getByText('Toggle').click()
    })

    expect(screen.getByTestId('soundcheck')).toHaveTextContent('yes')
  })
})

describe('GameState Context - Minigames', () => {
  test('startTravelMinigame is callable', () => {
    const TestComponent = () => {
      const gameState = useGameState()
      return (
        <button onClick={() => gameState.startTravelMinigame('node1')}>Start Travel</button>
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
        <button onClick={() => gameState.completeTravelMinigame(10, [])}>Complete Travel</button>
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
        <button onClick={() => gameState.startRoadieMinigame('gig1')}>Start Roadie</button>
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
        <button onClick={() => gameState.completeRoadieMinigame(5)}>Complete Roadie</button>
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

      // Set up player with upgrades
      gameState.updatePlayer({
        van: {
          upgrades: ['upgrade1', 'upgrade2']
        }
      })

      return (
        <div>
          <div data-testid="has-upgrade">{gameState.hasUpgrade('upgrade1') ? 'yes' : 'no'}</div>
        </div>
      )
    }

    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    )

    expect(screen.getByTestId('has-upgrade')).toHaveTextContent('yes')
  })
})
