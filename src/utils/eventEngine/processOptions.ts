import type { GameEvent, GameState } from '../../types'
import { asNumber } from './helpers'

/**
 * Adds context-sensitive options to an event before it is displayed.
 *
 * @param event - Event definition selected for the current context.
 * @param gameState - The current game state.
 * @returns Event with processed options, or null when the input event is null.
 */
export const processOptions = (
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
}
