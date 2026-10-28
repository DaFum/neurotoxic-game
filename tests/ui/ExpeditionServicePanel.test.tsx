import { useEffect, useReducer } from 'react'
import i18next from 'i18next'
import en from '../../public/locales/en/ui.json'
import de from '../../public/locales/de/ui.json'
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
const translation = vi.hoisted(() => ({
  t: null as null | ((key: string, options?: object) => string),
  language: 'en'
}))
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
  useTranslation: () => ({
    i18n: { language: translation.language },
    t: (key: string, options?: object) =>
      translation.t ? translation.t(key, options) : key
  })
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
  translation.t = null
  translation.language = 'en'
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

const renderOpen = () => {
  const result = render(<ExpeditionServicePanel />)
  const toggle = screen.queryByTestId('expedition-service-toggle')
  if (toggle?.getAttribute('aria-expanded') === 'false') fireEvent.click(toggle)
  return result
}

const setRealTranslation = async (language: 'en' | 'de') => {
  const instance = i18next.createInstance()
  await instance.init({
    lng: language,
    resources: { en: { ui: en }, de: { ui: de } },
    ns: ['ui'],
    defaultNS: 'ui',
    keySeparator: false,
    interpolation: { escapeValue: false }
  })
  translation.language = language
  translation.t = (key, options) => instance.t(key, options)
}

describe('service guidance', () => {
  it('starts compact for noncritical condition and expands urgent condition', () => {
    state.current = buildState({ pa: 40, spareParts: 1 })
    const { unmount } = render(<ExpeditionServicePanel />)
    expect(
      screen.getByTestId('expedition-service-panel').getAttribute('data-urgent')
    ).toBe('false')
    expect(
      screen
        .getByTestId('expedition-service-toggle')
        .getAttribute('aria-expanded')
    ).toBe('false')
    expect(
      screen.getByTestId('expedition-repair-field-pa').closest('[hidden]')
    ).toBeTruthy()
    fireEvent.click(screen.getByTestId('expedition-service-toggle'))
    expect(screen.getByTestId('expedition-repair-field-pa')).toBeTruthy()
    unmount()
    state.current = buildState({ pa: 39 })
    render(<ExpeditionServicePanel />)
    expect(
      screen.getByTestId('expedition-service-panel').getAttribute('data-urgent')
    ).toBe('true')
    expect(
      screen
        .getByTestId('expedition-service-toggle')
        .getAttribute('aria-expanded')
    ).toBe('true')
  })

  it.each(['en', 'de'] as const)(
    'shows localized source, target and actual effects in %s',
    async language => {
      await setRealTranslation(language)
      state.current = buildState({ pa: 50, instruments: 60, spareParts: 1 })
      renderOpen()
      const button = screen.getByTestId(
        'expedition-repair-cannibalize-pa-from-instruments'
      )
      expect(button.textContent).toContain(
        language === 'en' ? 'Instruments' : 'Instrumente'
      )
      expect(button.textContent).toContain('PA')
      expect(
        screen.getByRole('button', {
          name:
            language === 'en'
              ? 'Cannibalize Instruments for PA'
              : 'Instrumente für PA ausschlachten'
        })
      ).toBeTruthy()
      expect(
        screen.getByTestId('expedition-preview-cannibalize-pa-from-instruments')
          .textContent
      ).toContain('50 → 60')
      expect(
        screen.getByTestId('expedition-preview-cannibalize-pa-from-instruments')
          .textContent
      ).toContain('60 → 45')
      expect(
        screen.getByTestId('expedition-preview-field-pa').textContent
      ).toContain(language === 'en' ? 'quality' : 'Qualität')
      expect(
        screen.getByTestId('expedition-preview-field-pa').textContent
      ).toMatch(language === 'en' ? /hidden defect/i : /versteckten Defekt/i)
      expect(
        screen.getByTestId('expedition-preview-field-pa').textContent
      ).toContain('1')
      expect(
        screen.getByTestId('expedition-preview-field-pa').textContent
      ).toContain('50 → 70–100')
    }
  )

  it('keeps urgent recovery open as critical condition and known defects change', () => {
    state.current = buildState({ pa: 20 })
    render(<ExpeditionServicePanel />)
    fireEvent.click(screen.getByTestId('expedition-service-toggle'))
    expect(
      screen
        .getByTestId('expedition-service-toggle')
        .getAttribute('aria-expanded')
    ).toBe('true')
    state.current.expedition.technicalCondition.pa = 0
    act(() => state.listeners.forEach(notify => notify()))
    expect(
      screen
        .getByTestId('expedition-service-accept-technical-failure')
        .closest('[hidden]')
    ).toBeNull()
    state.current.expedition.technicalCondition.defects.push({
      id: 'known',
      group: 'pa',
      severity: 2,
      status: 'revealed',
      source: 'field_repair',
      createdAtRouteStep: 1,
      triggerAt: 'pre_gig',
      triggerRouteStep: 3
    })
    act(() => state.listeners.forEach(notify => notify()))
    expect(
      screen.getByTestId('expedition-service-defects').closest('[hidden]')
    ).toBeNull()
  })

  it.each(['en', 'de'] as const)(
    'honors field engineer risk protection in %s',
    async language => {
      await setRealTranslation(language)
      state.current = buildState({ pa: 20, spareParts: 1 })
      state.current.expedition.runDraftTraitIds = ['field_engineer']
      renderOpen()
      const preview =
        screen.getByTestId('expedition-preview-field-pa').textContent ?? ''
      expect(preview).not.toMatch(/hidden defect|versteckten Defekt/i)
    }
  )

  it.each(['en', 'de'] as const)(
    'explains noncritical refusal in %s',
    async language => {
      await setRealTranslation(language)
      state.current = buildState({ pa: 81, instruments: 82, stageGear: 82 })
      renderOpen()
      expect(
        screen.getByText(
          language === 'en'
            ? /condition is not critical/i
            : /zustand ist nicht kritisch/i
        )
      ).toBeTruthy()
    }
  )

  it('describes cannibalizing as removing only one known defect', async () => {
    await setRealTranslation('en')
    state.current = buildState({
      pa: 20,
      defects: [
        {
          id: 'known1',
          group: 'pa',
          severity: 2,
          status: 'revealed',
          source: 'field_repair',
          createdAtRouteStep: 1,
          triggerAt: 'pre_gig',
          triggerRouteStep: 3
        },
        {
          id: 'known2',
          group: 'pa',
          severity: 2,
          status: 'revealed',
          source: 'field_repair',
          createdAtRouteStep: 1,
          triggerAt: 'pre_gig',
          triggerRouteStep: 3
        }
      ]
    })
    renderOpen()
    expect(
      screen.getByTestId('expedition-preview-cannibalize-pa-from-instruments')
        .textContent
    ).toMatch(/removes one known defect/i)
  })

  it('explains unavailable modes and defect risks without hidden defect details', async () => {
    await setRealTranslation('en')
    state.current = buildState({ pa: 10, instruments: 20, stageGear: 20 })
    renderOpen()
    expect(screen.getByText(/spare part/i)).toBeTruthy()
    expect(screen.getByText(/service location/i)).toBeTruthy()
    expect(
      screen.getByTestId('expedition-preview-improvise-pa').textContent
    ).toMatch(/hidden defect/i)
  })
})

describe('reachability', () => {
  it('renders nothing outside an active run', () => {
    state.current = buildState({ status: 'idle' })
    renderOpen()
    expect(screen.queryByTestId('expedition-service-panel')).toBeNull()
  })

  it('renders nothing when every group is untouched', () => {
    state.current = buildState({ pa: 100 })
    renderOpen()
    expect(screen.queryByTestId('expedition-service-panel')).toBeNull()
  })

  it('reports each group and marks a dead one', () => {
    state.current = buildState({ pa: 0 })
    renderOpen()
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
    const { unmount } = renderOpen()
    expect(screen.queryByTestId('expedition-repair-field-pa')).toBeNull()
    unmount()

    state.current = buildState({ spareParts: 1 })
    renderOpen()
    expect(screen.getByTestId('expedition-repair-field-pa')).toBeTruthy()
  })

  it('plays calibration before dispatching quality and consuming one spare part', () => {
    state.current = buildState({ spareParts: 2, pa: 10 })
    renderOpen()
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
    renderOpen()
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
    renderOpen()
    fireEvent.click(screen.getByTestId('expedition-repair-field-pa'))
    expect(
      screen.queryByRole('button', { name: 'ui:minigames.skip' })
    ).toBeNull()
    expect(actions.completeAmpCalibration).not.toHaveBeenCalled()
  })

  it('maps poor played stability to less restoration and a hidden defect on fallback', () => {
    state.current = buildState({ spareParts: 1, pa: 10 })
    renderOpen()
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
      renderOpen()
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
      const { rerender } = renderOpen()
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
    const { unmount } = renderOpen()
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
    renderOpen()
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

  it('offers the professional repair for a known defect on a group at full condition', () => {
    state.current = buildState({
      pa: 100,
      defects: [
        {
          id: 'defect_known',
          group: 'pa',
          severity: 2,
          status: 'revealed',
          source: 'field_repair',
          createdAtRouteStep: 1,
          triggerAt: 'pre_gig',
          triggerRouteStep: 5
        }
      ]
    })
    // At a service location, where the professional repair is legal.
    state.current.player.currentNodeId = 'service_node'
    state.current.gameMap = {
      nodes: {
        service_node: {
          id: 'service_node',
          type: 'SUPPLY_STOP',
          label: 'Supply Stop',
          layer: 0
        }
      },
      connections: []
    } as never
    state.current.expedition.visitedNodeIds = ['service_node']
    render(<ExpeditionServicePanel />)

    expect(
      screen
        .getByTestId('expedition-service-toggle')
        .getAttribute('aria-expanded')
    ).toBe('true')
    expect(
      screen.getByTestId('expedition-preview-professional-pa').textContent
    ).toContain('ui:expedition.service.clearsDefects')
    expect(screen.getByTestId('expedition-repair-professional-pa')).toBeTruthy()
    // The healthy groups stay without an offer.
    expect(
      screen.queryByTestId('expedition-repair-professional-instruments')
    ).toBeNull()
  })

  it('says so when nothing is repairable', () => {
    // No spare parts, no service location, nothing critical enough to
    // improvise on, and no donor above the cannibalize threshold.
    state.current = buildState({ pa: 54, instruments: 54, stageGear: 54 })
    renderOpen()
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
    renderOpen()
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
    renderOpen()
    // The quick check only returned condition bands the panel never showed.
    expect(screen.queryByTestId('expedition-inspection-quick_check')).toBeNull()
    expect(
      screen.queryByTestId('expedition-inspection-crew_inspection')
    ).toBeNull()
  })

  describe('inspections at full condition (#3406)', () => {
    const hiddenDefect = {
      id: 'defect_hidden',
      group: 'pa' as const,
      severity: 2 as const,
      status: 'hidden' as const,
      source: 'field_repair' as const,
      createdAtRouteStep: 1,
      triggerAt: 'pre_gig' as const,
      triggerRouteStep: 5
    }
    const atServiceLocation = () => {
      state.current.player.currentNodeId = 'service_node'
      state.current.gameMap = {
        nodes: {
          service_node: {
            id: 'service_node',
            type: 'SUPPLY_STOP',
            label: 'Supply Stop',
            layer: 0
          }
        },
        connections: []
      } as never
      state.current.expedition.visitedNodeIds = ['service_node']
    }

    it('keeps the panel up for an inspection that reveals a hidden defect', () => {
      state.current = buildState({
        pa: 100,
        instruments: 100,
        stageGear: 100,
        defects: [hiddenDefect]
      })
      atServiceLocation()
      renderOpen()

      expect(screen.getByTestId('expedition-service-panel')).toBeTruthy()
      expect(
        screen.getByTestId('expedition-inspection-full_service')
      ).toBeTruthy()
      // Nothing is repairable, so no misleading "no repair" line, and the
      // hidden defect stays unlisted.
      expect(screen.queryByTestId('expedition-service-no-repair')).toBeNull()
      expect(screen.queryByTestId('expedition-service-defects')).toBeNull()
    })

    it('stays hidden when no inspection would do anything', () => {
      state.current = buildState({ pa: 100, instruments: 100, stageGear: 100 })
      atServiceLocation()
      renderOpen()

      expect(screen.queryByTestId('expedition-service-panel')).toBeNull()
    })

    it('does not offer an inspection that is not legal at this location', () => {
      state.current = buildState({
        pa: 100,
        instruments: 100,
        stageGear: 100,
        defects: [hiddenDefect]
      })
      renderOpen()

      expect(screen.queryByTestId('expedition-service-panel')).toBeNull()
    })
  })

  it('offers termination only once a group is dead', () => {
    const { unmount } = renderOpen()
    expect(
      screen.queryByTestId('expedition-service-accept-technical-failure')
    ).toBeNull()
    unmount()

    state.current = buildState({ pa: 0 })
    renderOpen()
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
    renderOpen()
    const list = screen.getByTestId('expedition-service-defects')
    expect(list.children).toHaveLength(1)
    expect(list.textContent).not.toContain('instruments')
  })
})
