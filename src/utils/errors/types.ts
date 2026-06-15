import { isPlainRecord, sanitizeTraversableValue } from '../objectUtils'

/**
 * Severity labels used by centralized error handling and logging.
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const

/**
 * Error categories used to classify game, UI, storage, audio, and network failures.
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

export type ErrorSeverityType =
  (typeof ErrorSeverity)[keyof typeof ErrorSeverity]

export type ErrorCategoryType =
  (typeof ErrorCategory)[keyof typeof ErrorCategory]

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

let sensitivePatternString = ''
for (let i = 0; i < SENSITIVE_KEY_PATTERNS.length; i++) {
  const pattern = SENSITIVE_KEY_PATTERNS[i]
  if (pattern) {
    const escaped = escapeRegExp(pattern)
    sensitivePatternString = sensitivePatternString
      ? sensitivePatternString + '|' + escaped
      : escaped
  }
}

const SENSITIVE_KEY_REGEXP = sensitivePatternString
  ? new RegExp(sensitivePatternString)
  : null

const isSensitiveContextKey = (key: string) => {
  if (SENSITIVE_CONTEXT_KEYS.has(key)) return true
  return SENSITIVE_KEY_REGEXP ? SENSITIVE_KEY_REGEXP.test(key) : false
}

export const sanitizeContextValue = (
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

export const sanitizeContextPayload = (
  payload: unknown
): Record<string, unknown> => {
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

const VALID_SEVERITIES = new Set(Object.values(ErrorSeverity))

export const normalizeSeverity = (severity: unknown) => {
  if (typeof severity !== 'string') return null
  const normalized = severity.toLowerCase()
  return VALID_SEVERITIES.has(normalized as ErrorSeverityType)
    ? (normalized as ErrorSeverityType)
    : null
}
