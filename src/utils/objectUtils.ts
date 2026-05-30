export type RecordGuard = (value: unknown) => value is Record<string, unknown>

export const FORBIDDEN_KEYS: ReadonlySet<string> = new Set([
  '__proto__',
  'constructor',
  'prototype'
])
export const isForbiddenKey = (key: string): boolean => FORBIDDEN_KEYS.has(key)

type TraversalOptions = {
  isRecord?: RecordGuard
  createObject?: () => Record<string, unknown>
  shouldSkipKey?: (key: string) => boolean
  transformLeaf?: (value: unknown) => unknown
  transformRecordValue?: (
    key: string,
    value: unknown,
    sanitize: (value: unknown) => unknown
  ) => unknown
  onCircular?: () => unknown
}

export const isLooseRecord = (
  value: unknown
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const isPlainRecord = (
  value: unknown
): value is Record<string, unknown> =>
  value !== null &&
  typeof value === 'object' &&
  Object.getPrototypeOf(value) === Object.prototype

export const sanitizeTraversableValue = (
  value: unknown,
  options: TraversalOptions = {},
  visited: WeakSet<object> = new WeakSet()
): unknown => {
  const onCircular = options.onCircular ?? (() => '[REDACTED]')
  const createObject =
    options.createObject ??
    (() => Object.create(null) as Record<string, unknown>)
  const shouldSkipKey = (key: string): boolean =>
    FORBIDDEN_KEYS.has(key) || (options.shouldSkipKey?.(key) ?? false)

  if (Array.isArray(value)) {
    if (visited.has(value)) return onCircular()
    visited.add(value)
    try {
      return value.map(item => sanitizeTraversableValue(item, options, visited))
    } finally {
      visited.delete(value)
    }
  }

  const isRecord = options.isRecord ?? isLooseRecord
  if (isRecord(value)) {
    if (visited.has(value)) return onCircular()
    visited.add(value)

    try {
      const sanitized = createObject()
      for (const key in value) {
        if (!Object.hasOwn(value, key)) continue
        if (shouldSkipKey(key)) continue
        const rawValue = value[key]
        const sanitize = (nextValue: unknown) =>
          sanitizeTraversableValue(nextValue, options, visited)
        sanitized[key] = options.transformRecordValue
          ? options.transformRecordValue(key, rawValue, sanitize)
          : sanitize(rawValue)
      }
      return sanitized
    } finally {
      visited.delete(value)
    }
  }

  return options.transformLeaf ? options.transformLeaf(value) : value
}

/**
 * A secure wrapper around JSON.parse that uses a reviver to strip out
 * potentially dangerous keys associated with prototype pollution.
 *
 * @param text The JSON string to parse
 * @returns The parsed object, safely filtered
 */
export const safeJsonParse = (text: string): unknown => {
  return JSON.parse(text, (key: string, value: unknown) => {
    if (isForbiddenKey(key)) return undefined
    return value
  })
}
