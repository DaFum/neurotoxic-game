import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  GameStateProvider,
  useGameActions,
  useGameSelector
} from '../../src/context/GameState'
import { SAVE_KEY } from '../../src/context/usePersistence'
import { nextSeed } from '../../src/utils/seededRng'
import { resetStorageFallback } from '../../src/utils/storage'

// #3504: provider actions called in the same tick as an earlier dispatch must
// read the reduced state (`latestStateRef`), not the last render (`stateRef`).

const wrapper = ({ children }) => (
  <GameStateProvider>{children}</GameStateProvider>
)

const renderProvider = () =>
  renderHook(
    () => ({
      actions: useGameActions(),
      day: useGameSelector(s => s.player.day),
      money: useGameSelector(s => s.player.money),
      rngSeed: useGameSelector(s => s.rngSeed),
      activeEventId: useGameSelector(s => s.activeEvent?.id ?? null),
      eventCooldowns: useGameSelector(s => s.eventCooldowns)
    }),
    { wrapper }
  )

const PROBE_EVENT = { id: 'same_tick_probe', title: 'probe', options: [] }

describe('same-tick state reads through the real provider', () => {
  beforeEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetStorageFallback()
    localStorage.clear()
  })

  test('advanceDay after an earlier advanceDay in the same tick advances the RNG seed twice', () => {
    const { result } = renderProvider()
    const startDay = result.current.day
    const startSeed = result.current.rngSeed

    act(() => {
      result.current.actions.advanceDay()
      result.current.actions.advanceDay()
    })

    expect(result.current.day).toBe(startDay + 2)
    // A stale read rebuilds the second action from the pre-tick seed, so both
    // days roll the same stream and the seed advances only once.
    expect(result.current.rngSeed).toBe(nextSeed(nextSeed(startSeed)))
  })

  test('resolveEvent resolves an event activated earlier in the same tick', () => {
    const { result } = renderProvider()

    act(() => {
      result.current.actions.setActiveEvent(PROBE_EVENT)
      result.current.actions.resolveEvent({ id: 'ok', outcomeText: 'done' })
    })

    expect(result.current.activeEventId).toBeNull()
    expect(result.current.eventCooldowns).toContain(PROBE_EVENT.id)
  })

  test('resolveEvent saves a game-over snapshot that includes an earlier same-tick dispatch', () => {
    const { result } = renderProvider()
    act(() => {
      result.current.actions.setActiveEvent(PROBE_EVENT)
    })
    const money = result.current.money + 123

    act(() => {
      result.current.actions.updatePlayer({ money })
      result.current.actions.resolveEvent({
        id: 'doom',
        _precomputedResult: { delta: { flags: { gameOver: true } } }
      })
    })

    expect(result.current.money).toBe(money)
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null')
    expect(saved?.player?.money).toBe(money)
    expect(saved?.terminalOutcome?.reason).toBe('event_game_over')
  })
})
