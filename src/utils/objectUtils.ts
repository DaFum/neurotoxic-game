/**
 * Narrows unknown values to string-keyed records.
 */
export type RecordGuard = (value: unknown) => value is Record<string, unknown>

/**
 * Object keys that must be dropped when traversing untrusted payloads.
 */
export const FORBIDDEN_KEYS: ReadonlySet<string> = new Set([
  '__proto__',
  'constructor',
  'prototype'
])

/**
 * Checks whether a key can mutate object prototypes when copied.
 *
 * @param key - Object key to check.
 * @returns True when the key should be skipped during sanitization.
 */
export const isForbiddenKey = (key: string): boolean => FORBIDDEN_KEYS.has(key)

/**
 * Checks whether an object carries any prototype-polluting own-property.
 *
 * Derives from {@link FORBIDDEN_KEYS} so callers do not re-spell the
 * `__proto__`/`constructor`/`prototype` triad inline (which silently drifts
 * out of sync when the set changes). Uses `Object.hasOwn` to avoid the array
 * allocation of `Object.keys(obj).some(isForbiddenKey)`.
 *
 * @param obj - The object to check.
 * @returns True when any forbidden key is an own-property of `obj`.
 */
export const hasForbiddenOwnKeys = (obj: object): boolean => {
  for (const key of FORBIDDEN_KEYS) {
    if (Object.hasOwn(obj, key)) return true
  }
  return false
}

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

/**
 * Checks whether a value is a non-array object record.
 *
 * This accepts class instances and null-prototype objects; use
 * `isPlainRecord` when only normal object literals are valid.
 *
 * @param value - Candidate value to inspect.
 * @returns True when the value is object-like and can be traversed as a record.
 */
export const isLooseRecord = (
  value: unknown
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Checks whether a value is a plain object literal.
 *
 * @param value - Candidate value to inspect.
 * @returns True when the value has `Object.prototype` as its prototype.
 */
export const isPlainRecord = (
  value: unknown
): value is Record<string, unknown> =>
  value !== null &&
  typeof value === 'object' &&
  Object.getPrototypeOf(value) === Object.prototype

/**
 * Checks whether a value is a plain object or null-prototype record.
 *
 * @param value - Candidate value to inspect.
 * @returns True for object literals and records created with
 * `Object.create(null)`.
 */
export const isPlainOrNullPrototypeRecord = (
  value: unknown
): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/**
 * Recursively copies traversable values while removing unsafe keys.
 *
 * Arrays and records are copied, circular references are replaced through
 * `onCircular`, and optional transforms can customize leaves or record values.
 *
 * @param value - Arbitrary value crossing a storage, logging, or payload
 * boundary.
 * @param options - Traversal hooks and record policy overrides.
 * @param visited - Active traversal set used to detect circular references.
 * @returns Sanitized clone or transformed primitive value.
 */
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
      const len = value.length
      let result = value
      let modified = false
      for (let i = 0; i < len; i++) {
        if (Object.hasOwn(value, i)) {
          const original = value[i]
          const sanitized = sanitizeTraversableValue(original, options, visited)
          if (sanitized !== original) {
            if (!modified) {
              modified = true
              result = new Array(len)
              for (let j = 0; j < i; j++) {
                if (Object.hasOwn(value, j)) result[j] = value[j]
              }
            }
            result[i] = sanitized
          } else if (modified) {
            result[i] = original
          }
        }
      }
      return result
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
 * @typeParam T - Expected parsed value shape after caller-side validation.
 * @param text - JSON string to parse.
 * @returns Parsed value with forbidden keys dropped by the reviver.
 */
export const safeJsonParse = <T = unknown>(text: string): T => {
  return JSON.parse(text, (key: string, value: unknown) => {
    if (isForbiddenKey(key)) return undefined
    return value
  })
}
