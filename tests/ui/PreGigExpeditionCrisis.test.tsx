import { useEffect, useReducer } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { PreGig } from '../../src/scenes/PreGig'
import { createInitialState } from '../../src/context/initialState'
import { createDefaultExpeditionState } from '../../src/domain/expedition/defaults'
import {
  acceptExpeditionFailure,
  acceptExpeditionTechnicalFailure
} from '../../src/context/expeditionActionCreators'
import { gameReducer } from '../../src/context/gameReducer'
import type { GameState } from '../../src/types'

// The scene's own blocks are covered elsewhere; this suite is about the
// recovery surface a zero-Condition PreGig has to reach on this screen.
const state: { current: GameState; listeners: Set<() => void> } = vi.hoisted(
  () => ({ current: null, listeners: new Set<() => void>() }) as never
)
const actions = vi.hoisted(() => ({
  changeScene: vi.fn(),
  saveGameAfterStateCommit: vi.fn(),
  acceptExpeditionTechnicalFailure: vi.fn(),
  acceptExpeditionFailure: vi.fn(),
  resolveExpeditionCrisis: vi.fn(),
  executeExpeditionRepair: vi.fn(),
  executeExpeditionInspection: vi.fn(),
  claimExpeditionInsurance: vi.fn(),
  extractExpedition: vi.fn()
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

vi.mock('../../src/components/PixiStage', () => ({ PixiStage: () => null }))
vi.mock('../../src/components/pregig/PreGigHeader', () => ({
  PreGigHeader: () => null
}))
vi.mock('../../src/components/pregig/GigModifiersBlock', () => ({
  GigModifiersBlock: () => null
}))
vi.mock('../../src/components/pregig/SetlistBlock', () => ({
  SetlistBlock: () => null
}))
vi.mock('../../src/components/pregig/MerchStrategyBlock', () => ({
  MerchStrategyBlock: () => null
}))
vi.mock('../../src/components/pregig/PreGigStartButton', () => ({
  PreGigStartButton: () => null
}))
vi.mock('../../src/ui/expedition/ExtractionDialog', () => ({
  ExtractionDialog: () => null
}))
vi.mock('../../src/hooks/usePreGigLogic', () => ({
  usePreGigLogic: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
    currentGig: null,
    player: { money: 0 },
    merchInventory: {},
    isExpeditionActive: true,
    isSetlistFrozen: false,
    setlist: [],
    setlistMax: 4,
    gigModifiers: {},
    currentModifiers: [],
    band: { merchPrices: {} },
    selectedSongIds: [],
    calculatedBudget: 0,
    isStarting: false,
    isStartBlocked: true,
    GIG_MODIFIER_OPTIONS: [],
    bandMeetingCost: 0,
    assetModifiers: {},
    canAffordBandMeeting: false,
    canAffordModifier: () => false,
    handleUpdateMerchPrice: vi.fn(),
    handleRestockMerch: vi.fn(),
    handleBandMeeting: vi.fn(),
    toggleSong: vi.fn(),
    toggleModifier: vi.fn(),
    handleStartShow: vi.fn()
  })
}))

const notify = () => state.listeners.forEach(listener => listener())

/** A Tour stopped at PreGig with a dead PA, as a due `pre_gig` defect leaves it. */
const buildState = (): GameState => {
  const base = createInitialState()
  base.currentScene = 'PRE_GIG'
  base.expedition = {
    ...createDefaultExpeditionState(),
    status: 'active',
    runId: 'run_1',
    routeStep: 2,
    visitedNodeIds: ['node_a'],
    technicalCondition: {
      pa: 0,
      instruments: 100,
      stageGear: 100,
      defects: []
    }
  }
  return base
}

describe('PreGig expedition crisis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.current = buildState()
    actions.acceptExpeditionTechnicalFailure.mockImplementation(() => {
      const action = acceptExpeditionTechnicalFailure(state.current)
      if (action) state.current = gameReducer(state.current, action)
      notify()
    })
    actions.acceptExpeditionFailure.mockImplementation(() => {
      const action = acceptExpeditionFailure(state.current)
      if (action) state.current = gameReducer(state.current, action)
      notify()
    })
  })

  it('exposes the crisis choices after accepting a technical failure', () => {
    render(<PreGig />)
    expect(screen.queryByTestId('expedition-failure-crisis-dialog')).toBeNull()

    fireEvent.click(
      screen.getByTestId('expedition-service-accept-technical-failure')
    )

    expect(
      screen.getByTestId('expedition-failure-crisis-dialog')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: /ui:expedition\.crisis\.choice\.accept_failure/
      })
    ).toBeInTheDocument()
    // Accepting is two-stage: the run is still live until the crisis is confirmed.
    expect(state.current.expedition.status).toBe('active')
    expect(actions.changeScene).not.toHaveBeenCalled()
  })

  it('settles once and continues to the run summary when failure is confirmed', () => {
    render(<PreGig />)
    fireEvent.click(
      screen.getByTestId('expedition-service-accept-technical-failure')
    )
    fireEvent.click(
      screen.getByRole('button', {
        name: /ui:expedition\.crisis\.choice\.accept_failure/
      })
    )

    expect(state.current.expedition.status).toBe('failed')
    expect(actions.saveGameAfterStateCommit).toHaveBeenCalledTimes(1)
    expect(actions.changeScene).toHaveBeenCalledTimes(1)
    expect(actions.changeScene).toHaveBeenCalledWith('RUN_SUMMARY')
  })

  it('shows no crisis and no continuation while nothing was accepted', () => {
    render(<PreGig />)
    expect(screen.queryByTestId('expedition-failure-crisis-dialog')).toBeNull()
    expect(actions.changeScene).not.toHaveBeenCalled()
  })
})
