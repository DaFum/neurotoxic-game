/**
 * Throws when a discriminated union reaches an impossible branch.
 *
 * @param x - Value narrowed to `never` by exhaustive checks.
 * @throws Error describing the unhandled action type when one is available.
 */
export function assertNever(x: never): never {
  const type =
    x && typeof x === 'object' && Object.hasOwn(x, 'type')
      ? String((x as { type?: unknown }).type)
      : 'unknown'
  throw new Error(`Unhandled action type: ${type}`)
}
