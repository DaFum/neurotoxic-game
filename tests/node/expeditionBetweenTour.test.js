/**
 * @fileoverview G5 Task 13 — Between-Tour decisions with exact targets.
 *
 * Generated once, after both settlements, from state those settlements have
 * already advanced. At most three, in a fixed priority order, each bound to the
 * actor it was chosen for. Answering costs what the registry says, is
 * re-checked for affordability at the moment it is taken, and a second answer
 * changes nothing.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { gameReducer } from '../../src/context/gameReducer'
import { sanitizeCareerState } from '../../src/context/reducers/careerSanitizers'
import { ActionTypes } from '../../src/context/actionTypes'
import {
  createGenerateExpeditionBetweenTourDecisionsAction,
  createResolveExpeditionBetweenTourDecisionAction,
  createSettleExpeditionCareerResultAction,
  createSettleExpeditionCrewCareerAction
} from '../../src/context/careerActionCreators'
import {
  BETWEEN_TOUR_DECISION_PRIORITY,
  BETWEEN_TOUR_OPTIONS,
  BETWEEN_TOUR_CASH_OUT_PAYOUT,
  BETWEEN_TOUR_REHAB_COST,
  BETWEEN_TOUR_REPAIR_CONDITION_CEILING,
  BETWEEN_TOUR_REPAIR_COST_PER_POINT,
  MAX_BETWEEN_TOUR_DECISIONS,
  isBetweenTourDecisionType
} from '../../src/data/expedition/betweenTour'
import { areBetweenTourDecisionsResolved } from '../../src/domain/expedition/betweenTour'
import { EXPEDITION_CREW_BY_ID } from '../../src/data/expedition/crew'
import { startedState, walkToFinale } from '../expeditionLifecycleFixture.js'

/**
 * Crew a fresh Career may actually book.
 *
 * Manager and Security are sold content, so the ungated roles are the only
 * ones a fixture run can commit without inventing an unlock the suite is not
 * testing.
 */
const FIXTURE_CREW_IDS = ['mika', 'tom']

/** A finalized, completed run whose Crew and Career are already settled. */
const settled = (overrides = {}, loadoutOverrides = {}) => {
  const base = startedState(
    { money: 5000, ...overrides },
    { crewIds: FIXTURE_CREW_IDS, ...loadoutOverrides }
  )
  const atFinale = walkToFinale(base)
  const resolved = {
    ...atFinale,
    currentGig: { id: 'finale_venue' },
    lastGigStats: { score: 9000, accuracy: 85, failed: false },
    expedition: {
      ...atFinale.expedition,
      lastGigResolvedAtRouteStep: atFinale.expedition.routeStep
    }
  }
  const completed = gameReducer(resolved, {
    type: ActionTypes.COMPLETE_EXPEDITION,
    payload: {
      finaleResultId: 'finale_result_between_tour',
      expectedRouteStep: resolved.expedition.routeStep
    }
  })
  assert.equal(completed.expedition.status, 'completed')
  const runId = completed.expedition.outcome.runId
  let next = gameReducer(
    completed,
    createSettleExpeditionCrewCareerAction(runId)
  )
  next = gameReducer(next, createSettleExpeditionCareerResultAction(runId))
  return next
}

const generate = state =>
  gameReducer(
    state,
    createGenerateExpeditionBetweenTourDecisionsAction(
      state.expedition.outcome.runId
    )
  )

const stored = state =>
  state.career.betweenTourByRunId[state.expedition.outcome.runId]

const resolve = (state, decisionId, optionId) =>
  gameReducer(
    state,
    createResolveExpeditionBetweenTourDecisionAction(
      state.expedition.outcome.runId,
      decisionId,
      optionId
    )
  )

/** The stored decision of one family, or undefined. */
const decisionOf = (state, type) =>
  stored(state)?.decisions.find(decision => decision.type === type)

describe('G5 — the registry fixes the families and their options', () => {
  it('lists six families in priority order and caps at three', () => {
    assert.deepEqual(BETWEEN_TOUR_DECISION_PRIORITY, [
      'injury_rehab',
      'crew_debrief',
      'rival_response',
      'sponsor_follow_up',
      'vehicle_repair',
      'network_contact'
    ])
    assert.equal(MAX_BETWEEN_TOUR_DECISIONS, 3)
    for (const type of BETWEEN_TOUR_DECISION_PRIORITY) {
      assert.equal(isBetweenTourDecisionType(type), true)
      assert.equal(BETWEEN_TOUR_OPTIONS[type].length, 2, type)
    }
    for (const bad of ['', 'nope', null, 42, '__proto__']) {
      assert.equal(isBetweenTourDecisionType(bad), false)
    }
  })
})

describe('G5 — decisions are generated once, after both settlements', () => {
  it('refuses to generate before the settlements have run', () => {
    const base = startedState({ money: 5000 })
    const atFinale = walkToFinale(base)
    const completed = gameReducer(
      {
        ...atFinale,
        currentGig: { id: 'finale_venue' },
        lastGigStats: { score: 9000, accuracy: 85, failed: false },
        expedition: {
          ...atFinale.expedition,
          lastGigResolvedAtRouteStep: atFinale.expedition.routeStep
        }
      },
      {
        type: ActionTypes.COMPLETE_EXPEDITION,
        payload: {
          finaleResultId: 'finale_result_between_tour',
          expectedRouteStep: atFinale.expedition.routeStep
        }
      }
    )
    // The decisions read the Career the settlements advance, so asking first
    // would ask about state that is about to change.
    assert.equal(generate(completed), completed)
    assert.equal(
      Object.hasOwn(
        completed.career.betweenTourByRunId,
        completed.expedition.outcome.runId
      ),
      false
    )
  })

  it('generates at most three, in priority order', () => {
    const generated = generate(settled())
    const decisions = stored(generated).decisions
    assert.ok(decisions.length >= 1)
    assert.ok(decisions.length <= MAX_BETWEEN_TOUR_DECISIONS)
    const order = decisions.map(decision =>
      BETWEEN_TOUR_DECISION_PRIORITY.indexOf(decision.type)
    )
    assert.deepEqual(
      order,
      [...order].sort((a, b) => a - b),
      'decisions must arrive in the registry priority order'
    )
    // One instance per family: a Tour never asks the same question twice.
    assert.equal(
      new Set(decisions.map(decision => decision.type)).size,
      decisions.length
    )
    for (const decision of decisions) {
      assert.ok(decision.optionIds.length > 0, decision.type)
      for (const optionId of decision.optionIds) {
        assert.ok(
          BETWEEN_TOUR_OPTIONS[decision.type].includes(optionId),
          `${decision.type}/${optionId}`
        )
      }
    }
  })

  it('is an identity no-op the second time', () => {
    const once = generate(settled())
    assert.equal(generate(once), once)
  })

  it('refuses a malformed payload', () => {
    const state = settled()
    for (const payload of [null, 42, {}, { runId: 7 }]) {
      assert.equal(
        gameReducer(state, {
          type: ActionTypes.GENERATE_EXPEDITION_BETWEEN_TOUR_DECISIONS,
          payload
        }),
        state
      )
    }
  })
})

describe('G5 — targets are deterministic and exact', () => {
  /**
   * A settled run carrying two Crew recovery debts, both for Crew that were on
   * the road - a debt whose Crew skipped the Tour has served it and is
   * expired before generation, which the expiry suite covers.
   */
  const withTwoDebts = () => {
    const base = settled()
    const [first, second] = FIXTURE_CREW_IDS
    return {
      ...base,
      career: {
        ...base.career,
        settledCrewRunIds: ['run_older', base.expedition.outcome.runId],
        crewRecoveryDebtById: Object.assign(Object.create(null), {
          [second]: {
            crewId: second,
            createdFromRunId: base.expedition.outcome.runId,
            severity: 'serious',
            toursRemaining: 1
          },
          [first]: {
            crewId: first,
            createdFromRunId: 'run_older',
            severity: 'serious',
            toursRemaining: 1
          }
        })
      }
    }
  }

  it('picks the oldest Crew debt, then by id', () => {
    const [first] = FIXTURE_CREW_IDS
    const generated = generate(withTwoDebts())
    const decision = decisionOf(generated, 'injury_rehab')
    assert.ok(decision)
    // The debt created by the *earlier* run, whatever the crew ids sort like.
    assert.deepEqual(decision.target, { kind: 'crew', id: first })
  })

  it('falls back to the worst persistent Band consequence', () => {
    const base = settled()
    const withBand = {
      ...base,
      career: {
        ...base.career,
        crewRecoveryDebtById: Object.create(null),
        bandConsequenceByMemberId: Object.assign(Object.create(null), {
          zeta: 'light',
          alpha: 'serious'
        })
      }
    }
    const decision = decisionOf(generate(withBand), 'injury_rehab')
    assert.ok(decision)
    // Highest stage wins over the lexically earlier id.
    assert.deepEqual(decision.target, { kind: 'band', id: 'alpha' })
  })

  it('offers develop_signature only on a Crew that is eligible', () => {
    const base = settled()
    const decision = decisionOf(base, 'crew_debrief')
    assert.equal(decision, undefined, 'nothing is stored before generation')
    const generated = generate(base)
    const debrief = decisionOf(generated, 'crew_debrief')
    if (debrief) {
      // A fresh Career owns no `crew_signature_traits` set, so the option that
      // cannot be taken is not offered.
      assert.deepEqual(debrief.optionIds, ['rest_band'])
    }
  })

  it('offers the van only while it is actually damaged', () => {
    const intact = settled()
    const withIntactVan = {
      ...intact,
      player: {
        ...intact.player,
        van: {
          ...intact.player.van,
          condition: BETWEEN_TOUR_REPAIR_CONDITION_CEILING
        }
      }
    }
    assert.equal(
      decisionOf(generate(withIntactVan), 'vehicle_repair'),
      undefined
    )

    const damaged = {
      ...intact,
      player: { ...intact.player, van: { ...intact.player.van, condition: 40 } }
    }
    const decision = decisionOf(generate(damaged), 'vehicle_repair')
    assert.ok(decision)
    assert.deepEqual(decision.target, { kind: 'vehicle', id: 'active_van' })
  })

  it('offers the Archive lead only as the last resort', () => {
    // A Tour with real consequences answers those; the fallback exists so a
    // quiet Tour is never an empty screen.
    const busy = generate(settled())
    assert.ok(stored(busy).decisions.length > 0)
    assert.equal(decisionOf(busy, 'network_contact'), undefined)
  })
})

describe('G5 — answering derives every value from the stored decision', () => {
  it('charges the registry rehab cost and clears the debt', () => {
    const base = settled()
    const [crewId] = FIXTURE_CREW_IDS
    const withDebt = {
      ...base,
      career: {
        ...base.career,
        crewRecoveryDebtById: Object.assign(Object.create(null), {
          [crewId]: {
            crewId,
            createdFromRunId: base.expedition.outcome.runId,
            severity: 'serious',
            toursRemaining: 1
          }
        })
      }
    }
    const generated = generate(withDebt)
    const decision = decisionOf(generated, 'injury_rehab')
    assert.ok(decision)
    const paid = resolve(generated, decision.id, 'pay_rehab')
    assert.equal(
      paid.player.money,
      generated.player.money - BETWEEN_TOUR_REHAB_COST
    )
    assert.equal(Object.hasOwn(paid.career.crewRecoveryDebtById, crewId), false)
    // The answer is recorded against the decision, which is what closes it.
    assert.equal(
      stored(paid).resolvedOptionByDecisionId[decision.id],
      'pay_rehab'
    )
  })

  it('re-checks affordability at resolve, not at generation', () => {
    // Two money decisions in one Tour must not both be payable out of one
    // balance, so the price is checked when the option is taken.
    const base = settled()
    const [crewId] = FIXTURE_CREW_IDS
    const broke = {
      ...base,
      player: { ...base.player, money: BETWEEN_TOUR_REHAB_COST - 1 },
      career: {
        ...base.career,
        crewRecoveryDebtById: Object.assign(Object.create(null), {
          [crewId]: {
            crewId,
            createdFromRunId: base.expedition.outcome.runId,
            severity: 'serious',
            toursRemaining: 1
          }
        })
      }
    }
    const generated = generate(broke)
    const decision = decisionOf(generated, 'injury_rehab')
    assert.ok(decision)
    // Offered, refused, and still open: an option that cannot be taken must
    // not consume the decision.
    assert.ok(decision.optionIds.includes('pay_rehab'))
    assert.equal(resolve(generated, decision.id, 'pay_rehab'), generated)
    assert.equal(
      areBetweenTourDecisionsResolved(
        generated,
        generated.expedition.outcome.runId
      ),
      false
    )
    // The free option is always answerable.
    const accepted = resolve(generated, decision.id, 'accept_unavailability')
    assert.notEqual(accepted, generated)
    assert.equal(
      Object.hasOwn(accepted.career.crewRecoveryDebtById, crewId),
      true
    )
  })

  it('prices the repair from the van the decision was stored for', () => {
    const base = settled()
    const damaged = {
      ...base,
      player: { ...base.player, van: { ...base.player.van, condition: 40 } }
    }
    const generated = generate(damaged)
    const decision = decisionOf(generated, 'vehicle_repair')
    assert.ok(decision)
    const repaired = resolve(generated, decision.id, 'pay_repair')
    assert.equal(repaired.player.van.condition, 100)
    assert.equal(
      repaired.player.money,
      generated.player.money - (100 - 40) * BETWEEN_TOUR_REPAIR_COST_PER_POINT
    )
    // Carrying the damage costs nothing and changes nothing.
    const carried = resolve(generated, decision.id, 'carry_damage')
    assert.equal(carried.player.van.condition, 40)
    assert.equal(carried.player.money, generated.player.money)
  })

  it('refuses a second answer to the same decision', () => {
    const base = settled()
    const damaged = {
      ...base,
      player: { ...base.player, van: { ...base.player.van, condition: 40 } }
    }
    const generated = generate(damaged)
    const decision = decisionOf(generated, 'vehicle_repair')
    const once = resolve(generated, decision.id, 'carry_damage')
    assert.notEqual(once, generated)
    // The recorded answer is the guard: a replay cannot pay or treat twice.
    assert.equal(resolve(once, decision.id, 'pay_repair'), once)
    assert.equal(resolve(once, decision.id, 'carry_damage'), once)
  })

  it('refuses an option the stored decision does not offer', () => {
    const generated = generate(settled())
    const decision = stored(generated).decisions[0]
    assert.equal(resolve(generated, decision.id, 'not_an_option'), generated)
    // And an option belonging to a different family.
    const foreign = BETWEEN_TOUR_OPTIONS.network_contact[0]
    if (!decision.optionIds.includes(foreign)) {
      assert.equal(resolve(generated, decision.id, foreign), generated)
    }
  })

  it('refuses an unknown run or decision, and malformed payloads', () => {
    const generated = generate(settled())
    const decision = stored(generated).decisions[0]
    assert.equal(
      gameReducer(
        generated,
        createResolveExpeditionBetweenTourDecisionAction(
          'some_other_run',
          decision.id,
          decision.optionIds[0]
        )
      ),
      generated
    )
    assert.equal(
      resolve(generated, 'not_a_decision', decision.optionIds[0]),
      generated
    )
    for (const payload of [null, 42, {}, { runId: 'x', decisionId: 'y' }]) {
      assert.equal(
        gameReducer(generated, {
          type: ActionTypes.RESOLVE_EXPEDITION_BETWEEN_TOUR_DECISION,
          payload
        }),
        generated
      )
    }
  })
})

describe('G5 — a skipped Tour clears a serious recovery debt', () => {
  it('expires the debt of a Crew the finalized run did not select', () => {
    const base = settled()
    const selected = base.expedition.loadout.crewIds
    const absent = Object.keys(EXPEDITION_CREW_BY_ID).find(
      crewId => !selected.includes(crewId)
    )
    assert.ok(absent, 'the fixture must leave at least one Crew off the road')
    assert.ok(selected.length > 0, 'the fixture run must carry Crew')
    const withDebts = {
      ...base,
      career: {
        ...base.career,
        crewRecoveryDebtById: Object.assign(Object.create(null), {
          [absent]: {
            crewId: absent,
            createdFromRunId: 'run_older',
            severity: 'serious',
            toursRemaining: 1
          },
          [selected[0]]: {
            crewId: selected[0],
            createdFromRunId: 'run_older',
            severity: 'serious',
            toursRemaining: 1
          }
        })
      }
    }
    const generated = generate(withDebts)
    // Served: the Crew sat this Tour out, which is the one Tour it owed.
    assert.equal(
      Object.hasOwn(generated.career.crewRecoveryDebtById, absent),
      false
    )
    // Not served: this Crew was on the road, so it still owes a Tour - and it
    // is the one the rehab decision is about.
    assert.equal(
      Object.hasOwn(generated.career.crewRecoveryDebtById, selected[0]),
      true
    )
    assert.deepEqual(decisionOf(generated, 'injury_rehab').target, {
      kind: 'crew',
      id: selected[0]
    })
  })

  it('expires every served debt, not just the first', () => {
    const base = settled()
    const selected = base.expedition.loadout.crewIds
    const absent = Object.keys(EXPEDITION_CREW_BY_ID).filter(
      crewId => !selected.includes(crewId)
    )
    assert.ok(absent.length >= 2)
    const debts = Object.create(null)
    for (const crewId of absent) {
      debts[crewId] = {
        crewId,
        createdFromRunId: 'run_older',
        severity: 'serious',
        toursRemaining: 1
      }
    }
    const generated = generate({
      ...base,
      career: { ...base.career, crewRecoveryDebtById: debts }
    })
    assert.deepEqual(Object.keys(generated.career.crewRecoveryDebtById), [])
  })
})

describe('G5 — the next Tour waits for the answers', () => {
  it('blocks PREPARE_NEXT_EXPEDITION while a decision is open', () => {
    const generated = generate(settled())
    const runId = generated.expedition.outcome.runId
    assert.ok(stored(generated).decisions.length > 0)
    assert.equal(areBetweenTourDecisionsResolved(generated, runId), false)
    assert.equal(
      gameReducer(generated, {
        type: ActionTypes.PREPARE_NEXT_EXPEDITION,
        payload: { runId }
      }),
      generated
    )

    let answered = generated
    for (const decision of stored(generated).decisions) {
      const free =
        decision.optionIds.find(optionId =>
          [
            'accept_unavailability',
            'rest_band',
            'carry_damage',
            'cool_down',
            'walk_away',
            'cash_out'
          ].includes(optionId)
        ) ?? decision.optionIds[0]
      const next = resolve(answered, decision.id, free)
      assert.notEqual(next, answered, `${decision.type}/${free} was refused`)
      answered = next
    }
    assert.equal(areBetweenTourDecisionsResolved(answered, runId), true)
    const prepared = gameReducer(answered, {
      type: ActionTypes.PREPARE_NEXT_EXPEDITION,
      payload: { runId }
    })
    assert.equal(prepared.expedition.status, 'idle')
  })

  it('does not block a run that never generated a set', () => {
    // The gate waits on *stored* decisions. An absent set is not an
    // outstanding question: a failed run acknowledged straight from a crisis
    // never reaches the Between-Tour step, and treating that as incomplete
    // would strand it on the summary forever.
    const base = settled()
    assert.equal(
      areBetweenTourDecisionsResolved(base, base.expedition.outcome.runId),
      true
    )
    assert.equal(areBetweenTourDecisionsResolved(base, null), true)
    const prepared = gameReducer(base, {
      type: ActionTypes.PREPARE_NEXT_EXPEDITION,
      payload: { runId: base.expedition.outcome.runId }
    })
    assert.equal(prepared.expedition.status, 'idle')
  })

  it('pays out cash_out from the registry', () => {
    const base = settled()
    // A Tour with nothing to answer still gets the fallback contact.
    const quiet = {
      ...base,
      player: {
        ...base.player,
        van: { ...base.player.van, condition: 100 }
      },
      rivalBand: null,
      social: { ...base.social, activeDeals: [] },
      expedition: { ...base.expedition, loadout: null },
      career: {
        ...base.career,
        crewRecoveryDebtById: Object.create(null),
        bandConsequenceByMemberId: Object.create(null),
        rivalsById: Object.create(null),
        archiveByCategory: {
          ...base.career.archiveByCategory,
          region: ['home_turf']
        }
      }
    }
    const generated = generate(quiet)
    const decision = decisionOf(generated, 'network_contact')
    assert.ok(decision, 'a quiet Tour must still get the fallback decision')
    assert.deepEqual(decision.target, { kind: 'archive', id: 'home_turf' })
    const paid = resolve(generated, decision.id, 'cash_out')
    assert.equal(
      paid.player.money,
      generated.player.money + BETWEEN_TOUR_CASH_OUT_PAYOUT
    )
  })
})

describe('G5 — the Sponsor follow-up is about this run', () => {
  /** A settled run carrying one committed Sponsor obligation. */
  const withSponsorObligation = sourceId => {
    const base = settled()
    return {
      ...base,
      expedition: {
        ...base.expedition,
        activeObligations: [
          {
            id: `obligation_${sourceId}`,
            sourceType: 'brandDeal',
            sourceId,
            constraints: [],
            progressByConstraintId: {},
            status: 'completed',
            settled: true,
            doubleDown: null
          }
        ]
      }
    }
  }

  it('targets the deal the run actually committed to', () => {
    const generated = generate(withSponsorObligation('deal_carried'))
    const decision = decisionOf(generated, 'sponsor_follow_up')
    assert.ok(decision)
    assert.deepEqual(decision.target, {
      kind: 'sponsor',
      id: 'deal_carried'
    })
  })

  it('generates nothing for a sponsorless run with an older deal active', () => {
    // The Career's deal list outlives a Tour, so reading it would follow up on
    // a deal this run never carried.
    const base = settled()
    const sponsorless = {
      ...base,
      social: {
        ...base.social,
        activeDeals: [{ id: 'deal_from_an_earlier_tour' }]
      },
      expedition: { ...base.expedition, activeObligations: [] }
    }
    assert.equal(
      decisionOf(generate(sponsorless), 'sponsor_follow_up'),
      undefined
    )
  })

  it('ignores a native Contract, which is not a Sponsor', () => {
    const base = settled()
    const nativeOnly = {
      ...base,
      expedition: {
        ...base.expedition,
        activeObligations: [
          {
            id: 'obligation_native',
            sourceType: 'native',
            sourceId: 'contract_keep_it_clean',
            constraints: [],
            progressByConstraintId: {},
            status: 'completed',
            settled: true,
            doubleDown: null
          }
        ]
      }
    }
    assert.equal(
      decisionOf(generate(nativeOnly), 'sponsor_follow_up'),
      undefined
    )
  })
})

describe('G5 — the decisions survive a load', () => {
  it('preserves the decision set, the consequences and the lean', () => {
    // All three are saved with the Career slice, and the load path was
    // replacing them with defaults. An absent decision set counts as resolved,
    // so that loss also opened the next Tour on a run never answered.
    const raw = {
      betweenTourByRunId: {
        run_1: {
          runId: 'run_1',
          decisions: [
            {
              id: 'run_1:injury_rehab:mika',
              type: 'injury_rehab',
              target: { kind: 'crew', id: 'mika' },
              optionIds: BETWEEN_TOUR_OPTIONS.injury_rehab.slice()
            }
          ],
          resolvedOptionByDecisionId: {}
        }
      },
      bandConsequenceByMemberId: { member_1: 'serious' },
      nextTourPreferences: {
        rival: { rivalId: 'rival_1', stance: 'confront' },
        sponsor: { dealId: 'deal_1', bias: -1 }
      }
    }
    const sanitized = sanitizeCareerState(raw)
    assert.equal(sanitized.betweenTourByRunId.run_1.runId, 'run_1')
    assert.equal(sanitized.betweenTourByRunId.run_1.decisions.length, 1)
    // `safeRecord` builds null-prototype records on purpose, so the entries
    // are compared rather than the object identity - and that property is
    // asserted here rather than assumed.
    assert.equal(
      Object.getPrototypeOf(sanitized.bandConsequenceByMemberId),
      null
    )
    assert.deepEqual(
      { ...sanitized.bandConsequenceByMemberId },
      {
        member_1: 'serious'
      }
    )
    assert.deepEqual(sanitized.nextTourPreferences, {
      rival: { rivalId: 'rival_1', stance: 'confront' },
      sponsor: { dealId: 'deal_1', bias: -1 }
    })
  })

  it('drops what a save must not be able to author', () => {
    const sanitized = sanitizeCareerState({
      betweenTourByRunId: {
        // The key is how a resolve addresses the set, so a mismatched runId
        // would answer a different run's questions.
        mismatched: {
          runId: 'other',
          decisions: [],
          resolvedOptionByDecisionId: {}
        },
        run_2: {
          runId: 'run_2',
          decisions: [
            {
              id: 'd1',
              type: 'not_a_family',
              target: { kind: 'crew', id: 'mika' },
              optionIds: ['pay_rehab']
            },
            {
              id: 'd2',
              type: 'injury_rehab',
              target: { kind: 'nobody', id: 'x' },
              optionIds: ['pay_rehab']
            },
            {
              id: 'd3',
              type: 'injury_rehab',
              target: { kind: 'crew', id: 'mika' },
              // No option the family offers, so it could never be answered -
              // and an unanswerable decision blocks the next Tour forever.
              optionIds: ['grant_myself_everything']
            },
            {
              id: 'd4',
              type: 'rival_response',
              target: { kind: 'rival', id: 'rival_1' },
              optionIds: ['confront', 'grant_myself_everything']
            }
          ],
          resolvedOptionByDecisionId: {
            d4: 'grant_myself_everything',
            unknown_decision: 'confront'
          }
        }
      },
      bandConsequenceByMemberId: { a: 'critical', b: 'invented_stage', c: 7 },
      nextTourPreferences: {
        rival: { rivalId: 'rival_1', stance: 'obliterate' },
        sponsor: { dealId: 'deal_1', bias: 99 }
      }
    })

    assert.equal(
      Object.hasOwn(sanitized.betweenTourByRunId, 'mismatched'),
      false
    )
    const kept = sanitized.betweenTourByRunId.run_2
    // Only the one decision that is both a real family and answerable.
    assert.deepEqual(
      kept.decisions.map(decision => decision.id),
      ['d4']
    )
    assert.deepEqual(kept.decisions[0].optionIds, ['confront'])
    // An answer naming an option the family does not offer is not an answer.
    assert.deepEqual({ ...kept.resolvedOptionByDecisionId }, {})
    assert.deepEqual(
      { ...sanitized.bandConsequenceByMemberId },
      { a: 'critical' }
    )
    assert.deepEqual(sanitized.nextTourPreferences, {
      rival: null,
      sponsor: null
    })
  })
})
