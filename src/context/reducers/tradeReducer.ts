import type { GameState, ToastPayload } from '../../types/game'
import { logger } from '../../utils/logger'
import {
  clampPlayerFame,
  calculateFameLevel,
  isForbiddenKey
} from '../../utils/gameStateUtils'
import { addContrabandHelper } from './bandReducer'
import { getSafeUUID } from '../../utils/crypto'

const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

const sanitizeSuccessToast = (
  toast: unknown,
  {
    fallbackId,
    fallbackType = 'info',
    message,
    optionsPatch = {}
  }: {
    fallbackId: string
    fallbackType?: string
    message?: string
    optionsPatch?: Record<string, unknown>
  }
): ToastPayload | null => {
  if (!toast || typeof toast !== 'object' || Array.isArray(toast)) return null
  const toastObj = toast as Record<string, unknown>
  const id =
    typeof toastObj.id === 'string' && toastObj.id.trim().length > 0
      ? toastObj.id.trim()
      : fallbackId
  const type = typeof toastObj.type === 'string' ? toastObj.type : fallbackType
  const finalMessage = typeof message === 'string' ? message : undefined
  const messageKey =
    typeof toastObj.messageKey === 'string' ? toastObj.messageKey : ''
  if (!finalMessage && messageKey.length === 0) return null

  const baseOptions =
    typeof toastObj.options === 'object' &&
    toastObj.options !== null &&
    !Array.isArray(toastObj.options)
      ? (toastObj.options as Record<string, unknown>)
      : {}

  const safeToast: ToastPayload = {
    id,
    type,
    options: { ...baseOptions, ...optionsPatch }
  }
  if (finalMessage) safeToast.message = finalMessage
  if (messageKey.length > 0) safeToast.messageKey = messageKey
  return safeToast
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
    logger.warn(
      'GameState',
      'Failed to add void item to stash (max stacks or invalid item)'
    )
    const failureToast = {
      id: instanceId || getSafeUUID(),
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

    const toastId = instanceId || getSafeUUID()

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
            const rawContext = parsedContext

            const sanitizeContextValue = (value: unknown): unknown => {
              if (typeof value === 'string') {
                return value.replace(/[&<>"']/g, match => ESCAPE_MAP[match])
              }
              if (Array.isArray(value)) {
                return value.map(item => sanitizeContextValue(item))
              }
              if (value !== null && typeof value === 'object') {
                const out = Object.create(null)
                for (const prop in value) {
                  if (!Object.hasOwn(value, prop)) continue
                  if (isForbiddenKey(prop)) continue
                  out[prop] = sanitizeContextValue(value[prop])
                }
                return out
              }
              return value
            }

            const finalSafeContext = sanitizeContextValue(rawContext)
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
