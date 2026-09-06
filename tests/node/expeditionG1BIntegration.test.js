import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { gameReducer } from '../../src/context/gameReducer.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import {
  handleApplyExpeditionEventDelta,
  handleCompleteExpedition,
  handleRecordExpeditionObligationSignal
} from '../../src/context/reducers/expeditionReducer.ts'
import { getExpeditionFinaleRewardId } from '../../src/domain/expedition/finales.ts'
import { sanitizeExpeditionState } from '../../src/context/reducers/expeditionSanitizers.ts'
import { composeExpeditionFailureSignal } from '../../src/domain/expedition/failure.ts'
import { canSpendExpeditionCash } from '../../src/domain/expedition/loadout.ts'
import { settleExpedition } from '../../src/domain/expedition/extraction.ts'
import {
  fixtureLoadout,
  fixtureMap,
  preparedState,
  startedState,
  walkTo,
  walkToFinale
} from '../expeditionLifecycleFixture.js'

const map = fixtureMap()

/** Starts the fixture run carrying one native Contract. */
const startedWithContract = (templateId, targetNodeId = null) => {
  const prepared = preparedState({ money: 5000 })
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: 'run_fixture',
      expectedRunSeed: prepared.runSeed,
      loadout: {
        ...fixtureLoadout(),
        nativeContracts: [{ templateId, targetNodeId }]
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

  it('refuses the Finale reward until the Finale actually resolves', () => {
    // `handleStartGig` commits `finaleType` on the way into PRE_GIG, so
    // standing on the Finale node is true before the show is played.
    const atFinale = walkToFinale(startedState({ money: 5000 }))
    const unplayed = handleCompleteExpedition(atFinale, {
      finaleResultId: 'finale_result_fixture',
      expectedRouteStep: atFinale.expedition.routeStep
    })
    assert.equal(
      unplayed.expedition.rewardLedger.filter(
        entry => entry.sourceType === 'finale_nonlegendary'
      ).length,
      0
    )

    // A failed Finale earns nothing either - the reward is secured on earn for
    // the hostile profiles, so banking it early would survive the failure.
    const failedFinale = handleCompleteExpedition(
      {
        ...withResolvedGig(atFinale),
        lastGigStats: { score: 10, accuracy: 10, failed: true }
      },
      {
        finaleResultId: 'finale_result_fixture',
        expectedRouteStep: atFinale.expedition.routeStep
      }
    )
    assert.equal(
      failedFinale.expedition.rewardLedger.filter(
        entry => entry.sourceType === 'finale_nonlegendary'
      ).length,
      0
    )
  })

  it('refuses to complete the run until the Finale actually resolves', () => {
    // The reward proof is not enough on its own: `completeExpedition` is
    // publicly dispatchable, so an unplayed or failed Finale must not reach the
    // terminal transition either - that is what grants full retention, takes
    // the Nemesis tier and emits `expedition.finaleCompleted`.
    const atFinale = walkToFinale(startedState({ money: 5000 }))
    const payload = {
      finaleResultId: 'finale_result_fixture',
      expectedRouteStep: atFinale.expedition.routeStep
    }

    assert.strictEqual(
      handleCompleteExpedition(atFinale, payload),
      atFinale,
      'an unplayed Finale must be an identity no-op'
    )

    const failed = {
      ...withResolvedGig(atFinale),
      lastGigStats: { score: 10, accuracy: 10, failed: true }
    }
    assert.strictEqual(
      handleCompleteExpedition(failed, payload),
      failed,
      'a failed Finale must be an identity no-op'
    )

    // A gig resolved at an earlier step is not this Finale's result.
    const staleGig = {
      ...withResolvedGig(atFinale),
      expedition: {
        ...atFinale.expedition,
        lastGigResolvedAtRouteStep: atFinale.expedition.routeStep - 1
      }
    }
    assert.strictEqual(
      handleCompleteExpedition(staleGig, payload),
      staleGig,
      'a Finale proven by an earlier step must be an identity no-op'
    )

    const played = withResolvedGig(atFinale)
    const completed = handleCompleteExpedition(played, payload)
    assert.equal(completed.expedition.status, 'completed')
  })

  it('banks the Finale reward its own profile names and materializes it once', () => {
    const atFinale = withResolvedGig(
      walkToFinale(startedState({ money: 5000 }))
    )
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

  it('keeps an earned Contract reward across a load round-trip', () => {
    // `contract_route_target` materializes onto the fixture's SPECIAL node at
    // step 3, which the canonical walk actually visits - so the obligation is
    // completed through the production arrival signal rather than by hand.
    const started = startedWithContract('contract_route_target', 'exp_3_0')
    const atTarget = walkTo(started, 3)
    const targetNodeId = atTarget.expedition.visitedNodeIds.at(-1)
    assert.equal(
      atTarget.expedition.activeObligations[0].constraints[0].targetNodeId,
      targetNodeId
    )
    const obligationId = atTarget.expedition.activeObligations[0].id

    const earned = handleRecordExpeditionObligationSignal(atTarget, {
      signalType: 'arrival',
      sourceId: targetNodeId,
      expectedRouteStep: atTarget.expedition.routeStep
    })
    assert.equal(earned.expedition.activeObligations[0].status, 'completed')
    const entryId = `reward_contract_patch_run::${obligationId}`
    assert.ok(earned.expedition.rewardLedger.some(e => e.id === entryId))

    // An autosave lands between earning the reward and the terminal
    // settlement that materializes it; the reload must not drop it.
    const reloaded = sanitizeExpeditionState(
      earned.expedition,
      earned.runSeed,
      earned.lastGigStats
    )
    assert.ok(
      reloaded.rewardLedger.some(e => e.id === entryId),
      'a genuinely earned Contract reward must survive the load sanitizer'
    )

    // A forged entry naming an obligation the run never completed is still
    // dropped, because the evidence is the sanitized obligation itself.
    const forged = sanitizeExpeditionState(
      {
        ...earned.expedition,
        rewardLedger: [
          {
            ...earned.expedition.rewardLedger.find(e => e.id === entryId),
            id: 'reward_contract_patch_run::never_completed',
            sourceId: 'never_completed'
          }
        ]
      },
      earned.runSeed,
      earned.lastGigStats
    )
    assert.equal(forged.rewardLedger.length, 0)
  })

  it('banks an Event rare from its resolved result and keeps it on load', () => {
    // A real registry event/option pair: the proof is only evidence if the
    // content actually declares that this option produces this result, and the
    // resolving event must be the one on state.
    const eventId = 'expedition_underground_invite'
    const optionId = 'take_the_address'
    const started = {
      ...startedState({ money: 5000 }),
      activeEvent: { id: eventId }
    }
    const payload = {
      resultIds: ['spare_parts_scavenged'],
      expectedRouteStep: started.expedition.routeStep,
      sourceEventId: eventId,
      sourceOptionId: optionId
    }
    const resolvedEvent = handleApplyExpeditionEventDelta(started, payload)
    const sourceId = `${eventId}:${optionId}:spare_parts_scavenged`
    const entryId = `reward_event_spare_cables::${sourceId}`
    const entry = resolvedEvent.expedition.rewardLedger.find(
      item => item.id === entryId
    )
    assert.ok(entry, 'the resolved result must bank its declared rare')
    assert.equal(entry.sourceType, 'event_rare')
    // Route and event rares are the greed the extraction decision is about.
    assert.equal(entry.secured, false)
    assert.equal(entry.materialized, false)

    // Replaying the same resolution banks nothing further.
    assert.equal(
      handleApplyExpeditionEventDelta(resolvedEvent, payload).expedition
        .rewardLedger.length,
      resolvedEvent.expedition.rewardLedger.length
    )

    // An unmaterialized Event rare does not survive a load: the proof list is
    // part of the save, so it cannot authorize its own row, and a random event
    // roll has no seeded anchor to re-derive. Reloading mid-run forfeits it.
    assert.equal(
      sanitizeExpeditionState(
        resolvedEvent.expedition,
        resolvedEvent.runSeed
      ).rewardLedger.filter(item => item.id === entryId).length,
      0
    )
    // Once settlement has materialized it, the row is history and is kept -
    // still only alongside a proof the registry recognizes.
    const materialized = {
      ...resolvedEvent.expedition,
      rewardLedger: resolvedEvent.expedition.rewardLedger.map(item =>
        item.id === entryId ? { ...item, materialized: true } : item
      )
    }
    assert.ok(
      sanitizeExpeditionState(
        materialized,
        resolvedEvent.runSeed
      ).rewardLedger.some(item => item.id === entryId)
    )
    assert.equal(
      sanitizeExpeditionState(
        { ...materialized, resolvedEventSourceIds: [] },
        resolvedEvent.runSeed
      ).rewardLedger.filter(item => item.id === entryId).length,
      0
    )

    // A result that declares no rare banks nothing.
    assert.equal(
      handleApplyExpeditionEventDelta(started, {
        ...payload,
        resultIds: ['supplies_spoiled']
      }).expedition.rewardLedger.length,
      0
    )
  })

  it('refuses an Event rare the content never declared', () => {
    const eventId = 'expedition_underground_invite'
    const started = {
      ...startedState({ money: 5000 }),
      activeEvent: { id: eventId }
    }
    const basePayload = {
      resultIds: ['spare_parts_scavenged'],
      expectedRouteStep: started.expedition.routeStep,
      sourceEventId: eventId,
      sourceOptionId: 'take_the_address'
    }
    const banked = state =>
      state.expedition.rewardLedger.filter(
        entry => entry.sourceType === 'event_rare'
      ).length

    // A forged delta naming an event the run is not resolving.
    assert.equal(
      banked(
        handleApplyExpeditionEventDelta(started, {
          ...basePayload,
          sourceEventId: 'evt_invented'
        })
      ),
      0
    )
    // The right event, but an option that does not exist on it.
    assert.equal(
      banked(
        handleApplyExpeditionEventDelta(started, {
          ...basePayload,
          sourceOptionId: 'opt_invented'
        })
      ),
      0
    )
    // A real option of that event that declares a different result.
    assert.equal(
      banked(
        handleApplyExpeditionEventDelta(started, {
          ...basePayload,
          sourceOptionId: 'stay_clean'
        })
      ),
      0
    )
    // And with no event resolving at all.
    assert.equal(
      banked(
        handleApplyExpeditionEventDelta(
          { ...started, activeEvent: null },
          basePayload
        )
      ),
      0
    )
  })

  it('rejects a crafted save that mints its own Event-rare proof', () => {
    const started = startedState({ money: 5000 })
    // A *real* registry tuple, which is the case registry-membership alone
    // could never catch: the save names an event/option/result the content
    // genuinely declares and pairs it with the matching ledger row.
    const canonicalSourceId =
      'expedition_underground_invite:take_the_address:spare_parts_scavenged'
    const canonical = sanitizeExpeditionState(
      {
        ...started.expedition,
        resolvedEventSourceIds: [
          `${canonicalSourceId}:${started.expedition.routeStep}`
        ],
        rewardLedger: [
          {
            id: `reward_event_spare_cables::${canonicalSourceId}`,
            rewardDefinitionId: 'reward_event_spare_cables',
            sourceType: 'event_rare',
            sourceId: canonicalSourceId,
            earnedAtRouteStep: started.expedition.routeStep,
            secured: false,
            materialized: false
          }
        ]
      },
      started.runSeed
    )
    assert.equal(
      canonical.rewardLedger.filter(entry => entry.sourceType === 'event_rare')
        .length,
      0,
      'a real tuple the run never resolved must not authorize the reward'
    )

    const forgedSourceId = 'evt_invented:opt_invented:spare_parts_scavenged'
    const forged = sanitizeExpeditionState(
      {
        ...started.expedition,
        resolvedEventSourceIds: [
          `${forgedSourceId}:${started.expedition.routeStep}`
        ],
        rewardLedger: [
          {
            id: `reward_event_spare_cables::${forgedSourceId}`,
            rewardDefinitionId: 'reward_event_spare_cables',
            sourceType: 'event_rare',
            sourceId: forgedSourceId,
            earnedAtRouteStep: started.expedition.routeStep,
            secured: false,
            materialized: false
          }
        ]
      },
      started.runSeed
    )
    assert.deepEqual(forged.resolvedEventSourceIds, [])
    assert.equal(
      forged.rewardLedger.filter(entry => entry.sourceType === 'event_rare')
        .length,
      0
    )
  })

  it('drops a persisted Finale reward the Finale never earned', () => {
    // Node, profile and step are all things a save sitting at the Finale
    // already has, and `sanitizeRewardEntry` re-derives `secured: true` for
    // the hostile profiles - so the load proof has to be the runtime one.
    const atFinale = withResolvedGig(
      walkToFinale(startedState({ money: 5000 }))
    )
    const completed = handleCompleteExpedition(atFinale, {
      finaleResultId: 'finale_result_fixture',
      expectedRouteStep: atFinale.expedition.routeStep
    })
    const earned = completed.expedition.rewardLedger.find(
      entry => entry.sourceType === 'finale_nonlegendary'
    )
    assert.ok(earned)

    // A pre-settlement save carrying the genuinely earned row survives.
    const preSettlement = {
      ...atFinale.expedition,
      rewardLedger: [{ ...earned, materialized: false }]
    }
    const load = (expedition, lastGigStats) =>
      sanitizeExpeditionState(
        expedition,
        atFinale.runSeed,
        lastGigStats
      ).rewardLedger.filter(entry => entry.sourceType === 'finale_nonlegendary')
    assert.equal(load(preSettlement, atFinale.lastGigStats).length, 1)

    // No resolved gig at all.
    assert.equal(load(preSettlement, undefined).length, 0)
    // A resolved gig that failed.
    assert.equal(
      load(preSettlement, { score: 10, accuracy: 10, failed: true }).length,
      0
    )
    // A gig resolved at an earlier step is not this Finale's result.
    assert.equal(
      load(
        {
          ...preSettlement,
          lastGigResolvedAtRouteStep: atFinale.expedition.routeStep - 1
        },
        atFinale.lastGigStats
      ).length,
      0
    )
    // And with no resolved-step stamp at all.
    assert.equal(
      load(
        { ...preSettlement, lastGigResolvedAtRouteStep: null },
        atFinale.lastGigStats
      ).length,
      0
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
