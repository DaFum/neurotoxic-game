/**
 * Shared modal behaviour: module-level modal stack, Tab focus trap, background
 * `inert`/`aria-hidden`, focus restore and the single window-level Escape
 * handler. `Modal` and every hand-styled dialog shell (Band HQ, blood bank,
 * event/crisis dialogs) attach to it so they behave identically when stacked.
 */

import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

/**
 * Rejects focus candidates that match the selector but cannot take focus
 * because CSS hides them; `preventDefault()` plus a no-op `focus()` would make
 * Tab appear dead. `checkVisibility` also covers hidden ancestors where
 * available; the computed-style fallback keeps non-browser DOMs working.
 * @param element - Candidate focusable element inside the container.
 * @returns Whether the element is rendered and can receive focus.
 */
const isRenderedCandidate = (element: HTMLElement): boolean => {
  if (element === document.activeElement) return true

  const checkVisibility = element.checkVisibility
  if (typeof checkVisibility === 'function') {
    return checkVisibility.call(element, { checkVisibilityCSS: true })
  }

  // `visibility` is inherited, so the resolved value on the candidate already
  // accounts for hidden ancestors *and* a descendant's `visibility: visible`
  // override. `display` is not inherited, so the chain needs walking; an
  // ancestor with `display: contents` is not `none` and keeps traversal going.
  if (window.getComputedStyle(element).visibility === 'hidden') return false

  let ancestor: HTMLElement | null = element
  while (ancestor) {
    if (window.getComputedStyle(ancestor).display === 'none') return false
    ancestor = ancestor.parentElement
  }
  return true
}

/**
 * Lists the tabbable, rendered elements inside a container in DOM order.
 * @param container - Element whose descendants are candidates.
 * @returns Focusable elements that are not hidden, `aria-hidden` or inert.
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] =>
  Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter(
    element =>
      !element.hidden &&
      element.getAttribute('aria-hidden') !== 'true' &&
      !element.closest('[inert]') &&
      isRenderedCandidate(element)
  )

/**
 * Decides where a Tab press must move focus to keep it inside a trap.
 * @param focusableElements - Ordered focusable elements of the trap (non-empty).
 * @param activeElement - Currently focused element.
 * @param shiftKey - Whether Shift is held (reverse direction).
 * @param forceInto - Pull focus in from outside the trap (modal semantics).
 * @returns The element to focus, or `null` to let the browser move focus.
 */
export const getTabWrapTarget = (
  focusableElements: HTMLElement[],
  activeElement: Element | null,
  shiftKey: boolean,
  forceInto: boolean
): HTMLElement | null => {
  const firstFocusable = focusableElements[0]
  const lastFocusable = focusableElements[focusableElements.length - 1]
  if (!firstFocusable || !lastFocusable) return null

  if (
    forceInto ||
    (shiftKey && activeElement === firstFocusable) ||
    (!shiftKey && activeElement === lastFocusable)
  ) {
    return shiftKey ? lastFocusable : firstFocusable
  }
  return null
}

type ModalStackEntry = {
  token: symbol
  overlay: HTMLDivElement
  dialog: HTMLDivElement
  /** `data-modal-keep-interactive` siblings the Tab cycle also visits. */
  companions: Element[]
  opener: HTMLElement | null
  onCloseRef: { current: () => void }
}

type BackgroundState = {
  ariaHidden: string | null
  inert: string | null
  owners: Set<symbol>
}

/**
 * Delay before the dialog claims focus on open.
 *
 * @remarks
 * Focus is deferred one frame-ish rather than set synchronously so a mount or
 * entry transition on the dialog cannot immediately pull focus back. Tests that
 * assert initial focus must advance timers past this.
 */
const INITIAL_FOCUS_DELAY_MS = 50

const modalStack: ModalStackEntry[] = []
const backgroundStates = new Map<Element, BackgroundState>()
let stackOpener: HTMLElement | null = null

const handleModalKeyDown = (event: KeyboardEvent) => {
  const activeModal = modalStack[modalStack.length - 1]
  if (!activeModal) return

  if (event.key === 'Escape') {
    event.preventDefault()
    activeModal.onCloseRef.current()
    return
  }

  if (event.key !== 'Tab') return

  const { dialog } = activeModal
  const focusableElements = getFocusableElements(dialog)
  const companionFocusables = activeModal.companions.flatMap(companion =>
    companion instanceof HTMLElement && companion.isConnected
      ? getFocusableElements(companion)
      : []
  )

  if (focusableElements.length === 0 && companionFocusables.length === 0) {
    event.preventDefault()
    dialog.focus()
    return
  }

  const activeElement = document.activeElement

  // A kept-interactive companion (the tutorial card) joins the cycle after the
  // dialog: its DOM position is unrelated to the overlay's, so the browser's
  // own Tab order cannot be trusted to cross between them and every step is
  // placed explicitly.
  if (companionFocusables.length > 0) {
    const cycle = [...focusableElements, ...companionFocusables]
    const index =
      activeElement instanceof HTMLElement ? cycle.indexOf(activeElement) : -1
    const step = event.shiftKey ? -1 : 1
    const target =
      index === -1
        ? event.shiftKey
          ? cycle[cycle.length - 1]
          : cycle[0]
        : cycle[(index + step + cycle.length) % cycle.length]
    event.preventDefault()
    target?.focus()
    return
  }

  const target = getTabWrapTarget(
    focusableElements,
    activeElement,
    event.shiftKey,
    activeElement === dialog || !dialog.contains(activeElement)
  )
  if (target) {
    event.preventDefault()
    target.focus()
  }
}

const muteBackground = (element: Element, owner: symbol) => {
  const existingState = backgroundStates.get(element)

  if (existingState) {
    existingState.owners.add(owner)
  } else {
    backgroundStates.set(element, {
      ariaHidden: element.getAttribute('aria-hidden'),
      inert: element.getAttribute('inert'),
      owners: new Set([owner])
    })
  }

  element.setAttribute('aria-hidden', 'true')
  element.setAttribute('inert', '')
}

const restoreBackground = (element: Element, owner: symbol) => {
  const state = backgroundStates.get(element)
  if (!state) return

  state.owners.delete(owner)
  if (state.owners.size > 0) {
    element.setAttribute('aria-hidden', 'true')
    element.setAttribute('inert', '')
    return
  }

  if (state.ariaHidden === null) {
    element.removeAttribute('aria-hidden')
  } else {
    element.setAttribute('aria-hidden', state.ariaHidden)
  }
  if (state.inert === null) {
    element.removeAttribute('inert')
  } else {
    element.setAttribute('inert', state.inert)
  }
  backgroundStates.delete(element)
}

/**
 * Registers a dialog on the modal stack while it is open.
 *
 * @remarks
 * Attach `overlayRef` to the full-screen wrapper (give it `data-modal-overlay`)
 * and `dialogRef` to the element carrying `role='dialog'` and `tabIndex={-1}`.
 * While open the hook mutes every sibling branch (`aria-hidden` + `inert`)
 * except `data-modal-keep-announcing` live regions and
 * `data-modal-keep-interactive` companion panels, traps Tab inside the
 * topmost dialog plus those companions (dialog controls first), routes Escape
 * to the topmost dialog's `onClose` only, and restores background state and
 * focus on close.
 * @param isOpen - Whether the dialog is currently shown.
 * @param onClose - Called when Escape is pressed while this dialog is topmost.
 * @returns Refs for the overlay wrapper and the dialog element.
 */
export const useModalBehavior = (
  isOpen: boolean,
  onClose: () => void
): {
  overlayRef: RefObject<HTMLDivElement | null>
  dialogRef: RefObject<HTMLDivElement | null>
} => {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const onCloseRef = useRef(onClose)

  // Sync in an effect, not during render: a discarded render must not leak its
  // onClose into the module-level stack entry that Escape invokes.
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return

    const overlay = overlayRef.current
    const dialog = dialogRef.current
    if (!overlay || !dialog) return

    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const companions: Element[] = []
    const entry: ModalStackEntry = {
      token: Symbol('modal'),
      overlay,
      dialog,
      companions,
      opener,
      onCloseRef
    }
    const backgroundElements = new Set<Element>()
    let modalBranch: Element | null = overlay

    while (modalBranch?.parentElement) {
      const parentElement: HTMLElement = modalBranch.parentElement
      for (const sibling of parentElement.children) {
        if (
          sibling === modalBranch ||
          sibling.hasAttribute('data-modal-overlay') ||
          // Never mute an ARIA live region: aria-hidden on the toast container
          // silences every announcement made while a modal is open, so a
          // confirmation triggered from inside the dialog is never read out.
          sibling.hasAttribute('data-modal-keep-announcing')
        ) {
          continue
        }
        // Never mute a non-modal companion panel (the tutorial card): it sits
        // above the modal layer and must stay usable while a dialog is open,
        // so the Tab cycle visits it after the dialog's own controls.
        if (sibling.hasAttribute('data-modal-keep-interactive')) {
          companions.push(sibling)
          continue
        }
        backgroundElements.add(sibling)
        muteBackground(sibling, entry.token)
      }
      modalBranch = parentElement
      if (parentElement === document.body) break
    }

    if (modalStack.length === 0) {
      stackOpener = opener
      window.addEventListener('keydown', handleModalKeyDown)
    }
    for (const stackedModal of modalStack) {
      backgroundElements.add(stackedModal.overlay)
      muteBackground(stackedModal.overlay, entry.token)
    }
    modalStack.push(entry)

    const timer = window.setTimeout(() => {
      // Deferred so the dialog's own mount/entry animation cannot steal focus
      // back; see INITIAL_FOCUS_DELAY_MS. Focus already in a companion panel
      // is inside the Tab cycle, so it is not pulled back either.
      if (
        modalStack[modalStack.length - 1] === entry &&
        !dialog.contains(document.activeElement) &&
        !companions.some(companion =>
          companion.contains(document.activeElement)
        )
      ) {
        dialog.focus()
      }
    }, INITIAL_FOCUS_DELAY_MS)

    return () => {
      window.clearTimeout(timer)
      for (const element of backgroundElements) {
        restoreBackground(element, entry.token)
      }

      const entryIndex = modalStack.indexOf(entry)
      const wasTopmost = entryIndex === modalStack.length - 1
      if (entryIndex !== -1) {
        modalStack.splice(entryIndex, 1)
      }

      const activeModal = modalStack[modalStack.length - 1]
      if (!activeModal) {
        window.removeEventListener('keydown', handleModalKeyDown)
        if (stackOpener?.isConnected) {
          stackOpener.focus()
        }
        stackOpener = null
      } else if (wasTopmost) {
        if (
          entry.opener?.isConnected &&
          activeModal.dialog.contains(entry.opener)
        ) {
          entry.opener.focus()
        } else {
          activeModal.dialog.focus()
        }
      }
    }
  }, [isOpen])

  return { overlayRef, dialogRef }
}
