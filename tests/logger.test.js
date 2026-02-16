import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert'
import { Logger, LOG_LEVELS } from '../src/utils/logger.js'

describe('Logger', () => {
  let originalLocalStorage
  let originalConsole

  beforeEach(() => {
    // Backup globals
    originalLocalStorage = globalThis.localStorage
    originalConsole = globalThis.console

    // Mock localStorage
    globalThis.localStorage = {
      getItem: mock.fn(() => null),
      setItem: mock.fn(),
      removeItem: mock.fn(),
      clear: mock.fn()
    }

    // Mock console
    globalThis.console = {
      debug: mock.fn(),
      info: mock.fn(),
      warn: mock.fn(),
      error: mock.fn(),
      log: mock.fn()
    }
  })

  afterEach(() => {
    // Restore globals
    globalThis.localStorage = originalLocalStorage
    globalThis.console = originalConsole
  })

  test('constructor defaults to DEBUG level', () => {
    const logger = new Logger()
    assert.strictEqual(logger.minLevel, LOG_LEVELS.DEBUG)
    assert.deepStrictEqual(logger.logs, [])
  })

  test('constructor loads level from localStorage', () => {
    globalThis.localStorage.getItem.mock.mockImplementation(() =>
      LOG_LEVELS.WARN.toString()
    )
    const logger = new Logger()
    assert.strictEqual(logger.minLevel, LOG_LEVELS.WARN)
  })

  test('setLevel updates level and saves to localStorage', () => {
    const logger = new Logger()
    logger.setLevel(LOG_LEVELS.ERROR)
    assert.strictEqual(logger.minLevel, LOG_LEVELS.ERROR)
    assert.strictEqual(globalThis.localStorage.setItem.mock.calls.length, 1)
    assert.deepStrictEqual(
      globalThis.localStorage.setItem.mock.calls[0].arguments,
      ['neurotoxic_log_level', LOG_LEVELS.ERROR]
    )
  })

  test('subscribe registers callback and unsubscribe removes it', () => {
    const logger = new Logger()
    const callback = mock.fn()
    const unsubscribe = logger.subscribe(callback)

    logger.info('test', 'message')
    assert.strictEqual(callback.mock.calls.length, 1)

    // Verify event structure
    const event = callback.mock.calls[0].arguments[0]
    assert.strictEqual(event.type, 'add')
    assert.strictEqual(event.entry.message, 'message')

    unsubscribe()
    logger.info('test', 'message 2')
    assert.strictEqual(callback.mock.calls.length, 1)
  })

  test('debug logs only if level <= DEBUG', () => {
    const logger = new Logger()
    logger.setLevel(LOG_LEVELS.DEBUG)
    logger.debug('Test', 'Debug Message')

    assert.strictEqual(logger.logs.length, 1)
    assert.strictEqual(logger.logs[0].level, 'DEBUG')
    assert.strictEqual(globalThis.console.debug.mock.calls.length, 1)

    logger.setLevel(LOG_LEVELS.INFO)
    logger.debug('Test', 'Ignored Message')
    assert.strictEqual(logger.logs.length, 1)
    assert.strictEqual(globalThis.console.debug.mock.calls.length, 1)
  })

  test('info logs only if level <= INFO', () => {
    const logger = new Logger()
    logger.setLevel(LOG_LEVELS.INFO)
    logger.info('Test', 'Info Message')

    assert.strictEqual(logger.logs.length, 1)
    assert.strictEqual(logger.logs[0].level, 'INFO')
    assert.strictEqual(globalThis.console.info.mock.calls.length, 1)

    logger.setLevel(LOG_LEVELS.WARN)
    logger.info('Test', 'Ignored Message')
    assert.strictEqual(logger.logs.length, 1)
    assert.strictEqual(globalThis.console.info.mock.calls.length, 1)
  })

  test('warn logs only if level <= WARN', () => {
    const logger = new Logger()
    logger.setLevel(LOG_LEVELS.WARN)
    logger.warn('Test', 'Warn Message')

    assert.strictEqual(logger.logs.length, 1)
    assert.strictEqual(logger.logs[0].level, 'WARN')
    assert.strictEqual(globalThis.console.warn.mock.calls.length, 1)

    logger.setLevel(LOG_LEVELS.ERROR)
    logger.warn('Test', 'Ignored Message')
    assert.strictEqual(logger.logs.length, 1)
    assert.strictEqual(globalThis.console.warn.mock.calls.length, 1)
  })

  test('error logs only if level <= ERROR', () => {
    const logger = new Logger()
    logger.setLevel(LOG_LEVELS.ERROR)
    logger.error('Test', 'Error Message')

    assert.strictEqual(logger.logs.length, 1)
    assert.strictEqual(logger.logs[0].level, 'ERROR')
    assert.strictEqual(globalThis.console.error.mock.calls.length, 1)

    logger.setLevel(LOG_LEVELS.NONE)
    logger.error('Test', 'Ignored Message')
    assert.strictEqual(logger.logs.length, 1)
    assert.strictEqual(globalThis.console.error.mock.calls.length, 1)
  })

  test('logs are trimmed to maxLogs', () => {
    const logger = new Logger()
    logger.maxLogs = 5
    for (let i = 0; i < 10; i++) {
      logger.info('Test', `Message ${i}`)
    }
    assert.strictEqual(logger.logs.length, 5)
    assert.strictEqual(logger.logs[0].message, 'Message 9') // Newest first
    assert.strictEqual(logger.logs[4].message, 'Message 5')
  })

  test('clear removes all logs and emits clear event', () => {
    const logger = new Logger()
    const callback = mock.fn()
    logger.subscribe(callback)

    logger.info('Test', 'Message')
    assert.strictEqual(logger.logs.length, 1)

    logger.clear()
    assert.strictEqual(logger.logs.length, 0)

    // Check for clear event
    const lastCall = callback.mock.calls[callback.mock.calls.length - 1]
    assert.strictEqual(lastCall.arguments[0].type, 'clear')
  })

  test('dump returns JSON string of logs', () => {
    const logger = new Logger()
    logger.info('Test', 'Message')
    const json = logger.dump()
    const parsed = JSON.parse(json)
    assert.strictEqual(parsed.length, 1)
    assert.strictEqual(parsed[0].message, 'Message')
  })
})
