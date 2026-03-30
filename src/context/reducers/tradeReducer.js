import { logger } from '../../utils/logger.js'
import { clampPlayerFame, calculateFameLevel } from '../../utils/gameStateUtils.js'
import { addContrabandHelper } from './bandReducer.js'

/**
 * Handles purchasing an item from the Void Trader using Fame.
 * Validates cost, clamps new fame state, and calls addContrabandHelper.
 * @param {Object} state - Current game state
 * @param {Object} payload - { contrabandId, fameCost, instanceId, successToast }
 * @returns {Object} Updated state
 */
export const handleTradeVoidItem = (state, payload) => {
  if (!payload || typeof payload !== 'object') {
    logger.warn('GameState', 'Invalid payload for TRADE_VOID_ITEM')
    return state
  }

  const { contrabandId, fameCost, instanceId, successToast } = payload

  const cost = Math.max(0, Number(fameCost) || 0)
  const currentFame = Number(state.player.fame) || 0

  if (currentFame < cost) {
    logger.warn('GameState', 'Insufficient fame for void trade')
    return state
  }

  const nextFame = clampPlayerFame(currentFame - cost)

  const tempState = {
    ...state,
    player: {
      ...state.player,
      fame: nextFame,
      fameLevel: calculateFameLevel(nextFame)
    }
  }

  // Use the verified helper to graft the item into the band's stash safely
  const nextState = addContrabandHelper(tempState, { contrabandId, instanceId })

  // addContrabandHelper returns unmodified state if item invalid or max stacks
  if (nextState === tempState) {
    logger.warn('GameState', 'Failed to add void item to stash (max stacks or invalid item)')
    return state
  }

  if (successToast) {
    const actualDelta = currentFame - nextFame
    let enrichedMessage = successToast.message

    try {
      if (typeof enrichedMessage === 'string' && enrichedMessage.includes('|')) {
        const [key, jsonStr] = enrichedMessage.split('|')
        const context = JSON.parse(jsonStr)
        context.fame = actualDelta
        enrichedMessage = `${key}|${JSON.stringify(context)}`
      }
    } catch (err) {
      logger.warn('GameState', 'Failed to enrich successToast message', err)
    }

    const enrichedToast = {
      ...successToast,
      message: enrichedMessage
    }
    return {
      ...nextState,
      toasts: [...(nextState.toasts || []), enrichedToast]
    }
  }

  return nextState
}
