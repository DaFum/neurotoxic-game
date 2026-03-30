// TODO: Review this file
/**
 * Centralized Error Handling System
 * Provides custom error types, error logging, and error recovery utilities.
 * @module errorHandler
 */

import { logger } from './logger.js'

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
}

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
}

/**
 * Base Game Error class
 * @extends Error
 */
export class GameError extends Error {
  constructor(
    message,
    {
      category = ErrorCategory.UNKNOWN,
      severity = ErrorSeverity.MEDIUM,
      context = {},
      recoverable = true
    } = {}
  ) {
    super(message)
    this.name = 'GameError'
    this.category = category
    this.severity = severity
    this.context = context
    this.recoverable = recoverable
    this.timestamp = Date.now()
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
  constructor(message, context = {}) {
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
  constructor(message, context = {}) {
    super(message, {
      category: ErrorCategory.STORAGE,
      severity: ErrorSeverity.MEDIUM,
      context,
      recoverable: true
    })
    this.name = 'StorageError'
  }
}

export class AudioError extends GameError {
  constructor(message, context = {}) {
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
const errorLog = []
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

const isPlainObject = value => {
  return (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

const normalizeSeverity = severity => {
  if (typeof severity !== 'string') return null
  const normalized = severity.toLowerCase()
  return VALID_SEVERITIES.has(normalized) ? normalized : null
}

const isSensitiveContextKey = key => {
  if (SENSITIVE_CONTEXT_KEYS.has(key)) return true
  for (let i = 0; i < SENSITIVE_KEY_PATTERNS.length; i++) {
    if (key.includes(SENSITIVE_KEY_PATTERNS[i])) return true
  }
  return false
}

const sanitizeContextValue = (value, visited) => {
  if (Array.isArray(value)) {
    if (visited.has(value)) return '[REDACTED]'
    visited.add(value)
    return value.map(item => sanitizeContextValue(item, visited))
  }

  if (isPlainObject(value)) {
    return sanitizeContextObject(value, visited)
  }

  return value
}

const sanitizeContextObject = (context, visited) => {
  if (visited.has(context)) {
    return '[REDACTED]'
  }

  visited.add(context)
  const sanitized = {}

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

const sanitizeContextPayload = payload => {
  const visited = new WeakSet()

  if (isPlainObject(payload)) return sanitizeContextObject(payload, visited)

  if (payload instanceof Error) {
    return sanitizeContextObject(
      {
        name: payload.name,
        message: payload.message,
        stack: payload.stack
      },
      visited
    )
  }

  if (payload !== null && typeof payload === 'object') {
    return sanitizeContextObject(Object.assign({}, payload), visited)
  }

  return {}
}

const normalizeHandleErrorOptions = options => {
  const safeOptions = isPlainObject(options) ? options : {}

  const normalizedOptions = {
    source:
      typeof safeOptions.source === 'string' ? safeOptions.source : undefined,
    errorInfo:
      typeof safeOptions.errorInfo === 'object' &&
      safeOptions.errorInfo !== null
        ? safeOptions.errorInfo
        : null,
    severity: normalizeSeverity(safeOptions.severity)
  }

  return normalizedOptions
}

const sanitizeErrorInfo = errorInfo => ({
  // Allowed fields for globally dispatched critical error events:
  // - message: user-safe error summary
  // - code: optional machine-readable code/category
  // - timestamp: event time for correlation
  message: errorInfo?.message || 'Critical error',
  code: errorInfo?.category || ErrorCategory.UNKNOWN,
  timestamp: errorInfo?.timestamp || Date.now()
})

const sanitizeTelemetryErrorInfo = errorInfo => ({
  // Telemetry intentionally excludes raw error messages to avoid leaking
  // sensitive/user-controlled values.
  message: 'Error captured',
  code: errorInfo?.category || ErrorCategory.UNKNOWN,
  timestamp: errorInfo?.timestamp || Date.now()
})

const buildErrorInfo = (error, normalizedOptions, fallbackMessage) => {
  let errorInfo

  if (error instanceof GameError) {
    errorInfo = error.toLogObject()
  } else {
    errorInfo = {
      name: error.name || 'Error',
      message: error.message || fallbackMessage,
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      context: {},
      recoverable: true,
      timestamp: Date.now(),
      stack: error.stack
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

const logErrorLocally = errorInfo => {
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

const reportErrorRemote = errorInfo => {
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

const showErrorToast = (errorInfo, silent, addToast) => {
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
export const handleError = (error, options = {}) => {
  const safeOptions = isPlainObject(options) ? options : {}
  const {
    addToast,
    silent = false,
    fallbackMessage = 'An error occurred'
  } = safeOptions

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
  if (typeof window === 'undefined' || window[INIT_SYMBOL]) return
  window[INIT_SYMBOL] = true
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
export const safeStorageOperation = (operation, fn, fallbackValue = null) => {
  let retries = 2
  let lastError = null

  while (retries >= 0) {
    try {
      return fn()
    } catch (error) {
      lastError = error
      retries--
    }
  }

  handleError(
    new StorageError(`Storage operation failed after retries: ${operation}`, {
      originalError: lastError?.message
    }),
    { silent: true }
  )
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
export const withRetry = async (fn, options = {}) => {
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
}
