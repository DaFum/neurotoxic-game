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
    this.context = context as Record<string, unknown>
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
