import { logger } from '../logger'
import { isPlainRecord, sanitizeTraversableValue } from '../objectUtils'
import {
  GameError,
  ErrorCategory,
  ErrorSeverity,
  ErrorSeverityType,
  ErrorCategoryType
} from './types'

type ErrorInfoObject = {
  name: string
  message: string
  category: ErrorCategoryType
  severity: ErrorSeverityType
  context: Record<string, unknown>
  recoverable: boolean
  timestamp: number
  stack?: string
  source?: string
}

const errorLog: ErrorInfoObject[] = []
const MAX_ERROR_LOG_SIZE = 100

const VALID_SEVERITIES = new Set(Object.values(ErrorSeverity))

const SENSITIVE_CONTEXT_KEYS = new Set([
  'token',
  'password',
  'ssn',
  'email',
  'authorization',
  'cookie'
])

const SENSITIVE_KEY_PATTERNS = [
  'token',
  'secret',
  'key',
  'password',
  'ssn',
  'email',
  'auth',
  'authorization',
  'cookie'
]

const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const SENSITIVE_KEY_REGEXP = SENSITIVE_KEY_PATTERNS.some(Boolean)
  ? new RegExp(
      SENSITIVE_KEY_PATTERNS.reduce((acc, pattern) => {
        if (pattern) {
          const escaped = escapeRegExp(pattern)
          return acc ? acc + '|' + escaped : escaped
        }
        return acc
      }, '')
    )
  : null

const normalizeSeverity = (severity: unknown) => {
  if (typeof severity !== 'string') return null
  const normalized = severity.toLowerCase()
  return VALID_SEVERITIES.has(normalized as ErrorSeverityType)
    ? (normalized as ErrorSeverityType)
    : null
}

const isSensitiveContextKey = (key: string) => {
  if (SENSITIVE_CONTEXT_KEYS.has(key)) return true
  return SENSITIVE_KEY_REGEXP ? SENSITIVE_KEY_REGEXP.test(key) : false
}

const sanitizeContextValue = (
  value: unknown,
  visited: WeakSet<object>
): unknown =>
  sanitizeTraversableValue(
    value,
    {
      isRecord: isPlainRecord,
      createObject: () => ({}),
      transformRecordValue: (key, rawValue, sanitize) =>
        isSensitiveContextKey(key.toLowerCase())
          ? '[REDACTED]'
          : sanitize(rawValue)
    },
    visited
  )

const sanitizeContextPayload = (payload: unknown): Record<string, unknown> => {
  const visited = new WeakSet<object>()

  if (isPlainRecord(payload)) {
    return sanitizeContextValue(payload, visited) as Record<string, unknown>
  }

  if (payload instanceof Error) {
    return sanitizeContextValue(
      {
        name: payload.name,
        message: payload.message,
        stack: payload.stack
      },
      visited
    ) as Record<string, unknown>
  }

  if (payload !== null && typeof payload === 'object') {
    visited.add(payload)
    return sanitizeContextValue(
      Object.assign({}, payload) as Record<string, unknown>,
      visited
    ) as Record<string, unknown>
  }

  return {}
}

type NormalizedErrorOptions = {
  source: string | undefined
  errorInfo: Record<string, unknown> | null
  severity: ErrorSeverityType | null
}

const normalizeHandleErrorOptions = (
  options: unknown
): NormalizedErrorOptions => {
  const safeOptions = isPlainRecord(options) ? options : {}

  return {
    source:
      typeof safeOptions.source === 'string' ? safeOptions.source : undefined,
    errorInfo:
      typeof safeOptions.errorInfo === 'object' &&
      safeOptions.errorInfo !== null
        ? (safeOptions.errorInfo as Record<string, unknown>)
        : null,
    severity: normalizeSeverity(safeOptions.severity)
  }
}

const sanitizeErrorInfo = (errorInfo: ErrorInfoObject) => ({
  message: errorInfo.message || 'Critical error',
  code: errorInfo.category || ErrorCategory.UNKNOWN,
  timestamp: errorInfo.timestamp || Date.now()
})

const sanitizeTelemetryErrorInfo = (errorInfo: ErrorInfoObject) => ({
  message: 'Error captured',
  code: errorInfo.category || ErrorCategory.UNKNOWN,
  timestamp: errorInfo.timestamp || Date.now()
})

const buildErrorInfo = (
  error: unknown,
  normalizedOptions: NormalizedErrorOptions,
  fallbackMessage: string
): ErrorInfoObject => {
  let errorInfo: ErrorInfoObject

  if (error instanceof GameError) {
    errorInfo = error.toLogObject() as ErrorInfoObject
  } else {
    const errObj = error instanceof Error ? error : null
    errorInfo = {
      name: errObj?.name || 'Error',
      message:
        errObj?.message ||
        (typeof error === 'string' ? error : fallbackMessage),
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      context: {},
      recoverable: true,
      timestamp: Date.now(),
      stack: errObj?.stack
    }
  }

  if (normalizedOptions.source) {
    errorInfo.source = normalizedOptions.source
  }
  if (normalizedOptions.errorInfo) {
    errorInfo.context = {
      ...sanitizeContextPayload(errorInfo.context),
      ...sanitizeContextPayload(normalizedOptions.errorInfo)
    }
  } else {
    errorInfo.context = sanitizeContextPayload(errorInfo.context)
  }

  if (normalizedOptions.severity) {
    errorInfo.severity = normalizedOptions.severity
  }

  return errorInfo
}

const logErrorLocally = (errorInfo: ErrorInfoObject) => {
  errorLog.push(errorInfo)
  if (errorLog.length > MAX_ERROR_LOG_SIZE) {
    errorLog.shift()
  }

  switch (errorInfo.severity) {
    case ErrorSeverity.CRITICAL:
      logger.error('ErrorHandler', errorInfo.message, errorInfo)
      if (typeof window !== 'undefined') {
        const sanitizedErrorInfo = sanitizeErrorInfo(errorInfo)
        window.dispatchEvent(
          new CustomEvent('app:error:critical', { detail: sanitizedErrorInfo })
        )
      }
      break
    case ErrorSeverity.HIGH:
      logger.error('ErrorHandler', errorInfo.message, errorInfo)
      break
    case ErrorSeverity.MEDIUM:
      logger.warn('ErrorHandler', errorInfo.message, errorInfo)
      break
    case ErrorSeverity.LOW:
    default:
      logger.debug('ErrorHandler', errorInfo.message, errorInfo)
  }
}

const reportErrorRemote = (errorInfo: ErrorInfoObject) => {
  if (typeof window !== 'undefined' && window.navigator?.onLine) {
    try {
      fetch('/api/analytics/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizeTelemetryErrorInfo(errorInfo))
      }).catch(() => {
        // Silently fail if tracking is blocked or endpoint doesn't exist
      })
    } catch (_e) {
      // Ignore tracking errors
    }
  }

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      const payload = JSON.stringify({
        event: 'error',
        error: sanitizeTelemetryErrorInfo(errorInfo)
      })
      navigator.sendBeacon('/api/analytics/error', payload)
    } catch (_e) {
      // Ignore tracking failures to prevent recursive errors
    }
  }
}

const showErrorToast = (
  errorInfo: ErrorInfoObject,
  silent: boolean,
  addToast?: (message: string, type: string) => void
) => {
  if (!silent && addToast) {
    const toastType =
      errorInfo.severity === ErrorSeverity.CRITICAL ||
      errorInfo.severity === ErrorSeverity.HIGH
        ? 'error'
        : 'warning'

    addToast(errorInfo.message, toastType)
  }
}

export const handleError = (
  error: unknown,
  options: unknown = {}
): ErrorInfoObject => {
  const safeOptions = isPlainRecord(options) ? options : {}
  const addToast =
    typeof safeOptions.addToast === 'function'
      ? (safeOptions.addToast as (msg: string, type: string) => void)
      : undefined
  const silent =
    typeof safeOptions.silent === 'boolean' ? safeOptions.silent : false
  const fallbackMessage =
    typeof safeOptions.fallbackMessage === 'string'
      ? safeOptions.fallbackMessage
      : 'An error occurred'

  const normalizedOptions = normalizeHandleErrorOptions(safeOptions)
  const errorInfo = buildErrorInfo(error, normalizedOptions, fallbackMessage)

  logErrorLocally(errorInfo)
  reportErrorRemote(errorInfo)
  showErrorToast(errorInfo, silent, addToast)

  return errorInfo
}

export const initGlobalErrorHandling = () => {
  const INIT_SYMBOL = Symbol.for('neurotoxic:initGlobalErrorHandlingDone')
  if (typeof window === 'undefined') return
  const windowSymbolState = window as unknown as Record<symbol, unknown>
  if (windowSymbolState[INIT_SYMBOL] === true) return
  windowSymbolState[INIT_SYMBOL] = true
  window.addEventListener('unhandledrejection', event => {
    const reason = event.reason
    let errorToHandle
    if (reason instanceof Error) {
      errorToHandle = reason
    } else {
      let message
      if (typeof reason === 'string') {
        message = reason
      } else if (reason && typeof reason.message === 'string') {
        message = reason.message
      } else {
        try {
          message = String(reason)
        } catch {
          message = 'Unhandled Promise Rejection'
        }
      }
      errorToHandle = new Error(message)
    }
    handleError(errorToHandle, {
      source: 'unhandledrejection',
      severity: ErrorSeverity.HIGH,
      errorInfo: {
        originalReason: reason
      }
    })
  })
}

initGlobalErrorHandling()
