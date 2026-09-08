/**
 * Between-Tour decisions: what a finalized Tour asks, and what answering costs.
 *
 * @remarks
 * Generated once, after Crew and Career settlement, from state those two
 * settlements have already advanced - a decision derived earlier would ask
 * about an injury the settlement was about to record, or miss one it just did.
 * At most three, chosen in the registry's fixed priority order, and the run
 * seed only ever breaks a tie between genuinely equal candidates of the *same*
 * family: a seeded choice between two priorities would make the decision set
 * unpredictable rather than fair.
 *
 * The target travels with the decision. By resolve time the run's outcome is
 * cleared and another decision may already have treated the actor, so a
 * resolve that re-derived its target would act on someone else.
 */

import type { GameState } from '../../types'
import type {
  BetweenTourDecisionInstance,
  BetweenTourDecisionType,
  BetweenTourRunState,
  BetweenTourTarget
} from '../../types/career'
import {
  BETWEEN_TOUR_CASH_OUT_PAYOUT,
  BETWEEN_TOUR_DECISION_PRIORITY,
  BETWEEN_TOUR_OPTIONS,
  BETWEEN_TOUR_REHAB_COST,
  BETWEEN_TOUR_SPONSOR_ADVANCE_AMOUNT,
  BETWEEN_TOUR_SPONSOR_ADVANCE_REPAYMENT_RATE,
  BETWEEN_TOUR_REPAIR_CONDITION_CEILING,
  BETWEEN_TOUR_REPAIR_COST_PER_POINT,
  MAX_BETWEEN_TOUR_DECISIONS
} from '../../data/expedition/betweenTour'
import { EXPEDITION_CREW_BY_ID } from '../../data/expedition/crew'
import { BRAND_DEALS_BY_ID } from '../../data/brandDeals'
import { getEligibleCrewSignatureTrait } from './career'
import { finiteNumberOr } from '../../utils/finiteNumber'
import { hashExpeditionRoute } from './map'
import { resolveCrewRecoveryDebt } from './injuries'
import {
  clampPlayerMoney,
  clampVanCondition
} from '../../utils/gameState/clamps'
import { getExpeditionMinimumNextStartCost } from './loadout'
import {
  getExpeditionFuelTopUpCost,
  EXPEDITION_MAX_STARTING_FUEL
} from './loadout'

/** Band consequence stages, weakest first. */
const BAND_CONSEQUENCE_ORDER = ['none', 'light', 'serious', 'critical'] as const

/**
 * Picks one candidate from a set the design declares equal.
 *
 * @param candidates - Already sorted by the family's own rule.
 * @param runSeed - The finalized run's seed.
 * @param salt - The family asking.
 * @returns The chosen candidate, or `undefined` when there are none.
 *
 * @remarks
 * The candidates arrive sorted, so `[0]` is the design's answer whenever the
 * rule decides. The seed is consulted only when the leading candidates are
 * genuinely tied under that rule.
 */
const pickTied = <T>(
  candidates: readonly { key: string; value: T }[],
  runSeed: number,
  salt: string
): T | undefined => {
  if (candidates.length === 0) return undefined
  const leader = candidates[0]
  if (!leader) return undefined
  const tied = candidates.filter(entry => entry.key === leader.key)
  if (tied.length === 1) return leader.value
  const index =
    Number.parseInt(hashExpeditionRoute(`${runSeed}:${salt}`), 16) % tied.length
  return (tied[index] ?? leader).value
}

/** The Crew the just-finalized run had on the road. */
const finalizedCrewIds = (state: GameState): readonly string[] =>
  state.expedition?.loadout?.crewIds ?? []

/** The `injury_rehab` target: a Crew recovery debt first, then the band. */
const resolveInjuryRehabTarget = (
  state: GameState
): BetweenTourTarget | null => {
  const debts = Object.values(state.career.crewRecoveryDebtById)
  if (debts.length > 0) {
    // Created run order first, then crew id. Run order is not stored as a
    // number, so the run's own settlement order stands in: a debt created by
    // an earlier run sorts first because its `createdFromRunId` is earlier in
    // `settledCrewRunIds`.
    const order = state.career.settledCrewRunIds
    const sorted = [...debts].sort((a, b) => {
      const byRun =
        order.indexOf(a.createdFromRunId) - order.indexOf(b.createdFromRunId)
      return byRun !== 0 ? byRun : a.crewId.localeCompare(b.crewId)
    })
    const first = sorted[0]
    if (first) return { kind: 'crew', id: first.crewId }
  }
  // Highest stage, then id: a critical consequence outranks a light one
  // whatever the member ids are.
  const consequences = Object.entries(
    state.career.bandConsequenceByMemberId
  ).filter(([, stage]) => stage !== 'none')
  consequences.sort((a, b) => {
    const byStage =
      BAND_CONSEQUENCE_ORDER.indexOf(b[1]) -
      BAND_CONSEQUENCE_ORDER.indexOf(a[1])
    return byStage !== 0 ? byStage : a[0].localeCompare(b[0])
  })
  const worst = consequences[0]
  return worst ? { kind: 'band', id: worst[0] } : null
}

/**
 * The `crew_debrief` target and the options it may offer.
 *
 * @remarks
 * Two different pools, and the option list follows the pool: when any selected
 * Crew is signature-eligible the choice is made among *those* and
 * `develop_signature` is offered, and otherwise it is the least loyal selected
 * Crew with `rest_band` alone. Offering the signature option on an ineligible
 * target would be an option that cannot be taken.
 */
const resolveCrewDebriefDecision = (
  state: GameState
): { target: BetweenTourTarget; optionIds: string[] } | null => {
  const selected = finalizedCrewIds(state).filter(crewId =>
    Object.hasOwn(EXPEDITION_CREW_BY_ID, crewId)
  )
  if (selected.length === 0) return null
  const loyaltyOf = (crewId: string): number =>
    finiteNumberOr(state.career.crewById[crewId]?.loyalty, 0)
  const byLoyaltyThenId = (pool: readonly string[]): string[] =>
    [...pool].sort((a, b) => {
      const byLoyalty = loyaltyOf(a) - loyaltyOf(b)
      return byLoyalty !== 0 ? byLoyalty : a.localeCompare(b)
    })

  const eligible = selected.filter(
    crewId => getEligibleCrewSignatureTrait(state, crewId) !== null
  )
  if (eligible.length > 0) {
    const sorted = byLoyaltyThenId(eligible)
    const chosen = pickTied(
      sorted.map(crewId => ({ key: String(loyaltyOf(crewId)), value: crewId })),
      state.runSeed,
      'between-tour:crew_debrief'
    )
    if (chosen === undefined) return null
    return {
      target: { kind: 'crew', id: chosen },
      optionIds: [...BETWEEN_TOUR_OPTIONS.crew_debrief]
    }
  }
  const sorted = byLoyaltyThenId(selected)
  const chosen = pickTied(
    sorted.map(crewId => ({ key: String(loyaltyOf(crewId)), value: crewId })),
    state.runSeed,
    'between-tour:crew_debrief'
  )
  if (chosen === undefined) return null
  return { target: { kind: 'crew', id: chosen }, optionIds: ['rest_band'] }
}

/** The `rival_response` target: the persistent Rival this run met. */
const resolveRivalResponseTarget = (
  state: GameState
): BetweenTourTarget | null => {
  const runId = state.expedition?.outcome?.runId
  if (typeof runId !== 'string') return null
  const met = Object.entries(state.career.rivalsById)
    .filter(([, record]) => record.history.lastSeenRunId === runId)
    .sort(([idA, a], [idB, b]) => {
      const byNemesis =
        finiteNumberOr(b.history.nemesisLevel, 0) -
        finiteNumberOr(a.history.nemesisLevel, 0)
      return byNemesis !== 0 ? byNemesis : idA.localeCompare(idB)
    })
  const chosen = met[0]
  return chosen ? { kind: 'rival', id: chosen[0] } : null
}

/**
 * The `sponsor_follow_up` target: the deal the run was actually carrying.
 *
 * @param state - State the settlements have already advanced.
 * @returns The Sponsor obligation from the finalized run, or `null`.
 *
 * @remarks
 * Read from the run's own frozen `activeObligations`, not from
 * `social.activeDeals`. The Career's deal list outlives any single Tour, so a
 * Career that toured sponsorless while an older deal was still active would
 * generate a follow-up about a deal this run never carried - and the decision
 * exists to follow up on what the run committed to.
 *
 * `sourceType === 'brandDeal'` is the run-scoped proof: a `native` obligation
 * is a Contract the route offered, not a Sponsor. The lexical pick only ever
 * breaks a tie between several the same run really carried.
 */
/**
 * The `sponsor_advance` target: the Sponsor willing to front an insolvent Career.
 *
 * @param state - State the settlements have already advanced.
 * @returns The Sponsor the failed run was carrying, or `null`.
 *
 * @remarks
 * Generated only when all three hold: the run actually failed, the Career
 * cannot fund the cheapest legal next build, and no advance is already
 * outstanding. A Career that bailed out voluntarily is not owed a rescue, and
 * one that can still afford a Tour does not need one - 81% of fresh-Career
 * funding halts follow a failure, which is the case this exists for.
 *
 * The Sponsor is the one the failed run carried, read from the run's own frozen
 * obligations for the same reason `sponsor_follow_up` does: the Career's deal
 * list outlives the Tour.
 */
/**
 * Whether the Career can no longer fund a Tour worth starting.
 *
 * @param state - State the settlements have already advanced.
 * @returns True when the band cannot fuel up to half a tank.
 *
 * @remarks
 * This used to ask whether the Career could pay the *cheapest legal* build,
 * which is the rounding-up of the tank the last Tour left - a euro or two.
 * `SETTLE_EXPEDITION_CAREER_RESULT` now guarantees exactly that amount, so the
 * predicate could never hold again and `sponsor_advance` stopped being
 * generated: 3,048 advances before the guarantee, 0 after. A rescue whose
 * trigger is 'cannot pay two euros' is a rescue that never arrives.
 *
 * Half a tank is the threshold because it is what separates a Tour from a
 * gesture: below it the band cannot reach the far half of any route, so the
 * run it could legally book is one it cannot finish. Derived from
 * `EXPEDITION_MAX_STARTING_FUEL` and the production pump price rather than
 * fixed, so retuning either moves the rescue with it.
 */
export const isExpeditionCareerInsolvent = (state: GameState): boolean => {
  const currentFuel = finiteNumberOr(state.player.van?.fuel, 0)
  const viableTarget = Math.floor(EXPEDITION_MAX_STARTING_FUEL / 2)
  if (currentFuel >= viableTarget) return false
  const cost = getExpeditionFuelTopUpCost(currentFuel, viableTarget)
  return finiteNumberOr(state.player.money, 0) < cost
}

const resolveSponsorAdvanceTarget = (
  state: GameState
): BetweenTourTarget | null => {
  if (state.expedition.outcome?.kind !== 'failed') return null
  if (state.career.sponsorAdvance !== null) return null
  if (!isExpeditionCareerInsolvent(state)) return null

  // The Sponsor the failed run carried, when it carried one. Most Careers that
  // reach this point toured sponsorless - that is part of why they are broke -
  // so a deal the run never had is the fallback rather than a reason to offer
  // nothing. It is the lowest-upfront deal in the registry, resolved
  // deterministically: the band that just failed is not being courted by
  // anyone good.
  const carried = resolveSponsorFollowUpTarget(state)
  if (carried) return carried

  const cheapest = [...BRAND_DEALS_BY_ID.values()]
    .slice()
    .sort(
      (a, b) =>
        finiteNumberOr(a.offer?.upfront, 0) -
          finiteNumberOr(b.offer?.upfront, 0) || a.id.localeCompare(b.id)
    )[0]
  return cheapest ? { kind: 'sponsor', id: cheapest.id } : null
}

const resolveSponsorFollowUpTarget = (
  state: GameState
): BetweenTourTarget | null => {
  const sourceIds: string[] = []
  for (const obligation of state.expedition?.activeObligations ?? []) {
    if (obligation.sourceType !== 'brandDeal') continue
    if (typeof obligation.sourceId !== 'string' || obligation.sourceId === '')
      continue
    if (!sourceIds.includes(obligation.sourceId))
      sourceIds.push(obligation.sourceId)
  }
  sourceIds.sort((a, b) => a.localeCompare(b))
  const chosen = sourceIds[0]
  return chosen === undefined ? null : { kind: 'sponsor', id: chosen }
}

/** The `vehicle_repair` target: the van, when it is actually damaged. */
const resolveVehicleRepairTarget = (
  state: GameState
): BetweenTourTarget | null =>
  finiteNumberOr(state.player.van?.condition, 100) <
  BETWEEN_TOUR_REPAIR_CONDITION_CEILING
    ? { kind: 'vehicle', id: 'active_van' }
    : null

/**
 * The `network_contact` target: a lead out of the Archive.
 *
 * @param state - Current game state.
 * @param isFallback - Whether nothing else was generated.
 * @returns The lead, or `null`.
 *
 * @remarks
 * The fallback family. A Tour that produced no injury, no Crew, no Rival, no
 * Sponsor and an intact van still gets one decision, so the Between-Tour step
 * is never an empty screen. Offered only as that fallback: a Career with real
 * consequences to answer should be answering those.
 */
const resolveNetworkContactTarget = (
  state: GameState,
  isFallback: boolean
): BetweenTourTarget | null => {
  if (!isFallback) return null
  const regions = state.career.archiveByCategory.region ?? []
  const lead = [...regions].sort((a, b) => a.localeCompare(b))[0]
  return lead === undefined ? null : { kind: 'archive', id: lead }
}

/**
 * Generates the decisions one finalized run leaves behind.
 *
 * @param state - State after Crew and Career settlement.
 * @param runId - The finalized run.
 * @returns The stored decision set, or `null` when the run cannot generate.
 *
 * @remarks
 * Idempotent by construction: `betweenTourByRunId` already holding the run is
 * the guard, so a second call is an identity no-op rather than a second set of
 * questions about the same Tour.
 */
export const generateBetweenTourDecisions = (
  state: GameState,
  runId: string
): BetweenTourRunState | null => {
  const outcome = state.expedition?.outcome
  if (!outcome || outcome.runId !== runId) return null
  if (Object.hasOwn(state.career.betweenTourByRunId, runId)) return null
  if (!state.career.settledCrewRunIds.includes(runId)) return null
  if (!state.career.settledExpeditionRunIds.includes(runId)) return null

  const decisions: BetweenTourDecisionInstance[] = []
  const add = (
    type: BetweenTourDecisionType,
    resolved: { target: BetweenTourTarget; optionIds: string[] } | null
  ): void => {
    if (!resolved || decisions.length >= MAX_BETWEEN_TOUR_DECISIONS) return
    decisions.push({
      id: `${runId}:${type}`,
      type,
      target: resolved.target,
      optionIds: resolved.optionIds
    })
  }
  const withAllOptions = (
    type: BetweenTourDecisionType,
    target: BetweenTourTarget | null
  ): { target: BetweenTourTarget; optionIds: string[] } | null =>
    target ? { target, optionIds: [...BETWEEN_TOUR_OPTIONS[type]] } : null

  for (const type of BETWEEN_TOUR_DECISION_PRIORITY) {
    switch (type) {
      case 'injury_rehab':
        add(type, withAllOptions(type, resolveInjuryRehabTarget(state)))
        break
      case 'crew_debrief':
        add(type, resolveCrewDebriefDecision(state))
        break
      case 'rival_response':
        add(type, withAllOptions(type, resolveRivalResponseTarget(state)))
        break
      case 'sponsor_advance':
        add(type, withAllOptions(type, resolveSponsorAdvanceTarget(state)))
        break
      case 'sponsor_follow_up':
        add(type, withAllOptions(type, resolveSponsorFollowUpTarget(state)))
        break
      case 'vehicle_repair':
        add(type, withAllOptions(type, resolveVehicleRepairTarget(state)))
        break
      case 'network_contact':
        add(
          type,
          withAllOptions(
            type,
            resolveNetworkContactTarget(state, decisions.length === 0)
          )
        )
        break
    }
  }

  return {
    runId,
    decisions,
    resolvedOptionByDecisionId: Object.create(null) as Record<string, string>
  }
}

/**
 * Whether every decision of one run has been answered.
 *
 * @param state - Current game state.
 * @param runId - The finalized run.
 * @returns True when nothing is outstanding.
 *
 * @remarks
 * *Stored* decisions, which is what makes this a gate rather than a trap. A
 * run with no stored set has nothing outstanding: generation is refused before
 * both settlements have run and for a run that already has a set, so treating
 * an absent set as incomplete would strand every terminal transition that does
 * not go through the Between-Tour step at all - a failed run acknowledged from
 * a crisis dialog, or a save reloaded past the summary.
 */
export const areBetweenTourDecisionsResolved = (
  state: GameState,
  runId: unknown
): boolean => {
  if (typeof runId !== 'string') return true
  const stored = Object.hasOwn(state.career.betweenTourByRunId, runId)
    ? state.career.betweenTourByRunId[runId]
    : undefined
  if (!stored) return true
  return stored.decisions.every(decision =>
    Object.hasOwn(stored.resolvedOptionByDecisionId, decision.id)
  )
}

/**
 * Applies one Between-Tour option, deriving every value from the decision.
 *
 * @param state - Current game state.
 * @param decision - The stored decision being answered.
 * @param optionId - The option taken.
 * @returns Next state, or `null` when the option cannot be taken.
 *
 * @remarks
 * `null` is not a rejection of the *decision*: it means this option is not
 * available right now - almost always Cash the Career no longer has - so the
 * caller leaves the decision open instead of consuming it on nothing. That is
 * why affordability is re-checked here and not at generation: two money
 * options offered by the same Tour must not both be payable out of one
 * balance.
 *
 * Everything a decision changes is bounded and single-slot. The preferences
 * the Rival and Sponsor options leave are one entry each, overwritten rather
 * than accumulated, so a Career cannot stack leans into permanent power.
 */
export const applyBetweenTourDecisionOption = (
  state: GameState,
  decision: BetweenTourDecisionInstance,
  optionId: string
): GameState | null => {
  const money = finiteNumberOr(state.player.money, 0)

  switch (decision.type) {
    case 'injury_rehab': {
      if (optionId === 'accept_unavailability') {
        // Costs nothing and changes nothing: the Crew serves the Tour it owes,
        // or the band carries the consequence into the next one.
        return state
      }
      if (optionId !== 'pay_rehab') return null
      if (money < BETWEEN_TOUR_REHAB_COST) return null
      const paid = {
        ...state,
        player: {
          ...state.player,
          money: clampPlayerMoney(money - BETWEEN_TOUR_REHAB_COST)
        }
      }
      if (decision.target.kind === 'crew') {
        return {
          ...paid,
          career: resolveCrewRecoveryDebt(
            paid.career,
            decision.target.id,
            'rehab'
          )
        }
      }
      if (decision.target.kind === 'band') {
        const memberId = decision.target.id
        const current =
          state.career.bandConsequenceByMemberId[memberId] ?? 'none'
        const index = BAND_CONSEQUENCE_ORDER.indexOf(current)
        if (index <= 0) return null
        const reduced = BAND_CONSEQUENCE_ORDER[index - 1] ?? 'none'
        const next = Object.assign(
          Object.create(null),
          paid.career.bandConsequenceByMemberId
        ) as GameState['career']['bandConsequenceByMemberId']
        next[memberId] = reduced
        return {
          ...paid,
          career: { ...paid.career, bandConsequenceByMemberId: next }
        }
      }
      return null
    }

    case 'crew_debrief': {
      if (decision.target.kind !== 'crew') return null
      const crewId = decision.target.id
      const prior = state.career.crewById[crewId]
      if (!prior) return null
      if (optionId === 'rest_band') {
        return {
          ...state,
          career: {
            ...state.career,
            crewById: {
              ...state.career.crewById,
              [crewId]: {
                ...prior,
                loyalty: Math.min(100, finiteNumberOr(prior.loyalty, 0) + 1)
              }
            }
          }
        }
      }
      if (optionId !== 'develop_signature') return null
      // Re-checked, not trusted: eligibility can have lapsed since the
      // decision was generated - a rehab decision answered first may have
      // created a recovery debt, and a Crew in debt is not developing.
      const traitId = getEligibleCrewSignatureTrait(state, crewId)
      if (traitId === null) return null
      return {
        ...state,
        career: {
          ...state.career,
          crewById: {
            ...state.career.crewById,
            [crewId]: { ...prior, signatureTraitId: traitId }
          }
        }
      }
    }

    case 'rival_response': {
      if (decision.target.kind !== 'rival') return null
      if (optionId !== 'confront' && optionId !== 'cool_down') return null
      return {
        ...state,
        career: {
          ...state.career,
          nextTourPreferences: {
            ...state.career.nextTourPreferences,
            rival: { rivalId: decision.target.id, stance: optionId }
          }
        }
      }
    }

    case 'sponsor_advance': {
      if (decision.target.kind !== 'sponsor') return null
      if (optionId === 'decline_advance') return state
      if (optionId !== 'take_advance') return null
      // Re-derived, never trusted from the decision: the Career may have been
      // made solvent by an earlier decision in the same Between-Tour set, and
      // an advance it no longer needs is not one it may take.
      if (state.career.sponsorAdvance !== null) return null
      if (!isExpeditionCareerInsolvent(state)) return null
      // The whole target, re-derived. Checking only solvency let a crafted
      // persisted decision credit the advance after a run that *completed* or
      // extracted, and name any Sponsor id it liked: the failed-run and
      // canonical-Sponsor conditions live in the resolver, and were only ever
      // enforced at generation time.
      const canonicalTarget = resolveSponsorAdvanceTarget(state)
      if (!canonicalTarget) return null
      if (canonicalTarget.id !== decision.target.id) return null
      const runId = state.expedition.outcome?.runId
      if (typeof runId !== 'string') return null
      return {
        ...state,
        player: {
          ...state.player,
          money: clampPlayerMoney(
            finiteNumberOr(state.player.money, 0) +
              BETWEEN_TOUR_SPONSOR_ADVANCE_AMOUNT
          )
        },
        career: {
          ...state.career,
          sponsorAdvance: {
            dealId: decision.target.id,
            amount: BETWEEN_TOUR_SPONSOR_ADVANCE_AMOUNT,
            outstanding: Math.round(
              BETWEEN_TOUR_SPONSOR_ADVANCE_AMOUNT *
                BETWEEN_TOUR_SPONSOR_ADVANCE_REPAYMENT_RATE
            ),
            takenAfterRunId: runId
          }
        }
      }
    }
    case 'sponsor_follow_up': {
      if (decision.target.kind !== 'sponsor') return null
      if (optionId === 'keep_relationship') {
        return {
          ...state,
          career: {
            ...state.career,
            nextTourPreferences: {
              ...state.career.nextTourPreferences,
              sponsor: { dealId: decision.target.id, bias: 1 }
            }
          }
        }
      }
      if (optionId !== 'walk_away') return null
      return {
        ...state,
        career: {
          ...state.career,
          nextTourPreferences: {
            ...state.career.nextTourPreferences,
            sponsor: { dealId: decision.target.id, bias: -1 }
          }
        }
      }
    }

    case 'vehicle_repair': {
      if (optionId === 'carry_damage') return state
      if (optionId !== 'pay_repair') return null
      const condition = Math.max(
        0,
        Math.min(100, finiteNumberOr(state.player.van?.condition, 100))
      )
      const missingPoints = 100 - condition
      if (missingPoints <= 0) return null
      // Partial repair, priced per point. All-or-nothing was a Career-ender:
      // a van at condition 0 costs 1200 to rebuild, a Career between Tours
      // holds a few hundred, and the decision then refused outright - so the
      // van stayed at 0 for every remaining Tour, each run bailed out at its
      // first extraction window, and nothing ever earned the 1200. A garage
      // that will not sell twenty points of repair to a band with 240 in hand
      // is not a harder game, it is a dead one.
      // Fuel money is not spendable on bodywork. The Career settlement
      // guarantees enough to book the next Tour; letting the garage take it
      // would hand the wreck back in a different shape - a repaired van the
      // band cannot drive anywhere.
      const spendable = Math.max(
        0,
        money - getExpeditionMinimumNextStartCost(state)
      )
      const affordablePoints = Math.min(
        missingPoints,
        Math.floor(spendable / BETWEEN_TOUR_REPAIR_COST_PER_POINT)
      )
      if (affordablePoints <= 0) return null
      // Charged for exactly the points restored, so partial repair cannot be
      // cheaper per point than paying for the whole job.
      const cost = affordablePoints * BETWEEN_TOUR_REPAIR_COST_PER_POINT
      return {
        ...state,
        player: {
          ...state.player,
          money: clampPlayerMoney(money - cost),
          van: {
            ...state.player.van,
            condition: clampVanCondition(condition + affordablePoints)
          }
        }
      }
    }

    case 'network_contact': {
      if (optionId === 'cash_out') {
        return {
          ...state,
          player: {
            ...state.player,
            money: clampPlayerMoney(money + BETWEEN_TOUR_CASH_OUT_PAYOUT)
          }
        }
      }
      if (optionId !== 'follow_lead') return null
      if (decision.target.kind !== 'archive') return null
      // The lead is a Region the Archive already holds, so following it opens
      // the Tour Type the Region is toured with rather than minting a second
      // copy of a discovery. Nothing is unlocked: the Archive grants nothing,
      // and this only records that the contact was met.
      return {
        ...state,
        career: {
          ...state.career,
          archiveByCategory: {
            ...state.career.archiveByCategory,
            region: state.career.archiveByCategory.region.includes(
              decision.target.id
            )
              ? state.career.archiveByCategory.region
              : [...state.career.archiveByCategory.region, decision.target.id]
          }
        }
      }
    }
  }
}
