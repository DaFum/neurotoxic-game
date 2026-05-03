export function assertNever(x: never): never {
  const type =
    x && typeof x === 'object' && Object.hasOwn(x, 'type')
      ? String((x as { type?: unknown }).type)
      : 'unknown'
  throw new Error(`Unhandled action type: ${type}`)
}
