import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest'

import React from 'react'
import { render, cleanup } from '@testing-library/react'

// Mock react-i18next

// Mock hooks
vi.mock('../../src/context/GameState.tsx', () => ({
  useGameSelector: selector =>
    selector({
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
    updatePlayer: () => {},
    updateBand: () => {},
    tradeVoidItem: () => {},
    addToast: () => {},
    updateSettings: () => {},
    deleteSave: () => {},
    setSetlist: () => {}
  }),
  useGameState: () => ({
    player: { money: 100, fame: 50, day: 1, van: { upgrades: [] } },
    band: { members: [] },
    social: { instagram: 0, tiktok: 0 },
    updatePlayer: () => {},
    updateBand: () => {},
    addToast: () => {},
    settings: {},
    updateSettings: () => {},
    deleteSave: () => {},
    setlist: [],
    setSetlist: () => {},
    activeQuests: [],
    venueBlacklist: [],
    reputationByRegion: {}
  })
}))

vi.mock('../../src/hooks/useAudioControl', () => ({
  useAudioControl: () => ({
    audioState: { musicVol: 1, sfxVol: 1, isMuted: false },
    handleAudioChange: {
      setMusic: () => {},
      setSfx: () => {},
      toggleMute: () => {}
    }
  })
}))

// Mock dependencies
vi.mock('../../src/data/hqItems', () => ({
  HQ_ITEMS: { gear: [], instruments: [] }
}))
vi.mock('../../src/data/upgradeCatalog', () => ({
  getUnifiedUpgradeCatalog: () => []
}))
vi.mock('../../src/data/songs', () => ({
  SONGS_DB: []
}))
vi.mock('../../src/utils/imageGen', () => ({
  getGenImageUrl: () => 'mock-url',
  IMG_PROMPTS: {}
}))
vi.mock('../../src/ui/bandhq/hooks/usePurchaseLogic', () => ({
  usePurchaseLogic: () => ({
    handleBuy: () => {},
    isItemOwned: () => false,
    isItemDisabled: () => false,
    getAdjustedCost: item => item.cost // Mock passthrough
  }),
  getPrimaryEffect: () => ({})
}))
vi.mock('../../src/ui/shared/index.tsx', () => ({
  StatBox: () => React.createElement('div', { 'data-testid': 'stat-box' }),
  ProgressBar: () =>
    React.createElement('div', { 'data-testid': 'progress-bar' }),
  SettingsPanel: () =>
    React.createElement('div', { 'data-testid': 'settings-panel' }),
  Panel: ({ children }) =>
    React.createElement('div', { 'data-testid': 'panel' }, children),
  ActionButton: ({ children, type = 'button' }) => {
    const validTypes = ['button', 'submit', 'reset']
    const sanitizedType = validTypes.includes(type) ? type : 'button'
    return React.createElement(
      'button',
      { 'data-testid': 'action-button', type: sanitizedType },
      children
    )
  },
  Tooltip: ({ children }) =>
    React.createElement('div', { 'data-testid': 'tooltip' }, children)
}))

describe('BandHQ', () => {
  let BandHQ

  beforeAll(async () => {
    //  removed (handled by vitest env)
    // Dynamic import
    const module = await import('../../src/ui/BandHQ.tsx')
    BandHQ = module.BandHQ
  })

  afterEach(() => {
    cleanup()
  })

  test('renders without crashing', () => {
    const props = {
      onClose: () => {}
    }

    const { container } = render(React.createElement(BandHQ, props))
    expect(container.querySelector('h2')).toBeTruthy()
    // "BAND HQ" is the default fallback or key, adjust if needed
    expect(container.textContent).toContain('BAND HQ')
  })
})
