/**
 * Pure protected-cash helpers, kept free of heavy imports so the event engine
 * and UI can evaluate the spendable balance without pulling in the whole
 * Expedition loadout module.
 */
import type { GameState } from '../../types'
import { ActionTypes } from '../../context/actionTypes'
import { finiteNumberOr, isFiniteNumber } from '../../utils/finiteNumber'
import { logger } from '../../utils/logger'

/**
 * Career Cash the active run may not touch.
 *
 * @param state - Current game state.
 * @returns Non-negative protected amount; `0` outside an active run.
 *
 * @remarks
 * A corrupt protected slice (non-finite or negative) fails closed: the whole
 * balance counts as protected, so {@link getExpeditionSpendableCash} reports
 * nothing spendable rather than treating the protection as gone.
 */
export const getExpeditionProtectedCash = (
  state: Pick<GameState, 'player' | 'expedition'>
): number => {
  if (state.expedition?.status !== 'active') return 0
  const protectedCash = state.expedition.protectedCareerCash
  if (!isFiniteNumber(protectedCash) || protectedCash < 0) {
    return Math.max(0, finiteNumberOr(state.player.money, 0))
  }
  return protectedCash
}

/**
 * Cash the player may spend inside an active Expedition.
 *
 * @param state - Current game state.
 * @returns Non-negative spendable amount.
 *
 * @remarks
 * `protectedCareerCash` is committed in the build and is off-limits for the
 * whole run. Without this boundary a wealthy Career would trivialize every run
 * safety decision — the design requires Cash to be a tool for controlling risk,
 * not an unlimited rescue. Outside a run the full balance is spendable.
 */
export const getExpeditionSpendableCash = (
  state: Pick<GameState, 'player' | 'expedition'>
): number =>
  Math.max(
    0,
    finiteNumberOr(state.player.money, 0) - getExpeditionProtectedCash(state)
  )

/**
 * Checks whether an active-Expedition spend is affordable.
 *
 * @param state - Current game state.
 * @param amount - Non-negative cost to test.
 * @returns True when the spend stays inside the spendable slice.
 *
 * @remarks
 * A non-finite or negative amount is rejected rather than clamped: silently
 * treating `NaN` as free would let a malformed caller spend nothing and receive
 * the goods.
 */
export const canSpendExpeditionCash = (
  state: GameState,
  amount: number
): boolean =>
  isFiniteNumber(amount) &&
  amount >= 0 &&
  getExpeditionSpendableCash(state) >= amount

/**
 * A state view whose balance is only the cash an active run may spend.
 *
 * @param state - Game state, or an engine slice of it.
 * @returns `state` itself outside a run or without protected cash; otherwise a
 * shallow copy whose `player.money` is the spendable slice.
 *
 * @remarks
 * Event option conditions gate paid choices on `player.money`. Evaluating them
 * against this view keeps an optional purchase from being offered, or resolved,
 * on the strength of protected cash the floor will not let it spend.
 */
export const withExpeditionSpendableCash = <T extends object>(state: T): T => {
  const full = state as unknown as GameState
  if (getExpeditionProtectedCash(full) === 0) return state
  return {
    ...state,
    player: { ...full.player, money: getExpeditionSpendableCash(full) }
  }
}

/**
 * Outcome of settling a mandatory charge against spendable cash.
 */
export interface ExpeditionMandatoryDebitSettlement {
  /** The next player money balance. */
  nextMoney: number
  /** The amount of the charge actually paid. */
  paid: number
  /** The portion of the charge that was waived due to insufficient spendable cash. */
  waived: number
}

/**
 * Settles a mandatory debit (such as Roadie minigame equipment repairs) against available
 * spendable cash and credit.
 *
 * @param state - Current game state.
 * @param params - The mandatory charge and optional offsetting credit.
 * @returns Settlement containing next money balance, amount paid, and amount waived.
 *
 * @remarks
 * Normalizes inputs to finite nonnegative numbers. Outside an active run, protection is 0 and
 * debit is capped at balance so money never goes below 0. If protection is malformed, spendable
 * cash is 0, so only `credit` pays the charge and `nextMoney` is never lower than `money`.
 */
export const settleExpeditionMandatoryDebit = (
  state: GameState,
  { charge: rawCharge, credit: rawCredit }: { charge: number; credit?: number }
): ExpeditionMandatoryDebitSettlement => {
  const charge = Math.max(0, finiteNumberOr(rawCharge, 0))
  const credit = Math.max(0, finiteNumberOr(rawCredit, 0))
  const money = finiteNumberOr(state?.player?.money, 0)

  const available = getExpeditionSpendableCash(state) + credit
  const paid = Math.min(charge, available)
  const waived = charge - paid
  const nextMoney = money + credit - paid

  return { nextMoney, paid, waived }
}

/**
 * Action types exempt from the protected-Cash floor.
 *
 * @remarks
 * The floor guards *discretionary* spending. Three families must stay exempt:
 *
 * - `ADVANCE_DAY` applies mandatory obligations (upkeep, liability payments,
 *   legacy wear). Blocking it would freeze the day tick; the design instead
 *   wants unpayable obligations to surface as the bankruptcy crisis, which the
 *   failure shell derives from the same spendable slice. G2 owns the full
 *   active-Expedition day policy.
 * - `LOAD_GAME`/`RESET_STATE` install a state rather than spend from one, so
 *   comparing their result against the previous state's floor is meaningless.
 * - The Expedition terminal actions settle the run. A settlement only ever
 *   forfeits run *earnings*, so it cannot reach below the protected slice, but
 *   exempting them keeps the floor from second-guessing the settlement math.
 */
const EXPEDITION_CASH_FLOOR_EXEMPT_ACTIONS: ReadonlySet<string> = new Set([
  ActionTypes.ADVANCE_DAY,
  ActionTypes.SET_TERMINAL_OUTCOME,
  ActionTypes.LOAD_GAME,
  ActionTypes.RESET_STATE,
  ActionTypes.EXTRACT_EXPEDITION,
  ActionTypes.COMPLETE_EXPEDITION,
  ActionTypes.ACCEPT_EXPEDITION_FAILURE,
  ActionTypes.PREPARE_NEXT_EXPEDITION
])

/**
 * The balance a spend may leave, under an active run's protected Career Cash.
 *
 * @param expedition - The run's state, or `undefined` outside a run.
 * @param before - Balance before the spend.
 * @param after - Balance the spend would leave.
 * @returns `before` when the spend would cross the protected floor, else
 * `after`.
 *
 * @remarks
 * Same rule as {@link enforceExpeditionCashFloor}, for a caller that bundles
 * Cash with other gains (the post-gig ledger) and wants to refuse only the
 * Cash part instead of the whole update.
 */
export const capExpeditionSpendAtCashFloor = (
  expedition: GameState['expedition'] | undefined,
  before: number,
  after: number
): number => {
  if (expedition?.status !== 'active') return after
  // A corrupt slice fails closed, like getExpeditionProtectedCash: the whole
  // balance counts as protected.
  const protectedCash = expedition.protectedCareerCash
  const floor =
    isFiniteNumber(protectedCash) && protectedCash >= 0
      ? protectedCash
      : Math.max(0, finiteNumberOr(before, 0))
  if (floor === 0 || after >= before || after >= floor) return after
  return before
}

/**
 * Rejects any action that would spend past the protected Career Cash slice.
 *
 * @param previousState - State before the action reduced.
 * @param nextState - State the action produced.
 * @param actionType - The action's discriminant.
 * @returns `nextState`, or `previousState` when the spend crossed the floor.
 *
 * @remarks
 * One authoritative floor instead of a check at every spend site. Travel,
 * refuelling, repairs, clinic treatments, purchases and negative event money
 * deltas all deduct from `player.money` through their own reducers; auditing
 * each of them would leave the next spend path added elsewhere unguarded, and
 * the design requires the protected slice to hold against *every* in-run spend.
 *
 * Roadie settles equipment repairs as a capped mandatory debit before this guard
 * runs, and the generic rollback here acts as a backstop only.
 *
 * Only a spend that actually lowers the balance is judged, so an action that
 * nets positive or leaves Cash untouched is never rejected — including one that
 * starts below the floor because mandatory obligations already pushed it there.
 */
export const enforceExpeditionCashFloor = (
  previousState: GameState,
  nextState: GameState,
  actionType: string
): GameState => {
  if (nextState === previousState) return previousState
  if (previousState.expedition?.status !== 'active') return nextState
  // A recorded travel refusal is evidence that Cash could not pay for a leg.
  // Cash rising again retires it, or the Mobility crisis would stay latched at
  // that route step after the run can afford to leave.
  if (
    nextState.expedition?.blockedTravelAtRouteStep != null &&
    finiteNumberOr(nextState.player.money, 0) >
      finiteNumberOr(previousState.player.money, 0)
  ) {
    nextState = {
      ...nextState,
      expedition: { ...nextState.expedition, blockedTravelAtRouteStep: null }
    }
  }
  if (EXPEDITION_CASH_FLOOR_EXEMPT_ACTIONS.has(actionType)) return nextState

  const floor = getExpeditionProtectedCash(previousState)
  if (floor === 0) return nextState

  const before = finiteNumberOr(previousState.player.money, 0)
  const after = finiteNumberOr(nextState.player.money, 0)
  if (after >= before) return nextState
  if (after >= floor) return nextState

  // An event bundles Cash with time, controversy and confiscation. Rolling the
  // whole delta back would cancel those penalties while the event still
  // closes, so only the Cash debit is held at the floor.
  if (actionType === ActionTypes.APPLY_EVENT_DELTA) {
    return {
      ...nextState,
      player: {
        ...nextState.player,
        money: Math.max(after, Math.min(before, floor))
      }
    }
  }

  logger.warn(
    'Expedition',
    `Rejected a spend that would cross the protected Career Cash floor (${actionType})`,
    { before, after, floor }
  )

  // A reverted travel settlement leaves no trace, and a run that cannot pay
  // for any leg is then stuck with no crisis: `checkSoftlock` prices legs
  // through the career travel gate and knows nothing about this floor, so
  // `getExpeditionMobilityFailureSignal` stays silent and `accept_failure` -
  // the unconditional choice that is supposed to make a softlock impossible -
  // is never offered. Record the refusal as realized evidence, exactly as
  // `unpaidDailyObligation` records a day tick that could not pay.
  if (actionType === ActionTypes.COMPLETE_TRAVEL_MINIGAME) {
    return {
      ...previousState,
      expedition: {
        ...previousState.expedition,
        blockedTravelAtRouteStep: previousState.expedition.routeStep
      }
    }
  }
  return previousState
}

/**
 * How an active Expedition overrides the legacy daily tick.
 *
 * @remarks
 * Gathered once per day tick so the pure daily-update helpers can apply the
 * Expedition rules without each of them reaching into `state.expedition`.
 */
export interface ExpeditionDayPolicy {
  /** True while an active run overrides the legacy day tick. */
  isActive: boolean
  /** Cash the run may spend on mandatory obligations. */
  spendableCash: number
  /** Floor `player.money` must never cross. */
  protectedCareerCash: number
  /** Obligation a previous day could not pay, carried forward. */
  carriedUnpaidObligation: number
}

/**
 * Reads the day policy for the current state.
 *
 * @param state - Current game state.
 * @returns The policy; `isActive: false` outside a run, where the legacy tick
 * is left completely unchanged.
 */
export const getExpeditionDayPolicy = (
  state: GameState
): ExpeditionDayPolicy => {
  const isActive = state.expedition?.status === 'active'
  return {
    isActive,
    spendableCash: isActive ? getExpeditionSpendableCash(state) : 0,
    protectedCareerCash: getExpeditionProtectedCash(state),
    carriedUnpaidObligation: isActive
      ? Math.max(0, finiteNumberOr(state.expedition.unpaidDailyObligation, 0))
      : 0
  }
}

/**
 * Outcome of settling one day's mandatory obligations inside a run.
 */
export interface ExpeditionDaySettlement {
  /** Balance to write, never below the protected slice. */
  nextMoney: number
  /** Amount that could not be paid and carries into the next day. */
  unpaidObligation: number
}

/**
 * Settles a day's mandatory obligations against the run's spendable Cash.
 *
 * @param policy - Day policy for the current run.
 * @param currentMoney - Balance before the settlement.
 * @param dailyCost - Net mandatory cost for the day; negative means net income.
 * @returns The balance to write and the shortfall to carry forward.
 *
 * @remarks
 * Mandatory obligations are the one in-run cost the player cannot decline, so
 * they are allowed to consume the whole spendable slice — but not a cent of the
 * protected Career Cash, and the floor never raises a balance that is already
 * below it. A shortfall is therefore not silently forgiven and not
 * silently taken: it carries forward as evidence, which is what lets the failure
 * shell raise an attributable bankruptcy crisis instead of the run simply
 * stalling.
 *
 * A day whose net result is income still clears carried debt first, so earning
 * the money back is a real recovery rather than a cosmetic one.
 */
export const settleExpeditionDailyObligation = (
  policy: ExpeditionDayPolicy,
  currentMoney: number,
  dailyCost: number
): ExpeditionDaySettlement => {
  const money = finiteNumberOr(currentMoney, 0)
  const due = finiteNumberOr(dailyCost, 0) + policy.carriedUnpaidObligation

  // Net income for the day: nothing is owed, and the balance simply rises.
  if (due <= 0) {
    return { nextMoney: money - due, unpaidObligation: 0 }
  }

  const payable = Math.min(due, Math.max(0, policy.spendableCash))
  // The floor can only stop a payment, never fund one. Earlier stages of the
  // same day tick (the asset and liability ticks) may already have taken the
  // balance below the protected slice, and clamping *up* to it here would
  // conjure the difference into existence.
  const floor = Math.min(money, policy.protectedCareerCash)
  return {
    nextMoney: Math.max(floor, money - payable),
    unpaidObligation: due - payable
  }
}
