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

const normalizeHandleErrorOptions = options => {
  const safeOptions = isPlainObject(options) ? options : {}

  const normalizedOptions = {
    source: typeof safeOptions.source === 'string' ? safeOptions.source : undefined,
    errorInfo:
      typeof safeOptions.errorInfo === 'object' && safeOptions.errorInfo !== null
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
    errorInfo.context = { ...errorInfo.context, ...normalizedOptions.errorInfo }
  }
  if (normalizedOptions.severity) {
    errorInfo.severity = normalizedOptions.severity
  }

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
        window.dispatchEvent(new CustomEvent('app:error:critical', { detail: sanitizedErrorInfo }))
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

  return errorInfo
}

/**
 * Creates a safe wrapper for localStorage operations
 * @param {string} operation - Operation name for logging
 * @param {Function} fn - Function to execute
 * @param {*} [fallbackValue] - Value to return on error
 * @returns {*} Result or fallback value
 */
export const safeStorageOperation = (operation, fn, fallbackValue = null) => {
  try {
    return fn()
  } catch (error) {
    handleError(
      new StorageError(`Storage operation failed: ${operation}`, {
        originalError: error.message
      }),
      { silent: true }
    )
    return fallbackValue
  }
}
