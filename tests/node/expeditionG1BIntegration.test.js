import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { gameReducer } from '../../src/context/gameReducer.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import {
  handleCompleteExpedition,
  handleRecordExpeditionObligationSignal
} from '../../src/context/reducers/expeditionReducer.ts'
import { getExpeditionFinaleRewardId } from '../../src/domain/expedition/finales.ts'
import { composeExpeditionFailureSignal } from '../../src/domain/expedition/failure.ts'
import { canSpendExpeditionCash } from '../../src/domain/expedition/loadout.ts'
import { settleExpedition } from '../../src/domain/expedition/extraction.ts'
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

describe('G1B — core end-to-end checks without G5 forward dependencies', () => {
  it('keeps 25% and secured rare items only on failure', () => {
    const started = startedState({ money: 5000 })
    const withLedger = {
      ...started,
      player: { ...started.player, money: 6000, fame: 400 },
      expedition: {
        ...started.expedition,
        startingMoney: 5000,
        startingFame: 100,
        rewardLedger: [
          {
            id: 'reward_contract_patch_run::secured',
            rewardDefinitionId: 'reward_contract_patch_run',
            sourceType: 'contract',
            sourceId: 'secured',
            secured: true,
            earnedAtRouteStep: 1,
            materialized: false
          },
          {
            id: 'reward_route_merch_crate::greedy',
            rewardDefinitionId: 'reward_route_merch_crate',
            sourceType: 'route_rare',
            sourceId: 'greedy',
            secured: false,
            earnedAtRouteStep: 1,
            materialized: false
          }
        ]
      }
    }

    const failed = settleExpedition(withLedger, 'failed')
    assert.equal(failed.retentionRate, 0.25)
    assert.equal(failed.moneyRetained, Math.floor(1000 * 0.25))
    assert.equal(failed.fameRetained, Math.floor(300 * 0.25))
    assert.deepEqual(failed.retainedRewardEntryIds, [
      'reward_contract_patch_run::secured'
    ])
    assert.deepEqual(failed.abandonedRewardEntryIds, [
      'reward_route_merch_crate::greedy'
    ])

    // Completion keeps everything, so the three terminal kinds really are
    // three different bargains rather than one.
    const completed = settleExpedition(withLedger, 'completed')
    assert.equal(completed.retentionRate, 1)
    assert.equal(completed.abandonedRewardEntryIds.length, 0)
  })

  it('routes every later failure family into one terminal owner', () => {
    const started = startedState({ money: 5000 })
    const withBreachedContract = {
      ...started,
      expedition: {
        ...started.expedition,
        activeObligations: [
          {
            id: `${started.expedition.runId}:contract_all_in`,
            sourceType: 'native',
            sourceId: 'contract_all_in',
            constraints: [],
            progressByConstraintId: {},
            status: 'failed',
            settled: true,
            doubleDown: null
          }
        ]
      }
    }
    // Bankruptcy is the run's root cause when it also applies, so the
    // Contract family only wins once the economy is healthy - one composer
    // resolves the competition rather than each family ending the run itself.
    const alsoBroke = {
      ...withBreachedContract,
      player: { ...withBreachedContract.player, money: 0 },
      expedition: {
        ...withBreachedContract.expedition,
        unpaidDailyObligation: 25
      }
    }
    assert.equal(
      composeExpeditionFailureSignal(alsoBroke)?.reason,
      'bankruptcy'
    )
    assert.equal(
      composeExpeditionFailureSignal(withBreachedContract)?.reason,
      'critical_contract_breach'
    )
    // A later gate's own signal still arrives through the same composer.
    assert.equal(
      composeExpeditionFailureSignal(started, [
        {
          reason: 'crew_collapse',
          sourceId: 'zoe',
          choices: ['accept_failure']
        }
      ])?.reason,
      'crew_collapse'
    )
  })

  it('never lets a spend owner cross protectedCareerCash', () => {
    const run = startedState(
      { money: 5000 },
      { build: { protectedCareerCash: 2000 } }
    )
    assert.equal(run.expedition.protectedCareerCash, 2000)
    const spendable = run.player.money - run.expedition.protectedCareerCash
    assert.ok(spendable > 0)
    assert.equal(canSpendExpeditionCash(run, spendable), true)
    assert.equal(canSpendExpeditionCash(run, spendable + 1), false)
    // Every G1/G2/G4 spend owner asks this one gate, so the protected slice is
    // not something an individual owner can decide to ignore.
    assert.equal(canSpendExpeditionCash(run, run.player.money), false)
  })
})
