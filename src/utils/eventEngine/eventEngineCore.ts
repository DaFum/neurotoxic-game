import type { EventDelta, GameEvent, GameState } from '../../types'
import { EVENTS_DB } from '../../data/events/index'
import { EVENT_STRINGS } from '../../data/events/constants'
import { secureRandom } from '../crypto'
import { bandHasTrait } from '../traitUtils'
import { finiteNumberOr } from '../gameState'
import { StateError } from '../errorHandler'
import { selectEvent } from './eventSelection'
import { processEffect } from './eventEffectHandlers'
import { asNumber, logEventError, processEvent } from './helpers'
import type {
  EffectShape,
  EngineEvent,
  EngineGameState,
  EventChoice,
  TemplateContext,
  TriggerPoint
} from './types'

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
  const hasBandleader = isConflict && bandHasTrait(gameState.band, 'bandleader')

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
 * Event engine facade for selecting, resolving, and applying game events.
 */
export const eventEngine = {
  handleError: logEventError,
  processEvent,

  /**
   * Checks for and selects a random event from a specific category.
   * @param category - The category of events to check (e.g., 'travel', 'gig').
   * @param gameState - The current game state.
   * @param triggerPoint - Optional specific trigger point filter. Defaults to `null`.
   * @param rng - Random number generator. Defaults to `secureRandom`.
   * @returns The selected event object or null if none found.
   */
  checkEvent: (
    category: string,
    gameState: GameState,
    triggerPoint: TriggerPoint = null,
    rng: () => number = secureRandom
  ): GameEvent | null => {
    const pool = EVENTS_DB[category as keyof typeof EVENTS_DB] as
      | EngineEvent[]
      | undefined
    if (!pool) return null
    return selectEvent(
      pool,
      gameState as unknown as EngineGameState,
      triggerPoint,
      rng
    ) as GameEvent | null
  },

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
  resolveChoice: (
    choice: EventChoice,
    gameState: EngineGameState,
    rng: () => number = secureRandom
  ) => {
    let result: EffectShape

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
        if (result.type === 'composite') {
          // DEEP CLONE: Break array reference to prevent mutating global EVENTS_DB
          result = { ...result, effects: [...(result.effects ?? [])] }
        } else {
          // Convert simple result to composite to add stat tracking
          const originalEffect = { ...result }
          delete originalEffect.outcome
          delete originalEffect.description
          result = {
            type: 'composite',
            effects: [originalEffect],
            outcome: 'success',
            description: result.description
          }
        }

        // Add the stat increment safely (array is now a fresh copy)
        const effects = result.effects ?? []
        result.effects = effects
        effects.push({
          type: 'stat_increment',
          stat: 'conflictsResolved',
          value: 1
        })
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
      if (result.type === 'composite') {
        result = { ...result, effects: [...(result.effects ?? [])] }
      } else {
        const originalEffect = { ...result }
        delete originalEffect.outcome
        delete originalEffect.description
        result = {
          type: 'composite',
          effects: [originalEffect],
          outcome: result.outcome,
          description: result.description
        }
      }
      const effects = result.effects ?? []
      result.effects = effects
      effects.push({
        type: 'stat_increment',
        stat: 'stageDives',
        value: 1
      })
    }

    if (!result.nextEventId && choice.nextEventId) {
      result.nextEventId = choice.nextEventId
    }

    return result
  },

  /**
   * Adds context-sensitive options to an event before it is displayed.
   *
   * @param event - Event definition selected for the current context.
   * @param gameState - The current game state.
   * @returns Event with processed options, or null when the input event is null.
   */
  processOptions: (
    event: GameEvent,
    gameState: GameState
  ): GameEvent | null => {
    if (!event || !event.options) return event

    const processedEvent = { ...event, options: [...event.options] }

    if (
      event.id === 'van_breakdown_tire' &&
      (asNumber(gameState.band?.inventory?.spare_tire) > 0 ||
        gameState.band?.inventory?.spare_tire === true)
    ) {
      const spareTireOption = {
        label: 'events:van_breakdown_tire.opt3.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'item', item: 'spare_tire', value: -1 }, // Consume
            {
              type: 'stat',
              stat: 'time',
              value: -0.5,
              description: 'Quick fix.'
            }
          ]
        },
        outcomeText: 'events:van_breakdown_tire.opt3.outcome'
      }
      processedEvent.options.unshift(spareTireOption)
    }

    return processedEvent as GameEvent
  },

  /**
   * Converts a resolution result into a state delta object for the reducer.
   * @param result - The result object from resolveChoice.
   * @param context - Context variables from the event (e.g. member names).
   * @returns A delta object representing state changes, or null.
   */
  applyResult: (
    result: EffectShape | null,
    context: TemplateContext = {},
    gameState: EngineGameState | null = null
  ) => {
    if (!result) return null

    const delta: EventDelta = { player: {}, band: {}, social: {}, flags: {} }

    if (result.type === 'composite') {
      // ⚡ Optimization: Standard for loop instead of .forEach to avoid callback allocation
      const effects = result.effects ?? []
      for (let i = 0, len = effects.length; i < len; i++) {
        const eff = effects[i]
        if (eff) processEffect(eff, delta, context, gameState)
      }
    } else {
      processEffect(result, delta, context, gameState)
    }

    if (result.nextEventId) {
      delta.flags.queueEvent = result.nextEventId
    }

    return delta
  },

  selectEvent: selectEvent,
  filterEvents(
    pool: EngineEvent[],
    trigger: string | null,
    state: EngineGameState
  ) {
    const result: EngineEvent[] = []
    for (let i = 0, len = pool.length; i < len; i++) {
      const e = pool[i]
      if (!e) continue
      // Match exact trigger OR 'random' events (eligible at any trigger point)
      if (trigger && e.trigger !== trigger && e.trigger !== 'random') {
        continue
      }
      if (!e.condition) {
        result.push(e)
        continue
      }
      try {
        if (e.condition(state)) {
          result.push(e)
        }
      } catch (err) {
        this.handleError(err, e.id)
      }
    }
    return result
  }
}
