import { register } from 'node:module'

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
