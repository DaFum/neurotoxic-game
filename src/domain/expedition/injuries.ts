import type { CareerState } from '../../types/career'
import type { GameState } from '../../types'
import type {
  ExpeditionBandInjuryStage,
  ExpeditionInjuryPerformanceProfile
} from '../../types/expedition'
import { getExpeditionConditionPerformanceProfile } from './condition'

export const EXPEDITION_INJURY_PERFORMANCE_PROFILES: Readonly<
  Record<ExpeditionBandInjuryStage, ExpeditionInjuryPerformanceProfile>
> = {
  none: {
    staminaDrainMultiplier: 1,
    timingWindowMultiplier: 1,
    missPenaltyMultiplier: 1,
    cannotPerform: false
  },
  light: {
    staminaDrainMultiplier: 1.08,
    timingWindowMultiplier: 0.99,
    missPenaltyMultiplier: 1.05,
    cannotPerform: false
  },
  serious: {
    staminaDrainMultiplier: 1.18,
    timingWindowMultiplier: 0.97,
    missPenaltyMultiplier: 1.12,
    cannotPerform: false
  },
  critical: {
    staminaDrainMultiplier: 1.3,
    timingWindowMultiplier: 0.94,
    missPenaltyMultiplier: 1.2,
    cannotPerform: true
  }
}

export const getExpeditionPerformanceProfile = (
  state: GameState
): import('../../types/expedition').ExpeditionConditionPerformanceProfile => {
  const condition = getExpeditionConditionPerformanceProfile(
    state.expedition.technicalCondition
  )
  let staminaDrainMultiplier = 1
  let timingWindowMultiplier = 1
  let missPenaltyMultiplier = 1
  for (const member of state.band.members) {
    if (!member) continue
    const stage = state.expedition.bandInjuryByMemberId?.[member.id] ?? 'none'
    const injury = EXPEDITION_INJURY_PERFORMANCE_PROFILES[stage]
    staminaDrainMultiplier = Math.max(
      staminaDrainMultiplier,
      injury.staminaDrainMultiplier
    )
    timingWindowMultiplier = Math.min(
      timingWindowMultiplier,
      injury.timingWindowMultiplier
    )
    missPenaltyMultiplier = Math.max(
      missPenaltyMultiplier,
      injury.missPenaltyMultiplier
    )
  }
  return {
    ...condition,
    timingMultiplier: condition.timingMultiplier * timingWindowMultiplier,
    missStaminaMultiplier:
      condition.missStaminaMultiplier *
      staminaDrainMultiplier *
      missPenaltyMultiplier
  }
}

export const canPerformExpeditionGig = (state: GameState): boolean => {
  if (state.expedition.status !== 'active') return true
  for (const member of state.band.members) {
    if (
      member &&
      state.expedition.bandInjuryByMemberId?.[member.id] === 'critical'
    )
      return false
  }
  return true
}

export const getExpeditionInjuryActiveEffects = (
  state: GameState
): Array<{ key: string; options: Record<string, number> }> => {
  let worst: ExpeditionInjuryPerformanceProfile =
    EXPEDITION_INJURY_PERFORMANCE_PROFILES.none
  for (const member of state.band.members) {
    if (!member) continue
    const stage = state.expedition.bandInjuryByMemberId?.[member.id] ?? 'none'
    const profile = EXPEDITION_INJURY_PERFORMANCE_PROFILES[stage]
    if (profile.staminaDrainMultiplier > worst.staminaDrainMultiplier) {
      worst = profile
    }
  }
  if (worst === EXPEDITION_INJURY_PERFORMANCE_PROFILES.none) return []
  return [
    {
      key: 'ui:pregig.effects.injuryStamina',
      options: {
        penalty: Math.round((worst.staminaDrainMultiplier - 1) * 100)
      }
    },
    {
      key: 'ui:pregig.effects.injuryTiming',
      options: {
        penalty: Math.round((1 - worst.timingWindowMultiplier) * 100)
      }
    },
    {
      key: 'ui:pregig.effects.injuryMiss',
      options: {
        penalty: Math.round((worst.missPenaltyMultiplier - 1) * 100)
      }
    }
  ]
}

export const canResolveCrewRecoveryDebt = (
  career: CareerState,
  crewId: string
): boolean => Object.hasOwn(career.crewRecoveryDebtById, crewId)
export const resolveCrewRecoveryDebt = (
  career: CareerState,
  crewId: string,
  source: 'rehab' | 'served_unavailable_tour'
): CareerState => {
  if (
    !canResolveCrewRecoveryDebt(career, crewId) ||
    (source !== 'rehab' && source !== 'served_unavailable_tour')
  )
    return career
  const crewRecoveryDebtById = Object.assign(
    Object.create(null),
    career.crewRecoveryDebtById
  ) as CareerState['crewRecoveryDebtById']
  delete crewRecoveryDebtById[crewId]
  return { ...career, crewRecoveryDebtById }
}
