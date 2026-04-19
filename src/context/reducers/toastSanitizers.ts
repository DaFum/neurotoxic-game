import type { ToastPayload } from '../../types/game'

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
  const safePrimitives: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(baseOptions)) {
    const valueType = typeof value
    if (
      valueType === 'string' ||
      valueType === 'number' ||
      valueType === 'boolean' ||
      value === null
    ) {
      safePrimitives[key] = value
    }
  }

  const safeToast: ToastPayload = {
    id,
    type,
    options: { ...safePrimitives, ...optionsPatch }
  }
  if (finalMessage.length > 0) safeToast.message = finalMessage
  if (messageKey.length > 0) safeToast.messageKey = messageKey
  return safeToast
}

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
    const safePrimitives: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(opts)) {
      const valueType = typeof value
      if (
        valueType === 'string' ||
        valueType === 'number' ||
        valueType === 'boolean' ||
        value === null
      ) {
        safePrimitives[key] = value
      }
    }
    if (Object.keys(safePrimitives).length > 0) {
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
