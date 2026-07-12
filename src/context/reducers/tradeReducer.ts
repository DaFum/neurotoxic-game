import { finiteNumberOr } from '../../utils/finiteNumber';
import type { GameState, ToastPayload, TradeVoidItemPayload } from '../../types'
import { logger } from '../../utils/logger'
import {
  clampPlayerFame,
  calculateFameLevel,
  clampNonNegative,
  isForbiddenKey
} from '../../utils/gameState'
import {
  isLooseRecord,
  sanitizeTraversableValue,
  safeJsonParse
} from '../../utils/objectUtils'
import { addContrabandHelper } from './bandReducer'
import {
  buildDeterministicToastId,
  sanitizeSuccessToast
} from './toastSanitizers'

const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

const sanitizeContextValue = (value: unknown): unknown => {
  return sanitizeTraversableValue(value, {
    isRecord: isLooseRecord,
    createObject: () => Object.create(null),
    shouldSkipKey: isForbiddenKey,
    transformLeaf: leaf => {
      if (typeof leaf !== 'string') return leaf
      return leaf.replace(/[&<>"']/g, match => {
        const escapeKey = match as keyof typeof ESCAPE_MAP
        return ESCAPE_MAP[escapeKey]
      })
    }
  })
}

/**
 * Handles purchasing an item from the Void Trader using Fame.
 * Validates cost, clamps new fame state, and calls addContrabandHelper.
 *
 * @param state - Game state before the trade.
 * @param payload - Contraband id, fame cost, generated instance id, and optional
 * success toast.
 * @returns State with fame deducted and contraband added, or the original state
 * when validation fails.
 */
export const handleTradeVoidItem = (
  state: GameState,
  payload: TradeVoidItemPayload
): GameState => {
  if (!payload || typeof payload !== 'object') {
    logger.warn('GameState', 'Invalid payload for TRADE_VOID_ITEM')
    return state
  }

  const { fameCost, successToast } = payload
  const contrabandId =
    typeof payload.contrabandId === 'string' ? payload.contrabandId : ''
  const instanceId =
    typeof payload.instanceId === 'string' ? payload.instanceId : undefined

  const parsedCost = Number(fameCost)
  if (!Number.isFinite(parsedCost) || parsedCost < 0) {
    logger.warn('GameState', 'Invalid fameCost for void trade', fameCost)
    return state
  }
  const cost = clampNonNegative(parsedCost)
  const currentFame = finiteNumberOr(state.player.fame, 0)

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
    logger.warn(
      'GameState',
      'Failed to add void item to stash (max stacks or invalid item)'
    )
    const failureToast: ToastPayload = {
      id:
        instanceId ??
        buildDeterministicToastId('void-trade-toast', state.toasts),
      messageKey: 'ui:shop.messages.purchaseFailed',
      type: 'error'
    }
    return {
      ...state,
      toasts: [...(state.toasts || []), failureToast]
    }
  }

  if (successToast) {
    const actualDelta = currentFame - nextFame
    const successToastObj =
      typeof successToast === 'object' &&
      successToast !== null &&
      !Array.isArray(successToast)
        ? (successToast as Record<string, unknown>)
        : null
    if (!successToastObj) return nextState

    let enrichedToast: ToastPayload | null

    const toastId =
      instanceId ??
      buildDeterministicToastId('void-trade-toast', nextState.toasts)

    if (
      typeof successToastObj.messageKey === 'string' &&
      successToastObj.messageKey.length > 0
    ) {
      enrichedToast = sanitizeSuccessToast(successToast, {
        fallbackId: toastId,
        optionsPatch: { fame: actualDelta }
      })
    } else {
      let enrichedMessage = successToastObj.message
      try {
        if (
          typeof enrichedMessage === 'string' &&
          enrichedMessage.includes('|')
        ) {
          const firstPipeIdx = enrichedMessage.indexOf('|')
          const key = enrichedMessage.slice(0, firstPipeIdx)
          const jsonStr = enrichedMessage.slice(firstPipeIdx + 1)
          const parsedContext = safeJsonParse(jsonStr)
          if (isLooseRecord(parsedContext)) {
            const rawContext = parsedContext as Record<string, unknown>
            const finalSafeContext = sanitizeContextValue(rawContext) as Record<
              string,
              unknown
            >
            finalSafeContext.fame = actualDelta
            enrichedMessage = `${key}|${JSON.stringify(finalSafeContext)}`
          }
        }
      } catch (err) {
        logger.warn('GameState', 'Failed to enrich successToast message', err)
      }

      enrichedToast = sanitizeSuccessToast(successToast, {
        fallbackId: toastId,
        message: typeof enrichedMessage === 'string' ? enrichedMessage : '',
        optionsPatch: { fame: actualDelta }
      })
    }

    if (enrichedToast) {
      return {
        ...nextState,
        toasts: [...(nextState.toasts || []), enrichedToast]
      }
    }
    return nextState
  }

  return nextState
}
