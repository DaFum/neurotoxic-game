import { useEffect, useReducer } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ExpeditionServicePanel } from '../../src/ui/expedition/ExpeditionServicePanel'
import { createInitialState } from '../../src/context/initialState'
import { createDefaultExpeditionState } from '../../src/domain/expedition/defaults'
import type { GameState } from '../../src/types'
import {
  claimExpeditionInsurance,
  executeExpeditionRepair
} from '../../src/context/expeditionActionCreators'
import { gameReducer } from '../../src/context/gameReducer'

const state: { current: GameState; listeners: Set<() => void> } = vi.hoisted(
  () => ({ current: null, listeners: new Set<() => void>() }) as never
)
const stage = vi.hoisted(() => ({
  update: null as ((ms: number) => void) | null
}))

vi.mock('../../src/components/PixiStage', () => ({
  PixiStage: (props: { update: (ms: number) => void }) => {
    stage.update = props.update
    return null
  }
}))
vi.mock('../../src/utils/crypto', async importOriginal => ({
  ...(await importOriginal<typeof import('../../src/utils/crypto')>()),
  getSafeRandom: () => 0.99,
  secureRandom: () => 0.99,
  getSafeUUID: () => 'repair-defect'
}))

const actions = vi.hoisted(() => ({
  executeExpeditionRepair: vi.fn(),
  completeAmpCalibration: vi.fn(),
  changeScene: vi.fn(),
  executeExpeditionInspection: vi.fn(),
  claimExpeditionInsurance: vi.fn(),
  acceptExpeditionTechnicalFailure: vi.fn()
}))

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: (selector: (s: GameState) => unknown) => {
    const [, rerender] = useReducer((value: number) => value + 1, 0)
    useEffect(() => {
      state.listeners.add(rerender)
      return () => {
        state.listeners.delete(rerender)
      }
    }, [])
    return selector(state.current)
  },
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
  vi.useFakeTimers()
  stage.update = null
  state.current = buildState()
  actions.executeExpeditionRepair.mockImplementation(intent => {
    const action = executeExpeditionRepair(state.current, intent)
    if (action) state.current = gameReducer(state.current, action)
  })
})

afterEach(() => vi.useRealTimers())

// Exercise the real dial controls and scored simulation; only Pixi rendering is replaced.
const playRepair = (dial: number) => {
  fireEvent.change(screen.getByRole('slider'), { target: { value: dial } })
  for (let second = 0; second < 15; second++) {
    act(() => stage.update?.(1000))
  }
}

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

  it('plays calibration before dispatching quality and consuming one spare part', () => {
    state.current = buildState({ spareParts: 2, pa: 10 })
    render(<ExpeditionServicePanel />)
    fireEvent.click(screen.getByTestId('expedition-repair-field-pa'))
    expect(actions.executeExpeditionRepair).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeTruthy()
    playRepair(892)
    const continueButton = screen.getByRole('button', {
      name: 'ui:expedition.repair.apply'
    })
    fireEvent.click(continueButton)
    fireEvent.click(continueButton)
    expect(actions.executeExpeditionRepair).toHaveBeenCalledExactlyOnceWith({
      mode: 'field',
      targetGroup: 'pa',
      quality: 1,
      expectedRouteStep: ROUTE_STEP
    })
    expect(state.current.expedition.technicalCondition.pa).toBe(65)
    expect(state.current.expedition.technicalCondition.defects).toHaveLength(0)
    expect(state.current.expedition.cargo.spareParts).toBe(1)
    expect(screen.queryByRole('dialog')).toBeNull()
    act(() => vi.advanceTimersByTime(10_000))
    expect(actions.executeExpeditionRepair).toHaveBeenCalledTimes(1)
    expect(actions.completeAmpCalibration).not.toHaveBeenCalled()
    expect(actions.changeScene).not.toHaveBeenCalled()
  })

  it('bounds a played overdrive score above 100 percent to perfect repair quality', () => {
    state.current = buildState({ spareParts: 1, pa: 10 })
    render(<ExpeditionServicePanel />)
    fireEvent.click(screen.getByTestId('expedition-repair-field-pa'))
    fireEvent.change(screen.getByRole('slider'), { target: { value: 892 } })
    fireEvent.click(
      screen.getByRole('button', {
        name: 'ui:minigames.amp.controls.overdrive'
      })
    )
    act(() => stage.update?.(1000))
    act(() => stage.update?.(1000))
    fireEvent.click(
      screen.getByRole('button', {
        name: 'ui:minigames.amp.controls.overdrive'
      })
    )
    for (let second = 2; second < 15; second++) act(() => stage.update?.(1000))
    fireEvent.click(
      screen.getByRole('button', { name: 'ui:expedition.repair.apply' })
    )
    expect(actions.executeExpeditionRepair.mock.calls[0][0].quality).toBe(1)
    expect(state.current.expedition.technicalCondition.pa).toBe(65)
  })

  it('does not expose a pre-gig skip while hosting a repair', () => {
    state.current = buildState({ spareParts: 1 })
    state.current.minigame = {
      ...state.current.minigame,
      type: 'AMP_CALIBRATION',
      active: true
    }
    render(<ExpeditionServicePanel />)
    fireEvent.click(screen.getByTestId('expedition-repair-field-pa'))
    expect(
      screen.queryByRole('button', { name: 'ui:minigames.skip' })
    ).toBeNull()
    expect(actions.completeAmpCalibration).not.toHaveBeenCalled()
  })

  it('maps poor played stability to less restoration and a hidden defect on fallback', () => {
    state.current = buildState({ spareParts: 1, pa: 10 })
    render(<ExpeditionServicePanel />)
    fireEvent.click(screen.getByTestId('expedition-repair-field-pa'))
    playRepair(0)
    expect(actions.executeExpeditionRepair).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(10_000))
    const intent = actions.executeExpeditionRepair.mock.calls[0]?.[0]
    expect(intent.quality).toBeCloseTo(0.108)
    expect(state.current.expedition.technicalCondition.pa).toBe(34)
    expect(state.current.expedition.technicalCondition.defects).toHaveLength(1)
    expect(state.current.expedition.technicalCondition.defects[0].status).toBe(
      'hidden'
    )
    expect(state.current.expedition.cargo.spareParts).toBe(0)
    expect(actions.changeScene).not.toHaveBeenCalled()
  })

  it.each(['playing', 'completed'])(
    'cancels %s repair without cost or scene change',
    phase => {
      state.current = buildState({ spareParts: 1 })
      render(<ExpeditionServicePanel />)
      fireEvent.click(screen.getByTestId('expedition-repair-field-pa'))
      if (phase === 'completed') playRepair(892)
      fireEvent.keyDown(window, { key: 'Escape' })
      act(() => vi.advanceTimersByTime(10_000))
      expect(actions.executeExpeditionRepair).not.toHaveBeenCalled()
      expect(state.current.expedition.cargo.spareParts).toBe(1)
      expect(actions.changeScene).not.toHaveBeenCalled()
      expect(screen.queryByRole('dialog')).toBeNull()
    }
  )

  it.each(['routeStep', 'runId'])(
    'rejects an outdated repair after %s changes',
    field => {
      state.current = buildState({ spareParts: 1 })
      const { rerender } = render(<ExpeditionServicePanel />)
      fireEvent.click(screen.getByTestId('expedition-repair-field-pa'))
      playRepair(892)
      state.current = {
        ...state.current,
        expedition: {
          ...state.current.expedition,
          ...(field === 'routeStep'
            ? { routeStep: ROUTE_STEP + 1 }
            : { runId: 'replacement-run' })
        }
      }
      act(() => state.listeners.forEach(notify => notify()))
      rerender(<ExpeditionServicePanel />)
      act(() => vi.advanceTimersByTime(10_000))
      expect(actions.executeExpeditionRepair).not.toHaveBeenCalled()
      expect(state.current.expedition.cargo.spareParts).toBe(1)
    }
  )

  it('clears the completed repair fallback on panel unmount', () => {
    state.current = buildState({ spareParts: 1 })
    const { unmount } = render(<ExpeditionServicePanel />)
    fireEvent.click(screen.getByTestId('expedition-repair-field-pa'))
    playRepair(892)
    unmount()
    act(() => vi.advanceTimersByTime(10_000))
    expect(actions.executeExpeditionRepair).not.toHaveBeenCalled()
    expect(actions.changeScene).not.toHaveBeenCalled()
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
  it('lets the player choose an insured disabled group and actually restores it', () => {
    state.current = buildState({ pa: 0, instruments: 0 })
    state.current.expedition.insurancePolicyId = 'equipment'
    actions.claimExpeditionInsurance.mockImplementationOnce(intent => {
      state.current = gameReducer(
        state.current,
        claimExpeditionInsurance(state.current, intent)
      )
    })
    render(<ExpeditionServicePanel />)
    fireEvent.click(
      screen.getByTestId('expedition-service-insurance-claim-instruments')
    )
    expect(actions.claimExpeditionInsurance).toHaveBeenCalledWith({
      claimType: 'technical',
      targetGroup: 'instruments'
    })
    expect(state.current.expedition.technicalCondition.instruments).toBe(25)
    expect(state.current.expedition.technicalCondition.pa).toBe(0)
    expect(state.current.expedition.insuranceClaimConsumed).toBe(true)
  })

  it('does not offer inspections that would reveal nothing', () => {
    render(<ExpeditionServicePanel />)
    // The quick check only returned condition bands the panel never showed.
    expect(screen.queryByTestId('expedition-inspection-quick_check')).toBeNull()
    expect(
      screen.queryByTestId('expedition-inspection-crew_inspection')
    ).toBeNull()
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
