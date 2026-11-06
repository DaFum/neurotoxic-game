/**
 * Defines the callback structure for elements that support press-and-hold interactions.
 *
 * @remarks
 * Used in conjunction with `DeadmanButton` or spatial navigation to manage
 * long-press timers decoupled from standard `onClick` events.
 */
export type HoldTarget = { start: () => void; stop: () => void }

const targets = new WeakMap<HTMLElement, HoldTarget>()

/**
 * Registers an HTML element as a target for hold interactions.
 *
 * @remarks
 * The binding is stored in a module-scoped `WeakMap`, allowing safe cleanup
 * when the element is removed from the DOM.
 *
 * @param element - The DOM element to associate with the hold actions
 * @param target - The start and stop callbacks to trigger
 * @returns A teardown function that unregisters the element if it hasn't been reassigned
 */
export function registerHoldTarget(
  element: HTMLElement,
  target: HoldTarget
): () => void {
  targets.set(element, target)
  return () => {
    if (targets.get(element) === target) targets.delete(element)
  }
}

/**
 * Retrieves the registered hold actions for a given DOM element.
 *
 * @param element - The DOM element to query
 * @returns The associated hold target callbacks, or undefined if none are registered
 */
export function getHoldTarget(element: HTMLElement): HoldTarget | undefined {
  return targets.get(element)
}
