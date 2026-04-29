import { isForbiddenKey } from './gameStateUtils'

const VALID_NAMESPACES = [
  'ui',
  'events',
  'venues',
  'items',
  'economy',
  'traits'
]

const isTranslatableKey = (key: unknown): boolean => {
  if (typeof key !== 'string') return false
  const parts = key.split(':')
  if (parts.length > 1) {
    const ns = parts[0] ?? ''
    return VALID_NAMESPACES.includes(ns)
  }
  return false
}

export const translateContextKeys = (
  context: unknown,
  t: (key: string) => string
): unknown => {
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
      translatedContext[prop] = translateContextKeys(value, t)
    } else {
      translatedContext[prop] = value
    }
  }
  return translatedContext
}
