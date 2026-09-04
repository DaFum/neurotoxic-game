/**
 * Multi-axis Expedition failure shell.
 *
 * @remarks
 * The design requires several real failure axes, each attributable to visible
 * player decisions, and forbids a single opaque roll ending a 20-30 minute run.
 * So a crisis is *derived* from current run state rather than raised by a
 * caller, always names the resource that caused it, and always carries at least
 * one legal response.
 *
 * G1A owns the Economic and Mobility axes only. G2/G3/G4 export their technical,
 * Crew, Authority and critical-Contract signals into
 * {@link composeExpeditionFailureSignal}, which stays the single terminal owner —
 * no later domain creates a second failure system.
 */

import { checkSoftlock } from '../../utils/mapUtils'
import {
  calculateRefuelCost,
  shouldTriggerBankruptcy
} from '../../utils/economy'
import { getTotalDailyObligations } from '../../utils/assetSelectors'
import { isFiniteNumber } from '../../utils/finiteNumber'
import { getExpeditionSpendableCash } from './loadout'
import type { GameState } from '../../types'
import type {
  ExpeditionFailureChoiceId,
  ExpeditionFailureSignal,
  ExpeditionMap,
  PendingExpeditionFailure
} from '../../types/expedition'

/**
 * Cash a roadside tow costs.
 *
 * @remarks
 * Priced above a full refuel so towing is the expensive-but-safe escape the
 * anti-frustration rule asks for, not the cheap default.
 */
export const EXPEDITION_TOW_COST = 180 as const

/**
 * Order in which competing failure signals are resolved.
 *
 * @remarks
 * Failure reasons must be attributable, so the *root cause* wins rather than
 * whichever signal is checked first by accident. Bankruptcy outranks a mobility
 * crisis because being unable to afford the escape is why the escape is
 * unavailable. Later gates insert their reasons at their documented position.
 */
export const EXPEDITION_FAILURE_PRIORITY = [
  'bankruptcy',
  'technical_shutdown',
  'crew_collapse',
  'authority_crisis',
  'critical_contract_breach',
  'fuel_stranded'
] as const

/**
 * Derives the Economic failure signal.
 *
 * @param state - Current game state.
 * @returns The signal, or `null` when the run is solvent.
 *
 * @remarks
 * Measured against the *spendable* slice, not the raw balance: the protected
 * Career Cash is not available to rescue the run, so a run can go bankrupt
 * while the Career is wealthy. `shouldTriggerBankruptcy` and
 * `getTotalDailyObligations` stay the canonical owners of the rule itself.
 */
export const getExpeditionEconomyFailureSignal = (
  state: GameState
): ExpeditionFailureSignal | null => {
  if (state.expedition?.status !== 'active') return null
  const spendable = getExpeditionSpendableCash(state)
  if (!shouldTriggerBankruptcy(spendable, 0, getTotalDailyObligations(state))) {
    return null
  }
  return {
    reason: 'bankruptcy',
    // Names the resource that caused the crisis, as the design requires.
    sourceId: 'expedition_cash',
    choices: ['accept_failure']
  }
}

/**
 * Derives the Mobility failure signal.
 *
 * @param state - Current game state.
 * @returns The signal, or `null` when a legal move remains.
 *
 * @remarks
 * `checkSoftlock` is the canonical stranded authority and already accounts for
 * the travel gate, in-place gig escapes and an affordable refuel. It is given a
 * player view whose cash is the Expedition-spendable slice, so the protected
 * Career Cash cannot silently defuse a stranded verdict.
 */
export const getExpeditionMobilityFailureSignal = (
  state: GameState
): ExpeditionFailureSignal | null => {
  if (state.expedition?.status !== 'active') return null
  if (!state.gameMap) return null

  const spendable = getExpeditionSpendableCash(state)
  const strandedView = {
    ...state.player,
    money: spendable
  }
  if (
    !checkSoftlock(state.gameMap, strandedView, state.band, {
      dailyObligations: getTotalDailyObligations(state)
    })
  ) {
    return null
  }

  const currentFuel = isFiniteNumber(state.player.van?.fuel)
    ? state.player.van.fuel
    : 0
  const choices: ExpeditionFailureChoiceId[] = []
  if (
    calculateRefuelCost(currentFuel) > 0 &&
    spendable >= calculateRefuelCost(currentFuel)
  ) {
    choices.push('refuel')
  }
  if (spendable >= EXPEDITION_TOW_COST) choices.push('tow')
  // `accept_failure` is unconditional, which is what guarantees no softlock:
  // a crisis always has at least one legal response.
  choices.push('accept_failure')

  return {
    reason: 'fuel_stranded',
    sourceId:
      typeof state.player.currentNodeId === 'string'
        ? state.player.currentNodeId
        : 'expedition_route',
    choices
  }
}

/**
 * Composes every failure signal into the one terminal owner.
 *
 * @param state - Current game state.
 * @param laterGateSignals - Signals exported by G2/G3/G4.
 * @returns The highest-priority signal, or `null`.
 *
 * @remarks
 * G1B passes the technical, Crew, Authority and critical-Contract signals here.
 * Keeping composition in one function is what stops a later domain from adding
 * a second path from "something went wrong" to "the run is over".
 */
export const composeExpeditionFailureSignal = (
  state: GameState,
  laterGateSignals: readonly ExpeditionFailureSignal[] = []
): ExpeditionFailureSignal | null => {
  const signals: ExpeditionFailureSignal[] = []
  const economy = getExpeditionEconomyFailureSignal(state)
  if (economy) signals.push(economy)
  const mobility = getExpeditionMobilityFailureSignal(state)
  if (mobility) signals.push(mobility)
  for (const signal of laterGateSignals) {
    if (signal) signals.push(signal)
  }
  if (signals.length === 0) return null

  for (const reason of EXPEDITION_FAILURE_PRIORITY) {
    const match = signals.find(signal => signal.reason === reason)
    if (match) return match
  }
  return signals[0] ?? null
}

/**
 * Builds the stable crisis id for one signal.
 *
 * @param state - Current game state.
 * @param signal - Composed failure signal.
 * @returns Deterministic id.
 *
 * @remarks
 * Derived rather than generated: reducers must stay pure, and a stable id is
 * what makes `ACCEPT_EXPEDITION_FAILURE` replay-safe — a replayed accept names
 * an id that no longer matches the current derivation and is refused.
 */
export const buildExpeditionFailureId = (
  state: GameState,
  signal: ExpeditionFailureSignal
): string =>
  [
    'exp_fail',
    state.expedition.runId ?? 'no_run',
    signal.reason,
    signal.sourceId,
    String(state.expedition.routeStep)
  ].join('::')

/**
 * Derives the current pending crisis, if any.
 *
 * @param state - Current game state.
 * @param laterGateSignals - Signals exported by G2/G3/G4.
 * @returns The crisis to surface, or `null`.
 */
export const deriveExpeditionPendingFailure = (
  state: GameState,
  laterGateSignals: readonly ExpeditionFailureSignal[] = []
): PendingExpeditionFailure | null => {
  // Optional read: this is reached from the root reducer for *every* action, so
  // a state without the slice (an older save mid-migration, a partial fixture)
  // must be a no-op rather than a crash in an unrelated domain.
  if (state.expedition?.status !== 'active') return null
  const signal = composeExpeditionFailureSignal(state, laterGateSignals)
  if (!signal) return null
  return {
    id: buildExpeditionFailureId(state, signal),
    reason: signal.reason,
    sourceId: signal.sourceId,
    raisedAtRouteStep: state.expedition.routeStep,
    choices: signal.choices
  }
}

/**
 * Recomputes the stored crisis, preserving identity when nothing changed.
 *
 * @param state - Current game state.
 * @returns Next state, or the identical reference when the crisis is unchanged.
 *
 * @remarks
 * Called centrally from the root reducer after every action so the stored
 * crisis can never drift from the state that caused it. Returning the identical
 * reference on a no-op is required: the reducer-invariant tests assert that a
 * rejected action leaves the exact same state object.
 */
export const syncExpeditionPendingFailure = (state: GameState): GameState => {
  if (!state.expedition) return state
  const derived = deriveExpeditionPendingFailure(state)
  const current = state.expedition.pendingFailure

  if (derived === null) {
    if (current === null) return state
    return {
      ...state,
      expedition: { ...state.expedition, pendingFailure: null }
    }
  }
  if (
    current !== null &&
    current.id === derived.id &&
    current.choices.length === derived.choices.length &&
    current.choices.every((choice, index) => choice === derived.choices[index])
  ) {
    return state
  }
  return {
    ...state,
    expedition: { ...state.expedition, pendingFailure: derived }
  }
}

/**
 * Checks whether a crisis id names the run's *current* derived crisis.
 *
 * @param state - Current game state.
 * @param pendingFailureId - Id from an untrusted dispatch.
 * @returns True when the id matches the live derivation.
 *
 * @remarks
 * Deliberately compared against the freshly derived crisis, not the stored
 * copy, so a forged or stale id cannot end a run that has already recovered.
 */
export const isCurrentExpeditionFailureId = (
  state: GameState,
  pendingFailureId: unknown
): boolean => {
  if (typeof pendingFailureId !== 'string') return false
  const derived = deriveExpeditionPendingFailure(state)
  return derived !== null && derived.id === pendingFailureId
}

/**
 * Lists the legal responses to the current crisis.
 *
 * @param state - Current game state.
 * @param map - The route built from the canonical root run seed.
 * @returns Legal choices, with `extract` added at an extraction window.
 *
 * @remarks
 * The extraction escape depends on the route, which the signal producers do not
 * read, so it is composed here where the prepared map is available.
 */
export const getExpeditionCrisisChoices = (
  state: GameState,
  map: ExpeditionMap
): ExpeditionFailureChoiceId[] => {
  const pending = deriveExpeditionPendingFailure(state)
  if (!pending) return []
  const choices = [...pending.choices]
  const atWindow = Object.values(map.meta).some(
    entry =>
      entry.routeStep === state.expedition.routeStep && entry.isExtractionWindow
  )
  if (atWindow && !choices.includes('extract')) {
    choices.unshift('extract')
  }
  return choices
}
