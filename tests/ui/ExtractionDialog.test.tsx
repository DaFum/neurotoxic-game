import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ExtractionDialog } from '../../src/ui/expedition/ExtractionDialog'
import { createInitialState } from '../../src/context/initialState'
import { createDefaultExpeditionState } from '../../src/domain/expedition/defaults'
import type { GameState } from '../../src/types'

const state: { current: GameState } = vi.hoisted(
  () => ({ current: null }) as never
)
const extractExpedition = vi.hoisted(() => vi.fn())

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: (selector: (s: GameState) => unknown) =>
    selector(state.current),
  useGameActions: () => ({ extractExpedition })
}))

vi.mock('../../src/utils/numberUtils', () => ({
  formatCurrency: (value: number) => `${value} EUR`
}))

// Structural Modal mock: keeps the dialog role and renders children, so the
// consequence readout and the carry controls stay assertable.
vi.mock('../../src/ui/shared/Modal', () => ({
  Modal: ({
    isOpen,
    title,
    children
  }: {
    isOpen: boolean
    title?: string
    children?: React.ReactNode
  }) =>
    isOpen ? (
      <div role='dialog' aria-label={title}>
        <h2>{title}</h2>
        {children}
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

const ledgerEntry = (overrides = {}) => ({
  id: 'ledger_1',
  rewardDefinitionId: 'reward_route_merch_crate',
  sourceType: 'route_rare' as const,
  sourceId: 'exp_1_0',
  secured: false,
  earnedAtRouteStep: 1,
  materialized: false,
  ...overrides
})

const buildState = (rewardLedger: ReturnType<typeof ledgerEntry>[] = []) => {
  const base = createInitialState()
  base.player.money = 6000
  base.player.fame = 150
  base.expedition = {
    ...createDefaultExpeditionState(),
    status: 'active',
    runId: 'run_1',
    routeStep: 3,
    startingMoney: 5000,
    startingFame: 100,
    rewardLedger
  }
  return base
}

describe('ExtractionDialog', () => {
  beforeEach(() => {
    extractExpedition.mockClear()
  })

  it('states the exact consequences before confirmation', () => {
    state.current = buildState()
    render(<ExtractionDialog isOpen onClose={() => {}} />)

    // 1000 earned at the 60% base rate.
    expect(
      screen.getByTestId('expedition-extraction-retained')
    ).toHaveTextContent('600 EUR')
    expect(
      screen.getByTestId('expedition-extraction-forfeited')
    ).toHaveTextContent('400 EUR')
    // 50 fame earned: 30 kept, 20 lost.
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
  })

  it('renders nothing while closed', () => {
    state.current = buildState()
    const { container } = render(
      <ExtractionDialog isOpen={false} onClose={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('marks an unsecured rare reward as lost until it is carried', () => {
    state.current = buildState([ledgerEntry()])
    render(<ExtractionDialog isOpen onClose={() => {}} />)

    const carry = screen.getByTestId(
      'expedition-extraction-carry-reward_route_merch_crate'
    )
    expect(carry).toHaveTextContent('ui:expedition.extraction.willBeLost')
    expect(carry).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(carry)
    expect(carry).toHaveAttribute('aria-pressed', 'true')
    expect(carry).toHaveTextContent('ui:expedition.extraction.willBeKept')
  })

  it('disables further carry choices once the slots are spent', () => {
    state.current = buildState([
      ledgerEntry(),
      ledgerEntry({
        id: 'ledger_2',
        rewardDefinitionId: 'reward_route_vinyl_stash'
      })
    ])
    render(<ExtractionDialog isOpen onClose={() => {}} />)

    const first = screen.getByTestId(
      'expedition-extraction-carry-reward_route_merch_crate'
    )
    const second = screen.getByTestId(
      'expedition-extraction-carry-reward_route_vinyl_stash'
    )
    // The default cap is one slot, so committing the first must visibly close
    // the second rather than silently ignoring the click.
    fireEvent.click(first)
    expect(second).toBeDisabled()
  })

  it('omits secured rewards from the carry choice', () => {
    state.current = buildState([
      ledgerEntry({
        id: 'ledger_secured',
        rewardDefinitionId: 'reward_contract_patch_run',
        secured: true
      })
    ])
    render(<ExtractionDialog isOpen onClose={() => {}} />)
    expect(
      screen.getByTestId('expedition-extraction-no-rares')
    ).toBeInTheDocument()
  })

  it('dispatches the extraction with exactly the carried ids', () => {
    const onClose = vi.fn()
    state.current = buildState([ledgerEntry()])
    render(<ExtractionDialog isOpen onClose={onClose} />)

    fireEvent.click(
      screen.getByTestId('expedition-extraction-carry-reward_route_merch_crate')
    )
    fireEvent.click(screen.getByTestId('expedition-extraction-confirm'))

    expect(extractExpedition).toHaveBeenCalledWith(['ledger_1'])
    expect(onClose).toHaveBeenCalled()
  })

  it('cancels without extracting', () => {
    const onClose = vi.fn()
    state.current = buildState()
    render(<ExtractionDialog isOpen onClose={onClose} />)

    fireEvent.click(screen.getByTestId('expedition-extraction-cancel'))
    expect(extractExpedition).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})
