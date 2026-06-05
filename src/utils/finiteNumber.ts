/**
 * Returns `value` when it is a finite number, else `fallback`.
 *
 * Shared finite-number fallback for numeric state boundaries. This does not
 * parse strings; callers that intentionally accept numeric strings should use
 * a clearly named parser at that boundary.
 *
 * @param value - Unknown value crossing a state, storage, or payload boundary.
 * @param fallback - Number to use when `value` is not finite.
 * @returns `value` as a number, or `fallback` for non-numeric, `NaN`, or infinite input.
 */
export const finiteNumberOr = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

/**
 * Checks whether an unknown value is a finite JavaScript number.
 *
 * @param value - Unknown value to inspect.
 * @returns True when value is a number and not NaN or infinite.
 */
export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)
