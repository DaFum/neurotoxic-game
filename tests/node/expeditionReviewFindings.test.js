import assert from 'node:assert/strict'
import { test } from 'node:test'
import { gameReducer } from '../../src/context/gameReducer.ts'
import { settleExpeditionOnGameOver } from '../../src/context/reducers/expeditionReducer.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import { createAddQuestAction } from '../../src/context/actionCreators.ts'
import {
  startedState,
  walkToFinale,
  walkTo,
  firstExtractionRouteStep
} from '../expeditionLifecycleFixture.js'

const finaleState = () => {
  const walked = walkToFinale(startedState())
  return {
    ...walked,
    currentGig: { id: 'finale_venue' },
    lastGigStats: { accuracy: 85, failed: false },
    expedition: {
      ...walked.expedition,
      finaleType: 'rival_battle',
      lastGigResolvedAtRouteStep: walked.expedition.routeStep
    }
  }
}
const complete = state =>
  gameReducer(state, {
    type: ActionTypes.COMPLETE_EXPEDITION,
    payload: {
      finaleResultId: 'review_finale',
      expectedRouteStep: state.expedition.routeStep
    }
  })

for (const earlierOutcome of [false, true]) {
  test(`Rival Finale quest progress respects earlier outcome: ${earlierOutcome}`, () => {
    let state = finaleState()
    assert.ok(state.rivalBand)
    const rivalId = state.rivalBand.id
    state = gameReducer(
      state,
      createAddQuestAction({
        id: 'quest_expedition_nemesis',
        progress: 0,
        required: 3
      })
    )
    assert.equal(state.activeQuests[0].progress, 0)
    if (earlierOutcome) {
      state = {
        ...state,
        career: {
          ...state.career,
          rivalsById: {
            ...state.career.rivalsById,
            [rivalId]: {
              ...state.career.rivalsById[rivalId],
              history: {
                ...state.career.rivalsById[rivalId].history,
                lastNemesisAdvanceRunId: state.expedition.runId
              }
            }
          }
        }
      }
    }
    const next = complete(state)
    assert.equal(next.expedition.status, 'completed')
    assert.equal(
      next.activeQuests.find(q => q.id === 'quest_expedition_nemesis').progress,
      earlierOutcome ? 0 : 1
    )
    assert.strictEqual(complete(next), next)
  })
}

const preferences = {
  rival: { rivalId: 'rival_1', stance: 'confront' },
  sponsor: { dealId: 'deal_1', bias: 1 }
}
const withPreferences = state => ({
  ...state,
  career: { ...state.career, nextTourPreferences: structuredClone(preferences) }
})
for (const kind of ['completed', 'extracted', 'failed']) {
  test(`next-tour preferences expire when intended tour is ${kind}`, () => {
    const state = withPreferences(
      kind === 'completed'
        ? finaleState()
        : walkTo(startedState(), firstExtractionRouteStep())
    )
    const next =
      kind === 'completed'
        ? complete(state)
        : kind === 'failed'
          ? settleExpeditionOnGameOver(state)
          : gameReducer(state, {
              type: ActionTypes.EXTRACT_EXPEDITION,
              payload: {
                expectedRouteStep: state.expedition.routeStep,
                explicitRareRewardIds: []
              }
            })
    assert.equal(next.expedition.status, kind)
    assert.deepEqual(next.career.nextTourPreferences, {
      rival: null,
      sponsor: null
    })
    assert.deepEqual(state.career.nextTourPreferences, preferences)
  })
}
test('refused completion keeps next-tour preferences active', () => {
  const state = withPreferences(startedState())
  assert.strictEqual(complete(state), state)
  assert.deepEqual(state.career.nextTourPreferences, preferences)
})
