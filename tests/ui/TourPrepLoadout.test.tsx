import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TourPrepLoadout } from '../../src/ui/expedition/TourPrepLoadout'
import { createInitialState } from '../../src/context/initialState'
import type { GameState } from '../../src/types'

const state: { current: GameState } = vi.hoisted(
  () => ({ current: null }) as never
)

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: (selector: (s: GameState) => unknown) =>
    selector(state.current),
  useGameActions: () => ({
    startExpedition: vi.fn(),
    prepareExpeditionSponsorOffers: vi.fn()
  })
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' }
  })
}))

describe('TourPrepLoadout', () => {
  it('renders category tabs with proper ARIA attributes and switches active tab', () => {
    state.current = createInitialState()
    render(<TourPrepLoadout />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs.length).toBe(4)

    // First tab active by default
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[0]).toHaveAttribute('aria-controls', 'panel-route_performance')
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false')

    // Switch to tab 2 (Tourbus & Cargo)
    fireEvent.click(tabs[1]!)
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
  })

  it('includes focus-visible ring classes on category tabs and selection controls', () => {
    state.current = createInitialState()
    render(<TourPrepLoadout />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs[0]?.className).toContain('focus-visible:ring-toxic-green')

    const perkNone = screen.getByTestId('expedition-prep-perk-none')
    expect(perkNone.className).toContain('focus-visible:ring-toxic-green')
  })
})
