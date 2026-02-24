import { test, describe, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { render, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'

// Mock dependencies
mock.module('../src/data/hqItems.js', {
  namedExports: {
    HQ_ITEMS: { gear: [], instruments: [] }
  }
})

mock.module('../src/data/upgradeCatalog.js', {
  namedExports: {
    getUnifiedUpgradeCatalog: () => []
  }
})

mock.module('../src/data/songs.js', {
  namedExports: {
    SONGS_DB: []
  }
})

mock.module('../src/utils/imageGen.js', {
  namedExports: {
    getGenImageUrl: () => 'mock-url',
    IMG_PROMPTS: {}
  }
})

mock.module('../src/hooks/usePurchaseLogic.js', {
  namedExports: {
    usePurchaseLogic: () => ({
      handleBuy: () => {},
      isItemOwned: () => false,
      isItemDisabled: () => false,
      getAdjustedCost: (item) => item.cost // Mock passthrough
    }),
    getPrimaryEffect: () => ({})
  }
})

mock.module('../src/ui/shared/index.jsx', {
  namedExports: {
    StatBox: () => React.createElement('div', { 'data-testid': 'stat-box' }),
    ProgressBar: () => React.createElement('div', { 'data-testid': 'progress-bar' }),
    SettingsPanel: () => React.createElement('div', { 'data-testid': 'settings-panel' }),
    Panel: ({ children }) => React.createElement('div', { 'data-testid': 'panel' }, children),
    ActionButton: ({ children, type = 'button' }) => React.createElement('button', { 'data-testid': 'action-button', type }, children),
    Tooltip: ({ children }) => React.createElement('div', { 'data-testid': 'tooltip' }, children)
  }
})

describe('BandHQ', () => {
  let BandHQ

  test.before(async () => {
      setupJSDOM()
      // Dynamic import
      const module = await import('../src/ui/BandHQ.jsx')
      BandHQ = module.BandHQ
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
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
      onAudioChange: { setMusic: () => {}, setSfx: () => {}, toggleMute: () => {} }
    }

    const { container } = render(React.createElement(BandHQ, props))
    assert.ok(container.querySelector('h2'), 'Should render header')
    assert.ok(container.textContent.includes('BAND HQ'), 'Should contain title')
  })
})
