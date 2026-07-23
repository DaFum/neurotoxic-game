import { EVENT_STRINGS } from '../../data/events/constants'
import { secureRandom } from '../crypto'
import { bandHasTrait } from '../traitUtils'
import { finiteNumberOr } from '../gameState'
import { StateError } from '../errorHandler'
import { asNumber } from './helpers'
import type { EffectShape, EngineGameState, EventChoice } from './types'

/**
 * Computes the effective skill value for a skill check.
 *
 * Priority order matters:
 * - 'luck' is always a pure roll (the band has a static `luck` property that would otherwise shadow it).
 * - Top-level numeric band stats (e.g. `harmony`) divide by 10 to fit the 0-10 check scale.
 * - Otherwise, take the best member value, preferring nested `baseStats` (1-10) over top-level
 *   dynamic stats (0-100) so dynamic `stamina: 100` doesn't trivialize checks against base `stamina: 7`.
 */
const computeSkillCheckValue = (
  stat: string,
  gameState: EngineGameState,
  rng: () => number
): number => {
  if (stat === 'luck') return rng() * 10
  if (!gameState.band) return 0

  const bandStat = gameState.band[stat]
  if (typeof bandStat === 'number') return finiteNumberOr(bandStat, 0) / 10

  const members = Array.isArray(gameState.band.members)
    ? gameState.band.members
    : []
  if (members.length === 0) return 0

  let best = -Infinity
  for (let i = 0; i < members.length; i++) {
    const m = members[i]
    if (!m) {
      throw new StateError(
        `Sparse members invariant violated in band.members at index ${i}`
      )
    }
    const val = m.baseStats?.[stat] !== undefined ? m.baseStats[stat] : m[stat]
    const currentVal = asNumber(val)
    if (currentVal > best) best = currentVal
  }
  return best
}

/**
 * Resolves a failed skill check, applying the Bandleader trait save (50% chance
 * to convert conflict-event failures into successes with appended saved-text).
 */
const resolveSkillCheckFailure = (
  success: EffectShape,
  failure: EffectShape,
  gameState: EngineGameState,
  rng: () => number
): EffectShape => {
  // Pre-consume RNG for determinism regardless of trait presence
  const bandleaderRoll = rng()
  const isConflict = gameState.activeEvent?.tags?.includes('conflict') ?? false
  const hasBandleader =
    isConflict && gameState.band && bandHasTrait(gameState.band, 'bandleader')

  if (hasBandleader && bandleaderRoll < 0.5) {
    return {
      ...success,
      outcome: 'success',
      description:
        (success?.description || '') + EVENT_STRINGS.SAVED_BY_BANDLEADER
    }
  }
  return { ...failure, outcome: 'failure' }
}

/**
 * Resolves an event choice into immediate effects and follow-up outcomes.
 *
 * @remarks
 * Skill checks use the supplied RNG for deterministic tests and special-case
 * luck before falling through to band stat lookup.
 *
 * @param choice - The choice object selected by the player.
 * @param gameState - The current game state.
 * @param rng - Random number generator. Defaults to `secureRandom`.
 * @returns Effect payload, including any skill-check outcome or next-event id.
 */
/**
 * Ensures the result is a composite effect and appends a new effect to it safely,
 * without mutating the global events DB.
 */
const appendEffectToResult = (
  result: EffectShape,
  effectToAppend: EffectShape
): EffectShape => {
  if (result.type === 'composite') {
    return { ...result, effects: [...(result.effects ?? []), effectToAppend] }
  }

  const { outcome, description, ...originalEffect } = result

  return {
    type: 'composite',
    effects: [originalEffect, effectToAppend],
    outcome,
    description
  }
}

export const resolveChoice = (
  choice: EventChoice,
  gameState: EngineGameState,
  rng: () => number = secureRandom
) => {
  let result: EffectShape
  const appendStatIncrement = (res: EffectShape, stat: string, value: number) =>
    appendEffectToResult(res, { type: 'stat_increment', stat, value })

  if (choice.skillCheck) {
    const { stat, threshold, success, failure } = choice.skillCheck

    const skillValue = computeSkillCheckValue(stat, gameState, rng)
    const roll = rng() * 10
    const total = skillValue + (roll > 8 ? 2 : 0) // Crit chance

    if (total >= threshold) {
      result = { ...success, outcome: 'success' }
    } else {
      result = resolveSkillCheckFailure(success, failure, gameState, rng)
    }

    // Track conflict resolution for unlocking 'bandleader'
    if (
      result.outcome === 'success' &&
      gameState.activeEvent?.tags?.includes('conflict')
    ) {
      result = appendStatIncrement(result, 'conflictsResolved', 1)
    }
  } else {
    result = { ...(choice.effect ?? {}), outcome: 'direct' }
  }

  // Track Stage Dive attempts for unlocking 'showman'
  // Moved outside of skillCheck block because this choice is direct
  if (
    gameState.activeEvent?.id === 'gig_mid_stage_diver' &&
    choice.flags?.includes('stageDive')
  ) {
    result = appendStatIncrement(result, 'stageDives', 1)
  }

  if (!result.nextEventId && choice.nextEventId) {
    result.nextEventId = choice.nextEventId
  }

  return result
}
