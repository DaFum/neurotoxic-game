import { finiteNumberOr } from '../../utils/finiteNumber'
import { EXPEDITION_PRESSURE_EVENTS } from '../../data/expedition/pressureEvents'
import { hashExpeditionRoute } from './map'
import { deriveExpeditionOverlayTarget } from './routeOverlay'
import type { ExpeditionMap } from '../../types/expedition'
import { mulberry32 } from '../../utils/seededRng'
import type { GameState } from '../../types'
import { getEffectiveExpeditionRules } from './effectiveRules'

export interface PressureDirectorContext {
  heat: number
  exposure: number
  fameExpectationPressure: number
  cashPressure: number
  technicalConditionPressure: number
  crewStressPressure: number
  activeObligationPressure: number
  rivalPressure: number
  routeDepthPressure: number
}
export interface ExpeditionPressureEvent {
  id: string
  severity: 'normal' | 'severe'
  pressureFamily:
    'authority' | 'crew' | 'contract' | 'rival' | 'social' | 'technical'
  baseWeight: number
  negative: boolean
  /**
   * Whether the run is in a state this event can happen in at all.
   *
   * @remarks
   * Task 8 has the Director filter eligibility before it samples, so the rule
   * lives on the registry entry the Director reads rather than only on the
   * authored event. Otherwise the Director can select a Rival ambush on a run
   * with no Rival and the authored event then refuses itself, leaving the step
   * silently empty.
   */
  isEligible?: (state: GameState) => boolean
}

/**
 * Narrows an untrusted value to a known pressure-event id.
 *
 * @param value - Raw candidate, typically from a save.
 * @returns True when the id is in the canonical registry.
 */
export const isExpeditionPressureEventId = (value: unknown): value is string =>
  typeof value === 'string' &&
  EXPEDITION_PRESSURE_EVENTS.some(event => event.id === value)
const bounded = (value: unknown): number =>
  Math.max(0, Math.min(100, finiteNumberOr(value, 0)))
export const derivePressureDirectorContext = (
  state: GameState
): PressureDirectorContext => {
  const condition = state.expedition.technicalCondition
  const conditionAverage = condition
    ? (condition.pa + condition.instruments + condition.stageGear) / 3
    : 100
  const stresses = Object.values(state.expedition.crew?.stressByCrewId ?? {})
  return {
    heat: bounded(state.expedition.pressure.heat),
    exposure: bounded(state.expedition.pressure.exposure),
    fameExpectationPressure: 0,
    cashPressure: bounded(
      state.player.money <= state.expedition.protectedCareerCash ? 100 : 0
    ),
    technicalConditionPressure: bounded(100 - conditionAverage),
    crewStressPressure: bounded(stresses.length ? Math.max(...stresses) : 0),
    activeObligationPressure: bounded(
      state.expedition.activeObligations.filter(
        item => item.status === 'active'
      ).length * 25
    ),
    rivalPressure: bounded(state.rivalBand?.powerLevel ?? 0),
    routeDepthPressure: bounded(state.expedition.routeStep * 10)
  }
}
/**
 * Share of eligibility the whole pressure pool draws at one qualifying moment.
 *
 * @remarks
 * Spread across the pool rather than per event, so adding a fifth event makes
 * the existing four rarer instead of making pressure events as a whole more
 * frequent. Sized against the neighbouring Crew events' flat `0.1`.
 */
const EXPEDITION_PRESSURE_EVENT_POOL_RATE = 0.4 as const

/**
 * Weighs the pool against the Director context.
 *
 * @param state - Current game state.
 * @param events - Candidate pool.
 * @returns Each event with the weight the Director gives it right now.
 *
 * @remarks
 * The single weighting formula behind the run's one pressure draw:
 * {@link selectPressureEvent} samples from it, and the authored events are
 * gated on the id it produced, so the pressure a run is under shapes both the
 * draw and the surfaced event rather than through two drifting copies.
 */
const weighExpeditionPressureEvents = (
  state: GameState,
  events: readonly ExpeditionPressureEvent[]
): Array<{ event: ExpeditionPressureEvent; weight: number }> => {
  const context = derivePressureDirectorContext(state)
  const relief =
    state.expedition.pressure.severeReliefUntilRouteStep !== null &&
    state.expedition.routeStep <=
      state.expedition.pressure.severeReliefUntilRouteStep
  const bypass = context.heat >= 90
  // Cash and route depth are run-wide rather than per-family, so they cannot
  // simply scale every weight - that cancels out in a weighted draw and would
  // leave both inputs derived but inert. A run out of spendable Cash feels it
  // through its obligations and its Crew; a deeper run draws harsher events.
  const familyPressure: Record<
    ExpeditionPressureEvent['pressureFamily'],
    number
  > = {
    authority: context.heat,
    crew: context.crewStressPressure + context.cashPressure / 2,
    contract: context.activeObligationPressure + context.cashPressure / 2,
    rival: context.rivalPressure,
    social: context.exposure,
    technical: context.technicalConditionPressure
  }
  // The composed rules publish per-family event weighting, so the Director has
  // to consume it: without this a jammer, `cold_trail`, a Security/Manager
  // crew or a Nemesis level changes nothing about which family the run draws.
  const effective = getEffectiveExpeditionRules(state).numeric
  const familyWeight: Record<
    ExpeditionPressureEvent['pressureFamily'],
    number
  > = {
    authority: effective.authorityEventWeightMultiplier,
    rival: effective.rivalEventWeightMultiplier,
    crew: 1,
    contract: 1,
    social: 1,
    technical: 1
  }
  const weighted = events.map(event => ({
    event,
    weight:
      Math.max(0, event.baseWeight) *
      (1 + familyPressure[event.pressureFamily] / 100) *
      Math.max(0, familyWeight[event.pressureFamily]) *
      (event.severity === 'severe' ? 1 + context.routeDepthPressure / 100 : 1) *
      (event.id === state.expedition.pressure.lastSevereEventId ? 0.25 : 1) *
      (event.severity === 'severe' && relief && !bypass ? 0.35 : 1)
  }))
  return weighted
}

/**
 * Samples one pressure event for the current route step.
 *
 * @param state - Current game state.
 * @param events - Candidate pool.
 * @returns The selected event, or `null` when nothing is eligible.
 */
export const selectPressureEvent = (
  state: GameState,
  events: readonly ExpeditionPressureEvent[]
): ExpeditionPressureEvent | null => {
  if (events.length === 0) return null
  const weighted = weighExpeditionPressureEvents(state, events)
  const total = weighted.reduce((sum, item) => sum + item.weight, 0)
  if (total <= 0) return null
  const rng = mulberry32(
    Number.parseInt(
      hashExpeditionRoute(
        `${state.runSeed}:pressure:${state.expedition.routeStep}`
      ),
      16
    )
  )
  let roll = rng() * total
  for (const item of weighted) {
    roll -= item.weight
    if (roll <= 0) return item.event
  }
  return weighted.at(-1)?.event ?? null
}
/**
 * Runs one Director step for the route step the run has just entered.
 *
 * @param state - Current game state, already advanced to the new route step.
 * @param events - Candidate pool; defaults to the canonical registry.
 * @returns The next pressure slice, or the identical reference when the
 * Director selects nothing.
 *
 * @remarks
 * The single production entrypoint for {@link selectPressureEvent}. Selection
 * is seeded from `runSeed` and the route step, so composing it into the route
 * advance keeps the Director replay-safe: the same run picks the same event at
 * the same step. A severe negative event opens the relief window the next two
 * steps read, and the Underground invite is what turns high Heat into the
 * run-scoped route opportunity rather than only a penalty.
 */
export const resolveExpeditionPressureDirectorStep = (
  state: GameState,
  events: readonly ExpeditionPressureEvent[] = EXPEDITION_PRESSURE_EVENTS
): GameState['expedition']['pressure'] => {
  const pressure = state.expedition.pressure
  if (state.expedition.status !== 'active') return pressure
  // Eligibility first, exactly as Task 8 orders it: an event the run cannot
  // have must not consume the step's single draw.
  const eligible = events.filter(event => event.isEligible?.(state) ?? true)
  if (eligible.length === 0) return pressure

  // One roll decides whether this step has a pressure event at all, so the
  // pool stays as rare as its neighbours; the weighting then decides which.
  const routeStep = state.expedition.routeStep
  const gate = mulberry32(
    Number.parseInt(
      hashExpeditionRoute(`${state.runSeed}:pressure_gate:${routeStep}`),
      16
    )
  )()
  if (gate > EXPEDITION_PRESSURE_EVENT_POOL_RATE) return pressure

  const event = selectPressureEvent(state, eligible)
  if (!event) return pressure
  // Selection only. Relief and the Underground opportunity are consequences of
  // an event the player actually resolved, so they are applied by
  // `applyExpeditionPressureEventResolution` rather than here - otherwise the
  // run could open two steps of relief for a show it never saw.
  return { ...pressure, pendingDirectorEventId: event.id }
}

/**
 * Applies the consequences of the Director event the player just resolved.
 *
 * @param state - Current game state.
 * @param resolvedEventId - Id of the event whose option was resolved.
 * @param map - Route used to place an Underground detour.
 * @returns The next pressure slice, or the identical reference when the id is
 * not the pending Director event.
 *
 * @remarks
 * The other half of the single draw: only the event the canonical event
 * lifecycle actually surfaced and resolved may open a relief window or a route
 * opportunity, and it may do so once, because resolving clears the pending id.
 */
export const applyExpeditionPressureEventResolution = (
  state: GameState,
  resolvedEventId: unknown,
  map: ExpeditionMap | null = null
): GameState['expedition']['pressure'] => {
  const pressure = state.expedition.pressure
  if (
    state.expedition.status !== 'active' ||
    typeof resolvedEventId !== 'string' ||
    pressure.pendingDirectorEventId !== resolvedEventId
  ) {
    return pressure
  }
  const event = EXPEDITION_PRESSURE_EVENTS.find(
    entry => entry.id === resolvedEventId
  )
  if (!event) return pressure
  const routeStep = state.expedition.routeStep

  const consumed = { ...pressure, pendingDirectorEventId: null }
  const next =
    event.severity === 'severe' && event.negative
      ? {
          ...consumed,
          lastSevereEventId: event.id,
          severeReliefUntilRouteStep: routeStep + 2
        }
      : consumed

  if (
    event.id !== 'expedition_underground_invite' ||
    pressure.heat < 60 ||
    pressure.temporaryRouteOpportunity !== null ||
    state.expedition.runId === null ||
    map === null
  )
    return next
  const targetNodeId = deriveExpeditionOverlayTarget(
    state,
    map,
    'underground_invite'
  )
  if (targetNodeId === null) return next
  return {
    ...next,
    temporaryRouteOpportunity: {
      // Derived, not generated: the load sanitizer re-derives this id, so a
      // forged opportunity cannot name a step it did not fire at.
      id: `UNDERGROUND_MARKET:${state.expedition.runId}:${routeStep}`,
      subtype: 'UNDERGROUND_MARKET',
      targetNodeId,
      createdAtRouteStep: routeStep
    }
  }
}

export const applyExpeditionPressureDelta = (
  state: GameState,
  delta: { heat?: number; exposure?: number; crowdHype?: number }
): GameState['expedition']['pressure'] => {
  const pressure = state.expedition.pressure
  const effective = getEffectiveExpeditionRules(state).numeric
  const clamp = (value: number) => Math.max(0, Math.min(100, value))
  const heatDelta = finiteNumberOr(delta.heat, 0)
  const exposureDelta = finiteNumberOr(delta.exposure, 0)
  return {
    ...pressure,
    heat: clamp(
      pressure.heat +
        (heatDelta > 0 ? heatDelta * effective.heatGainMultiplier : heatDelta)
    ),
    exposure: clamp(
      pressure.exposure +
        (exposureDelta > 0
          ? exposureDelta * effective.exposureGainMultiplier
          : exposureDelta)
    ),
    crowdHype: clamp(pressure.crowdHype + finiteNumberOr(delta.crowdHype, 0))
  }
}
