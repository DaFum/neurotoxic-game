import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { gameReducer } from '../../src/context/gameReducer.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import {
  handleCompleteExpedition,
  handleRecordExpeditionObligationSignal
} from '../../src/context/reducers/expeditionReducer.ts'
import { getExpeditionFinaleRewardId } from '../../src/domain/expedition/finales.ts'
import {
  fixtureLoadout,
  fixtureMap,
  preparedState,
  startedState,
  walkToFinale
} from '../expeditionLifecycleFixture.js'

const map = fixtureMap()

/** Starts the fixture run carrying one native Contract. */
const startedWithContract = templateId => {
  const prepared = preparedState({ money: 5000 })
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: 'run_fixture',
      expectedRunSeed: prepared.runSeed,
      loadout: {
        ...fixtureLoadout(),
        nativeContracts: [{ templateId, targetNodeId: null }]
      }
    }
  })
  assert.equal(started.expedition.status, 'active')
  assert.equal(started.expedition.activeObligations.length, 1)
  return started
}

/** Puts a resolved gig on the run at its current route step. */
const withResolvedGig = (state, accuracy = 80) => ({
  ...state,
  currentGig: { id: 'g1b_venue' },
  lastGigStats: { score: 1000, accuracy, failed: false },
  expedition: {
    ...state.expedition,
    lastGigResolvedAtRouteStep: state.expedition.routeStep
  }
})

describe('G1B — Contract and Finale rewards reach the G1 ledger', () => {
  it('banks a completed Contract reward once, source-proven', () => {
    const started = startedWithContract('contract_three_good_gigs')
    const obligationId = started.expedition.activeObligations[0].id

    // Two of the three qualifying gigs are already behind the run.
    const primed = withResolvedGig({
      ...started,
      expedition: {
        ...started.expedition,
        activeObligations: [
          {
            ...started.expedition.activeObligations[0],
            progressByConstraintId: {
              three_good_gigs: {
                constraintId: 'three_good_gigs',
                value: 2,
                satisfied: false,
                failed: false
              }
            }
          }
        ]
      }
    })

    const payload = {
      signalType: 'gig',
      sourceId: 'g1b_venue',
      expectedRouteStep: primed.expedition.routeStep
    }
    const completed = handleRecordExpeditionObligationSignal(primed, payload)
    assert.equal(completed.expedition.activeObligations[0].status, 'completed')

    const entries = completed.expedition.rewardLedger.filter(
      entry => entry.sourceType === 'contract'
    )
    assert.equal(entries.length, 1)
    assert.equal(entries[0].rewardDefinitionId, 'reward_contract_patch_run')
    assert.equal(entries[0].id, `reward_contract_patch_run::${obligationId}`)
    // Contract rewards are secured on earn: the obligation already resolved.
    assert.equal(entries[0].secured, true)
    assert.equal(entries[0].materialized, false)

    // A replayed signal collides with the derived entry id instead of paying
    // the reward a second time.
    assert.strictEqual(
      handleRecordExpeditionObligationSignal(completed, payload),
      completed
    )
  })

  it('refuses a Contract reward while the obligation is still active', () => {
    const started = startedWithContract('contract_three_good_gigs')
    const primed = withResolvedGig(started)
    const signalled = handleRecordExpeditionObligationSignal(primed, {
      signalType: 'gig',
      sourceId: 'g1b_venue',
      expectedRouteStep: primed.expedition.routeStep
    })
    assert.equal(signalled.expedition.activeObligations[0].status, 'active')
    assert.equal(
      signalled.expedition.rewardLedger.filter(
        entry => entry.sourceType === 'contract'
      ).length,
      0
    )
  })

  it('banks the Finale reward its own profile names and materializes it once', () => {
    const atFinale = walkToFinale(startedState({ money: 5000 }))
    assert.equal(
      atFinale.expedition.visitedNodeIds.at(-1),
      map.finaleNodeId,
      'the fixture walk must end on the Finale node'
    )
    const expectedRewardId = getExpeditionFinaleRewardId(
      atFinale.expedition.finaleType
    )

    const completed = handleCompleteExpedition(atFinale, {
      finaleResultId: 'finale_result_fixture',
      expectedRouteStep: atFinale.expedition.routeStep
    })
    assert.notStrictEqual(completed, atFinale)
    assert.equal(completed.expedition.status, 'completed')

    const entries = completed.expedition.rewardLedger.filter(
      entry => entry.sourceType === 'finale_nonlegendary'
    )
    assert.equal(entries.length, 1)
    assert.equal(entries[0].rewardDefinitionId, expectedRewardId)
    assert.equal(entries[0].id, `${expectedRewardId}::${map.finaleNodeId}`)
    // Completion retains everything, so the terminal owner materializes it.
    assert.equal(entries[0].materialized, true)
    assert.ok(
      completed.expedition.outcome?.settlement.retainedRewardEntryIds.includes(
        entries[0].id
      )
    )
  })

  it('derives the Finale reward from the profile, not the caller', () => {
    assert.equal(
      getExpeditionFinaleRewardId('illegal_show'),
      'reward_finale_underground_ledger'
    )
    assert.equal(
      getExpeditionFinaleRewardId('rival_battle'),
      'reward_finale_underground_ledger'
    )
    assert.equal(
      getExpeditionFinaleRewardId('regional_headliner'),
      'reward_finale_road_crew_respect'
    )
    assert.equal(
      getExpeditionFinaleRewardId(null),
      'reward_finale_road_crew_respect'
    )
  })
})
