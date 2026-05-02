export function assertNever(x: never): never {
  const type =
    x && typeof x === 'object' && 'type' in x
      ? String((x as { type?: unknown }).type)
      : 'unknown'
  throw new Error(`Unhandled action type: ${type}`)
}
