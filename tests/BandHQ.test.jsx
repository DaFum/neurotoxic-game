import {
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi
} from 'vitest'

import React from 'react'
import { render, cleanup } from '@testing-library/react'

// Mock dependencies
vi.mock('../src/data/hqItems.js', () => ({
  HQ_ITEMS: { gear: [], instruments: [] }
}))
vi.mock('../src/data/upgradeCatalog.js', () => ({
  getUnifiedUpgradeCatalog: () => []
}))
vi.mock('../src/data/songs.js', () => ({
  SONGS_DB: []
}))
vi.mock('../src/utils/imageGen.js', () => ({
  getGenImageUrl: () => 'mock-url',
  IMG_PROMPTS: {}
}))
vi.mock('../src/hooks/usePurchaseLogic.js', () => ({
  usePurchaseLogic: () => ({
    handleBuy: () => {},
    isItemOwned: () => false,
    isItemDisabled: () => false,
    getAdjustedCost: item => item.cost // Mock passthrough
  }),
  getPrimaryEffect: () => ({})
}))
vi.mock('../src/ui/shared/index.jsx', () => ({
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
    const module = await import('../src/ui/BandHQ.jsx')
    BandHQ = module.BandHQ
  })

  afterEach(() => {
    cleanup()
  })

  test('renders without crashing', () => {
    const props = {
      player: { money: 100, fame: 50, day: 1, van: {} },
      band: { members: [] },
      social: { instagram: 0, tiktok: 0 },
      onClose: () => {},
      updatePlayer: () => {},
      updateBand: () => {},
      addToast: () => {},
      settings: {},
      updateSettings: () => {},
      deleteSave: () => {},
      setlist: [],
      setSetlist: () => {},
      audioState: { musicVol: 1, sfxVol: 1, isMuted: false },
      onAudioChange: {
        setMusic: () => {},
        setSfx: () => {},
        toggleMute: () => {}
      }
    }

    const { container } = render(React.createElement(BandHQ, props))
    expect(container.querySelector('h2')).toBeTruthy()
    expect(container.textContent.includes('BAND HQ')).toBeTruthy()
  })
})
