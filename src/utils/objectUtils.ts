export type RecordGuard = (value: unknown) => value is Record<string, unknown>

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

  if (Array.isArray(value)) {
    if (visited.has(value)) return onCircular()
    visited.add(value)
    return value.map(item => sanitizeTraversableValue(item, options, visited))
  }

  const isRecord = options.isRecord ?? isLooseRecord
  if (isRecord(value)) {
    if (visited.has(value)) return onCircular()
    visited.add(value)

    const sanitized = options.createObject?.() ?? {}
    for (const key in value) {
      if (!Object.hasOwn(value, key)) continue
      if (options.shouldSkipKey?.(key)) continue
      const rawValue = value[key]
      const sanitize = (nextValue: unknown) =>
        sanitizeTraversableValue(nextValue, options, visited)
      sanitized[key] = options.transformRecordValue
        ? options.transformRecordValue(key, rawValue, sanitize)
        : sanitize(rawValue)
    }
    return sanitized
  }

  return options.transformLeaf ? options.transformLeaf(value) : value
}
