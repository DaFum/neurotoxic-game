export type HoldTarget = { start: () => void; stop: () => void }
const targets = new WeakMap<HTMLElement, HoldTarget>()
export function registerHoldTarget(
  element: HTMLElement,
  target: HoldTarget
): () => void {
  targets.set(element, target)
  return () => {
    if (targets.get(element) === target) targets.delete(element)
  }
}
export function getHoldTarget(element: HTMLElement): HoldTarget | undefined {
  return targets.get(element)
}
