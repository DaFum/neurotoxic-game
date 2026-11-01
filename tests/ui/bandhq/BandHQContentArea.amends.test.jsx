import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { getUnblacklistCost } from '../../../src/context/reducers/socialReducer'

// #3485 item 1: handleUnblacklistVenue refuses on spendable cash, so the
// Make Amends button must be gated on the same figure, not raw money.
const VENUE_ID = 'stendal_stadtfest'

const mocks = vi.hoisted(() => ({
  state: {
    player: {
      money: 0,
      fame: 50,
      fameLevel: 1,
      day: 4,
      location: 'berlin',
      van: { fuel: 40, condition: 80, upgrades: [] },
      stats: {}
    },
    band: { harmony: 60, members: [], inventory: {}, stash: {} },
    social: { instagram: 0, tiktok: 0, youtube: 0, newsletter: 0 },
    settings: {},
    setlist: [],
    activeQuests: [],
    venueBlacklist: [],
    reputationByRegion: {},
    career: { finalizedExpeditionRuns: 0, unlockedSetIds: [] },
    expedition: { status: 'idle' }
  },
  unblacklistVenue: vi.fn()
}))

vi.mock('../../../src/context/GameState.tsx', () => ({
  useGameSelector: selector => selector(mocks.state),
  useGameActions: () => ({
    updatePlayer: vi.fn(),
    updateBand: vi.fn(),
    tradeVoidItem: vi.fn(),
    addToast: vi.fn(),
    updateSettings: vi.fn(),
    deleteSave: vi.fn(),
    setSetlist: vi.fn(),
    unblacklistVenue: mocks.unblacklistVenue,
    craftItem: vi.fn(),
    consumeItem: vi.fn()
  })
}))

vi.mock('../../../src/hooks/useAudioControl', () => ({
  useAudioControl: () => ({
    audioState: { musicVol: 1, sfxVol: 1, isMuted: false },
    handleAudioChange: {
      setMusic: vi.fn(),
      setSfx: vi.fn(),
      toggleMute: vi.fn()
    }
  })
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, options) =>
      String(options?.defaultValue ?? key).replace(
        /\{\{(\w+)\}\}/g,
        (_m, name) => String(options?.[name] ?? '')
      ),
    i18n: { language: 'en', changeLanguage: vi.fn(), options: {} }
  })
}))

const { BandHQContentArea } =
  await import('../../../src/ui/bandhq/BandHQContentArea.tsx')

describe('BandHQContentArea Make Amends affordability', () => {
  const cost = getUnblacklistCost(VENUE_ID)

  beforeEach(() => {
    mocks.unblacklistVenue.mockClear()
    mocks.state.venueBlacklist = [VENUE_ID]
    // Holds more than the cost, so raw money alone would afford it.
    mocks.state.player.money = cost + 150
  })

  afterEach(() => {
    cleanup()
  })

  it('disables Make Amends when only protected Expedition cash could pay', () => {
    mocks.state.expedition = {
      status: 'active',
      protectedCareerCash: 200
    }

    render(<BandHQContentArea currentTab='DETAILS' />)

    const button = screen.getByRole('button', { name: /Make Amends/ })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(button)
    expect(mocks.unblacklistVenue).not.toHaveBeenCalled()
  })

  it('enables Make Amends when no cash is protected', () => {
    mocks.state.expedition = { status: 'idle' }

    render(<BandHQContentArea currentTab='DETAILS' />)

    const button = screen.getByRole('button', { name: /Make Amends/ })
    expect(button).toHaveAttribute('aria-disabled', 'false')
    fireEvent.click(button)
    expect(mocks.unblacklistVenue).toHaveBeenCalledWith(VENUE_ID)
  })
})
