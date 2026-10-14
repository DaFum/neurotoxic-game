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
      return key === 'items:contraband.c_void_energy.name'
        ? 'Void Energy Drink'
        : key
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

  it('shows the showcase Contract locked with its Fame floor until the band is known', () => {
    const unknown = createInitialState()
    unknown.player.fame = 0
    state.current = unknown
    const { unmount } = render(<TourPrepLoadout />)
    fireEvent.click(screen.getAllByRole('tab')[3]!)

    const locked = screen.getByTestId(
      'expedition-prep-contract-contract_all_in'
    )
    expect(locked).toBeDisabled()
    expect(locked).toHaveTextContent('ui:expedition.prep.contractFameLocked')
    const call = tCalls
      .filter(c => c.key === 'ui:expedition.prep.contractFameLocked')
      .at(-1)
    expect(call?.options).toEqual({ fame: '1,000' })
    unmount()

    const known = createInitialState()
    known.player.fame = 1000
    state.current = known
    render(<TourPrepLoadout />)
    fireEvent.click(screen.getAllByRole('tab')[3]!)
    const open = screen.getByTestId('expedition-prep-contract-contract_all_in')
    expect(open).toBeEnabled()
    expect(open).not.toHaveTextContent('ui:expedition.prep.contractFameLocked')
  })

  it('names insurance policies and their cover instead of raw ids', () => {
    state.current = createInitialState()
    render(<TourPrepLoadout />)

    const roadside = screen.getByTestId('expedition-prep-insurance-roadside')
    expect(roadside).toHaveTextContent(
      'ui:expedition.insurance.policy.roadside'
    )
    expect(
      tCalls.some(c => c.key === 'ui:expedition.insurance.coverage.vehicle')
    ).toBe(true)
  })

  it('states sponsor and contract terms before the player commits', () => {
    state.current = createInitialState()
    render(<TourPrepLoadout />)

    const sponsorTerms = screen.getAllByTestId(
      /^expedition-prep-sponsor-terms-/
    )
    expect(sponsorTerms.length).toBeGreaterThan(0)
    expect(sponsorTerms[0]).toHaveTextContent('ui:deals.upfront')

    const contractTerms = screen.getByTestId(
      'expedition-prep-contract-terms-contract_keep_it_clean'
    )
    expect(contractTerms).toHaveTextContent(
      'ui:expedition.contractTerms.contract_keep_it_clean'
    )
    expect(contractTerms).toHaveTextContent('ui:expedition.prep.contractReward')
    expect(contractTerms).toHaveTextContent(
      'ui:expedition.prep.contractFailure'
    )
  })

  it('counts the sponsor advance in the cash available after start', () => {
    state.current = createInitialState()
    render(<TourPrepLoadout />)
    const amount = () =>
      Number(
        screen
          .getByTestId('expedition-prep-spendable')
          .textContent?.replace(/\D/g, '')
      )

    const before = amount()
    const offer = screen.getAllByTestId(
      /^expedition-prep-sponsor-(?!none|terms)/
    )[0]
    fireEvent.click(offer!)

    expect(amount()).toBeGreaterThan(before)
  })

  it('explains a full tank instead of offering a stuck fuel slider', () => {
    state.current = createInitialState()
    state.current.player.van = { ...state.current.player.van, fuel: 100 }
    render(<TourPrepLoadout />)

    expect(screen.getByTestId('expedition-prep-fuel-target')).toBeDisabled()
    expect(
      screen.getByText('ui:expedition.prep.fuelTankFull')
    ).toBeInTheDocument()
  })

  it('names an owned tourbus by kind/flavor/tier instead of its UUID or raw archetype enum', () => {
    const assetId = '3f2a9c1e-7b4d-4e8a-9c2f-1a2b3c4d5e6f'
    state.current = createInitialState()
    state.current.assets = [
      {
        id: assetId,
        kind: 'tourbus_chassis',
        chassisFlavor: 'diy',
        chassisTier: 3,
        condition: 80,
        baseUpkeep: 0,
        baseDailyRevenue: 0,
        slots: [],
        acquiredOnDay: 1,
        acquisitionMode: 'cash',
        baseRiskEventChance: 0
      }
    ]
    render(<TourPrepLoadout />)

    const option = screen.getByTestId(`expedition-prep-tourbus-${assetId}`)
    expect(option).not.toHaveTextContent(assetId)
    expect(option).not.toHaveTextContent(/armored_hauler(?!\w)/)
    expect(option).not.toHaveTextContent('Archetype:')
    expect(option).toHaveTextContent('assets:kind.tourbus_chassis')
    expect(option).toHaveTextContent('assets:flavor.diy')
    expect(option).toHaveTextContent('assets:chassisTier.3')
    expect(option).toHaveTextContent('ui:expedition.prep.tourbusMeta')
    const call = tCalls
      .filter(c => c.key === 'ui:expedition.prep.tourbusMeta')
      .at(-1)
    expect(call?.options).toEqual({
      archetype: 'ui:expedition.chassis.archetype.armored_hauler',
      cargo: '4'
    })
  })

  it('labels the merch and protected-cash sliders', () => {
    state.current = createInitialState()
    render(<TourPrepLoadout />)

    const patches = screen.getByTestId('expedition-prep-merch-patches')
    expect(patches.closest('label')).toHaveTextContent(
      'economy:gigIncome.merchSales.patches.label'
    )
    expect(
      screen.getByTestId('expedition-prep-protected-cash')
    ).toHaveAccessibleName('ui:expedition.prep.protectedCash')
  })

  it('offers owned non-stackable contraband (stacks: null) as one packable unit', () => {
    state.current = createInitialState()
    state.current.band.stash = {
      c_rusty_strings: { id: 'c_rusty_strings', stacks: null },
      c_void_energy: { id: 'c_void_energy', stacks: 2 },
      c_bone_dust: { id: 'c_bone_dust', stacks: Number.NaN }
    } as unknown as GameState['band']['stash']
    render(<TourPrepLoadout />)

    expect(
      screen.getByTestId('expedition-prep-contraband-c_rusty_strings')
    ).toHaveAttribute('max', '1')
    expect(
      screen.getByTestId('expedition-prep-contraband-c_void_energy')
    ).toHaveAttribute('max', '2')
    expect(
      screen.queryByTestId('expedition-prep-contraband-c_bone_dust')
    ).toBeNull()
  })

  it('translates contraband names instead of rendering the raw locale key', () => {
    state.current = createInitialState()
    state.current.band.stash = {
      c_void_energy: { id: 'c_void_energy', stacks: 2 }
    } as unknown as GameState['band']['stash']
    tCalls.length = 0
    render(<TourPrepLoadout />)

    const slider = screen.getByTestId(
      'expedition-prep-contraband-c_void_energy'
    )
    expect(slider.closest('label')).toHaveTextContent('Void Energy Drink')
    expect(slider.closest('label')).not.toHaveTextContent(
      'items:contraband.c_void_energy.name'
    )
  })
})
