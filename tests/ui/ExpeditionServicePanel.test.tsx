import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ExpeditionServicePanel } from '../../src/ui/expedition/ExpeditionServicePanel'
import { createInitialState } from '../../src/context/initialState'
import { createDefaultExpeditionState } from '../../src/domain/expedition/defaults'
import type { GameState } from '../../src/types'

const state: { current: GameState } = vi.hoisted(
  () => ({ current: null }) as never
)
const actions = vi.hoisted(() => ({
  executeExpeditionRepair: vi.fn(),
  executeExpeditionInspection: vi.fn(),
  claimExpeditionInsurance: vi.fn(),
  acceptExpeditionTechnicalFailure: vi.fn()
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

const ROUTE_STEP = 2

const buildState = ({
  status = 'active' as GameState['expedition']['status'],
  pa = 40,
  instruments = 100,
  stageGear = 100,
  spareParts = 0,
  money = 5000,
  defects = [] as GameState['expedition']['technicalCondition']['defects']
} = {}) => {
  const base = createInitialState()
  base.player.money = money
  base.expedition = {
    ...createDefaultExpeditionState(),
    status,
    runId: 'run_1',
    routeStep: ROUTE_STEP,
    visitedNodeIds: ['node_a'],
    cargo: {
      spareParts,
      supplies: 0,
      technicalGearItemIds: [],
      merch: [],
      contraband: []
    },
    technicalCondition: { pa, instruments, stageGear, defects }
  }
  return base
}

beforeEach(() => {
  vi.clearAllMocks()
  state.current = buildState()
})

describe('reachability', () => {
  it('renders nothing outside an active run', () => {
    state.current = buildState({ status: 'idle' })
    render(<ExpeditionServicePanel />)
    expect(screen.queryByTestId('expedition-service-panel')).toBeNull()
  })

  it('renders nothing when every group is untouched', () => {
    state.current = buildState({ pa: 100 })
    render(<ExpeditionServicePanel />)
    expect(screen.queryByTestId('expedition-service-panel')).toBeNull()
  })

  it('reports each group and marks a dead one', () => {
    state.current = buildState({ pa: 0 })
    render(<ExpeditionServicePanel />)
    expect(
      screen.getByTestId('expedition-service-condition-pa').textContent
    ).toContain('ui:expedition.service.disabled')
    expect(
      screen.getByTestId('expedition-service-condition-instruments').textContent
    ).not.toContain('ui:expedition.service.disabled')
  })
})

describe('repair controls', () => {
  it('offers a field repair only while spare parts are aboard', () => {
    state.current = buildState({ spareParts: 0 })
    const { unmount } = render(<ExpeditionServicePanel />)
    expect(screen.queryByTestId('expedition-repair-field-pa')).toBeNull()
    unmount()

    state.current = buildState({ spareParts: 1 })
    render(<ExpeditionServicePanel />)
    expect(screen.getByTestId('expedition-repair-field-pa')).toBeTruthy()
  })

  it('dispatches the repair with the current route step', () => {
    state.current = buildState({ spareParts: 1 })
    render(<ExpeditionServicePanel />)
    fireEvent.click(screen.getByTestId('expedition-repair-field-pa'))
    expect(actions.executeExpeditionRepair).toHaveBeenCalledWith({
      mode: 'field',
      targetGroup: 'pa',
      expectedRouteStep: ROUTE_STEP
    })
  })

  it('names the donor group on a cannibalize offer', () => {
    // Cannibalize takes from another group, so each donor is its own offer —
    // the player picks which instrument to strip, not just the mode.
    state.current = buildState({ pa: 10, instruments: 100, stageGear: 100 })
    render(<ExpeditionServicePanel />)
    fireEvent.click(
      screen.getByTestId('expedition-repair-cannibalize-pa-from-instruments')
    )
    expect(actions.executeExpeditionRepair).toHaveBeenCalledWith({
      mode: 'cannibalize',
      targetGroup: 'pa',
      sourceGroup: 'instruments',
      expectedRouteStep: ROUTE_STEP
    })
    expect(
      screen.getByTestId('expedition-repair-cannibalize-pa-from-stageGear')
    ).toBeTruthy()
  })

  it('says so when nothing is repairable', () => {
    // No spare parts, no service location, nothing critical enough to
    // improvise on, and no donor above the cannibalize threshold.
    state.current = buildState({ pa: 54, instruments: 54, stageGear: 54 })
    render(<ExpeditionServicePanel />)
    expect(screen.getByTestId('expedition-service-no-repair')).toBeTruthy()
  })
})

describe('inspections and termination', () => {
  it('offers the free quick check and dispatches it', () => {
    render(<ExpeditionServicePanel />)
    fireEvent.click(screen.getByTestId('expedition-inspection-quick_check'))
    expect(actions.executeExpeditionInspection).toHaveBeenCalledWith({
      mode: 'quick_check',
      expectedRouteStep: ROUTE_STEP
    })
  })

  it('offers termination only once a group is dead', () => {
    const { unmount } = render(<ExpeditionServicePanel />)
    expect(
      screen.queryByTestId('expedition-service-accept-technical-failure')
    ).toBeNull()
    unmount()

    state.current = buildState({ pa: 0 })
    render(<ExpeditionServicePanel />)
    fireEvent.click(
      screen.getByTestId('expedition-service-accept-technical-failure')
    )
    expect(actions.acceptExpeditionTechnicalFailure).toHaveBeenCalledTimes(1)
  })

  it('lists a revealed defect without leaking a hidden one', () => {
    state.current = buildState({
      pa: 40,
      defects: [
        {
          id: 'defect_revealed',
          group: 'pa',
          severity: 2,
          status: 'revealed',
          source: 'field_repair',
          createdAtRouteStep: 1,
          triggerAt: 'pre_gig',
          triggerRouteStep: 3
        },
        {
          id: 'defect_hidden',
          group: 'instruments',
          severity: 3,
          status: 'hidden',
          source: 'improvise',
          createdAtRouteStep: 1,
          triggerAt: 'post_gig',
          triggerRouteStep: 3
        }
      ]
    })
    render(<ExpeditionServicePanel />)
    const list = screen.getByTestId('expedition-service-defects')
    expect(list.children).toHaveLength(1)
    expect(list.textContent).not.toContain('instruments')
  })
})
