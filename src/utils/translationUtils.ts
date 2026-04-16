// @ts-nocheck
import { isForbiddenKey } from './gameStateUtils'

const VALID_NAMESPACES = [
  'ui',
  'events',
  'venues',
  'items',
  'economy',
  'traits'
]

const isTranslatableKey = key => {
  if (typeof key !== 'string') return false
  const parts = key.split(':')
  if (parts.length > 1) {
    return VALID_NAMESPACES.includes(parts[0])
  }
  return false
}

/**
 * Recursively translates translation keys within a context object and filters forbidden keys.
 * @param {any} context - The context object to translate and sanitize.
 * @param {Function} t - The translation function.
 * @returns {any} The sanitized and translated context.
 */
export const translateContextKeys = (context, t) => {
  // Handle null or non-object types (e.g., from JSON.parse("null") or literals)
  if (context === null || typeof context !== 'object') {
    return context
  }

  if (Array.isArray(context)) {
    return context.map(item => {
      if (typeof item === 'string') {
        return isTranslatableKey(item) ? t(item) : item
      }
      return translateContextKeys(item, t)
    })
  }

  const translatedContext = {}
  for (const prop in context) {
    if (!Object.hasOwn(context, prop)) continue
    // SECURITY: Skip forbidden keys to prevent prototype pollution or other injection
    if (isForbiddenKey(prop)) continue

    const value = context[prop]
    if (typeof value === 'string') {
      translatedContext[prop] = isTranslatableKey(value) ? t(value) : value
    } else if (typeof value === 'object' && value !== null) {
      // SECURITY: Recurse into nested objects to sanitize and translate
      translatedContext[prop] = translateContextKeys(value, t)
    } else {
      translatedContext[prop] = value
    }
  }
  return translatedContext
}
