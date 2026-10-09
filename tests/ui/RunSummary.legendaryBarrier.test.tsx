import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ExpeditionLegendaryClaim } from '../../src/types/expedition'

/**
 * The Legendary claim is a persistence barrier, and these tests hold the half
 * of it that lives in the scene: a run that owes an award it could not durably
 * record must not be settled at all.
 *
 * @remarks
 * The claim's own durability logic is covered against real storage in
 * `tests/node/unlockManager.test.js`. What cannot be covered there is the
 * ordering - that no settlement, Ascension evaluation or Between-Tour
 * generation runs before the barrier clears - so the command's verdict is
 * injected here and the settlement commands are spies.
 */

const RUN_ID = 'run_barrier_1'

/** The verdict the injected claim command returns on its next call. */
let claimResult: ExpeditionLegendaryClaim = 'claimed'
/** Whether the Career still owes an unclaimed Legendary for this run. */
let owesLegendary = true

const settleExpeditionCrewCareer = vi.fn()
const settleExpeditionCareerResult = vi.fn()
const unlockExpeditionAscension = vi.fn()
const generateExpeditionBetweenTourDecisions = vi.fn()
const claimExpeditionLegendaryReward = vi.fn(
  (): ExpeditionLegendaryClaim => claimResult
)
const addToast = vi.fn()

const mockState = {
  expedition: {
    outcome: {
      runId: RUN_ID,
      kind: 'completed',
      reason: null,
      settlement: {
        retentionRate: 1,
        moneyRetained: 100,
        moneyForfeited: 0,
        retainedRewardEntryIds: [],
        abandonedRewardEntryIds: []
      }
    }
  },
  band: { members: [{ id: 'matze', name: 'Matze' }] },
  career: {
    betweenTourByRunId: {} as Record<string, unknown>,
    rivalsById: {}
  }
}

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState),
  useGameActions: () => ({
    prepareNextExpedition: vi.fn(),
    settleExpeditionCrewCareer,
    settleExpeditionCareerResult,
    claimExpeditionLegendaryReward,
    unlockExpeditionAscension,
    generateExpeditionBetweenTourDecisions,
    resolveExpeditionBetweenTourDecision: vi.fn(),
    changeScene: vi.fn(),
    saveGameAfterStateCommit: vi.fn(),
    addToast
  })
}))

// The scene reads "does this run still owe a Legendary" through the same
// predicate the barrier uses, so the test drives that fact directly rather
// than assembling a Career that satisfies it.
vi.mock('../../src/domain/expedition/legendaries', () => ({
  resolveExpeditionLegendaryCandidate: () =>
    owesLegendary ? 'safe_harbor' : null
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, options?: { target?: string }) =>
      options?.target === undefined ? key : `${key}|${options.target}`
  })
}))

const { RunSummary } = await import('../../src/scenes/RunSummary')

const settlementCalls = () =>
  settleExpeditionCrewCareer.mock.calls.length +
  settleExpeditionCareerResult.mock.calls.length +
  unlockExpeditionAscension.mock.calls.length +
  generateExpeditionBetweenTourDecisions.mock.calls.length

describe('the Legendary claim gates the whole settlement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    claimResult = 'claimed'
    owesLegendary = true
  })

  it('settles nothing when the marker could not be persisted', () => {
    claimResult = 'persistence_failed'
    render(<RunSummary />)

    expect(claimExpeditionLegendaryReward).toHaveBeenCalledWith(RUN_ID)
    // The point of the barrier: none of these may run on a lost award.
    expect(settlementCalls()).toBe(0)
    expect(settleExpeditionCrewCareer).not.toHaveBeenCalled()
    expect(settleExpeditionCareerResult).not.toHaveBeenCalled()
    expect(unlockExpeditionAscension).not.toHaveBeenCalled()
    expect(generateExpeditionBetweenTourDecisions).not.toHaveBeenCalled()
  })

  it('keeps the run acknowledgeable so the claim can be retried', () => {
    claimResult = 'persistence_failed'
    render(<RunSummary />)

    expect(
      screen.getByTestId('expedition-legendary-claim-blocked')
    ).toBeTruthy()
    expect(screen.getByTestId('expedition-legendary-claim-retry')).toBeTruthy()
    // Continue must not be reachable while the barrier holds, or the player
    // could walk past the award.
    expect(screen.queryByTestId('expedition-run-summary-continue')).toBeNull()
    expect(addToast).toHaveBeenCalled()
  })

  it('settles once a retry clears the barrier', () => {
    claimResult = 'persistence_failed'
    render(<RunSummary />)
    expect(settlementCalls()).toBe(0)

    // Storage recovers, and the retry is what re-runs the barrier.
    claimResult = 'claimed'
    fireEvent.click(screen.getByTestId('expedition-legendary-claim-retry'))

    expect(settleExpeditionCrewCareer).toHaveBeenCalledWith(RUN_ID)
    expect(settleExpeditionCareerResult).toHaveBeenCalledWith(RUN_ID)
    expect(unlockExpeditionAscension).toHaveBeenCalledWith(RUN_ID)
    expect(generateExpeditionBetweenTourDecisions).toHaveBeenCalledWith(RUN_ID)
  })

  it('settles immediately when the run owes no Legendary', () => {
    claimResult = 'not_applicable'
    owesLegendary = false
    render(<RunSummary />)

    expect(settleExpeditionCrewCareer).toHaveBeenCalledWith(RUN_ID)
    expect(settleExpeditionCareerResult).toHaveBeenCalledWith(RUN_ID)
    expect(unlockExpeditionAscension).toHaveBeenCalledWith(RUN_ID)
    expect(generateExpeditionBetweenTourDecisions).toHaveBeenCalledWith(RUN_ID)
    expect(
      screen.queryByTestId('expedition-legendary-claim-blocked')
    ).toBeNull()
    expect(addToast).not.toHaveBeenCalled()
  })
})

describe('Between-Tour decisions name their target', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    claimResult = 'not_applicable'
    owesLegendary = false
  })

  it('renders a display label instead of the raw target id', () => {
    mockState.career.betweenTourByRunId = {
      [RUN_ID]: {
        runId: RUN_ID,
        decisions: [
          {
            id: `${RUN_ID}:injury_rehab`,
            type: 'injury_rehab',
            target: { kind: 'band', id: 'matze' },
            optionIds: ['pay_rehab']
          },
          {
            id: `${RUN_ID}:sponsor_follow_up`,
            type: 'sponsor_follow_up',
            target: { kind: 'sponsor', id: 'energy_drink_cx' },
            optionIds: ['keep_relationship']
          }
        ],
        resolvedOptionByDecisionId: {}
      }
    }
    try {
      render(<RunSummary />)
      const panel = screen.getByTestId('expedition-between-tour')
      expect(panel).toHaveTextContent(
        'ui:expedition.betweenTour.injury_rehab|Matze'
      )
      expect(panel).toHaveTextContent(
        'ui:expedition.betweenTour.sponsor_follow_up|economy:brandDeals.energy_drink_cx.name'
      )
      expect(panel).not.toHaveTextContent('|energy_drink_cx')
      expect(panel).not.toHaveTextContent('|matze')
      // Retention renders through the locale-aware percent formatter.
      expect(screen.getByText('100%')).toBeInTheDocument()
    } finally {
      mockState.career.betweenTourByRunId = {}
    }
  })
})
