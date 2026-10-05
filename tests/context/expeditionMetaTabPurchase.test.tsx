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

/** Exposes the provider's commands, Career and toasts to the test. */
const probe: {
  actions: GameDispatchActions | null
  career: CareerState | null
  toasts: Array<{ message: string; type: string }>
} = { actions: null, career: null, toasts: [] }

const Probe = () => {
  probe.actions = useGameActions()
  probe.career = useGameSelector(state => state.career)
  probe.toasts = useGameSelector(state => state.toasts) as Array<{
    message: string
    type: string
  }>
  return null
}

/** Seeds a save with the given Career and mounts the tab on the provider. */
const mountWithCareer = (career: Partial<CareerState>) => {
  const adapter = new InMemoryAdapter()
  const base = createInitialState()
  adapter.set(
    SAVE_KEY,
    JSON.stringify({
      player: base.player,
      band: base.band,
      social: base.social,
      gameMap: base.gameMap,
      career: { ...base.career, ...career }
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
  return adapter
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
    expect(probe.toasts.some(toast => toast.type === 'error')).toBe(false)
  })

  it('saves an accepted build', () => {
    const adapter = mountWithCareer({ tourTokens: 2 })
    act(() => {
      fireEvent.click(screen.getByTestId('expedition-meta-build-workshop'))
    })
    const saved = JSON.parse(String(adapter.get(SAVE_KEY)))
    expect(saved.career.hqFacilityLevels.workshop).toBe(1)
    expect(saved.career.tourTokens).toBe(0)
  })

  it('toasts a refused build and saves nothing', () => {
    const adapter = mountWithCareer({ tourTokens: 0 })
    const before = adapter.get(SAVE_KEY)
    let built = true
    act(() => {
      built = probe.actions?.purchaseExpeditionHqFacility('workshop', 0) ?? true
    })
    expect(built).toBe(false)
    expect(probe.career?.hqFacilityLevels.workshop ?? 0).toBe(0)
    expect(adapter.get(SAVE_KEY)).toBe(before)
    expect(probe.toasts).toContainEqual(
      expect.objectContaining({
        message: 'ui:expedition.meta.purchaseFailed.tokens',
        type: 'error'
      })
    )
  })

  it('toasts the reason a refused unlock set gives', () => {
    mountWithCareer({ tourTokens: 5 })
    let bought = true
    act(() => {
      bought =
        probe.actions?.purchaseExpeditionUnlockSet('mechanic_network') ?? true
    })
    expect(bought).toBe(false)
    expect(probe.toasts).toContainEqual(
      expect.objectContaining({
        message: 'ui:expedition.meta.purchaseFailed.facility',
        type: 'error'
      })
    )
  })
})
