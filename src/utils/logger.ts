import { getSafeUUID } from './crypto'

/**
 * Log levels for the application.
 */
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
}

/**
 * A configurable logger system for debugging game flow.
 */
export class Logger {
  logs: any[]
  maxLogs: number
  minLevel: number
  listeners: Array<(event: any) => void>
  constructor() {
    this.logs = []
    this.maxLogs = 1000
    this.minLevel = LOG_LEVELS.DEBUG // Default to DEBUG for now, can be changed via settings
    this.listeners = []

    // Load preference if available
    try {
      const savedLevel = localStorage.getItem('neurotoxic_log_level')
      if (savedLevel) this.minLevel = parseInt(savedLevel, 10)
    } catch (_e) {
      // Ignore storage errors
    }
  }

  /**
   * Set the minimum log level filter.
   * @param {number} level
   */
  setLevel(level: number): void {
    this.minLevel = level
    try {
      localStorage.setItem('neurotoxic_log_level', String(level))
    } catch (_e) {
      // Ignore storage errors
    }
  }

  /**
   * Subscribe to log updates (for UI).
   * @param {Function} callback - Callback receiving {type, entry}.
   * @returns {Function} Unsubscribe function
   */
  subscribe(
    callback: (event: { type: string; entry: any }) => void
  ): () => void {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }

  /**
   * Emits log updates to subscribers.
   * @param {object} event - Event object { type, entry }.
   * @private
   */
  _emit(event: any): void {
    this.listeners.forEach(cb => {
      cb(event)
    })
  }

  /**
   * Pushes a new log entry and trims history.
   * @param {object} entry - Log entry.
   * @private
   */
  _push(entry: any): void {
    this.logs.unshift(entry) // Newest first
    if (this.logs.length > this.maxLogs) {
      this.logs.pop()
    }
    this._emit({ type: 'add', entry })
  }

  /**
   * Formats a log message into a structured object.
   * @param {string} level - Log level.
   * @param {string} channel - Source channel.
   * @param {string} message - Message text.
   * @param {any} data - Associated data.
   * @returns {object} Formatted log object.
   * @private
   */
  _format(
    level: string,
    channel: string,
    message: string,
    data: any
  ): {
    id: string
    timestamp: string
    level: string
    channel: string
    message: string
    data: any
  } {
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
   * @param {string} channel - The source channel (e.g. 'Audio', 'GameLoop').
   * @param {string} message - The log message.
   * @param {any} [data] - Optional data to attach.
   */
  debug(channel: string, message: string, data?: any): void {
    if (this.minLevel > LOG_LEVELS.DEBUG) return
    if (!(import.meta as any).env?.PROD) {
      console.debug(`[${channel}] ${message}`, data || '')
    }
    this._push(this._format('DEBUG', channel, message, data))
  }

  /**
   * Logs an informational message.
   * @param {string} channel - The source channel.
   * @param {string} message - The log message.
   * @param {any} [data] - Optional data.
   */
  info(channel: string, message: string, data?: any): void {
    if (this.minLevel > LOG_LEVELS.INFO) return
    if (!(import.meta as any).env?.PROD) {
      console.info(`[${channel}] ${message}`, data || '')
    }
    this._push(this._format('INFO', channel, message, data))
  }

  /**
   * Logs a warning message.
   * @param {string} channel - The source channel.
   * @param {string} message - The log message.
   * @param {any} [data] - Optional data.
   */
  warn(channel: string, message: string, data?: any): void {
    if (this.minLevel > LOG_LEVELS.WARN) return
    console.warn(`[${channel}] ${message}`, data || '')
    this._push(this._format('WARN', channel, message, data))
  }

  /**
   * Logs an error message.
   * @param {string} channel - The source channel.
   * @param {string} message - The log message.
   * @param {any} [data] - Optional data (usually the error object).
   */
  error(channel: string, message: string, data?: any): void {
    if (this.minLevel > LOG_LEVELS.ERROR) return
    console.error(`[${channel}] ${message}`, data || '')
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
   * Dumps logs as a JSON string.
   * @returns {string} JSON representation of logs.
   */
  dump(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

export const logger = new Logger()
