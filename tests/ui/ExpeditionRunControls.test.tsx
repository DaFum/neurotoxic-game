import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ExpeditionRunControls } from '../../src/ui/expedition/ExpeditionRunControls'
import { createInitialState } from '../../src/context/initialState'
import { createDefaultExpeditionState } from '../../src/domain/expedition/defaults'
import { buildExpeditionMap } from '../../src/domain/expedition/map'
import type { GameState } from '../../src/types'

const state: { current: GameState } = vi.hoisted(
  () => ({ current: null }) as never
)
const actions = vi.hoisted(() => ({
  changeScene: vi.fn(),
  saveGameAfterStateCommit: vi.fn(),
  extractExpedition: vi.fn(),
  selectExpeditionDraft: vi.fn(),
  doubleDownExpeditionObligation: vi.fn()
}))

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: (selector: (s: GameState) => unknown) =>,
  useGameSelectorOptional: (selector: (s: GameState) => unknown) =>
    selector(state.current),
  useGameActions: () => actions
}))

// Structural ExtractionDialog mock: this suite is about reachability and
// terminal navigation, and the dialog's own consequences are covered by
// `ExtractionDialog.test.tsx`.
vi.mock('../../src/ui/expedition/ExtractionDialog', () => ({
  ExtractionDialog: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid='extraction-dialog-open' /> : null
}))

// Structural FailureCrisisDialog mock: exposes its `onExtract` so this suite
// can assert the crisis escape reaches the same confirmation.
vi.mock('../../src/ui/expedition/FailureCrisisDialog', () => ({
  FailureCrisisDialog: ({ onExtract }: { onExtract?: () => void }) => (
    <button
      type='button'
      data-testid='crisis-extract-escape'
      onClick={onExtract}
    />
  )
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  // Like i18next for a key with no entry: the supplied `defaultValue` wins.
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, options?: { defaultValue?: unknown }) =>
      typeof options?.defaultValue === 'string' ? options.defaultValue : key
  })
}))

const RUN_SEED = 4242
const map = buildExpeditionMap(RUN_SEED, 'standard_tour', 'industrial_belt')

/** Route steps that do and do not offer voluntary extraction. */
const windowStep = Math.min(
  ...Object.values(map.meta)
    .filter(entry => entry.isExtractionWindow)
    .map(entry => entry.routeStep)
)

/** Walks the fixture route to a depth, following the first edge each time. */
const visitedTo = (depth: number): string[] => {
  const visited = [map.startNodeId]
  while (visited.length - 1 < depth) {
    const from = visited[visited.length - 1]
    const next = map.connections.find(edge => edge.from === from)?.to
    if (!next) break
    visited.push(next)
  }
  return visited
}

const buildState = ({
  status = 'active' as GameState['expedition']['status'],
  routeStep = windowStep
} = {}) => {
  const base = createInitialState()
  base.runSeed = RUN_SEED
  base.expedition = {
    ...createDefaultExpeditionState(),
    status,
    runId: 'run_1',
    routeStep,
    visitedNodeIds: visitedTo(routeStep),
    loadout: {
      tourTypeId: 'standard_tour',
      regionId: 'industrial_belt',
      activeTourbusAssetId: null,
      crewIds: [],
      cargo: { spareParts: 0, supplies: 0 },
      starterPerkId: null,
      nativeContracts: [],
      insurancePolicyId: null,
      pressureModifierIds: [],
      build: {
        setlistSongIds: [],
        equipment: { selectedGearItemIds: [] },
        selectedTourbusModuleIds: [],
        merch: [],
        contraband: [],
        sponsorOfferId: null,
        startingFuelTarget: 100,
        protectedCareerCash: 0
      }
    },
    outcome:
      status === 'active'
        ? null
        : {
            runId: 'run_1',
            kind: status as 'extracted',
            reason: null,
            finalizedAtRouteStep: routeStep,
            settlement: {
              retentionRate: 0.6,
              moneyEarned: 0,
              moneyRetained: 0,
              moneyForfeited: 0,
              fameEarned: 0,
              fameRetained: 0,
              fameForfeited: 0,
              retainedRewardEntryIds: [],
              abandonedRewardEntryIds: []
            },
            finaleResultId: null
          }
  }
  return base
}

describe('ExpeditionRunControls', () => {
  beforeEach(() => {
    for (const fn of Object.values(actions)) fn.mockClear()
  })

  it('offers extraction at a legal window', () => {
    state.current = buildState()
    render(<ExpeditionRunControls />)
    expect(screen.getByTestId('expedition-extract-open')).toBeInTheDocument()
  })

  it('hides extraction before the route offers a window', () => {
    state.current = buildState({ routeStep: 1 })
    render(<ExpeditionRunControls />)
    expect(screen.queryByTestId('expedition-extract-open')).toBeNull()
  })

  it('opens the confirmation rather than extracting directly', () => {
    state.current = buildState()
    render(<ExpeditionRunControls />)
    expect(screen.queryByTestId('extraction-dialog-open')).toBeNull()

    fireEvent.click(screen.getByTestId('expedition-extract-open'))
    expect(screen.getByTestId('extraction-dialog-open')).toBeInTheDocument()
    // The consequences must be shown before the run ends.
    expect(actions.extractExpedition).not.toHaveBeenCalled()
  })

  it('routes the crisis extraction escape to the same confirmation', () => {
    state.current = buildState()
    render(<ExpeditionRunControls />)
    expect(screen.queryByTestId('extraction-dialog-open')).toBeNull()

    fireEvent.click(screen.getByTestId('crisis-extract-escape'))
    expect(screen.getByTestId('extraction-dialog-open')).toBeInTheDocument()
  })

  it('keeps the Authority encounter off the extraction confirmation', () => {
    const base = buildState()
    base.player = { ...base.player, money: 5000 }
    base.expedition = {
      ...base.expedition,
      pressure: { ...base.expedition.pressure, heat: 95 }
    }
    state.current = base
    render(<ExpeditionRunControls />)
    expect(
      screen.getByTestId('expedition-authority-encounter')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('crisis-extract-escape'))
    expect(screen.getByTestId('extraction-dialog-open')).toBeInTheDocument()
    expect(screen.queryByTestId('expedition-authority-encounter')).toBeNull()
  })

  it('renders nothing outside an active run', () => {
    state.current = buildState({ status: 'idle' })
    const { container } = render(<ExpeditionRunControls />)
    expect(container.firstChild).toBeNull()
  })

  it('saves before navigating to the run summary', () => {
    for (const status of ['extracted', 'completed', 'failed'] as const) {
      for (const fn of Object.values(actions)) fn.mockClear()
      state.current = buildState({ status })
      render(<ExpeditionRunControls />)
      // Persist first: the reducer settled the run, and the scene change would
      // unmount this component before it could observe the committed state.
      expect(actions.saveGameAfterStateCommit).toHaveBeenCalledTimes(1)
      expect(actions.changeScene).toHaveBeenCalledWith('RUN_SUMMARY')
    }
  })
})

describe('Career ending', () => {
  beforeEach(() => {
    for (const fn of Object.values(actions)) fn.mockClear()
  })

  it('never routes a Career terminal outcome to the run summary', () => {
    const active = buildState()
    state.current = active
    const { rerender } = render(<ExpeditionRunControls />)
    state.current = {
      ...buildState({ status: 'failed' }),
      terminalOutcome: { reason: 'event_game_over', eventId: 'deal_devil' },
      currentScene: 'GAMEOVER'
    } as GameState
    rerender(<ExpeditionRunControls />)
    expect(actions.changeScene).not.toHaveBeenCalled()
    expect(actions.saveGameAfterStateCommit).not.toHaveBeenCalled()
  })
})

describe('Run draft picker', () => {
  beforeEach(() => {
    for (const fn of Object.values(actions)) fn.mockClear()
  })

  it('stays out of the way until the reducer offers a draft', () => {
    state.current = buildState()
    render(<ExpeditionRunControls />)
    expect(screen.queryByTestId('expedition-run-draft-offer')).toBeNull()
  })

  it('offers the stored candidates and dispatches only the chosen id', () => {
    const base = buildState()
    base.expedition = {
      ...base.expedition,
      pendingRunDraftOffer: {
        sourceType: 'supply',
        sourceKey: 'exp_2_0',
        offeredAtRouteStep: base.expedition.routeStep,
        candidateTraitIds: ['road_warrior', 'cold_trail', 'backchannel']
      }
    }
    state.current = base
    render(<ExpeditionRunControls />)

    expect(screen.getByTestId('expedition-run-draft-offer')).toBeInTheDocument()
    // Exactly the stored candidates, no regeneration in the UI.
    expect(screen.getByTestId('expedition-run-draft-road_warrior')).toBeTruthy()
    expect(screen.getByTestId('expedition-run-draft-cold_trail')).toBeTruthy()
    expect(screen.getByTestId('expedition-run-draft-backchannel')).toBeTruthy()
    expect(
      screen.queryByTestId('expedition-run-draft-reckless_encore')
    ).toBeNull()

    fireEvent.click(screen.getByTestId('expedition-run-draft-cold_trail'))
    expect(actions.selectExpeditionDraft).toHaveBeenCalledTimes(1)
    expect(actions.selectExpeditionDraft).toHaveBeenCalledWith('cold_trail')
  })

  it('labels a trait without a locale entry as unknown instead of showing its id', () => {
    const base = buildState()
    base.expedition = {
      ...base.expedition,
      pendingRunDraftOffer: {
        sourceType: 'supply',
        sourceKey: 'exp_2_0',
        offeredAtRouteStep: base.expedition.routeStep,
        candidateTraitIds: ['trait_from_a_newer_save']
      }
    }
    state.current = base
    render(<ExpeditionRunControls />)

    const button = screen.getByTestId(
      'expedition-run-draft-trait_from_a_newer_save'
    )
    expect(button).toHaveTextContent('Unknown trait')
    expect(button).not.toHaveTextContent('trait_from_a_newer_save')
  })
})

describe('Obligations', () => {
  const obligation = (
    id: string,
    status: 'active' | 'completed' | 'failed'
  ) => ({
    id,
    status,
    sourceType: 'native' as const,
    sourceId: id,
    constraints: [],
    progressByConstraintId: {},
    settled: status !== 'active',
    doubleDown: null
  })

  it.each([
    [[]],
    [[obligation('done', 'completed'), obligation('failed', 'failed')]]
  ])('hides the panel when there are no active obligations', obligations => {
    state.current = buildState()
    state.current.expedition.activeObligations = obligations
    render(<ExpeditionRunControls />)
    expect(screen.queryByTestId('expedition-active-obligations')).toBeNull()
  })

  it('shows only active obligations and dispatches their double down', () => {
    state.current = buildState({ routeStep: 0 })
    state.current.expedition.activeObligations = [
      obligation('done', 'completed'),
      obligation('live', 'active')
    ]
    render(<ExpeditionRunControls />)
    const panel = screen.getByTestId('expedition-active-obligations')
    expect(
      panel.querySelectorAll('[data-testid^="double-down-"]')
    ).toHaveLength(1)
    fireEvent.click(screen.getByTestId('double-down-live'))
    expect(actions.doubleDownExpeditionObligation).toHaveBeenCalledWith(
      'live',
      expect.any(String)
    )
  })
})
