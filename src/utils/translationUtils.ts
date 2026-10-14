import { isForbiddenKey } from './objectUtils'

const VALID_NAMESPACES = new Set([
  'ui',
  'events',
  'venues',
  'items',
  'economy',
  'traits'
])

const isTranslatableKey = (key: unknown): boolean => {
  if (typeof key !== 'string') return false
  const parts = key.split(':')
  if (parts.length > 1) {
    const ns = parts[0] ?? ''
    return VALID_NAMESPACES.has(ns)
  }
  return false
}

/**
 * Recursively translates i18n-looking string values in an event context object.
 *
 * @param context - Raw context value, including nested arrays or objects.
 * @param t - Translation callback for recognized namespaced keys.
 * @returns A sanitized copy with recognized keys translated, preserving non-object values.
 */
export const translateContextKeys = (
  context: unknown,
  t: (key: string) => string
): unknown => {
  const ancestors = new WeakSet<object>()
  const translate = (context: unknown): unknown => {
    // Handle null or non-object types (e.g., from JSON.parse("null") or literals)
    if (context === null || typeof context !== 'object') {
      return context
    }

    // Omit only ancestors: a shared non-cyclic subtree is translated at each use.
    if (ancestors.has(context)) return undefined
    ancestors.add(context)

    if (Array.isArray(context)) {
      const len = context.length
      const result = new Array(len)
      for (let i = 0; i < len; i++) {
        if (!Object.hasOwn(context, i)) continue
        const item = context[i]
        if (typeof item === 'string') {
          result[i] = isTranslatableKey(item) ? t(item) : item
        } else {
          result[i] = translate(item)
        }
      }
      ancestors.delete(context)
      return result
    }

    const translatedContext: Record<string, unknown> = {}
    const contextRecord = context as Record<string, unknown>
    for (const prop in contextRecord) {
      if (!Object.hasOwn(contextRecord, prop)) continue
      // SECURITY: Skip forbidden keys to prevent prototype pollution or other injection
      if (isForbiddenKey(prop)) continue

      const value = contextRecord[prop]
      if (typeof value === 'string') {
        translatedContext[prop] = isTranslatableKey(value) ? t(value) : value
      } else if (typeof value === 'object' && value !== null) {
        // SECURITY: Recurse into nested objects to sanitize and translate
        translatedContext[prop] = translate(value)
      } else {
        translatedContext[prop] = value
      }
    }
    ancestors.delete(context)
    return translatedContext
  }
  return translate(context)
}
