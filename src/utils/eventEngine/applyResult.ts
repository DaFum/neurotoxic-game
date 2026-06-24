import type { EventDelta } from '../../types'
import { processEffect } from './eventEffectHandlers'
import type { EffectShape, EngineGameState, TemplateContext } from './types'

/**
 * Converts a resolution result into a state delta object for the reducer.
 * @param result - The result object from resolveChoice.
 * @param context - Context variables from the event (e.g. member names).
 * @param gameState - Current game state context.
 * @returns A delta object representing state changes, or null.
 */
export const applyResult = (
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
}
