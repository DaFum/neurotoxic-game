import { getFocusableElements } from '../../ui/shared/useModalBehavior'
import { getHoldTarget } from './holdTargets'
import type { Direction } from '../../types/gamepad'

function candidatesFor(roots: HTMLElement[]): HTMLElement[] {
  return roots
    .flatMap(root => getFocusableElements(root))
    .filter(
      element =>
        element.getAttribute('aria-disabled') !== 'true' &&
        !element.closest('[aria-hidden="true"]')
    )
}

/** Navigate within the current modal scope, preserving the control's own key behavior. */
export function moveGamepadFocus(
  direction: Direction,
  roots: HTMLElement[]
): void {
  const candidates = candidatesFor(roots)
  if (!candidates.length) return
  const active = document.activeElement
  const index = candidates.indexOf(active as HTMLElement)
  if (index < 0) {
    ;(
      candidates.find(element =>
        element.hasAttribute('data-gamepad-autofocus')
      ) ?? candidates[0]
    )?.focus()
    return
  }
  const element = candidates[index]
  if (!element) return
  const horizontal = direction === 'left' || direction === 'right'
  const forward = direction === 'right' || direction === 'down'
  if (
    horizontal &&
    element instanceof HTMLInputElement &&
    element.type === 'range'
  ) {
    if (forward) element.stepUp()
    else element.stepDown()
    element.dispatchEvent(new Event('input', { bubbles: true }))
    return
  }
  if (horizontal && element instanceof HTMLSelectElement) {
    const length = element.options.length
    if (length)
      element.selectedIndex =
        (element.selectedIndex + (forward ? 1 : -1) + length) % length
    element.dispatchEvent(new Event('change', { bubbles: true }))
    return
  }
  if (horizontal && element.getAttribute('role') === 'tab') {
    element.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: forward ? 'ArrowRight' : 'ArrowLeft',
        bubbles: true
      })
    )
    return
  }
  const rect = element.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  let best: HTMLElement | undefined
  let score = Infinity
  for (const candidate of candidates) {
    if (candidate === element) continue
    const next = candidate.getBoundingClientRect()
    const dx = next.left + next.width / 2 - x
    const dy = next.top + next.height / 2 - y
    const primary =
      direction === 'right'
        ? dx
        : direction === 'left'
          ? -dx
          : direction === 'down'
            ? dy
            : -dy
    if (primary <= 0) continue
    const secondary = horizontal ? Math.abs(dy) : Math.abs(dx)
    const value = primary + secondary * 2
    if (value < score) {
      best = candidate
      score = value
    }
  }
  ;(
    best ??
    candidates[
      (index + (forward ? 1 : -1) + candidates.length) % candidates.length
    ]
  )?.focus()
}

/** Activate one path and return the corresponding release operation for holds. */
export function activateGamepadElement(
  element: HTMLElement
): (() => void) | undefined {
  if (element.getAttribute('aria-disabled') === 'true') return
  const hold = getHoldTarget(element)
  if (hold) {
    hold.start()
    return hold.stop
  }
  if (typeof element.click === 'function') element.click()
  else element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}
