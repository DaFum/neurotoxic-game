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

const tCalls = vi.hoisted(() => [] as Array<{ key: string; options: unknown }>)

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string, options?: unknown) => {
      tCalls.push({ key, options })
      return key
    },
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

  it('supports roving tabindex with Arrow/Home/End keyboard navigation on category tabs', () => {
    state.current = createInitialState()
    render(<TourPrepLoadout />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs.map(tab => tab.getAttribute('tabindex'))).toEqual([
      '0',
      '-1',
      '-1',
      '-1'
    ])

    tabs[0]!.focus()
    fireEvent.keyDown(tabs[0]!, { key: 'ArrowRight' })
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[1]).toHaveFocus()
    expect(tabs[1]).toHaveAttribute('tabindex', '0')

    fireEvent.keyDown(tabs[1]!, { key: 'End' })
    expect(tabs[3]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[3]).toHaveFocus()

    fireEvent.keyDown(tabs[3]!, { key: 'ArrowRight' })
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(tabs[0]!, { key: 'Home' })
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[0]).toHaveFocus()
  })

  it('includes focus-visible ring classes on category tabs and selection controls', () => {
    state.current = createInitialState()
    render(<TourPrepLoadout />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs[0]?.className).toContain('focus-visible:ring-toxic-green')

    const perkNone = screen.getByTestId('expedition-prep-perk-none')
    expect(perkNone.className).toContain('focus-visible:ring-toxic-green')
  })

  it('exposes the raw load and capacity to assistive tech only when the cargo meter is over capacity', () => {
    state.current = createInitialState()
    render(<TourPrepLoadout />)
    fireEvent.click(screen.getAllByRole('tab')[1]!)

    const meter = () =>
      screen.getByRole('progressbar', { name: 'ui:expedition.prep.cargo' })
    expect(meter()).not.toHaveAttribute('aria-valuetext')

    fireEvent.change(screen.getByTestId('expedition-prep-spare-parts'), {
      target: { value: '10' }
    })
    fireEvent.change(screen.getByTestId('expedition-prep-supplies'), {
      target: { value: '10' }
    })

    // aria-valuenow is clamped to the capacity, so the overflow is only
    // audible through the value text.
    expect(meter()).toHaveAttribute(
      'aria-valuetext',
      'ui:expedition.prep.cargoOverCapacityText'
    )
    const call = tCalls
      .filter(c => c.key === 'ui:expedition.prep.cargoOverCapacityText')
      .at(-1)
    expect(call?.options).toEqual({ used: 20, max: 8 })
  })
})
