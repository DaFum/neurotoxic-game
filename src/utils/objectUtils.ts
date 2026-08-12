import { isFiniteNumber } from './finiteNumber'

/**
 * Narrows unknown values to string-keyed records.
 */
type RecordGuard = (value: unknown) => value is Record<string, unknown>

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

/**
 * Depth ceiling for {@link hasForbiddenKeysDeep}; payloads nested deeper are
 * rejected rather than traversed, so hostile input cannot overflow the stack.
 */
const MAX_FORBIDDEN_KEY_SCAN_DEPTH = 64

const scanForForbiddenKeys = (
  value: unknown,
  path: WeakSet<object>,
  cleared: WeakSet<object>,
  depth: number
): boolean => {
  if (typeof value !== 'object' || value === null) return false
  if (depth > MAX_FORBIDDEN_KEY_SCAN_DEPTH) return true
  // `path` holds only the current recursion ancestors, so a repeat is a real
  // cycle. `cleared` memoizes subtrees already proven safe, which keeps a
  // shared (DAG) child from being re-walked — accepting it without the
  // exponential blowup that re-traversal would cost on hostile input.
  if (path.has(value)) return true
  if (cleared.has(value)) return false
  if (!Array.isArray(value) && !isLooseRecord(value)) return false

  path.add(value)
  // `getOwnPropertyNames`, not `Object.keys`: a non-enumerable own key hides
  // from enumeration but still pollutes on copy, and a non-enumerable accessor
  // would otherwise be invoked later by the caller's field reads.
  const found = Object.getOwnPropertyNames(value).some(key => {
    if (isForbiddenKey(key)) return true
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) return true
    return scanForForbiddenKeys(descriptor.value, path, cleared, depth + 1)
  })
  path.delete(value)
  if (!found) cleared.add(value)
  return found
}

/**
 * Recursively checks an untrusted payload for prototype-polluting own keys at
 * every object and array level.
 *
 * Traversal is deliberately hostile-input safe: it is depth-bounded, rejects
 * cycles, inspects non-enumerable own properties, and reads values through
 * property descriptors so accessors are never invoked (a throwing getter would
 * otherwise escape a validator, and a stateful one could report different
 * values to the validation and output-construction passes). Shared child
 * references are legitimate and accepted.
 *
 * @param value - Arbitrary value from a JSON, storage, or generated-data boundary.
 * @returns True when the payload is unsafe to copy.
 */
export const hasForbiddenKeysDeep = (value: unknown): boolean =>
  scanForForbiddenKeys(value, new WeakSet(), new WeakSet(), 0)

/**
 * Filters a value to the subset of its entries that are strings.
 *
 * Non-arrays yield an empty array, so the result is always a safe `string[]`.
 *
 * @param value - Arbitrary value, typically from an untrusted payload.
 * @returns A new array containing only the string entries.
 */
export const sanitizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string')
}

/**
 * Copies the safe primitive entries (`string`, finite `number`, `boolean`,
 * `null`) of a record, skipping prototype-polluting keys. Non-finite numbers
 * (`NaN`/`Infinity`) are dropped, matching the project payload-safety rule.
 *
 * Shared by the toast-option and persisted-state sanitizers so the two do not
 * drift; callers decide how to treat an empty result.
 *
 * @param record - Source record whose entries are inspected.
 * @returns A new record containing only the safe primitive entries.
 */
export const copySafePrimitiveEntries = (
  record: Record<string, unknown>
): Record<string, string | number | boolean | null> => {
  const copied: Record<string, string | number | boolean | null> = {}
  for (const key in record) {
    if (!Object.hasOwn(record, key)) continue
    if (isForbiddenKey(key)) continue
    const entry = record[key]
    if (
      typeof entry === 'string' ||
      typeof entry === 'boolean' ||
      entry === null ||
      isFiniteNumber(entry)
    ) {
      copied[key] = entry
    }
  }
  return copied
}

export const copySafePrimitiveObject = (
  value: unknown
): Record<string, string | number | boolean | null> | undefined => {
  if (!isLooseRecord(value)) return undefined
  const copied = copySafePrimitiveEntries(value)
  for (const key in copied) {
    if (Object.hasOwn(copied, key)) {
      return copied
    }
  }
  return undefined
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
  maxDepth?: number
  dropUndefinedLeaves?: boolean
  sentinel?: unknown
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
  visited: WeakSet<object> = new WeakSet(),
  depth = 0
): unknown => {
  if (options.maxDepth !== undefined && depth > options.maxDepth) {
    return options.sentinel
  }

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

      if (options.dropUndefinedLeaves) {
        let hasValidItems = false
        const prunedArray: unknown[] = []
        for (let i = 0; i < len; i++) {
          if (Object.hasOwn(value, i)) {
            const original = value[i]
            const sanitized = sanitizeTraversableValue(
              original,
              options,
              visited,
              depth + 1
            )
            if (sanitized === undefined) {
              modified = true
            } else {
              hasValidItems = true
              prunedArray.push(sanitized)
              if (sanitized !== original) {
                modified = true
              }
            }
          } else {
            modified = true
          }
        }
        if (!hasValidItems && 'sentinel' in options) return options.sentinel
        return modified ? prunedArray : value
      }

      for (let i = 0; i < len; i++) {
        if (Object.hasOwn(value, i)) {
          const original = value[i]
          const sanitized = sanitizeTraversableValue(
            original,
            options,
            visited,
            depth + 1
          )
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
      let isEmpty = true
      for (const key in value) {
        if (!Object.hasOwn(value, key)) continue
        if (shouldSkipKey(key)) continue
        const rawValue = value[key]
        const sanitize = (nextValue: unknown) =>
          sanitizeTraversableValue(nextValue, options, visited, depth + 1)

        const nextVal = options.transformRecordValue
          ? options.transformRecordValue(key, rawValue, sanitize)
          : sanitize(rawValue)

        if (options.dropUndefinedLeaves && nextVal === undefined) {
          continue
        }

        sanitized[key] = nextVal
        isEmpty = false
      }

      if (options.dropUndefinedLeaves && isEmpty && 'sentinel' in options) {
        return options.sentinel
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
