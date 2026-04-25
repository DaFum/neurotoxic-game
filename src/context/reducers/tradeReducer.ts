import type { GameState, ToastPayload } from '../../types/game'
import { logger } from '../../utils/logger'
import {
  clampPlayerFame,
  calculateFameLevel,
  isForbiddenKey
} from '../../utils/gameStateUtils'
import { addContrabandHelper } from './bandReducer'
import { getSafeUUID } from '../../utils/crypto'
import { sanitizeSuccessToast } from './toastSanitizers'

const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

const sanitizeContextValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return value.replace(/[&<>"']/g, match => {
      const escapeKey = match as keyof typeof ESCAPE_MAP
      return ESCAPE_MAP[escapeKey]
    })
  }
  if (Array.isArray(value)) {
    return value.map(item => sanitizeContextValue(item))
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = Object.create(null)
    for (const [prop, val] of Object.entries(value as Record<string, unknown>)) {
      if (isForbiddenKey(prop)) continue
      out[prop] = sanitizeContextValue(val)
    }
    return out
  }
  return value
}

/**
 * Handles purchasing an item from the Void Trader using Fame.
 * Validates cost, clamps new fame state, and calls addContrabandHelper.
 * @param {Object} state - Current game state
 * @param {Object} payload - { contrabandId, fameCost, instanceId, successToast }
 * @returns {Object} Updated state
 */
export const handleTradeVoidItem = (
  state: GameState,
  payload: Record<string, unknown>
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
    logger.warn(
      'GameState',
      'Failed to add void item to stash (max stacks or invalid item)'
    )
    const failureToast: ToastPayload = {
      id: instanceId ?? getSafeUUID(),
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

    let enrichedToast: ToastPayload | null = null

    const toastId = instanceId ?? getSafeUUID()

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
          const parsedContext = JSON.parse(jsonStr)
          const isPlainObject =
            parsedContext !== null &&
            typeof parsedContext === 'object' &&
            !Array.isArray(parsedContext) &&
            (Object.getPrototypeOf(parsedContext) === Object.prototype ||
              Object.getPrototypeOf(parsedContext) === null)

          if (isPlainObject) {
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
