import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { TourPrep } from '../../src/scenes/TourPrep'
import { createInitialState } from '../../src/context/initialState'
import { createDefaultExpeditionState } from '../../src/domain/expedition/defaults'
import { SONGS_BY_ID } from '../../src/data/songs'
import { buildPreparedExpeditionSponsorOffers } from '../../src/domain/expedition/sponsors'
import type { GameState } from '../../src/types'

const state: { current: GameState } = vi.hoisted(
  () => ({ current: null }) as never
)
const actions = vi.hoisted(() => ({
  prepareExpeditionRun: vi.fn(),
  startExpedition: vi.fn(),
  changeScene: vi.fn(),
  saveGameAfterStateCommit: vi.fn()
}))

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: (selector: (s: GameState) => unknown) =>
    selector(state.current),
  useGameActions: () => actions
}))

vi.mock('../../src/utils/numberUtils', () => ({
  formatCurrency: (value: number) => `${value} EUR`
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, options?: Record<string, unknown>) => {
      if (options && Object.hasOwn(options, 'defaultValue')) {
        return String(options.defaultValue)
      }
      return options && Object.keys(options).length > 0
        ? `${key}:${Object.values(options).join(',')}`
        : key
    }
  })
}))

const GUITAR = 'hq_inst_guitar_custom'
const DRUM_TRIGGER = 'hq_inst_drum_trigger'
const FLYING_V = 'hq_inst_guitar_flying_v'
const COWBELL = 'hq_inst_cowbell_inferno'
const SONG_IDS = [...SONGS_BY_ID.keys()]

const buildState = ({
  status = 'prepared' as GameState['expedition']['status'],
  owned = [] as string[],
  money = 5000,
  fuel = 100
} = {}) => {
  const base = createInitialState()
  base.runSeed = 4242
  base.player.money = money
  base.player.van = { ...base.player.van, fuel }
  base.player.van.upgrades = [...owned]
  base.expedition = {
    ...createDefaultExpeditionState(),
    status,
    prep: status === 'idle' ? null : { prepId: 'run_1' }
  }
  return base
}

describe('TourPrep scene', () => {
  beforeEach(() => {
    for (const fn of Object.values(actions)) fn.mockClear()
  })

  it('claims a run identity on entry when idle', () => {
    state.current = buildState({ status: 'idle' })
    render(<TourPrep />)
    expect(actions.prepareExpeditionRun).toHaveBeenCalledTimes(1)
  })

  it('does not reroll while a run is already prepared', () => {
    state.current = buildState({ status: 'prepared' })
    render(<TourPrep />)
    expect(actions.prepareExpeditionRun).not.toHaveBeenCalled()
  })

  it('saves and leaves once the run is active', () => {
    state.current = buildState({ status: 'active' })
    render(<TourPrep />)
    // Persistence before navigation: the scene unmounts before it could
    // observe the committed state itself.
    expect(actions.saveGameAfterStateCommit).toHaveBeenCalledTimes(1)
    expect(actions.changeScene).toHaveBeenCalledWith('OVERWORLD')
  })

  it('offers no starter perk until its unlock set is owned', () => {
    state.current = buildState()
    render(<TourPrep />)
    // The "no perk" option is always there; a perk button is not.
    expect(screen.getByTestId('expedition-prep-perk-none')).toBeInTheDocument()
    expect(screen.queryByTestId('expedition-prep-perk-mechanic_kit')).toBeNull()
  })

  it('offers only the perk the owned set carries, and commits it', () => {
    const base = buildState()
    base.career = { ...base.career, unlockedSetIds: ['mechanic_network'] }
    state.current = base
    render(<TourPrep />)

    const perk = screen.getByTestId('expedition-prep-perk-mechanic_kit')
    expect(perk).toBeInTheDocument()
    expect(screen.queryByTestId('expedition-prep-perk-press_pass')).toBeNull()

    fireEvent.click(perk)
    expect(perk).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByTestId('expedition-prep-commit'))
    expect(actions.startExpedition).toHaveBeenCalledTimes(1)
    expect(actions.startExpedition.mock.calls[0][0].starterPerkId).toBe(
      'mechanic_kit'
    )
  })

  it('offers no Tour Pressure until Ascension is open', () => {
    state.current = buildState()
    render(<TourPrep />)
    expect(
      screen.queryByTestId('expedition-prep-pressure-bad_roads')
    ).toBeNull()
  })

  it('commits up to three pressure modifiers and no more', () => {
    const base = buildState()
    base.career = { ...base.career, ascensionUnlocked: true }
    state.current = base
    render(<TourPrep />)

    const pick = (id: string) =>
      screen.getByTestId(`expedition-prep-pressure-${id}`)

    fireEvent.click(pick('bad_roads'))
    fireEvent.click(pick('media_frenzy'))
    fireEvent.click(pick('no_safety_net'))
    // The fourth is offered but not selectable.
    expect(pick('union_trouble')).toBeDisabled()
    // Deselecting frees the slot again rather than locking the picker.
    fireEvent.click(pick('no_safety_net'))
    expect(pick('union_trouble')).toBeEnabled()

    fireEvent.click(screen.getByTestId('expedition-prep-commit'))
    expect(actions.startExpedition).toHaveBeenCalledTimes(1)
    expect(
      actions.startExpedition.mock.calls[0][0].pressureModifierIds
    ).toEqual(['bad_roads', 'media_frenzy'])
  })

  it('previews the prepared route and enables the commit', () => {
    state.current = buildState()
    render(<TourPrep />)

    const nodes = Number(
      screen.getByTestId('expedition-prep-nodes').textContent
    )
    expect(nodes).toBeGreaterThanOrEqual(7)
    expect(nodes).toBeLessThanOrEqual(9)
    expect(
      Number(screen.getByTestId('expedition-prep-windows').textContent)
    ).toBeGreaterThan(0)
    expect(screen.getByTestId('expedition-prep-commit')).toBeEnabled()
  })

  it('commits the validated build rather than the raw selection', () => {
    state.current = buildState()
    render(<TourPrep />)

    fireEvent.click(screen.getByTestId('expedition-prep-commit'))
    expect(actions.startExpedition).toHaveBeenCalledTimes(1)
    const committed = actions.startExpedition.mock.calls[0][0]
    expect(committed.tourTypeId).toBe('standard_tour')
    expect(committed.build.setlistSongIds).toEqual([SONG_IDS[0]])
    expect(committed.build.sponsorOfferId).toBeNull()
    expect(committed.nativeContracts).toEqual([])
  })

  it('commits a selected sponsor offer and native contract', () => {
    const base = buildState()
    base.expedition = {
      ...base.expedition,
      preparedSponsorOffers: buildPreparedExpeditionSponsorOffers(base)
    }
    // `contract_three_good_gigs` is a performance Contract, and that pool is
    // what `festival_network` sells. The subject here is the commit, not the
    // pool gate, so the Career owns the set.
    base.career = { ...base.career, unlockedSetIds: ['festival_network'] }
    state.current = base
    render(<TourPrep />)

    const offer = base.expedition.preparedSponsorOffers[0]
    expect(offer).toBeDefined()
    fireEvent.click(
      screen.getByTestId(`expedition-prep-sponsor-${offer.offerId}`)
    )
    fireEvent.click(
      screen.getByTestId('expedition-prep-contract-contract_three_good_gigs')
    )
    fireEvent.click(screen.getByTestId('expedition-prep-commit'))

    const committed = actions.startExpedition.mock.calls[0][0]
    expect(committed.build.sponsorOfferId).toBe(offer.offerId)
    expect(committed.nativeContracts).toEqual([
      { templateId: 'contract_three_good_gigs', targetNodeId: null }
    ])
  })

  it('derives the route target for a route contract rather than asking', () => {
    state.current = buildState()
    render(<TourPrep />)

    fireEvent.click(
      screen.getByTestId('expedition-prep-contract-contract_route_target')
    )
    fireEvent.click(screen.getByTestId('expedition-prep-commit'))

    const committed = actions.startExpedition.mock.calls[0][0]
    expect(committed.nativeContracts).toHaveLength(1)
    // The validator requires a route contract to name its target, and the
    // reducer materializes the same node.
    expect(committed.nativeContracts[0].targetNodeId).toEqual(
      expect.any(String)
    )
  })

  it('refuses an incompatible contract pair in the picker', () => {
    state.current = buildState()
    render(<TourPrep />)

    fireEvent.click(
      screen.getByTestId('expedition-prep-contract-contract_keep_it_clean')
    )
    // `contract_all_in` cannot be combined with `contract_keep_it_clean`, so
    // the screen shows it as unavailable instead of failing at commit time.
    expect(
      screen.getByTestId('expedition-prep-contract-contract_all_in')
    ).toBeDisabled()

    fireEvent.click(screen.getByTestId('expedition-prep-commit'))
    expect(
      actions.startExpedition.mock.calls[0][0].nativeContracts
    ).toHaveLength(1)
  })

  it('blocks the commit and names the reason for an illegal build', () => {
    state.current = buildState()
    render(<TourPrep />)

    // Deselecting the only song makes the setlist empty, which the canonical
    // validator rejects.
    fireEvent.click(screen.getByRole('button', { name: SONG_IDS[0] }))
    expect(screen.getByTestId('expedition-prep-commit')).toBeDisabled()
    expect(screen.getByTestId('expedition-prep-rejection')).toHaveTextContent(
      'ui:expedition.prep.reject.SETLIST_EMPTY'
    )

    fireEvent.click(screen.getByTestId('expedition-prep-commit'))
    expect(actions.startExpedition).not.toHaveBeenCalled()
  })

  it('offers only owned performance gear', () => {
    state.current = buildState({ owned: [GUITAR] })
    render(<TourPrep />)

    // The mocked `t` resolves the item label to its defaultValue, the raw id.
    expect(screen.getByRole('button', { name: GUITAR })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: DRUM_TRIGGER })).toBeNull()
  })

  it('explains an empty gear catalog instead of rendering an empty list', () => {
    state.current = buildState()
    // The starter roster owns the three setup consumables (`strings`,
    // `cables`, `drum_parts`), which are legitimately selectable catalog
    // items — clear them to reach the genuinely empty case.
    state.current.band.inventory = {
      ...state.current.band.inventory,
      strings: false,
      cables: false,
      drum_parts: false
    }
    render(<TourPrep />)
    expect(screen.getByTestId('expedition-prep-no-gear')).toBeInTheDocument()
  })

  it('caps the committed gear at three owned items', () => {
    state.current = buildState({
      owned: [GUITAR, FLYING_V, DRUM_TRIGGER, COWBELL]
    })
    render(<TourPrep />)

    for (const itemId of [GUITAR, FLYING_V, DRUM_TRIGGER, COWBELL]) {
      fireEvent.click(screen.getByRole('button', { name: itemId }))
    }
    fireEvent.click(screen.getByTestId('expedition-prep-commit'))

    const committed = actions.startExpedition.mock.calls[0][0]
    expect(committed.build.equipment.selectedGearItemIds).toHaveLength(3)
    expect(committed.build.equipment.selectedGearItemIds).not.toContain(COWBELL)
  })

  it('prices the fuel top-up from the committed target', () => {
    state.current = buildState({ fuel: 60 })
    render(<TourPrep />)

    fireEvent.change(screen.getByTestId('expedition-prep-fuel-target'), {
      target: { value: '100' }
    })
    // 40 litres at the canonical 1.75 EUR/l price.
    expect(screen.getByTestId('expedition-prep-fuel-cost')).toHaveTextContent(
      '70 EUR'
    )
    expect(screen.getByTestId('expedition-prep-spendable')).toHaveTextContent(
      '4930 EUR'
    )
  })

  it('reduces the spendable slice by the protected career cash', () => {
    state.current = buildState({ money: 5000, fuel: 100 })
    render(<TourPrep />)

    fireEvent.change(screen.getByTestId('expedition-prep-protected-cash'), {
      target: { value: '2000' }
    })
    expect(screen.getByTestId('expedition-prep-spendable')).toHaveTextContent(
      '3000 EUR'
    )
  })

  it('keeps a route back to the menu', () => {
    state.current = buildState()
    render(<TourPrep />)
    fireEvent.click(
      screen.getByRole('button', { name: 'ui:expedition.prep.abort' })
    )
    expect(actions.changeScene).toHaveBeenCalledWith('MENU')
  })
})
