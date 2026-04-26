/**
 * Centralized Error Handling System
 * Provides custom error types, error logging, and error recovery utilities.
 * Note: The recursive context sanitizer redacts sensitive keys, blocks
 * prototype-pollution keys such as __proto__/constructor/prototype, and
 * safely handles cyclic structures via WeakSet.
 * @module errorHandler
 */

import { logger } from './logger'

// Public API: shared error taxonomy and base classes for scene/util integration and future extension.
/**
 * Error severity levels
 * @readonly
 * @enum {string}
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
 * @enum {string}
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
 * @extends Error
 */

export type ErrorSeverityType =
  (typeof ErrorSeverity)[keyof typeof ErrorSeverity]
export type ErrorCategoryType =
  (typeof ErrorCategory)[keyof typeof ErrorCategory]

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

  static Render(message: string, context: Record<string, unknown> = {}) {
    return new RenderError(message, context)
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

export class RenderError extends GameError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, {
      category: ErrorCategory.RENDER,
      severity: ErrorSeverity.HIGH,
      context,
      recoverable: true
    })
    this.name = 'RenderError'
  }
}

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
 * @type {Array<Object>}
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

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

const normalizeSeverity = (severity: unknown) => {
  if (typeof severity !== 'string') return null
  const normalized = severity.toLowerCase()
  return VALID_SEVERITIES.has(normalized as ErrorSeverityType)
    ? (normalized as ErrorSeverityType)
    : null
}

const isSensitiveContextKey = (key: string) => {
  if (SENSITIVE_CONTEXT_KEYS.has(key)) return true
  for (let i = 0; i < SENSITIVE_KEY_PATTERNS.length; i++) {
    const pattern = SENSITIVE_KEY_PATTERNS[i]
    if (pattern && key.includes(pattern)) return true
  }
  return false
}

const sanitizeContextValue = (
  value: unknown,
  visited: WeakSet<object>
): unknown => {
  if (Array.isArray(value)) {
    if (visited.has(value)) return '[REDACTED]'
    visited.add(value)
    const len = value.length
    const result: unknown[] = new Array(len)
    for (let i = 0; i < len; i++) {
      result[i] = sanitizeContextValue(value[i], visited)
    }
    return result
  }

  if (isPlainObject(value)) {
    return sanitizeContextObject(value, visited)
  }

  return value
}

const sanitizeContextObject = (
  context: Record<string, unknown>,
  visited: WeakSet<object>
): Record<string, unknown> | '[REDACTED]' => {
  if (visited.has(context)) {
    return '[REDACTED]'
  }

  visited.add(context)
  const sanitized: Record<string, unknown> = {}

  for (const key in context) {
    if (
      !Object.hasOwn(context, key) ||
      key === '__proto__' ||
      key === 'constructor' ||
      key === 'prototype'
    )
      continue
    const value = context[key]
    const normalizedKey = key.toLowerCase()
    if (isSensitiveContextKey(normalizedKey)) {
      sanitized[key] = '[REDACTED]'
      continue
    }

    sanitized[key] = sanitizeContextValue(value, visited)
  }

  return sanitized
}

const sanitizeContextPayload = (payload: unknown): Record<string, unknown> => {
  const visited = new WeakSet<object>()

  if (isPlainObject(payload)) {
    return sanitizeContextObject(payload, visited) as Record<string, unknown>
  }

  if (payload instanceof Error) {
    return sanitizeContextObject(
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
    return sanitizeContextObject(
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
  const safeOptions = isPlainObject(options) ? options : {}

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
 * @param {Error} error - The error to handle
 * @param {Object} [options] - Handler options
 * @param {Function} [options.addToast] - Toast notification function
 * @param {boolean} [options.silent] - Whether to suppress user notifications
 * @param {string} [options.fallbackMessage] - Fallback message for unknown errors
 * @returns {Object} Processed error info
 */
export const handleError = (error: unknown, options: unknown = {}) => {
  const safeOptions = isPlainObject(options) ? options : {}
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
 * @param {string} operation - Operation name for logging
 * @param {Function} fn - Function to execute
 * @param {*} [fallbackValue] - Value to return on error
 * @returns {*} Result or fallback value
 */
export const safeStorageOperation = <T>(
  operation: string,
  fn: () => T,
  fallbackValue?: T | null
): T | null => {
  let retries = 2
  let lastError: unknown = null

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
  // - If a fallbackValue was explicitly supplied (even null), return it.
  // - If no fallback was provided (undefined), surface the StorageError to callers.

  if (fallbackValue === undefined) {
    // No safe fallback was provided by the caller — surface the error without logging it twice
    throw storageError
  }

  // Only log if we are gracefully degrading to a fallback
  handleError(storageError, { silent: true })
  return fallbackValue
}

/**
 * Executes a function with automatic retry logic for recoverable errors.
 * @param {Function} fn - The async function to execute.
 * @param {Object} [options] - Retry options.
 * @param {number} [options.retries=3] - Maximum number of retries.
 * @param {number} [options.delay=1000] - Base delay in milliseconds between retries.
 * @param {number} [options.backoff=2] - Multiplier for exponential backoff.
 * @returns {Promise<*>} The result of the function.
 * @throws {Error} The final error if all retries fail.
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: {
    retries?: number
    delay?: number
    backoff?: number
  } = {}
): Promise<T> => {
  const { retries = 3, delay = 1000, backoff = 2 } = options
  const safeRetries = Number.isFinite(retries)
    ? Math.max(0, Math.floor(retries))
    : 3
  const maxAttempts = safeRetries + 1
  let attempt = 0
  let currentDelay = delay

  do {
    try {
      return await fn()
    } catch (error) {
      attempt++
      const isRecoverable =
        error instanceof GameError ? error.recoverable : true

      if (attempt >= maxAttempts || !isRecoverable) {
        throw error
      }

      handleError(error, {
        silent: true,
        source: 'withRetry',
        errorInfo: { attempt, maxRetries: maxAttempts, nextDelay: currentDelay }
      })

      await new Promise(resolve => setTimeout(resolve, currentDelay))
      currentDelay *= backoff
    }
  } while (attempt < maxAttempts)
  throw new Error('Retries failed')
}
