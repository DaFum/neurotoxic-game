import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  GameStateProvider,
  useGameActions,
  useGameSelector
} from '../../src/context/GameState'
import { SAVE_KEY } from '../../src/context/usePersistence'
import { GAME_PHASES } from '../../src/context/gameConstants'
import { ALL_VENUES } from '../../src/data/venues'
import { useArrivalLogic } from '../../src/hooks/useArrivalLogic'
import { resetStorageFallback } from '../../src/utils/storage'

const wrapper = ({ children }) => (
  <GameStateProvider>{children}</GameStateProvider>
)

const storedSave = () => JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null')

const GIG_NODE_ID = 'node_gig'

// Mounts the real arrival hook under the real provider, then places the band
// on a gig node with harmony high enough that the show cannot be cancelled.
const arriveAtGig = venue => {
  const { result } = renderHook(
    () => ({
      actions: useGameActions(),
      arrival: useArrivalLogic({ rng: () => 0.99 }),
      scene: useGameSelector(s => s.currentScene),
      day: useGameSelector(s => s.player.day),
      gigId: useGameSelector(s => s.currentGig?.id ?? null)
    }),
    { wrapper }
  )
  act(() => {
    result.current.actions.setGameMap({
      nodes: {
        [GIG_NODE_ID]: {
          id: GIG_NODE_ID,
          type: 'GIG',
          layer: 1,
          x: 10,
          y: 10,
          venue
        }
      },
      connections: [],
      layers: [[GIG_NODE_ID]]
    })
    result.current.actions.updatePlayer({
      currentNodeId: GIG_NODE_ID,
      money: 5000
    })
    result.current.actions.updateBand({ harmony: 90 })
  })
  const startDay = result.current.day
  act(() => {
    result.current.arrival.handleArrivalSequence()
  })
  return { result, startDay }
}

describe('useArrivalLogic deferred gig arrival through the real provider', () => {
  beforeEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  afterEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  test('the deferred gig evaluation starts the gig and saves the committed START_GIG', () => {
    const venue = ALL_VENUES[0]
    const { result, startDay } = arriveAtGig(venue)

    expect(result.current.scene).toBe(GAME_PHASES.PRE_GIG)
    expect(result.current.gigId).toBe(venue.id)
    expect(result.current.day).toBe(startDay + 1)
    const saved = storedSave()
    expect(saved?.currentGig?.id).toBe(venue.id)
    expect(saved?.player?.day).toBe(startDay + 1)
  })

  test('an inline venue without an id routes to the overworld instead of stalling', () => {
    const { result, startDay } = arriveAtGig({ name: 'Club' })

    expect(result.current.scene).toBe(GAME_PHASES.OVERWORLD)
    expect(result.current.gigId).toBe(null)
    expect(storedSave()?.player?.day).toBe(startDay + 1)
  })
})
