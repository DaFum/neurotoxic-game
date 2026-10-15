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

vi.mock('../../src/utils/numberUtils', () => ({
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
})
