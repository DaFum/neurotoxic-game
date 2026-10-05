import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

import {
  GameStateProvider,
  useGameSelector,
  useGameActions
} from '../../src/context/GameState'
import type { GameDispatchActions } from '../../src/context/useGameDispatchActions'
import { StorageProvider } from '../../src/context/StorageContext'
import { InMemoryAdapter } from '../../src/utils/storageAdapter'
import { resetStorageFallback } from '../../src/utils/storage'
import { createInitialState } from '../../src/context/initialState'
import { ExpeditionMetaTab } from '../../src/ui/expedition/ExpeditionMetaTab'
import { HQ_FACILITY_LEVEL_COSTS } from '../../src/data/expedition/hqFacilities'
import { EXPEDITION_UNLOCK_SETS } from '../../src/data/expedition/unlockSets'
import type { CareerState } from '../../src/types/career'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ i18n: { language: 'en' }, t: (key: string) => key })
}))

const SAVE_KEY = 'neurotoxic_v3_save'

/** Exposes the provider's commands and Career to the test. */
const probe: {
  actions: GameDispatchActions | null
  career: CareerState | null
} = { actions: null, career: null }

const Probe = () => {
  probe.actions = useGameActions()
  probe.career = useGameSelector(state => state.career)
  return null
}

describe('ExpeditionMetaTab through the real reducer', () => {
  beforeEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  it('builds the Workshop and then buys the set it gates', () => {
    const adapter = new InMemoryAdapter()
    const base = createInitialState()
    adapter.set(
      SAVE_KEY,
      JSON.stringify({
        player: base.player,
        band: base.band,
        social: base.social,
        gameMap: base.gameMap,
        career: { ...base.career, tourTokens: 5 }
      })
    )
    render(
      <StorageProvider adapter={adapter}>
        <GameStateProvider>
          <Probe />
          <ExpeditionMetaTab />
        </GameStateProvider>
      </StorageProvider>
    )
    act(() => {
      probe.actions?.loadGame()
    })
    expect(probe.career?.tourTokens).toBe(5)

    // The set is locked until its facility exists.
    expect(
      screen.getByTestId('expedition-meta-unlock-mechanic_network')
    ).toBeDisabled()

    act(() => {
      fireEvent.click(screen.getByTestId('expedition-meta-build-workshop'))
    })
    expect(probe.career?.hqFacilityLevels.workshop).toBe(1)
    expect(probe.career?.tourTokens).toBe(5 - HQ_FACILITY_LEVEL_COSTS[1])

    act(() => {
      fireEvent.click(
        screen.getByTestId('expedition-meta-unlock-mechanic_network')
      )
    })
    expect(probe.career?.unlockedSetIds).toContain('mechanic_network')
    expect(probe.career?.pendingUnlockPurchase).toBeNull()
    expect(probe.career?.tourTokens).toBe(
      5 -
        HQ_FACILITY_LEVEL_COSTS[1] -
        EXPEDITION_UNLOCK_SETS.mechanic_network.cost
    )
    // Owned now, so the buy control is gone.
    expect(
      screen.queryByTestId('expedition-meta-unlock-mechanic_network')
    ).toBeNull()
  })
})
