import type { ToastPayload } from '../../types'
import { isEmptyObject } from '../../utils/gameState'
import { copySafePrimitiveEntries } from '../../utils/objectUtils'

/**
 * Toast types accepted from runtime and persisted toast payloads.
 */
export const ALLOWED_TOAST_TYPES = [
  'success',
  'error',
  'warning',
  'info'
] as const satisfies readonly ToastPayload['type'][]

type SuccessToastConfig = {
  fallbackId: string
  fallbackType?: ToastPayload['type']
  message?: string
  optionsPatch?: Record<string, unknown>
}

/**
 * Builds a deterministic toast id that cannot collide with ids already in the
 * toast list. Reducers must not call RNG/UUID helpers (purity), but a plain
 * length-based id could be reissued after earlier toasts were dismissed.
 *
 * @param prefix - Stable, caller-specific id prefix.
 * @param toasts - Current toast list to avoid collisions with.
 * @returns `${prefix}-${n}` with the smallest free n, starting at toasts.length.
 */
export const buildDeterministicToastId = (
  prefix: string,
  toasts: readonly ToastPayload[] | undefined
): string => {
  // ⚡ BOLT OPTIMIZATION: Replaced .map() inside Set constructor with procedural loop.
  // Why: Avoids intermediate array allocation from .map().
  const existing = new Set<string>()
  const safeToasts = toasts || []
  for (let idx = 0; idx < safeToasts.length; idx++) {
    const toast = safeToasts[idx]
    if (toast?.id) {
      existing.add(toast.id)
    }
  }
  let i = safeToasts.length
  let id = `${prefix}-${i}`
  while (existing.has(id)) {
    i += 1
    id = `${prefix}-${i}`
  }
  return id
}

const sanitizePrimitiveOptions = (
  options: Record<string, unknown>
): Record<string, unknown> => copySafePrimitiveEntries(options)

/**
 * Sanitizes an optional success-toast payload while applying safe fallbacks.
 *
 * @param toast - Raw toast payload.
 * @returns Sanitized toast payload, or null when no message or key remains.
 */
export const sanitizeSuccessToast = (
  toast: unknown,
  {
    fallbackId,
    fallbackType = 'info',
    message,
    optionsPatch = {}
  }: SuccessToastConfig
): ToastPayload | null => {
  if (!toast || typeof toast !== 'object' || Array.isArray(toast)) return null
  const toastObj = toast as Record<string, unknown>
  const id =
    typeof toastObj.id === 'string' && toastObj.id.trim().length > 0
      ? toastObj.id.trim()
      : fallbackId
  const rawType = typeof toastObj.type === 'string' ? toastObj.type : ''
  const type = (ALLOWED_TOAST_TYPES as readonly string[]).includes(rawType)
    ? (rawType as ToastPayload['type'])
    : fallbackType
  const messageFromToast =
    typeof toastObj.message === 'string' ? toastObj.message.trim() : ''
  const finalMessage =
    typeof message === 'string' ? message.trim() : messageFromToast
  const messageKey =
    typeof toastObj.messageKey === 'string' ? toastObj.messageKey : ''
  if (finalMessage.length === 0 && messageKey.length === 0) return null

  const baseOptions =
    typeof toastObj.options === 'object' &&
    toastObj.options !== null &&
    !Array.isArray(toastObj.options)
      ? (toastObj.options as Record<string, unknown>)
      : {}

  // Whitelist primitive-only values to match sanitizeLoadedToast pattern
  const safePrimitives = sanitizePrimitiveOptions(baseOptions)
  const safeOptionsPatch = sanitizePrimitiveOptions(optionsPatch)

  const safeToast: ToastPayload = {
    id,
    type
  }
  const safeOptions = { ...safePrimitives, ...safeOptionsPatch }
  if (!isEmptyObject(safeOptions)) {
    safeToast.options = safeOptions
  }
  if (finalMessage.length > 0) safeToast.message = finalMessage
  if (messageKey.length > 0) safeToast.messageKey = messageKey
  return safeToast
}

/**
 * Sanitizes a toast loaded from persisted state.
 *
 * @param toast - Raw persisted toast payload.
 * @param allowedToastTypes - Toast type allow-list.
 * @returns Sanitized toast payload, or null when required fields are invalid.
 */
export const sanitizeLoadedToast = (
  toast: unknown,
  allowedToastTypes: readonly ToastPayload['type'][] = ALLOWED_TOAST_TYPES
): ToastPayload | null => {
  if (!toast || typeof toast !== 'object' || Array.isArray(toast)) return null
  const toastObj = toast as Record<string, unknown>
  const id = typeof toastObj.id === 'string' ? toastObj.id.trim() : ''
  const hasMessage = typeof toastObj.message === 'string'
  const hasMessageKey =
    typeof toastObj.messageKey === 'string' &&
    toastObj.messageKey.trim().length > 0
  if (!(id.length > 0 && (hasMessage || hasMessageKey))) return null

  const message = hasMessage ? (toastObj.message as string).trim() : ''
  if (!(message.length > 0 || hasMessageKey)) return null

  const toastType = String(toastObj.type)
  const type = allowedToastTypes.includes(toastType as ToastPayload['type'])
    ? (toastType as ToastPayload['type'])
    : 'info'

  const safeToast: ToastPayload = {
    id,
    type
  }

  if (message.length > 0) {
    safeToast.message = message
  }

  if (hasMessageKey) {
    safeToast.messageKey = (toastObj.messageKey as string).trim()
  }

  if (
    typeof toastObj.options === 'object' &&
    toastObj.options !== null &&
    !Array.isArray(toastObj.options)
  ) {
    const opts = toastObj.options as Record<string, unknown>
    const safePrimitives = sanitizePrimitiveOptions(opts)
    if (!isEmptyObject(safePrimitives)) {
      safeToast.options = safePrimitives
    }
  }

  if (
    typeof toastObj.timeout === 'number' &&
    Number.isFinite(toastObj.timeout) &&
    toastObj.timeout >= 0
  ) {
    safeToast.timeout = toastObj.timeout
  }

  if (
    typeof toastObj.createdAt === 'number' &&
    Number.isFinite(toastObj.createdAt)
  ) {
    safeToast.createdAt = toastObj.createdAt
  }

  return safeToast
}
