import { describe, expect, test, vi, beforeEach } from 'vitest'
import { useEffect, useRef } from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react'
import {
  GameStateProvider,
  useGameActions,
  useGameSelector
} from '../../src/context/GameState.tsx'
import { GameOver } from '../../src/scenes/GameOver.tsx'
import { GAME_PHASES } from '../../src/context/gameConstants'
import { createInitialState } from '../../src/context/initialState'
import {
  SAVE_KEY,
  createPersistedState
} from '../../src/context/usePersistence'
import { createFixedClock } from '../../src/utils/clock'

// Records every call to `loadGame` while still running the real one, so a test
// can tell a screen that only looked at the save from one that loaded it.
const loadGameSpy = vi.hoisted(() => vi.fn())
vi.mock('../../src/context/GameState.tsx', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    useGameActions: () => {
      const actions = actual.useGameActions()
      return {
        ...actions,
        loadGame: () => {
          loadGameSpy()
          return actions.loadGame()
        }
      }
    }
  }
})

/** A save as the game writes it, for the state with these fields set. */
const storedSave = overrides =>
  JSON.stringify(
    createPersistedState(
      { ...createInitialState(), ...overrides },
      createFixedClock(1)
    )
  )

const ENDING_SAVE = () =>
  storedSave({
    currentScene: GAME_PHASES.GAMEOVER,
    terminalOutcome: { reason: 'bankruptcy' }
  })
const RESUMABLE_SAVE = () => storedSave({ currentScene: GAME_PHASES.OVERWORLD })

// Intercepts the game state to set up conditions for the GameOver screen
const GameOverTestHarness = ({ children }) => {
  const player = useGameSelector(state => state.player)
  const currentScene = useGameSelector(state => state.currentScene)
  const { updatePlayer } = useGameActions()

  useEffect(() => {
    if (player.score !== 100) {
      updatePlayer({ score: 100, day: 5, fame: 50, totalTravels: 2 })
    }
  }, [player.score, updatePlayer])

  if (player.score !== 100) return <div>Setting up state...</div>

  return (
    <div>
      <div data-testid='scene'>{currentScene}</div>
      {children}
    </div>
  )
}

describe('GameOver Scene', () => {
  beforeEach(() => {
    // The setup file hands every test an empty localStorage; saves are stored
    // for real so the screen reads what the game itself would write.
    loadGameSpy.mockClear()
  })

  test('renders game over stats correctly with context', async () => {
    const { getByText, findByText } = render(
      <GameStateProvider>
        <GameOverTestHarness>
          <GameOver />
        </GameOverTestHarness>
      </GameStateProvider>
    )

    await findByText('ui:gameOver.soldOut')
    expect(getByText('ui:tour.endedPrematurely')).toBeInTheDocument()
    expect(getByText('100')).toBeInTheDocument() // Score
    expect(getByText('5')).toBeInTheDocument() // Days
    expect(getByText('50')).toBeInTheDocument() // Fame
  })

  test('handles RETURN TO MENU', async () => {
    const { getByText, findByText, getByTestId } = render(
      <GameStateProvider>
        <GameOverTestHarness>
          <GameOver />
        </GameOverTestHarness>
      </GameStateProvider>
    )

    await findByText('ui:gameOver.returnToMenu')
    const returnBtn = getByText('ui:gameOver.returnToMenu')
    fireEvent.click(returnBtn)

    // We expect the scene to change to MENU
    await waitFor(() => {
      expect(getByTestId('scene').textContent).toBe(GAME_PHASES.MENU)
    })
  })

  // Load is offered only for a save that resumes play. A missing or refused
  // save hides it without the ending notice; Return to Menu stays.
  test.each([
    ['no save', null],
    ['a corrupt save', 'not json'],
    ['a save from a newer version', JSON.stringify({ version: 999999 })]
  ])('%s hides Load and keeps Return to Menu', async (_label, stored) => {
    if (stored !== null) localStorage.setItem(SAVE_KEY, stored)
    vi.useFakeTimers()
    try {
      const { getByText, queryByText, getByTestId } = render(
        <GameStateProvider>
          <GameOverTestHarness>
            <GameOver />
          </GameOverTestHarness>
        </GameStateProvider>
      )
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(queryByText('ui:gameOver.loadLastSave')).toBeNull()
      expect(queryByText('ui:gameOver.lastSaveIsEnding')).toBeNull()

      fireEvent.click(getByText('ui:gameOver.returnToMenu'))
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      expect(getByTestId('scene').textContent).toBe(GAME_PHASES.MENU)
      expect(loadGameSpy).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  test('a save that disappears after mount hides Load on activation instead of loading', async () => {
    localStorage.setItem(SAVE_KEY, RESUMABLE_SAVE())
    const { getByText, findByText, queryByText, getByTestId } = render(
      <GameStateProvider>
        <GameOverTestHarness>
          <GameOver />
        </GameOverTestHarness>
      </GameStateProvider>
    )
    await findByText('ui:gameOver.loadLastSave')

    const sceneBefore = getByTestId('scene').textContent
    localStorage.removeItem(SAVE_KEY)
    fireEvent.click(getByText('ui:gameOver.loadLastSave'))

    await waitFor(() => {
      expect(queryByText('ui:gameOver.loadLastSave')).toBeNull()
    })
    expect(getByText('ui:gameOver.returnToMenu')).toBeInTheDocument()
    // Stays on this screen instead of being sent to the menu.
    expect(getByTestId('scene').textContent).toBe(sceneBefore)
    expect(loadGameSpy).not.toHaveBeenCalled()
  })
  test('a save that only records the ending hides Load and keeps Return to Menu', async () => {
    localStorage.setItem(SAVE_KEY, ENDING_SAVE())
    const { getByText, findByText, queryByText, getByTestId } = render(
      <GameStateProvider>
        <GameOverTestHarness>
          <GameOver />
        </GameOverTestHarness>
      </GameStateProvider>
    )

    const notice = await findByText('ui:gameOver.lastSaveIsEnding')
    expect(notice.closest('[role="status"]')).not.toBeNull()
    expect(queryByText('ui:gameOver.loadLastSave')).toBeNull()

    fireEvent.click(getByText('ui:gameOver.returnToMenu'))
    await waitFor(() => {
      expect(getByTestId('scene').textContent).toBe(GAME_PHASES.MENU)
    })
    expect(loadGameSpy).not.toHaveBeenCalled()
  })

  test('Load stays hidden until the save has been evaluated, then loads a resumable one', async () => {
    localStorage.setItem(SAVE_KEY, RESUMABLE_SAVE())
    vi.useFakeTimers()
    try {
      const { getByText, queryByText, getByTestId } = render(
        <GameStateProvider>
          <GameOverTestHarness>
            <GameOver />
          </GameOverTestHarness>
        </GameStateProvider>
      )

      // Mounted, evaluation still pending: Return to Menu is there, Load is not.
      expect(getByText('ui:gameOver.returnToMenu')).toBeInTheDocument()
      expect(queryByText('ui:gameOver.loadLastSave')).toBeNull()
      expect(queryByText('ui:gameOver.lastSaveIsEnding')).toBeNull()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      fireEvent.click(getByText('ui:gameOver.loadLastSave'))
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(getByTestId('scene').textContent).toBe(GAME_PHASES.OVERWORLD)
      expect(loadGameSpy).toHaveBeenCalledTimes(1)
      expect(queryByText('ui:gameOver.lastSaveIsEnding')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  test('evaluates after the mount effects, so it sees a save written just after mounting', async () => {
    // An effect that runs after this screen's own (the provider's autosave is
    // one) writes the ending between mount and the evaluation.
    vi.useFakeTimers()
    try {
      const { queryByText, getByText } = render(
        <GameStateProvider>
          <GameOverTestHarness>
            <GameOver />
          </GameOverTestHarness>
        </GameStateProvider>
      )
      expect(queryByText('ui:gameOver.loadLastSave')).toBeNull()

      localStorage.setItem(SAVE_KEY, ENDING_SAVE())
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(getByText('ui:gameOver.lastSaveIsEnding')).toBeInTheDocument()
      expect(queryByText('ui:gameOver.loadLastSave')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  test('evaluates the save the provider autosaved on the way into GAMEOVER', async () => {
    // Nothing is stored yet: the ending is written by the provider's own
    // autosave effect, which runs after this screen's effects on mount. A
    // preview taken inside the mount effect would read the empty slot.
    const EndingFlow = () => {
      const scene = useGameSelector(state => state.currentScene)
      const { changeScene } = useGameActions()
      const startedRef = useRef(false)
      useEffect(() => {
        if (startedRef.current) return
        startedRef.current = true
        changeScene(GAME_PHASES.OVERWORLD)
      }, [changeScene])
      return (
        <>
          <button onClick={() => changeScene(GAME_PHASES.GAMEOVER)}>end</button>
          {scene === GAME_PHASES.GAMEOVER && <GameOver />}
        </>
      )
    }
    const { getByText, findByText, queryByText, getByTestId } = render(
      <GameStateProvider>
        <GameOverTestHarness>
          <EndingFlow />
        </GameOverTestHarness>
      </GameStateProvider>
    )
    await waitFor(() => {
      expect(getByTestId('scene').textContent).toBe(GAME_PHASES.OVERWORLD)
    })
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()

    fireEvent.click(getByText('end'))

    expect(await findByText('ui:gameOver.lastSaveIsEnding')).toBeInTheDocument()
    expect(localStorage.getItem(SAVE_KEY)).not.toBeNull()
    expect(queryByText('ui:gameOver.loadLastSave')).toBeNull()
  })

  test('a save that becomes terminal after mount is not loaded on activation', async () => {
    localStorage.setItem(SAVE_KEY, RESUMABLE_SAVE())
    const { getByText, findByText, queryByText } = render(
      <GameStateProvider>
        <GameOverTestHarness>
          <GameOver />
        </GameOverTestHarness>
      </GameStateProvider>
    )
    await findByText('ui:gameOver.loadLastSave')

    // Another writer replaces the slot with the ending after the screen opened.
    localStorage.setItem(SAVE_KEY, ENDING_SAVE())
    fireEvent.click(getByText('ui:gameOver.loadLastSave'))

    expect(await findByText('ui:gameOver.lastSaveIsEnding')).toBeInTheDocument()
    expect(queryByText('ui:gameOver.loadLastSave')).toBeNull()
    expect(loadGameSpy).not.toHaveBeenCalled()
  })
})
