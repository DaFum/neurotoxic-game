import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  GameStateProvider,
  useGameActions,
  useGameSelector
} from '../../src/context/GameState'
import { SAVE_KEY } from '../../src/context/usePersistence'
import { ALL_VENUES } from '../../src/data/venues'
import { resetStorageFallback } from '../../src/utils/storage'

const wrapper = ({ children }) => (
  <GameStateProvider>{children}</GameStateProvider>
)

const storedSave = () => JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null')

describe('post-arrival save through the real provider', () => {
  beforeEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  afterEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  test('the save requested right after startGig captures the committed START_GIG', () => {
    const venue = ALL_VENUES[0]
    const { result } = renderHook(
      () => ({
        actions: useGameActions(),
        gigId: useGameSelector(s => s.currentGig?.id ?? null)
      }),
      { wrapper }
    )

    // The arrival effect's exact sequence.
    act(() => {
      result.current.actions.startGig(venue)
      result.current.actions.saveGameAfterStateCommit()
    })

    expect(result.current.gigId).toBe(venue.id)
    expect(storedSave()?.currentGig?.id).toBe(venue.id)
  })
})
