/**
 * Centralized Error Handling System
 * Provides custom error types, error logging, and error recovery utilities.
 * Note: The recursive context sanitizer redacts sensitive keys, blocks
 * prototype-pollution keys such as __proto__/constructor/prototype, and
 * safely handles cyclic structures via WeakSet.
 * Module: `errorHandler`.
 */

import { logger } from './logger'
import { isPlainRecord, sanitizeTraversableValue } from './objectUtils'

// Public API: shared error taxonomy and base classes for scene/util integration and future extension.
/**
 * Error severity levels
 * @readonly
 * Enum: `string`
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const

/**
 * Error categories for classification
 * @readonly
 * Enum: `string`
 */
export const ErrorCategory = {
  STATE: 'state',
  RENDER: 'render',
  AUDIO: 'audio',
  NETWORK: 'network',
  STORAGE: 'storage',
  INPUT: 'input',
  GAME_LOGIC: 'game_logic',
  UNKNOWN: 'unknown'
} as const

/**
 * Base Game Error class
 * Extends `Error`.
 */

export type ErrorSeverityType =
  (typeof ErrorSeverity)[keyof typeof ErrorSeverity]

/**
 * Error category union derived from `ErrorCategory`.
 */
export type ErrorCategoryType =
  (typeof ErrorCategory)[keyof typeof ErrorCategory]

/**
 * Base application error carrying severity, category, context, and recovery metadata.
 */
export class GameError extends Error {
  public category: ErrorCategoryType
  public severity: ErrorSeverityType
  public context: Record<string, unknown>
  public recoverable: boolean
  public timestamp: number
  public source?: GameError | Error

  constructor(
    message: string,
    {
      category = ErrorCategory.UNKNOWN as ErrorCategoryType,
      severity = ErrorSeverity.MEDIUM as ErrorSeverityType,
      context = {},
      recoverable = true
    }: {
      category?: ErrorCategoryType
      severity?: ErrorSeverityType
      context?: Record<string, unknown>
      recoverable?: boolean
    } = {}
  ) {
    super(message)
    this.name = 'GameError'
    this.category = category
    this.severity = severity
    this.context = sanitizeContextValue(context, new WeakSet()) as Record<
      string,
      unknown
    >
    this.recoverable = recoverable
    this.timestamp = Date.now()
  }

  static State(message: string, context: Record<string, unknown> = {}) {
    return new StateError(message, context)
  }

  static Audio(message: string, context: Record<string, unknown> = {}) {
    return new AudioError(message, context)
  }
  toLogObject() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      context: this.context,
      recoverable: this.recoverable,
      timestamp: this.timestamp,
      stack: this.stack
    }
  }
}

/**
 * Error type for invalid or inconsistent game state.
 */
export class StateError extends GameError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, {
      category: ErrorCategory.STATE,
      severity: ErrorSeverity.HIGH,
      context,
      recoverable: true
    })
    this.name = 'StateError'
  }
}

/**
 * Error type for localStorage and persistence failures.
 */
export class StorageError extends GameError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, {
      category: ErrorCategory.STORAGE,
      severity: ErrorSeverity.MEDIUM,
      context,
      recoverable: true
    })
    this.name = 'StorageError'
  }
}

/**
 * Error type for audio system failures.
 */
export class AudioError extends GameError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, {
      category: ErrorCategory.AUDIO,
      severity: ErrorSeverity.MEDIUM,
      context,
      recoverable: true
    })
    this.name = 'AudioError'
  }
}

/**
 * Error log storage for debugging
 * Type: `Array<Object>`.
 */
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
      // Prototype-pollution keys are already stripped by sanitizeTraversableValue
      // via the canonical FORBIDDEN_KEYS set, so no shouldSkipKey is needed here.
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

const sanitizeErrorInfo = (errorInfo: ErrorInfoObject) => ({
  // Allowed fields for globally dispatched critical error events:
  // - message: user-safe error summary
  // - code: optional machine-readable code/category
  // - timestamp: event time for correlation
  message: errorInfo.message || 'Critical error',
  code: errorInfo.category || ErrorCategory.UNKNOWN,
  timestamp: errorInfo.timestamp || Date.now()
})

const sanitizeTelemetryErrorInfo = (errorInfo: ErrorInfoObject) => ({
  // Telemetry intentionally excludes raw error messages to avoid leaking
  // sensitive/user-controlled values.
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

  // Merge external context/source if provided
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
  // Log to error log
  errorLog.push(errorInfo)
  if (errorLog.length > MAX_ERROR_LOG_SIZE) {
    errorLog.shift()
  }

  // Log to console/logger based on severity
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
  // Remote tracking stub
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

  // Remote Tracking (Fire and forget via beacon)
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      const payload = JSON.stringify({
        event: 'error',
        error: sanitizeTelemetryErrorInfo(errorInfo)
      })
      // Intentionally hardcoded analytics endpoint stub per requirements
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
  // Toast taxonomy mapping: high-severity failures => `error`, recoverable/medium issues => `warning`.
  // UI supports: success | error | info | warning.
  if (!silent && addToast) {
    const toastType =
      errorInfo.severity === ErrorSeverity.CRITICAL ||
      errorInfo.severity === ErrorSeverity.HIGH
        ? 'error'
        : 'warning'

    addToast(errorInfo.message, toastType)
  }
}

/**
 * Handles an error by logging and optionally showing user feedback
 * @param error - The error to handle
 * @param options - Optional. Handler options
 * - `options.addToast` - Optional. Toast notification function
 * - `options.silent` - Optional. Whether to suppress user notifications
 * - `options.fallbackMessage` - Optional. Fallback message for unknown errors
 * @returns Processed error info
 */
export const handleError = (error: unknown, options: unknown = {}) => {
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

/**
 * Initializes global error listeners. Idempotent — safe to call multiple times.
 */
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

// Auto-init on load
initGlobalErrorHandling()

/**
 * Creates a safe wrapper for localStorage operations
 * @param operation - Operation name for logging
 * @param fn - Function to execute
 * @param fallbackValue - Optional. Value to return on error
 * @returns Result or fallback value
 */
export function runSafeStorageOperation<T>(operation: string, fn: () => T): T
export function runSafeStorageOperation<T>(
  operation: string,
  fn: () => T,
  fallbackValue: T
): T
export function runSafeStorageOperation<T>(
  operation: string,
  fn: () => T,
  fallbackValue: null
): T | null
export function runSafeStorageOperation<T>(
  operation: string,
  fn: () => T,
  fallbackValue: undefined
): T | undefined
export function runSafeStorageOperation<T>(
  operation: string,
  fn: () => T,
  ...fallbackValue: [] | [T | null | undefined]
): T | null | undefined {
  let retries = 2
  let lastError: unknown = null
  const hasFallback = fallbackValue.length > 0

  while (retries >= 0) {
    try {
      return fn()
    } catch (error) {
      lastError = error
      retries--
    }
  }

  const storageError = new StorageError(
    `Storage operation failed after retries: ${operation}`,
    {
      originalError:
        lastError instanceof Error ? lastError.message : String(lastError)
    }
  )

  // Behave deterministically:
  // - If a fallbackValue was explicitly supplied (even null/undefined), return it.
  // - If no fallback argument was provided, surface the StorageError to callers.

  if (!hasFallback) {
    // No safe fallback was provided by the caller — surface the error without logging it twice
    throw storageError
  }

  // Only log if we are gracefully degrading to a fallback
  handleError(storageError, { silent: true })
  return fallbackValue[0]
}
