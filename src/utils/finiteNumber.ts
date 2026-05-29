/**
 * Returns `value` when it is a finite number, else `fallback`.
 *
 * Shared finite-number fallback for numeric state boundaries. This does not
 * parse strings; callers that intentionally accept numeric strings should use
 * a clearly named parser at that boundary.
 */
export const finiteNumberOr = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)
