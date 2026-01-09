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
class Logger {
  constructor() {
    this.logs = []
    this.maxLogs = 1000
    this.minLevel = LOG_LEVELS.DEBUG // Default to DEBUG for now, can be changed via settings
    this.listeners = []

    // Load preference if available
    try {
      const savedLevel = localStorage.getItem('neurotoxic_log_level')
      if (savedLevel) this.minLevel = parseInt(savedLevel, 10)
    } catch (e) {
      // Ignore storage errors
    }
  }

  /**
   * Set the minimum log level filter.
   * @param {number} level
   */
  setLevel(level) {
    this.minLevel = level
    localStorage.setItem('neurotoxic_log_level', level)
  }

  /**
   * Subscribe to log updates (for UI).
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }

  _emit() {
    this.listeners.forEach(cb => cb(this.logs))
  }

  _push(entry) {
    this.logs.unshift(entry) // Newest first
    if (this.logs.length > this.maxLogs) {
      this.logs.pop()
    }
    this._emit()
  }

  _format(level, channel, message, data) {
    return {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      level,
      channel,
      message,
      data
    }
  }

  debug(channel, message, data) {
    if (this.minLevel > LOG_LEVELS.DEBUG) return
    console.debug(`[${channel}] ${message}`, data || '')
    this._push(this._format('DEBUG', channel, message, data))
  }

  info(channel, message, data) {
    if (this.minLevel > LOG_LEVELS.INFO) return
    console.info(`[${channel}] ${message}`, data || '')
    this._push(this._format('INFO', channel, message, data))
  }

  warn(channel, message, data) {
    if (this.minLevel > LOG_LEVELS.WARN) return
    console.warn(`[${channel}] ${message}`, data || '')
    this._push(this._format('WARN', channel, message, data))
  }

  error(channel, message, data) {
    if (this.minLevel > LOG_LEVELS.ERROR) return
    console.error(`[${channel}] ${message}`, data || '')
    this._push(this._format('ERROR', channel, message, data))
  }

  clear() {
    this.logs = []
    this._emit()
  }

  dump() {
    return JSON.stringify(this.logs, null, 2)
  }
}

export const logger = new Logger()
