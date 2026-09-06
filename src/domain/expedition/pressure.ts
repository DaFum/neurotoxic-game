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
}
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
export const selectPressureEvent = (
  state: GameState,
  events: readonly ExpeditionPressureEvent[]
): ExpeditionPressureEvent | null => {
  if (events.length === 0) return null
  const context = derivePressureDirectorContext(state)
  const relief =
    state.expedition.pressure.severeReliefUntilRouteStep !== null &&
    state.expedition.routeStep <=
      state.expedition.pressure.severeReliefUntilRouteStep
  const bypass = context.heat >= 90
  const familyPressure: Record<
    ExpeditionPressureEvent['pressureFamily'],
    number
  > = {
    authority: context.heat,
    crew: context.crewStressPressure,
    contract: context.activeObligationPressure,
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
      (event.id === state.expedition.pressure.lastSevereEventId ? 0.25 : 1) *
      (event.severity === 'severe' && relief && !bypass ? 0.35 : 1)
  }))
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
  events: readonly ExpeditionPressureEvent[] = EXPEDITION_PRESSURE_EVENTS,
  map: ExpeditionMap | null = null
): GameState['expedition']['pressure'] => {
  const pressure = state.expedition.pressure
  if (state.expedition.status !== 'active') return pressure
  const event = selectPressureEvent(state, events)
  if (!event) return pressure
  const routeStep = state.expedition.routeStep
  const next =
    event.severity === 'severe' && event.negative
      ? {
          ...pressure,
          lastSevereEventId: event.id,
          severeReliefUntilRouteStep: routeStep + 2
        }
      : pressure
  if (
    event.id !== 'expedition_underground_invite' ||
    pressure.heat < 60 ||
    pressure.temporaryRouteOpportunity !== null ||
    state.expedition.runId === null ||
    map === null
  )
    return next
  // The opportunity names where the run may now *go*, not where it stands: an
  // invite that opens no new destination is not an opportunity.
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
