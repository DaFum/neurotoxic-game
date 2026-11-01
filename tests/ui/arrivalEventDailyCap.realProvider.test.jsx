import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  GameStateProvider,
  useGameActions,
  useGameSelector
} from '../../src/context/GameState'
import { eventEngine } from '../../src/utils/eventEngine'
import { resetStorageFallback } from '../../src/utils/storage'

const wrapper = ({ children }) => (
  <GameStateProvider>{children}</GameStateProvider>
)

const PROBE_EVENT = { id: 'arrival_cap_probe', title: 'probe', options: [] }

const renderProvider = () =>
  renderHook(
    () => ({
      actions: useGameActions(),
      player: useGameSelector(s => s.player),
      activeEventId: useGameSelector(s => s.activeEvent?.id ?? null)
    }),
    { wrapper }
  )

// The arrival sequence of `useArrivalLogic`: the day tick and the travel event
// roll run in the same tick, before React renders the advanced day.
const arriveAndRollEvent = result => {
  let fired = null
  act(() => {
    result.current.actions.advanceDay()
    fired = result.current.actions.triggerEvent('transport', 'travel')
  })
  return fired
}

describe('arrival event selection through the real provider', () => {
  beforeEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetStorageFallback()
    localStorage.clear()
  })

  test('two events on the previous day do not suppress the new day arrival event', () => {
    const { result } = renderProvider()
    act(() => {
      result.current.actions.updatePlayer({ eventsTriggeredToday: 2 })
    })
    expect(result.current.player.eventsTriggeredToday).toBe(2)
    const startDay = result.current.player.day
    const checkEvent = vi
      .spyOn(eventEngine, 'checkEvent')
      .mockReturnValue(PROBE_EVENT)

    expect(arriveAndRollEvent(result)).toBe(true)

    // Selection ran against the advanced day, not the previous render.
    expect(checkEvent).toHaveBeenCalledTimes(1)
    expect(checkEvent.mock.calls[0][1].player.day).toBe(startDay + 1)
    expect(result.current.player.day).toBe(startDay + 1)
    expect(result.current.activeEventId).toBe(PROBE_EVENT.id)
    expect(result.current.player.eventsTriggeredToday).toBe(1)
  })

  test('one event on the previous day leaves the new day arrival event using exactly one slot', () => {
    const { result } = renderProvider()
    act(() => {
      result.current.actions.updatePlayer({ eventsTriggeredToday: 1 })
    })
    const startDay = result.current.player.day
    vi.spyOn(eventEngine, 'checkEvent').mockReturnValue(PROBE_EVENT)

    expect(arriveAndRollEvent(result)).toBe(true)

    expect(result.current.player.day).toBe(startDay + 1)
    expect(result.current.activeEventId).toBe(PROBE_EVENT.id)
    expect(result.current.player.eventsTriggeredToday).toBe(1)
  })
})
