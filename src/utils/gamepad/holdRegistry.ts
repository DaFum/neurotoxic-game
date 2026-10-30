/**
 * Hold interaction registry for DeadmanButton and hold targets.
 * Uses a WeakMap mapping button DOM elements to private start and stop callbacks.
 */

export interface HoldCallbacks {
  start: () => void
  stop: () => void
}

const holdRegistry = new WeakMap<HTMLButtonElement, HoldCallbacks>()
let activeHoldElement: HTMLButtonElement | null = null

export function registerDeadmanHold(
  element: HTMLButtonElement | null,
  callbacks: HoldCallbacks
): () => void {
  if (!element) return () => {}
  holdRegistry.set(element, callbacks)
  return () => {
    if (activeHoldElement === element) {
      stopActiveHold()
    }
    holdRegistry.delete(element)
  }
}

export const registerHoldButton = (
  element: HTMLButtonElement | null,
  start: () => void,
  stop: () => void
): (() => void) => registerDeadmanHold(element, { start, stop })

export function getDeadmanHold(
  element: Element | null
): HoldCallbacks | undefined {
  if (element instanceof HTMLButtonElement) {
    return holdRegistry.get(element)
  }
  return undefined
}

export function startHold(element: HTMLButtonElement): boolean {
  const callbacks = holdRegistry.get(element)
  if (callbacks) {
    if (activeHoldElement && activeHoldElement !== element) {
      stopActiveHold()
    }
    activeHoldElement = element
    callbacks.start()
    return true
  }
  return false
}

export function stopActiveHold(): void {
  if (activeHoldElement) {
    const callbacks = holdRegistry.get(activeHoldElement)
    activeHoldElement = null
    callbacks?.stop()
  }
}

export function getActiveHoldElement(): HTMLButtonElement | null {
  return activeHoldElement
}
