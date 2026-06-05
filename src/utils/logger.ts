/// <reference types="vite/client" />
import { getSafeUUID } from './crypto'

/**
 * Numeric log levels used for filtering console output and retained history.
 */
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
}

/**
 * Checks whether a numeric value is one of the supported log levels.
 *
 * @param level - Candidate log level.
 * @returns True when the value maps to a `LOG_LEVELS` entry.
 */
export const isValidLogLevel = (level: number): boolean => {
  return (
    Number.isFinite(level) &&
    Number.isInteger(level) &&
    level >= LOG_LEVELS.DEBUG &&
    level <= LOG_LEVELS.NONE
  )
}

/**
 * Configurable logger that mirrors messages to the console and retained history.
 */
export class Logger {
  /**
   * Newest-first retained log entries.
   */
  logs: LogEntry[]
  /**
   * Maximum number of log entries retained in memory.
   */
  maxLogs: number
  /**
   * Minimum numeric level mirrored to console and history.
   */
  minLevel: number
  /**
   * Subscribers notified when log history changes.
   */
  listeners: Array<(event: LogEvent) => void>
  constructor() {
    this.logs = []
    this.maxLogs = 1000
    this.minLevel = LOG_LEVELS.DEBUG // Default to DEBUG for now, can be changed via settings
    this.listeners = []

    // Load preference if available
    let savedLevel: number | null = null
    try {
      const storage =
        typeof window !== 'undefined'
          ? window.localStorage
          : typeof globalThis !== 'undefined'
            ? globalThis.localStorage
            : null
      if (storage) {
        const raw = storage.getItem('neurotoxic_log_level')
        if (raw !== null) {
          const parsed = parseInt(raw, 10)
          if (!isNaN(parsed)) {
            savedLevel = parsed
          }
        }
      }
    } catch (_e) {
      // Ignore errors (SecurityError, etc.)
    }
    if (savedLevel !== null && isValidLogLevel(savedLevel)) {
      this.minLevel = savedLevel
    }
  }

  /**
   * Sets the minimum log level and persists it when storage is available.
   * @param level - Candidate numeric log level.
   */
  setLevel(level: number): void {
    if (!isValidLogLevel(level)) {
      console.warn(`[Logger] Invalid log level: ${level}, ignoring`)
      return
    }
    this.minLevel = level
    try {
      const storage =
        typeof window !== 'undefined'
          ? window.localStorage
          : typeof globalThis !== 'undefined'
            ? globalThis.localStorage
            : null
      if (storage) {
        storage.setItem('neurotoxic_log_level', level.toString())
      }
    } catch (_e) {
      // Ignore errors
    }
  }

  /**
   * Subscribes to log-history updates.
   * @param callback - Callback receiving log add or clear events.
   * @returns Function that removes the subscription.
   */
  subscribe(callback: (event: LogEvent) => void): () => void {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }

  /**
   * Emits log updates to subscribers.
   * @param event - Log-history mutation event.
   */
  _emit(event: LogEvent): void {
    this.listeners.forEach(cb => {
      cb(event)
    })
  }

  /**
   * Pushes a new log entry and trims history.
   * @param entry - Entry to add to retained history.
   */
  _push(entry: LogEntry): void {
    // Return a new array reference to support React useSyncExternalStore
    this.logs = [entry, ...this.logs].slice(0, this.maxLogs)
    this._emit({ type: 'add', entry })
  }

  /**
   * Formats a log message into a structured object.
   * @param level - Log level.
   * @param channel - Source channel.
   * @param message - Message text.
   * @param data - Optional structured data attached to the entry.
   * @returns Formatted log object.
   */
  _format(
    level: string,
    channel: string,
    message: string,
    data: unknown
  ): LogEntry {
    return {
      id: getSafeUUID(),
      timestamp: new Date().toISOString(),
      level,
      channel,
      message,
      data
    }
  }

  /**
   * Logs a debug message.
   * @param channel - The source channel (e.g. 'Audio', 'GameLoop').
   * @param message - The log message.
   * @param data - Optional data to attach.
   */
  debug(channel: string, message: string, data?: unknown): void {
    if (this.minLevel > LOG_LEVELS.DEBUG) return
    if (!import.meta.env?.PROD) {
      console.debug(`[${channel}] ${message}`, data ?? '')
    }
    this._push(this._format('DEBUG', channel, message, data))
  }

  /**
   * Logs an informational message.
   * @param channel - The source channel.
   * @param message - The log message.
   * @param data - Optional data.
   */
  info(channel: string, message: string, data?: unknown): void {
    if (this.minLevel > LOG_LEVELS.INFO) return
    if (!import.meta.env?.PROD) {
      console.info(`[${channel}] ${message}`, data ?? '')
    }
    this._push(this._format('INFO', channel, message, data))
  }

  /**
   * Logs a warning message.
   * @param channel - The source channel.
   * @param message - The log message.
   * @param data - Optional data.
   */
  warn(channel: string, message: string, data?: unknown): void {
    if (this.minLevel > LOG_LEVELS.WARN) return
    console.warn(`[${channel}] ${message}`, data ?? '')
    this._push(this._format('WARN', channel, message, data))
  }

  /**
   * Logs an error message.
   * @param channel - The source channel.
   * @param message - The log message.
   * @param data - Optional data (usually the error object).
   */
  error(channel: string, message: string, data?: unknown): void {
    if (this.minLevel > LOG_LEVELS.ERROR) return
    console.error(`[${channel}] ${message}`, data ?? '')
    this._push(this._format('ERROR', channel, message, data))
  }

  /**
   * Clears all stored logs.
   */
  clear(): void {
    this.logs = []
    this._emit({ type: 'clear' })
  }

  /**
   * Serializes retained logs for diagnostics.
   * @returns Pretty-printed JSON representation of retained logs.
   */
  dump(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

/**
 * Shared application logger instance used by runtime systems and debug UI.
 */
export const logger = new Logger()

/**
 * Structured log entry stored by `Logger`.
 */
export type LogEntry = {
  id: string
  timestamp: string
  level: string
  channel: string
  message: string
  data: unknown
}

/**
 * Subscription event emitted when log history changes.
 */
export type LogEvent =
  | { type: 'add'; entry: LogEntry }
  | { type: 'clear'; entry?: undefined }
