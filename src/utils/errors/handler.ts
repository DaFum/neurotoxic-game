import { logger } from '../logger'
import { isPlainRecord } from '../objectUtils'
import {
  GameError,
  ErrorCategory,
  ErrorSeverity,
  ErrorSeverityType,
  ErrorCategoryType,
  sanitizeContextPayload,
  normalizeSeverity
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
      }).catch(reason => {
        // Non-recursive debug log only: this runs inside the error handler, so
        // escalating (warn/error) could re-enter reportErrorRemote. Debug is a
        // no-op in production but surfaces telemetry outages during debugging.
        logger.debug('ErrorHandler', 'Remote error report failed', reason)
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

export const toastTypeFromSeverity = (severity: ErrorSeverityType): string => {
  return severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH
    ? 'error'
    : 'warning'
}

const showErrorToast = (
  errorInfo: ErrorInfoObject,
  silent: boolean,
  addToast?: (message: string, type: string) => void
) => {
  if (!silent && addToast) {
    const toastType = toastTypeFromSeverity(errorInfo.severity)
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
    let errorToHandle: unknown
    if (reason instanceof Error) {
      errorToHandle = reason
    } else {
      let message: string | undefined
      if (typeof reason === 'string') {
        message = reason
      } else if (typeof reason === 'object' && reason !== null) {
        if (Object.hasOwn(reason, 'message')) {
          try {
            const val = (reason as Record<string, unknown>)['message']
            if (typeof val === 'string') {
              message = val
            }
          } catch {
            // Ignore throwing getter
          }
        }
      }

      if (message === undefined) {
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
