import { eventEngine } from './eventEngine.js'

/**
 * Resolves an event choice into result and state delta payloads.
 *
 * @param {object} choice - Event choice selected by the player.
 * @param {object} gameState - Snapshot of the current game state.
 * @returns {{ result: object | null, delta: object | null, outcomeText: string, description: string }} Resolution payload.
 */
export const resolveEventChoice = (choice, gameState) => {
  if (!choice) {
    return { result: null, delta: null, outcomeText: '', description: '' }
  }

  const result = eventEngine.resolveChoice(choice, gameState)
  const delta = eventEngine.applyResult(result)

  return {
    result,
    delta,
    outcomeText: choice.outcomeText ?? '',
    description: result?.description ?? ''
  }
}
