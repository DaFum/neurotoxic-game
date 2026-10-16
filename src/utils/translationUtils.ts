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
 * @remarks Top-level strings pass through; only strings nested in context objects or arrays are translated.
 */
export const translateContextKeys = (
  context: unknown,
  t: (key: string) => string
): unknown => {
  if (typeof context === 'string') return context
  const ancestors = new WeakSet<object>()
  const translate = (context: unknown): unknown => {
    if (typeof context === 'string') {
      return isTranslatableKey(context) ? t(context) : context
    }
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
        result[i] = translate(context[i])
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

      translatedContext[prop] = translate(contextRecord[prop])
    }
    ancestors.delete(context)
    return translatedContext
  }
  return translate(context)
}
