/**
 * @fileoverview G5 Task 11 — the five Legendaries are earned and rule-changing.
 *
 * Two contracts. A Legendary is *earned*: a completed Finale at Headliner rank
 * awards the one that Finale maps to, once per run, behind a durable marker.
 * And it *changes a rule*: each one has its own trigger and its own once-per-run
 * consumption, so none of them is a multiplier that could have lived in
 * `getEffectiveExpeditionRules` instead.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { createCommitExpeditionLegendaryRewardAction } from '../../src/context/careerActionCreators'
import {
  EXPEDITION_LEGENDARY_BY_FINALE,
  EXPEDITION_LEGENDARY_IDS,
  getExpeditionLegendaryMarkerId,
  isExpeditionLegendaryId
} from '../../src/data/expedition/legendaries'
import {
  EXPEDITION_SALVAGE_RIGHTS_FLOOR,
  applyExpeditionSalvageRights,
  canExpeditionGhostRouteConvert,
  deriveExpeditionGhostRouteTarget,
  deriveExpeditionNemesisKeyTarget,
  isExpeditionLegendaryAvailable,
  isExpeditionSafeHarborWindow,
  resolveExpeditionLegendaryCandidate
} from '../../src/domain/expedition/legendaries'
import { getEffectiveExpeditionRules } from '../../src/domain/expedition/effectiveRules'
import { getEffectiveExpeditionRoute } from '../../src/domain/expedition/routeOverlay'
import { getAuthorityCrisisSignal } from '../../src/domain/expedition/authority'
import { EXPEDITION_FINALES_BY_ID } from '../../src/data/expedition/finales'
import { EXPEDITION_CONTRACTS_BY_ID } from '../../src/data/expedition/contracts'
import { sanitizeCareerState } from '../../src/context/reducers/careerSanitizers'
import { sanitizeExpeditionState } from '../../src/context/reducers/expeditionSanitizers'
import {
  fixtureMap,
  startedState,
  walkTo
} from '../expeditionLifecycleFixture.js'

const map = fixtureMap()

/** The Career counters that derive Headliner. */
const HEADLINER = {
  finalizedExpeditionRuns: 5,
  completedExpeditionRuns: 5,
  completedExpeditionRegionIds: ['home_turf', 'festival_fields']
}

/** A run holding some Legendaries, at Headliner rank. */
const owning = (...legendaryIds) => {
  const base = startedState({ money: 5000 })
  return {
    ...base,
    career: { ...base.career, ...HEADLINER, legendaryIds }
  }
}

/** A finalized, completed run on one Finale profile. */
const finalizedOn = (finaleType, careerOverrides = {}) => {
  const base = startedState({ money: 5000 })
  return {
    ...base,
    career: { ...base.career, ...HEADLINER, ...careerOverrides },
    expedition: {
      ...base.expedition,
      status: 'completed',
      finaleType,
      outcome: {
        ...base.expedition.outcome,
        runId: base.expedition.runId,
        kind: 'completed',
        reason: null,
        finalizedAtRouteStep: base.expedition.routeStep,
        finaleResultId: 'finale_result_fixture',
        settlement: {
          retentionRate: 1,
          moneyEarned: 0,
          moneyRetained: 0,
          moneyForfeited: 0,
          fameEarned: 0,
          fameRetained: 0,
          fameForfeited: 0,
          retainedRewardEntryIds: [],
          abandonedRewardEntryIds: []
        }
      }
    }
  }
}

const claim = (state, expected) =>
  gameReducer(
    state,
    createCommitExpeditionLegendaryRewardAction(
      state.expedition.outcome.runId,
      expected
    )
  )

describe('G5 — the registry maps every Finale that has a signature', () => {
  it('names five Legendaries and no duplicates', () => {
    assert.equal(EXPEDITION_LEGENDARY_IDS.length, 5)
    assert.equal(new Set(EXPEDITION_LEGENDARY_IDS).size, 5)
    for (const id of EXPEDITION_LEGENDARY_IDS) {
      assert.equal(isExpeditionLegendaryId(id), true)
      assert.equal(
        getExpeditionLegendaryMarkerId(id),
        `expedition.legendary.${id}`
      )
    }
    for (const bad of ['', 'nope', null, 42, '__proto__']) {
      assert.equal(isExpeditionLegendaryId(bad), false)
    }
  })

  it('gives every Finale profile but contract_special its own Legendary', () => {
    const finaleTypes = [...EXPEDITION_FINALES_BY_ID.keys()]
    assert.ok(finaleTypes.includes('contract_special'))
    const mapped = finaleTypes.filter(type =>
      Object.hasOwn(EXPEDITION_LEGENDARY_BY_FINALE, type)
    )
    // One Finale per Legendary, and the Contract-forced Finale has none of its
    // own - it awards whatever is still missing instead.
    assert.equal(mapped.length, EXPEDITION_LEGENDARY_IDS.length)
    assert.equal(
      new Set(mapped.map(type => EXPEDITION_LEGENDARY_BY_FINALE[type])).size,
      EXPEDITION_LEGENDARY_IDS.length
    )
    assert.equal(
      Object.hasOwn(EXPEDITION_LEGENDARY_BY_FINALE, 'contract_special'),
      false
    )
  })
})

describe('G5 — a Legendary is earned by a Finale, once', () => {
  it('awards the Legendary the completed Finale maps to', () => {
    for (const [finaleType, expected] of Object.entries(
      EXPEDITION_LEGENDARY_BY_FINALE
    )) {
      const state = finalizedOn(finaleType)
      assert.equal(
        resolveExpeditionLegendaryCandidate(
          state,
          state.expedition.outcome.runId
        ),
        expected
      )
      const claimed = claim(state, expected)
      assert.deepEqual(claimed.career.legendaryIds, [expected])
      assert.deepEqual(claimed.career.legendaryClaimedRunIds, [
        state.expedition.outcome.runId
      ])
    }
  })

  it('awards the first unowned Legendary for a Contract-forced Finale', () => {
    const state = finalizedOn('contract_special')
    assert.equal(
      resolveExpeditionLegendaryCandidate(
        state,
        state.expedition.outcome.runId
      ),
      'safe_harbor'
    )
    const held = finalizedOn('contract_special', {
      legendaryIds: ['safe_harbor', 'the_fixer']
    })
    assert.equal(
      resolveExpeditionLegendaryCandidate(held, held.expedition.outcome.runId),
      'nemesis_key'
    )
    // With all five owned there is nothing left to award.
    const complete = finalizedOn('contract_special', {
      legendaryIds: [...EXPEDITION_LEGENDARY_IDS]
    })
    assert.equal(
      resolveExpeditionLegendaryCandidate(
        complete,
        complete.expedition.outcome.runId
      ),
      null
    )
  })

  it('refuses a run that already claimed one', () => {
    // The run-scoped guard, not the owned list: `contract_special` awards
    // whatever is missing, so without it one run could walk the whole registry.
    const state = finalizedOn('contract_special')
    const first = claim(state, 'safe_harbor')
    assert.deepEqual(first.career.legendaryIds, ['safe_harbor'])
    assert.equal(
      resolveExpeditionLegendaryCandidate(
        first,
        first.expedition.outcome.runId
      ),
      null
    )
    assert.equal(claim(first, 'the_fixer'), first)
  })

  it('refuses a Career below headliner', () => {
    const rookie = finalizedOn('regional_headliner', {
      finalizedExpeditionRuns: 1,
      completedExpeditionRuns: 0,
      completedExpeditionRegionIds: []
    })
    assert.equal(
      resolveExpeditionLegendaryCandidate(
        rookie,
        rookie.expedition.outcome.runId
      ),
      null
    )
    assert.equal(claim(rookie, 'safe_harbor'), rookie)
  })

  it('refuses a run that did not complete on a resolved Finale', () => {
    const base = finalizedOn('regional_headliner')
    const extracted = {
      ...base,
      expedition: {
        ...base.expedition,
        status: 'extracted',
        outcome: { ...base.expedition.outcome, kind: 'extracted' }
      }
    }
    assert.equal(claim(extracted, 'safe_harbor'), extracted)
    const unresolved = {
      ...base,
      expedition: {
        ...base.expedition,
        outcome: { ...base.expedition.outcome, finaleResultId: null }
      }
    }
    assert.equal(claim(unresolved, 'safe_harbor'), unresolved)
  })

  it('refuses a mismatched or malformed claim', () => {
    const state = finalizedOn('regional_headliner')
    // The expected id is a stale guard: naming a different Legendary awards
    // nothing rather than the one the caller asked for.
    assert.equal(claim(state, 'nemesis_key'), state)
    assert.equal(
      gameReducer(
        state,
        createCommitExpeditionLegendaryRewardAction(
          'some_other_run',
          'safe_harbor'
        )
      ),
      state
    )
    for (const payload of [
      null,
      42,
      {},
      { runId: state.expedition.outcome.runId },
      { runId: 7, expectedCapabilityId: 'safe_harbor' }
    ]) {
      assert.equal(
        gameReducer(state, {
          type: ActionTypes.COMMIT_EXPEDITION_LEGENDARY_REWARD,
          payload
        }),
        state
      )
    }
  })

  it('keeps only registry ids across the load boundary', () => {
    const raw = JSON.parse(
      '{"legendaryIds":["safe_harbor","nope","__proto__","safe_harbor"],"legendaryClaimedRunIds":["run_1",7,"run_1"]}'
    )
    const sanitized = sanitizeCareerState(raw)
    assert.deepEqual(sanitized.legendaryIds, ['safe_harbor'])
    assert.deepEqual(sanitized.legendaryClaimedRunIds, ['run_1'])
    assert.equal(Object.hasOwn(sanitized.legendaryIds, '__proto__'), false)
  })

  it('resets the run-scoped consumption at START', () => {
    // Ownership survives a run; what the *last* run spent must not.
    const started = owning('the_fixer')
    assert.deepEqual(started.expedition.consumedLegendaryIds, [])
    const sanitized = sanitizeExpeditionState(
      {
        ...started.expedition,
        consumedLegendaryIds: ['the_fixer', 'nope', 'the_fixer']
      },
      started.runSeed
    )
    assert.deepEqual(sanitized.consumedLegendaryIds, ['the_fixer'])
  })

  it('is not something an unlock set can sell', () => {
    // A Legendary is never a numeric rule, so the composition path stays empty
    // of them: if one only made a number bigger it would belong there instead.
    const rules = getEffectiveExpeditionRules(
      owning(...EXPEDITION_LEGENDARY_IDS)
    )
    assert.deepEqual(rules.legendary, {})
  })
})

describe('G5 — Safe Harbor is one extra extraction opportunity', () => {
  /**
   * The two windows to record, chosen so the node after them is *not* itself a
   * base window.
   *
   * Derived rather than pinned: the fixture route's own extraction corridor
   * decides which step qualifies, and a hardcoded pair silently stops testing
   * the Legendary the moment the corridor moves.
   */
  const WINDOWS_SEEN = (() => {
    const steps = [
      ...new Set(
        map.nodeOrder
          .filter(nodeId => map.meta[nodeId]?.isExtractionWindow === true)
          .map(nodeId => map.meta[nodeId].routeStep)
      )
    ].sort((a, b) => a - b)
    const second = steps.find(
      step =>
        steps.indexOf(step) >= 1 &&
        !steps.includes(step + 1) &&
        map.meta[map.finaleNodeId].routeStep !== step + 1
    )
    assert.ok(second, 'the fixture route offers no non-window step to grant')
    return [steps[steps.indexOf(second) - 1], second]
  })()

  /** A run standing one step past its second recorded window. */
  const pastSecondWindow = (legendaryIds, windows) => {
    const base = owning(...legendaryIds)
    const walked = walkTo(base, Math.max(...windows) + 1)
    return {
      ...walked,
      expedition: { ...walked.expedition, extractionWindowsSeen: windows }
    }
  }

  it('opens the node after the second window and nowhere else', () => {
    const owned = pastSecondWindow(['safe_harbor'], WINDOWS_SEEN)
    assert.equal(isExpeditionSafeHarborWindow(owned, map), true)
    // One window is not two.
    assert.equal(
      isExpeditionSafeHarborWindow(
        pastSecondWindow(['safe_harbor'], [WINDOWS_SEEN[0]]),
        map
      ),
      false
    )
    // And the grant belongs to that one node: standing anywhere else on the
    // route, it is not owed. Derived from the same walk, so only the recorded
    // windows differ.
    const elsewhere = {
      ...owned,
      expedition: { ...owned.expedition, extractionWindowsSeen: [3, 4] }
    }
    assert.equal(isExpeditionSafeHarborWindow(elsewhere, map), false)
  })

  it('does nothing for a Career that does not own it', () => {
    assert.equal(
      isExpeditionSafeHarborWindow(pastSecondWindow([], WINDOWS_SEEN), map),
      false
    )
  })

  it('lets the run extract on it through the production reducer', () => {
    const owned = pastSecondWindow(['safe_harbor'], WINDOWS_SEEN)
    // The base route does not offer this node, which is what makes the
    // extraction below evidence of the Legendary rather than of the route.
    const nodeId = owned.expedition.visitedNodeIds.at(-1)
    assert.equal(map.meta[nodeId].isExtractionWindow, false)
    const extracted = gameReducer(owned, {
      type: ActionTypes.EXTRACT_EXPEDITION,
      payload: { expectedRouteStep: owned.expedition.routeStep }
    })
    assert.equal(extracted.expedition.status, 'extracted')

    // Without the Legendary the identical dispatch is refused.
    const unowned = pastSecondWindow([], WINDOWS_SEEN)
    assert.equal(
      gameReducer(unowned, {
        type: ActionTypes.EXTRACT_EXPEDITION,
        payload: { expectedRouteStep: unowned.expedition.routeStep }
      }),
      unowned
    )
  })
})

describe('G5 — Nemesis Key is the only two-step move in the run', () => {
  it('opens a node two layers ahead, never the Finale', () => {
    const owned = owning('nemesis_key')
    const target = deriveExpeditionNemesisKeyTarget(owned, map)
    assert.ok(target)
    assert.equal(map.meta[target].routeStep, owned.expedition.routeStep + 2)
    assert.notEqual(target, map.finaleNodeId)
    // Deterministic: the same run always resolves the same jump.
    assert.equal(deriveExpeditionNemesisKeyTarget(owned, map), target)
  })

  it('adds the jump to the effective route without touching the map', () => {
    const owned = owning('nemesis_key')
    const target = deriveExpeditionNemesisKeyTarget(owned, map)
    const from = owned.expedition.visitedNodeIds.at(-1)
    const route = getEffectiveExpeditionRoute(owned, map)
    assert.ok(
      route.connections.some(edge => edge.from === from && edge.to === target)
    )
    // The base route has no such edge, and the map itself is unchanged: the
    // overlay is composed on top, so the run's `mapHash` is the same one Tour
    // Prep previewed.
    assert.ok(
      !map.connections.some(edge => edge.from === from && edge.to === target)
    )
    assert.equal(fixtureMap().mapHash, map.mapHash)
  })

  it('is spent by travelling it, and only once', () => {
    const owned = owning('nemesis_key')
    const target = deriveExpeditionNemesisKeyTarget(owned, map)
    const jumped = gameReducer(owned, {
      type: ActionTypes.ADVANCE_EXPEDITION_ROUTE,
      payload: { nodeId: target, expectedRouteStep: owned.expedition.routeStep }
    })
    assert.equal(jumped.expedition.routeStep, owned.expedition.routeStep + 2)
    assert.deepEqual(jumped.expedition.consumedLegendaryIds, ['nemesis_key'])
    assert.equal(isExpeditionLegendaryAvailable(jumped, 'nemesis_key'), false)
    assert.equal(deriveExpeditionNemesisKeyTarget(jumped, map), null)
  })

  it('refuses the same jump to a Career that does not own it', () => {
    const owned = owning('nemesis_key')
    const target = deriveExpeditionNemesisKeyTarget(owned, map)
    const unowned = startedState({ money: 5000 })
    assert.equal(
      gameReducer(unowned, {
        type: ActionTypes.ADVANCE_EXPEDITION_ROUTE,
        payload: {
          nodeId: target,
          expectedRouteStep: unowned.expedition.routeStep
        }
      }),
      unowned
    )
  })
})

describe('G5 — Ghost Route is the Underground way out', () => {
  /** A run cornered by Authority pressure with no ordinary exit left. */
  const cornered = legendaryIds => {
    const base = owning(...legendaryIds)
    return {
      ...base,
      player: {
        ...base.player,
        money: 0,
        van: { ...base.player.van, fuel: 0 }
      },
      expedition: {
        ...base.expedition,
        pressure: { ...base.expedition.pressure, heat: 95 },
        cargo: { ...base.expedition.cargo, contraband: [] },
        loadout: { ...base.expedition.loadout, crewIds: [] },
        activeObligations: [
          { id: 'o1', sourceType: 'native', status: 'active' },
          { id: 'o2', sourceType: 'native', status: 'active' }
        ]
      }
    }
  }

  it('converts the crisis into a detour while it is unspent', () => {
    const trapped = cornered([])
    // Without it the situation is terminal.
    assert.ok(getAuthorityCrisisSignal(trapped))

    const owned = cornered(['ghost_route'])
    assert.equal(canExpeditionGhostRouteConvert(owned), true)
    assert.equal(getAuthorityCrisisSignal(owned), null)
    const target = deriveExpeditionGhostRouteTarget(owned, map)
    assert.ok(target)
    assert.equal(map.meta[target].routeStep, owned.expedition.routeStep + 1)
  })

  it('does not convert pressure that is not severe', () => {
    const owned = owning('ghost_route')
    assert.equal(owned.expedition.pressure.heat < 90, true)
    assert.equal(canExpeditionGhostRouteConvert(owned), false)
    assert.equal(deriveExpeditionGhostRouteTarget(owned, map), null)
  })

  it('is spent by taking the detour', () => {
    const owned = cornered(['ghost_route'])
    const target = deriveExpeditionGhostRouteTarget(owned, map)
    const escaped = gameReducer(owned, {
      type: ActionTypes.ADVANCE_EXPEDITION_ROUTE,
      payload: { nodeId: target, expectedRouteStep: owned.expedition.routeStep }
    })
    assert.deepEqual(escaped.expedition.consumedLegendaryIds, ['ghost_route'])
    // Spent, so the same pressure is terminal again.
    const corneredAgain = {
      ...escaped,
      player: { ...owned.player },
      expedition: {
        ...escaped.expedition,
        pressure: { ...escaped.expedition.pressure, heat: 95 },
        cargo: { ...owned.expedition.cargo },
        loadout: { ...owned.expedition.loadout },
        activeObligations: [...owned.expedition.activeObligations]
      }
    }
    assert.equal(canExpeditionGhostRouteConvert(corneredAgain), false)
    assert.ok(getAuthorityCrisisSignal(corneredAgain))
  })
})

describe('G5 — Salvage Rights trades a rare for a wiped group', () => {
  /** A run whose instruments group the wear just took to zero. */
  const wiped = (legendaryIds, expeditionOverrides = {}) => {
    const base = owning(...legendaryIds)
    const before = { ...base.expedition.technicalCondition, instruments: 10 }
    const state = {
      ...base,
      expedition: {
        ...base.expedition,
        technicalCondition: { ...before, instruments: 0 },
        ...expeditionOverrides
      }
    }
    return { state, before }
  }

  it('keeps the group at the salvage floor by giving up an unsecured rare', () => {
    const { state, before } = wiped(['salvage_rights'], {
      rewardLedger: [
        {
          id: 'rare_1',
          rewardDefinitionId: 'reward_route_merch_crate',
          sourceType: 'route',
          sourceId: 'exp_node_1',
          secured: false,
          earnedAtRouteStep: 1,
          materialized: false
        }
      ]
    })
    const rescued = applyExpeditionSalvageRights(state, before)
    assert.equal(
      rescued.expedition.technicalCondition.instruments,
      EXPEDITION_SALVAGE_RIGHTS_FLOOR
    )
    assert.deepEqual(rescued.expedition.rewardLedger, [])
    assert.deepEqual(rescued.expedition.consumedLegendaryIds, [
      'salvage_rights'
    ])
  })

  it('takes two spare parts when nothing unsecured is left', () => {
    const { state, before } = wiped(['salvage_rights'], {
      rewardLedger: [],
      cargo: { ...owning().expedition.cargo, spareParts: 3 }
    })
    const rescued = applyExpeditionSalvageRights(state, before)
    assert.equal(
      rescued.expedition.technicalCondition.instruments,
      EXPEDITION_SALVAGE_RIGHTS_FLOOR
    )
    assert.equal(rescued.expedition.cargo.spareParts, 1)
  })

  it('never touches a secured reward', () => {
    // Secured rewards are banked, so spending one would reach past this run.
    const { state, before } = wiped(['salvage_rights'], {
      rewardLedger: [
        {
          id: 'banked',
          rewardDefinitionId: 'reward_finale_underground_ledger',
          sourceType: 'finale_nonlegendary',
          sourceId: 'exp_finale',
          secured: true,
          earnedAtRouteStep: 1,
          materialized: false
        }
      ],
      cargo: { ...owning().expedition.cargo, spareParts: 0 }
    })
    // No unsecured rare and no spare parts, so it is simply unavailable.
    assert.equal(applyExpeditionSalvageRights(state, before), state)
    assert.equal(state.expedition.technicalCondition.instruments, 0)
  })

  it('does not rescue a group that was already at zero', () => {
    const base = owning('salvage_rights')
    const already = {
      ...base,
      expedition: {
        ...base.expedition,
        technicalCondition: { ...base.expedition.technicalCondition, pa: 0 },
        cargo: { ...base.expedition.cargo, spareParts: 5 }
      }
    }
    assert.equal(
      applyExpeditionSalvageRights(
        already,
        already.expedition.technicalCondition
      ),
      already
    )
  })

  it('acts once per run', () => {
    const { state, before } = wiped(['salvage_rights'], {
      rewardLedger: [],
      cargo: { ...owning().expedition.cargo, spareParts: 9 },
      consumedLegendaryIds: ['salvage_rights']
    })
    assert.equal(applyExpeditionSalvageRights(state, before), state)
  })
})

describe('G5 — The Fixer excuses one Contract failure', () => {
  /** A real severe event id, so the Heat signal below has a source to name. */
  const SEVERE_EVENT_ID = 'expedition_technical_collapse'

  it('is unavailable to a Career that does not own it', () => {
    assert.equal(isExpeditionLegendaryAvailable(owning(), 'the_fixer'), false)
    assert.equal(
      isExpeditionLegendaryAvailable(owning('the_fixer'), 'the_fixer'),
      true
    )
  })

  it('skips the Heat and controversy a failed Contract would cost', () => {
    // `contract_keep_it_clean` is a Heat cap, so a run over the cap breaches it
    // on the next signal. Not tour-ending, which is exactly the family the
    // Fixer is allowed to excuse. Its constraint is read from the registry so
    // the fixture cannot drift from the template the reducer settles against.
    const template = EXPEDITION_CONTRACTS_BY_ID.get('contract_keep_it_clean')
    assert.ok(template && template.tourEndingOnFailure === false)
    const cap = template.constraints[0].maxHeat

    const build = legendaryIds => {
      const owned = owning(...legendaryIds)
      const breaching = {
        ...owned,
        expedition: {
          ...owned.expedition,
          pressure: {
            ...owned.expedition.pressure,
            heat: cap + 20,
            // A `heat` signal is anchored to the severe event that raised it,
            // and the reducer refuses one whose source it cannot confirm.
            lastSevereEventId: SEVERE_EVENT_ID
          },
          activeObligations: [
            {
              id: 'ob_fixer',
              sourceType: 'native',
              sourceId: template.id,
              status: 'active',
              settled: false,
              constraints: [...template.constraints],
              // Seeded: the settlement loop only advances a constraint that
              // already has a progress record, which `materializeCommittedContracts`
              // creates at START.
              progressByConstraintId: Object.assign(Object.create(null), {
                [template.constraints[0].id]: {
                  constraintId: template.constraints[0].id,
                  value: 0,
                  satisfied: false,
                  failed: false
                }
              }),
              doubleDown: null
            }
          ]
        }
      }
      return gameReducer(breaching, {
        type: ActionTypes.RECORD_EXPEDITION_OBLIGATION_SIGNAL,
        payload: {
          signalType: 'heat',
          sourceId: SEVERE_EVENT_ID,
          expectedRouteStep: breaching.expedition.routeStep
        }
      })
    }

    const withoutFixer = build([])
    const withFixer = build(['the_fixer'])
    assert.equal(
      withoutFixer.expedition.activeObligations[0].status,
      'failed',
      'the Contract must actually fail for this to prove anything'
    )
    assert.equal(withFixer.expedition.activeObligations[0].status, 'failed')
    // The Contract still failed; the penalty simply did not land.
    assert.ok(
      withoutFixer.expedition.pressure.heat >
        withFixer.expedition.pressure.heat,
      'the excused failure must cost less Heat than the unexcused one'
    )
    assert.ok(
      withoutFixer.social.controversyLevel > withFixer.social.controversyLevel
    )
    assert.deepEqual(withFixer.expedition.consumedLegendaryIds, ['the_fixer'])
    // And no payout: the Fixer is not a completion.
    assert.equal(withFixer.player.money, withoutFixer.player.money)
  })
})
