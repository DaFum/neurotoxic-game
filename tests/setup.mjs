import { register } from 'node:module'

process.env.NODE_ENV = 'test'

// Suppress the two experimental warnings the node:test runner emits for
// features this suite deliberately uses.
//
// Matched by message rather than by `name === 'ExperimentalWarning'` alone:
// the blanket form swallowed every experimental warning, including one a
// dependency or a future Node release might raise about something we are not
// opting into - exactly the signal a test run should surface.
const SUPPRESSED_EXPERIMENTAL_WARNINGS = [
  'Module mocking',
  'The MockTimers API'
]
const originalEmit = process.emit
process.emit = function (name, data, ...args) {
  if (
    name === 'warning' &&
    typeof data === 'object' &&
    data !== null &&
    data.name === 'ExperimentalWarning' &&
    SUPPRESSED_EXPERIMENTAL_WARNINGS.some(known =>
      String(data.message ?? '').includes(known)
    )
  ) {
    return false
  }
  return Reflect.apply(originalEmit, this, [name, data, ...args])
}

// Register the loader relative to this file
register('./loader.mjs', import.meta.url)

const LOG_LEVEL_KEY = 'neurotoxic_log_level'
const WARN_LEVEL = '2'

if (typeof globalThis.localStorage === 'undefined') {
  const storage = new Map()
  globalThis.localStorage = {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null
    },
    setItem(key, value) {
      storage.set(key, String(value))
    },
    removeItem(key) {
      storage.delete(key)
    },
    clear() {
      storage.clear()
    }
  }
}

const existingLogLevel = globalThis.localStorage.getItem(LOG_LEVEL_KEY)
if (existingLogLevel == null) {
  globalThis.localStorage.setItem(LOG_LEVEL_KEY, WARN_LEVEL)
}
