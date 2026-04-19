import type { ToastPayload } from '../../types/game'

type SuccessToastConfig = {
  fallbackId: string
  fallbackType?: string
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
  const type = typeof toastObj.type === 'string' ? toastObj.type : fallbackType
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

  const safeToast: ToastPayload = {
    id,
    type,
    options: { ...baseOptions, ...optionsPatch }
  }
  if (finalMessage.length > 0) safeToast.message = finalMessage
  if (messageKey.length > 0) safeToast.messageKey = messageKey
  return safeToast
}

export const sanitizeLoadedToast = (
  toast: unknown,
  allowedToastTypes: readonly string[]
): ToastPayload | null => {
  if (!toast || typeof toast !== 'object' || Array.isArray(toast)) return null
  const toastObj = toast as Record<string, unknown>
  const id = typeof toastObj.id === 'string' ? toastObj.id.trim() : ''
  const hasMessage = toastObj.message !== undefined
  const hasMessageKey = typeof toastObj.messageKey === 'string'
  if (!(id.length > 0 && (hasMessage || hasMessageKey))) return null

  const message = hasMessage ? String(toastObj.message).trim() : ''
  if (!(message.length > 0 || hasMessageKey)) return null

  const toastType = String(toastObj.type)
  const type = allowedToastTypes.includes(toastType) ? toastType : 'info'

  const safeToast: ToastPayload = {
    id,
    type
  }

  if (message.length > 0) {
    safeToast.message = message
  }

  if (typeof toastObj.messageKey === 'string') {
    safeToast.messageKey = toastObj.messageKey
  }

  if (
    typeof toastObj.options === 'object' &&
    toastObj.options !== null &&
    !Array.isArray(toastObj.options)
  ) {
    safeToast.options = toastObj.options as Record<string, unknown>
  }

  if (
    Number.isFinite(toastObj.timeout as number) &&
    (toastObj.timeout as number) >= 0
  ) {
    safeToast.timeout = toastObj.timeout as number
  }

  if (Number.isFinite(toastObj.createdAt as number)) {
    safeToast.createdAt = toastObj.createdAt as number
  }

  return safeToast
}
