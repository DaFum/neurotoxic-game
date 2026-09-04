import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { FailureCrisisDialog } from '../../src/ui/expedition/FailureCrisisDialog'
import { createInitialState } from '../../src/context/initialState'
import { createDefaultExpeditionState } from '../../src/domain/expedition/defaults'
import type { GameState } from '../../src/types'
import type { PendingExpeditionFailure } from '../../src/types/expedition'

const state: { current: GameState } = vi.hoisted(
  () => ({ current: null }) as never
)
const acceptExpeditionFailure = vi.hoisted(() => vi.fn())

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: (selector: (s: GameState) => unknown) =>
    selector(state.current),
  useGameActions: () => ({ acceptExpeditionFailure })
}))

vi.mock('../../src/utils/numberUtils', () => ({
  formatCurrency: (value: number) => `${value} EUR`
}))

// Structural CrisisModal mock: renders each action as a real button so the
// dialog's choice list and its handlers stay assertable.
vi.mock('../../src/ui/shared/BrutalistUI', () => ({
  CrisisModal: ({
    isOpen,
    title,
    description,
    actions
  }: {
    isOpen: boolean
    title?: string
    description?: string
    actions?: Array<{
      id: string
      label: string
      meta?: string
      onClick?: () => void
      variant?: string
    }>
  }) =>
    isOpen ? (
      <div role='dialog' aria-label={title}>
        <h2>{title}</h2>
        <p>{description}</p>
        <ul>
          {(actions ?? []).map(action => (
            <li key={action.id}>
              <button
                type='button'
                data-testid={`crisis-choice-${action.id}`}
                data-variant={action.variant}
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

const buildState = (pendingFailure: PendingExpeditionFailure | null) => {
  const base = createInitialState()
  base.player.van = { ...base.player.van, fuel: 20 }
  base.expedition = {
    ...createDefaultExpeditionState(),
    status: 'active',
    runId: 'run_1',
    routeStep: 4,
    pendingFailure
  }
  return base
}

const crisis = (
  overrides: Partial<PendingExpeditionFailure> = {}
): PendingExpeditionFailure => ({
  id: 'exp_fail::run_1::fuel_stranded::exp_4_0::4',
  reason: 'fuel_stranded',
  sourceId: 'exp_4_0',
  raisedAtRouteStep: 4,
  choices: ['refuel', 'tow', 'accept_failure'],
  ...overrides
})

describe('FailureCrisisDialog', () => {
  beforeEach(() => {
    acceptExpeditionFailure.mockClear()
  })

  it('renders nothing while no crisis is live', () => {
    state.current = buildState(null)
    const { container } = render(<FailureCrisisDialog />)
    expect(container.firstChild).toBeNull()
  })

  it('names the failure family and the state that caused it', () => {
    state.current = buildState(crisis())
    render(<FailureCrisisDialog />)

    expect(
      screen.getByText('ui:expedition.crisis.title.fuel_stranded')
    ).toBeInTheDocument()
    // The crisis must expose the cause, so the node id reaches the copy.
    expect(
      screen.getByText('ui:expedition.crisis.cause.fuel_stranded:exp_4_0')
    ).toBeInTheDocument()
  })

  it('offers exactly the reducer-derived choices', () => {
    state.current = buildState(crisis())
    render(<FailureCrisisDialog />)

    expect(screen.getByTestId('crisis-choice-refuel')).toBeInTheDocument()
    expect(screen.getByTestId('crisis-choice-tow')).toBeInTheDocument()
    expect(
      screen.getByTestId('crisis-choice-accept_failure')
    ).toBeInTheDocument()
    // `extract` was not in the derived set, so the dialog must not invent it.
    expect(screen.queryByTestId('crisis-choice-extract')).toBeNull()
  })

  it('prices the paid escapes from their canonical costs', () => {
    state.current = buildState(crisis())
    render(<FailureCrisisDialog />)

    // A tank at 20 costs 80 litres × 1.75 = 140 to fill.
    expect(screen.getByTestId('crisis-choice-refuel')).toHaveTextContent(
      '140 EUR'
    )
    expect(screen.getByTestId('crisis-choice-tow')).toHaveTextContent('180 EUR')
  })

  it('always exposes an accept-failure escape, so a crisis cannot softlock', () => {
    state.current = buildState(crisis({ choices: ['accept_failure'] }))
    render(<FailureCrisisDialog />)

    const accept = screen.getByTestId('crisis-choice-accept_failure')
    expect(accept).toBeInTheDocument()
    expect(accept).toHaveAttribute('data-variant', 'danger')
  })

  it('dispatches only the terminal transition itself', () => {
    const onRefuel = vi.fn()
    const onTow = vi.fn()
    state.current = buildState(crisis())
    render(<FailureCrisisDialog onRefuel={onRefuel} onTow={onTow} />)

    fireEvent.click(screen.getByTestId('crisis-choice-accept_failure'))
    expect(acceptExpeditionFailure).toHaveBeenCalledTimes(1)

    // The recovery responses belong to the host scene, not to this dialog.
    fireEvent.click(screen.getByTestId('crisis-choice-refuel'))
    expect(onRefuel).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByTestId('crisis-choice-tow'))
    expect(onTow).toHaveBeenCalledTimes(1)
    expect(acceptExpeditionFailure).toHaveBeenCalledTimes(1)
  })

  it('renders the bankruptcy family with its own copy', () => {
    state.current = buildState(
      crisis({
        reason: 'bankruptcy',
        sourceId: 'expedition_cash',
        choices: ['accept_failure']
      })
    )
    render(<FailureCrisisDialog />)
    expect(
      screen.getByText('ui:expedition.crisis.title.bankruptcy')
    ).toBeInTheDocument()
    expect(
      // The mocked `t` resolves the nested source lookup to its defaultValue,
      // which is the raw source id.
      screen.getByText('ui:expedition.crisis.cause.bankruptcy:expedition_cash')
    ).toBeInTheDocument()
  })
})
