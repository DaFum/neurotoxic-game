import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AuthorityEncounterDialog } from '../../src/ui/expedition/AuthorityEncounterDialog'
import { createInitialState } from '../../src/context/initialState'
import type { GameState } from '../../src/types'

const state: { current: GameState } = vi.hoisted(
  () => ({ current: null }) as never
)
const resolveExpeditionAuthorityExit = vi.hoisted(() => vi.fn())

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: (selector: (s: GameState) => unknown) =>
    selector(state.current),
  useGameActions: () => ({ resolveExpeditionAuthorityExit })
}))

// Local i18n mock that renders interpolation values, so the Contract named in
// a meta line stays assertable.
vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, options?: Record<string, unknown>) =>
      options?.contract === undefined
        ? key
        : `${key}(${String(options.contract)})`
  })
}))

// The future-obligation derivation reaches the real numeric helpers, so only
// the currency formatter is replaced.
vi.mock('../../src/utils/numberUtils', async importOriginal => ({
  ...(await importOriginal<typeof import('../../src/utils/numberUtils')>()),
  formatCurrency: (value: number) => `${value} EUR`
}))

// Structural CrisisModal mock: renders each action as a real button so the
// offered exits and their handlers stay assertable.
vi.mock('../../src/ui/shared/BrutalistUI', () => ({
  CrisisModal: ({
    isOpen,
    title,
    actions
  }: {
    isOpen: boolean
    title?: string
    actions?: Array<{
      id: string
      label: string
      meta?: string
      onClick?: () => void
    }>
  }) =>
    isOpen ? (
      <div role='dialog' aria-label={title}>
        <h2>{title}</h2>
        <ul>
          {(actions ?? []).map(action => (
            <li key={action.id}>
              <button
                type='button'
                data-testid={`authority-exit-${action.id}`}
                onClick={action.onClick}
              >
                {action.label} / {action.meta}
              </button>
            </li>
          ))}
        </ul>
      </div>
    ) : null
}))

const buildState = (heat: number, money: number, fuel: number): GameState => {
  const initial = createInitialState()
  return {
    ...initial,
    player: {
      ...initial.player,
      money,
      van: { ...initial.player.van, fuel }
    },
    expedition: {
      ...initial.expedition,
      status: 'active',
      runId: 'run-1',
      pressure: { ...initial.expedition.pressure, heat }
    }
  }
}

describe('AuthorityEncounterDialog', () => {
  beforeEach(() => {
    resolveExpeditionAuthorityExit.mockClear()
  })

  it('renders nothing below the Authority threshold', () => {
    state.current = buildState(50, 1000, 50)
    const { container } = render(<AuthorityEncounterDialog />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing while a crisis owns the decision surface', () => {
    const base = buildState(95, 1000, 50)
    state.current = {
      ...base,
      expedition: {
        ...base.expedition,
        pendingFailure: {
          id: 'x',
          reason: 'bankruptcy',
          sourceId: 'expedition_cash',
          raisedAtRouteStep: 0,
          choices: ['accept_failure']
        }
      }
    }
    const { container } = render(<AuthorityEncounterDialog />)
    expect(container.firstChild).toBeNull()
  })

  it('offers exactly the executable exits and dispatches the pick', () => {
    state.current = buildState(95, 1000, 50)
    render(<AuthorityEncounterDialog />)

    expect(screen.getByTestId('authority-exit-pay')).toHaveTextContent(
      'ui:expedition.authority.exit.pay / 500 EUR'
    )
    expect(screen.getByTestId('authority-exit-route_detour')).toBeTruthy()
    expect(screen.queryByTestId('authority-exit-crew')).toBeNull()
    expect(screen.queryByTestId('authority-exit-future_obligation')).toBeNull()

    fireEvent.click(screen.getByTestId('authority-exit-route_detour'))
    expect(resolveExpeditionAuthorityExit).toHaveBeenCalledWith('route_detour')
  })

  it('lets the player decline without spending an exit', () => {
    state.current = buildState(95, 1000, 50)
    const { container } = render(<AuthorityEncounterDialog />)

    fireEvent.click(screen.getByTestId('authority-exit-decline'))

    expect(resolveExpeditionAuthorityExit).not.toHaveBeenCalled()
    expect(container.firstChild).toBeNull()
  })

  it('asks again at the next route step after a decline', () => {
    const base = buildState(95, 1000, 50)
    state.current = base
    const { container, rerender } = render(<AuthorityEncounterDialog />)
    fireEvent.click(screen.getByTestId('authority-exit-decline'))
    expect(container.firstChild).toBeNull()

    // Same step, re-rendered: still declined. (The mocked selector does not
    // subscribe, and the component is memoized, so each rerender changes the
    // `suppressed` prop to force a render pass.)
    rerender(<AuthorityEncounterDialog suppressed={false} />)
    expect(container.firstChild).toBeNull()

    state.current = {
      ...base,
      expedition: {
        ...base.expedition,
        routeStep: base.expedition.routeStep + 1
      }
    }
    rerender(<AuthorityEncounterDialog suppressed={undefined} />)
    expect(screen.getByTestId('authority-exit-pay')).toBeTruthy()
  })

  it('stays hidden while another decision dialog is open', () => {
    state.current = buildState(95, 1000, 50)
    const { container, rerender } = render(
      <AuthorityEncounterDialog suppressed />
    )
    expect(container.firstChild).toBeNull()

    rerender(<AuthorityEncounterDialog suppressed={false} />)
    expect(screen.getByTestId('authority-exit-pay')).toBeTruthy()
  })

  it('names the Contract a future obligation would add', () => {
    const base = buildState(95, 0, 0)
    state.current = {
      ...base,
      runSeed: 123,
      expedition: {
        ...base.expedition,
        activeObligations: [],
        visitedNodeIds: ['exp_0_0'],
        loadout: {
          tourTypeId: 'standard_tour',
          regionId: 'industrial_belt',
          crewIds: [],
          nativeContracts: []
        } as never
      }
    }
    render(<AuthorityEncounterDialog />)
    expect(
      screen.getByTestId('authority-exit-future_obligation')
    ).toHaveTextContent(
      'ui:expedition.authority.meta.future_obligation(ui:expedition.contract.contract_no_rest_finale)'
    )
  })
})
