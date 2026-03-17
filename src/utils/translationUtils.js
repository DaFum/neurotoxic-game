import { isForbiddenKey } from './gameStateUtils.js'

const VALID_NAMESPACES = ['ui:', 'events:', 'venues:', 'items:', 'economy:']

/**
 * Recursively translates translation keys within a context object and filters forbidden keys.
 * @param {any} context - The context object to translate and sanitize.
 * @param {Function} t - The translation function.
 * @returns {any} The sanitized and translated context.
 */
export const translateContextKeys = (context, t) => {
  // Handle null or non-object types (e.g., from JSON.parse("null") or literals)
  if (
    context === null ||
    typeof context !== 'object'
  ) {
    return context
  }

  if (Array.isArray(context)) {
    return context.map(item => {
      if (typeof item === 'string') {
        const isTranslationKey = VALID_NAMESPACES.some(ns => item.startsWith(ns))
        return isTranslationKey ? t(item, { defaultValue: item }) : item
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
      const isTranslationKey = VALID_NAMESPACES.some(ns => value.startsWith(ns))
      translatedContext[prop] = isTranslationKey ? t(value) : value
    } else if (typeof value === 'object' && value !== null) {
      // SECURITY: Recurse into nested objects to sanitize and translate
      translatedContext[prop] = translateContextKeys(value, t)
    } else {
      translatedContext[prop] = value
    }
  }
  return translatedContext
}
