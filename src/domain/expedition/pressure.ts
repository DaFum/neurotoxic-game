import { finiteNumberOr } from '../../utils/finiteNumber'
import { hashExpeditionRoute } from './map'
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
  const weighted = events.map(event => ({
    event,
    weight:
      Math.max(0, event.baseWeight) *
      (1 + familyPressure[event.pressureFamily] / 100) *
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
