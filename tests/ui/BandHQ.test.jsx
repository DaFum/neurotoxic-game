import { describe, expect, test, vi, beforeAll, afterEach } from 'vitest'

import React from 'react'
import {
  render,
  screen,
  cleanup,
  waitFor,
  act,
  fireEvent
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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
      reputationByRegion: {},
      career: { finalizedExpeditionRuns: 0, unlockedSetIds: [] },
      expedition: { status: 'idle' }
    }),
  useGameActions: () => ({
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
    handleAudioChange: {
      setMusic: vi.fn(),
      setSfx: vi.fn(),
      toggleMute: vi.fn()
    }
  })
}))

vi.mock('../../src/data/hqItems', () => ({
  HQ_ITEMS: { gear: [], instruments: [] }
}))
vi.mock('../../src/data/upgradeCatalog', () => ({
  getUnifiedUpgradeCatalog: () => []
}))
vi.mock('../../src/data/songs', () => ({ SONGS_DB: [] }))
vi.mock('../../src/utils/imageGen', () => ({
  isImageGenerationAvailable: () => true,
  resolveGenImageUrl: () => 'mock-url',
  getGeneratedImageFallbackUrl: () => 'mock-fallback',
  getGenImageUrl: () => 'mock-url',
  IMG_PROMPTS: {}
}))
vi.mock('../../src/ui/bandhq/hooks/usePurchaseLogic', () => ({
  usePurchaseLogic: () => ({
    handleBuy: vi.fn(),
    isItemOwned: () => false,
    isItemDisabled: () => false,
    getAdjustedCost: item => item.cost
  })
}))

describe('BandHQ UI tests', () => {
  afterEach(() => {
    cleanup()
  })
  let BandHQ

  beforeAll(async () => {
    const module = await import('../../src/ui/BandHQ.tsx')
    BandHQ = module.BandHQ
  })

  test('basic tab reachability check', async () => {
    const props = { onClose: () => {} }
    const { container } = render(React.createElement(BandHQ, props))

    // Check render
    expect(container.querySelector('h2')).toBeTruthy()
    expect(container.textContent).toContain('BAND HQ')

    // Check reachability
    const user = userEvent.setup()
    const shopTab = screen.getByRole('tab', { name: /shop/i })
    await user.click(shopTab)
    expect(screen.getByRole('tabpanel', { name: /shop/i })).toBeVisible()
  })

  test('uses a mobile-safe dialog shell and stacked header controls', () => {
    const props = { onClose: () => {} }
    render(React.createElement(BandHQ, props))

    const dialog = screen.getByRole('dialog', { name: /band hq/i })
    const leaveButton = screen.getByRole('button', { name: /leave/i })
    const tablist = screen.getByRole('tablist', {
      name: /band hq sections/i
    })

    expect(dialog).toHaveClass('h-[calc(100svh-1rem)]')
    expect(dialog).toHaveClass('max-h-[calc(100svh-1rem)]')
    expect(dialog).toHaveClass('shadow-[4px_4px_0px_var(--color-toxic-green)]')
    expect(leaveButton).toHaveClass('w-full')
    expect(leaveButton).toHaveClass('sm:w-auto')
    expect(tablist).toHaveClass('shrink-0')
    expect(tablist).toHaveClass('scrollbar-hidden')
  })

  test('joins the shared modal stack: single Escape close, Tab trap and focus restore', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const Harness = ({ open }) => (
      <>
        <button type='button'>Open HQ</button>
        {open && <BandHQ onClose={onClose} />}
      </>
    )

    const { rerender } = render(<Harness open={false} />)
    const opener = screen.getByRole('button', { name: 'Open HQ' })
    opener.focus()
    rerender(<Harness open={true} />)

    const dialog = screen.getByRole('dialog', { name: /band hq/i })
    await waitFor(() => expect(dialog).toHaveFocus())
    expect(dialog.parentElement).toHaveAttribute('data-modal-overlay')
    expect(opener).toHaveAttribute('inert')

    // Tab wraps inside the dialog in both directions.
    const focusable = Array.from(
      dialog.querySelectorAll('button:not([disabled]), [tabindex="0"]')
    )
    focusable[focusable.length - 1].focus()
    await user.tab()
    expect(focusable[0]).toHaveFocus()
    await user.tab({ shift: true })
    expect(focusable[focusable.length - 1]).toHaveFocus()

    // One Escape closes exactly once (no second window-level listener).
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)

    rerender(<Harness open={false} />)
    expect(opener).not.toHaveAttribute('inert')
    expect(opener).toHaveFocus()
  })

  test('supports roving tabIndex and keyboard arrow navigation between tabs', async () => {
    const props = { onClose: () => {} }
    render(React.createElement(BandHQ, props))

    const user = userEvent.setup()
    const statsTab = screen.getByRole('tab', { name: /stats/i })
    const detailsTab = screen.getByRole('tab', { name: /details/i })

    // Active tab has tabIndex 0, inactive has -1
    expect(statsTab).toHaveAttribute('tabindex', '0')
    expect(detailsTab).toHaveAttribute('tabindex', '-1')
    expect(statsTab).toHaveAttribute('aria-selected', 'true')
    expect(detailsTab).toHaveAttribute('aria-selected', 'false')

    // Navigate using ArrowRight
    statsTab.focus()
    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('tabpanel', { name: /details/i })).toBeVisible()
    expect(detailsTab).toHaveAttribute('tabindex', '0')
    expect(statsTab).toHaveAttribute('tabindex', '-1')

    // Navigate to Glossary tab
    const glossaryTab = screen.getByRole('tab', { name: /glossary/i })
    await user.click(glossaryTab)
    expect(screen.getByRole('tabpanel', { name: /glossary/i })).toBeVisible()

    // ArrowRight onto locked Void Trader tab: receives focus, aria-disabled is true, active panel stays GLOSSARY
    glossaryTab.focus()
    await user.keyboard('{ArrowRight}')
    const voidTab = screen.getByRole('tab', { name: /void/i })
    expect(voidTab).toHaveFocus()
    expect(voidTab).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('tabpanel', { name: /glossary/i })).toBeVisible()

    // Navigate to first tab with Home key
    await user.keyboard('{Home}')
    expect(statsTab).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tabpanel', { name: /stats/i })).toBeVisible()
  })

  test('tabs keep a 44px minimum touch target', () => {
    render(React.createElement(BandHQ, { onClose: () => {} }))

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(11)
    for (const tab of tabs) expect(tab).toHaveClass('min-h-11')
  })

  test('tab strip overflow cue follows scroll position and strip size', () => {
    const observers = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback) {
          this.callback = callback
          observers.push(this)
        }
        observe = vi.fn()
        unobserve = vi.fn()
        disconnect = vi.fn()
      }
    )
    try {
      const { unmount } = render(
        React.createElement(BandHQ, { onClose: () => {} })
      )
      const tablist = screen.getByRole('tablist', {
        name: /band hq sections/i
      })
      const cue = side =>
        document.querySelector(`[data-overflow-cue="${side}"]`)

      // jsdom lays nothing out, so the strip "fits": no cue at all.
      expect(cue('start')).toBeNull()
      expect(cue('end')).toBeNull()

      const metrics = { scrollWidth: 1200, clientWidth: 400, scrollLeft: 0 }
      for (const key of Object.keys(metrics)) {
        Object.defineProperty(tablist, key, {
          configurable: true,
          get: () => metrics[key]
        })
      }
      const stripObserver = observers.find(o =>
        o.observe.mock.calls.some(([el]) => el === tablist)
      )
      expect(stripObserver).toBeDefined()

      // Overflowing at the start edge: only the end side hints at more tabs.
      act(() => stripObserver.callback([]))
      expect(cue('start')).toBeNull()
      expect(cue('end')).not.toBeNull()

      metrics.scrollLeft = 400
      fireEvent.scroll(tablist)
      expect(cue('start')).not.toBeNull()
      expect(cue('end')).not.toBeNull()

      // Reaching the end edge hides that side's cue.
      metrics.scrollLeft = 800
      fireEvent.scroll(tablist)
      expect(cue('start')).not.toBeNull()
      expect(cue('end')).toBeNull()

      // The cue is decoration only.
      const startCue = cue('start')
      expect(startCue).toHaveAttribute('aria-hidden', 'true')
      expect(startCue).toHaveClass('pointer-events-none')
      expect(tablist.contains(startCue)).toBe(false)

      // Widening the strip until everything fits removes every cue.
      metrics.clientWidth = 1200
      metrics.scrollLeft = 0
      act(() => stripObserver.callback([]))
      expect(cue('start')).toBeNull()
      expect(cue('end')).toBeNull()

      unmount()
      expect(stripObserver.disconnect).toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
