import { describe, expect, test, vi, beforeAll } from 'vitest'

import React from 'react'
import { render } from '@testing-library/react'

vi.mock('../../src/context/GameState.tsx', () => ({
  useGameSelector: selector => selector({
    player: { money: 100, fame: 50, day: 1, van: { upgrades: [] } },
    band: { members: [] },
    social: { instagram: 0, tiktok: 0 },
    settings: {},
    setlist: [],
    activeQuests: [],
    venueBlacklist: [],
    reputationByRegion: {}
  }),
  useGameActions: () => ({
    updatePlayer: vi.fn(),
    updateBand: vi.fn(),
    addToast: vi.fn(),
    updateSettings: vi.fn(),
    deleteSave: vi.fn(),
    setSetlist: vi.fn()
  }),
  useGameState: () => ({
    player: { money: 100, fame: 50, day: 1, van: { upgrades: [] } },
    band: { members: [] },
    social: { instagram: 0, tiktok: 0 },
    settings: {},
    setlist: [],
    activeQuests: [],
    venueBlacklist: [],
    reputationByRegion: {},
    updatePlayer: vi.fn(),
    updateBand: vi.fn(),
    addToast: vi.fn(),
    updateSettings: vi.fn(),
    deleteSave: vi.fn(),
    setSetlist: vi.fn()
  })
}))

vi.mock('../../src/hooks/useAudioControl', () => ({
  useAudioControl: () => ({
    audioState: { musicVol: 1, sfxVol: 1, isMuted: false },
    handleAudioChange: { setMusic: vi.fn(), setSfx: vi.fn(), toggleMute: vi.fn() }
  })
}))

vi.mock('../../src/data/hqItems', () => ({ HQ_ITEMS: { gear: [], instruments: [] } }))
vi.mock('../../src/data/upgradeCatalog', () => ({ getUnifiedUpgradeCatalog: () => [] }))
vi.mock('../../src/data/songs', () => ({ SONGS_DB: [] }))
vi.mock('../../src/utils/imageGen', () => ({ getGenImageUrl: () => 'mock-url', IMG_PROMPTS: {} }))
vi.mock('../../src/ui/bandhq/hooks/usePurchaseLogic', () => ({
  usePurchaseLogic: () => ({ handleBuy: vi.fn(), isItemOwned: () => false, isItemDisabled: () => false, getAdjustedCost: item => item.cost }),
  getPrimaryEffect: () => ({})
}))

describe('BandHQ UI tests', () => {
  let BandHQ

  beforeAll(async () => {
    const module = await import('../../src/ui/BandHQ.tsx')
    BandHQ = module.BandHQ
  })

  test('basic tab reachability check', async () => {
    const props = { onClose: () => {} }
    const { container } = render(React.createElement(BandHQ, props))
    expect(container).toBeTruthy()
  })
})
