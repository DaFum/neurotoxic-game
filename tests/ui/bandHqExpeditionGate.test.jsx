import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'

import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'

// The Career and run status the component reads, rewritten per test.
const gameState = {
  player: { money: 999999, fame: 999999, day: 1, van: { upgrades: [] } },
  band: { members: [], inventory: {} },
  social: { instagram: 0, tiktok: 0, controversyLevel: 0 },
  settings: {},
  setlist: [],
  activeQuests: [],
  venueBlacklist: [],
  reputationByRegion: {},
  career: { finalizedExpeditionRuns: 0, unlockedSetIds: [] },
  expedition: { status: 'idle' }
}

vi.mock('../../src/context/GameState.tsx', () => ({
  useGameSelector: selector => selector(gameState),
  useGameActions: () => ({
    updatePlayer: vi.fn(),
    updateBand: vi.fn(),
    tradeVoidItem: vi.fn(),
    addToast: vi.fn(),
    updateSettings: vi.fn(),
    deleteSave: vi.fn(),
    setSetlist: vi.fn(),
    unblacklistVenue: vi.fn(),
    craftItem: vi.fn(),
    consumeItem: vi.fn()
  })
}))

vi.mock('../../src/hooks/useAudioControl', () => ({
  useAudioControl: () => ({
    audioState: { musicVol: 1, sfxVol: 1, isMuted: false },
    handleAudioChange: {
      setMusic: vi.fn(),
      setSfx: vi.fn(),
      toggleMute: vi.fn()
    }
  })
}))

// One real catalog entry: `hq_van_suspension` is `requires_roadtested`.
vi.mock('../../src/data/upgradeCatalog', () => ({
  getUnifiedUpgradeCatalog: () => [
    {
      id: 'hq_van_suspension',
      name: 'Suspension',
      cost: 100,
      currency: 'money',
      effects: [{ type: 'stat_modifier', stat: 'breakdownChance', value: -5 }]
    }
  ]
}))

// The legacy purchase logic never disables this entry, so a disabled button
// can only come from the Expedition gate under test.
vi.mock('../../src/ui/bandhq/hooks/usePurchaseLogic', () => ({
  usePurchaseLogic: () => ({
    handleBuy: vi.fn(),
    isItemDisabled: () => false,
    getPurchaseDecision: item => ({
      cost: item.cost,
      isOwned: false,
      isConsumable: false,
      canAfford: true,
      canPurchase: true
    })
  })
}))

describe('Band HQ gates the legacy catalog on Expedition progress', () => {
  let BandHQContentArea

  beforeEach(async () => {
    const module = await import('../../src/ui/bandhq/BandHQContentArea.tsx')
    BandHQContentArea = module.BandHQContentArea
  })

  afterEach(() => {
    cleanup()
    gameState.career = { finalizedExpeditionRuns: 0, unlockedSetIds: [] }
    gameState.expedition = { status: 'idle' }
  })

  const renderBuyButton = async () => {
    render(
      React.createElement(BandHQContentArea, {
        currentTab: 'UPGRADES',
        VOID_TRADER_CONTROVERSY_THRESHOLD: 50
      })
    )
    // GlitchButton reports its blocked state through `aria-disabled`.
    return screen.findByRole('button', { name: /buy/i })
  }

  test('disables a rank-gated upgrade for a Career with no finished run', async () => {
    const button = await renderBuyButton()
    expect(button).toHaveAttribute('aria-disabled', 'true')
  })

  test('enables it once the Career has reached the rank it names', async () => {
    gameState.career = {
      finalizedExpeditionRuns: 2,
      completedExpeditionRuns: 1,
      completedExpeditionRegionIds: [],
      rivalsById: {},
      unlockedSetIds: []
    }
    const button = await renderBuyButton()
    expect(button).toHaveAttribute('aria-disabled', 'false')
  })
})
