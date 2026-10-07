import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ExpeditionMetaTab } from '../../src/ui/expedition/ExpeditionMetaTab'
import { createInitialState } from '../../src/context/initialState'
import type { GameState } from '../../src/types'
import type { CareerState } from '../../src/types/career'

const state: { current: GameState } = vi.hoisted(
  () => ({ current: null }) as never
)
const actions = vi.hoisted(() => ({
  purchaseExpeditionHqFacility: vi.fn(),
  purchaseExpeditionUnlockSet: vi.fn(() => true),
  saveGameAfterStateCommit: vi.fn(),
  addToast: vi.fn()
}))

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: (selector: (s: GameState) => unknown) =>
    selector(state.current),
  useGameActions: () => actions
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ i18n: { language: 'en' }, t: (key: string) => key })
}))

const withCareer = (career: Partial<CareerState>): GameState => {
  const base = createInitialState()
  base.career = { ...base.career, ...career }
  return base
}

describe('ExpeditionMetaTab', () => {
  beforeEach(() => {
    for (const fn of Object.values(actions)) fn.mockClear()
  })

  it('builds the next facility level at the stored level', () => {
    state.current = withCareer({ tourTokens: 4 })
    render(<ExpeditionMetaTab />)
    fireEvent.click(screen.getByTestId('expedition-meta-build-workshop'))
    expect(actions.purchaseExpeditionHqFacility).toHaveBeenCalledWith(
      'workshop',
      0
    )
    // The command owns persistence and refusal feedback, so the tab neither
    // saves nor toasts on its own.
    expect(actions.saveGameAfterStateCommit).not.toHaveBeenCalled()
    expect(actions.addToast).not.toHaveBeenCalled()
  })

  it('names the current level as the stale guard for a level-2 build', () => {
    state.current = withCareer({
      tourTokens: 10,
      hqFacilityLevels: Object.assign(Object.create(null), {
        management_office: 1
      })
    })
    render(<ExpeditionMetaTab />)
    fireEvent.click(
      screen.getByTestId('expedition-meta-build-management_office')
    )
    expect(actions.purchaseExpeditionHqFacility).toHaveBeenCalledWith(
      'management_office',
      1
    )
  })

  it('disables a build the Career cannot afford and hides a maxed one', () => {
    state.current = withCareer({
      tourTokens: 1,
      hqFacilityLevels: Object.assign(Object.create(null), { workshop: 1 })
    })
    render(<ExpeditionMetaTab />)
    expect(screen.queryByTestId('expedition-meta-build-workshop')).toBeNull()
    expect(screen.getByTestId('expedition-meta-build-garage')).toBeDisabled()
  })

  it('buys an unlock set through the journal command', () => {
    state.current = withCareer({
      tourTokens: 5,
      hqFacilityLevels: Object.assign(Object.create(null), { workshop: 1 })
    })
    render(<ExpeditionMetaTab />)
    const button = screen.getByTestId('expedition-meta-unlock-mechanic_network')
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(actions.purchaseExpeditionUnlockSet).toHaveBeenCalledWith(
      'mechanic_network'
    )
    // `true` only means the journal opened; the command announces the
    // outcome once the marker write settles, so the tab must not.
    expect(actions.addToast).not.toHaveBeenCalled()
  })

  it('leaves a refused set to the command, with no toast of its own', () => {
    actions.purchaseExpeditionUnlockSet.mockReturnValueOnce(false)
    state.current = withCareer({
      tourTokens: 5,
      hqFacilityLevels: Object.assign(Object.create(null), { workshop: 1 })
    })
    render(<ExpeditionMetaTab />)
    fireEvent.click(
      screen.getByTestId('expedition-meta-unlock-mechanic_network')
    )
    expect(actions.addToast).not.toHaveBeenCalled()
  })

  it('keeps a set locked until its facility is built and says why', () => {
    state.current = withCareer({ tourTokens: 5 })
    render(<ExpeditionMetaTab />)
    expect(
      screen.getByTestId('expedition-meta-unlock-mechanic_network')
    ).toBeDisabled()
    expect(
      screen.getByTestId('expedition-meta-unlock-blocker-mechanic_network')
    ).toHaveTextContent('ui:expedition.meta.blocked.facility')
  })

  it('names the token shortfall on an otherwise buyable set', () => {
    state.current = withCareer({
      tourTokens: 1,
      hqFacilityLevels: Object.assign(Object.create(null), { workshop: 1 })
    })
    render(<ExpeditionMetaTab />)
    expect(
      screen.getByTestId('expedition-meta-unlock-blocker-mechanic_network')
    ).toHaveTextContent('ui:expedition.meta.blocked.tokens')
  })

  it('shows an owned set instead of a buy control', () => {
    state.current = withCareer({ unlockedSetIds: ['mechanic_network'] })
    render(<ExpeditionMetaTab />)
    expect(
      screen.queryByTestId('expedition-meta-unlock-mechanic_network')
    ).toBeNull()
  })
})
