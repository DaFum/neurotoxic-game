/**
 * Modal - A shared overlay component.
 */

import { useEffect, useId, useRef } from 'react'
import type { ReactNode, MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { UIFrameCorner } from './Icons'
import { Tooltip } from './Tooltip'

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
 * @param element - Candidate focusable element inside the dialog.
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

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title?: string
  ariaLabel?: string
  children?: ReactNode
  contentClassName?: string
  className?: string
}

type ModalStackEntry = {
  token: symbol
  overlay: HTMLDivElement
  dialog: HTMLDivElement
  opener: HTMLElement | null
  onCloseRef: { current: () => void }
}

type BackgroundState = {
  ariaHidden: string | null
  inert: string | null
  owners: Set<symbol>
}

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
  const focusableElements = Array.from(
    dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter(
    element =>
      !element.hidden &&
      element.getAttribute('aria-hidden') !== 'true' &&
      !element.closest('[inert]') &&
      isRenderedCandidate(element)
  )

  if (focusableElements.length === 0) {
    event.preventDefault()
    dialog.focus()
    return
  }

  const firstFocusable = focusableElements[0]
  const lastFocusable = focusableElements[focusableElements.length - 1]
  const activeElement = document.activeElement

  if (
    activeElement === dialog ||
    !dialog.contains(activeElement) ||
    (event.shiftKey && activeElement === firstFocusable) ||
    (!event.shiftKey && activeElement === lastFocusable)
  ) {
    event.preventDefault()
    ;(event.shiftKey ? lastFocusable : firstFocusable)?.focus()
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
 * Presents an accessible modal dialog with backdrop click, Escape close, and focus handoff.
 * @param props - Modal visibility, close handler, accessible title or label, content, and styling hooks.
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  ariaLabel,
  children,
  contentClassName = 'flex-1 min-h-0 flex flex-col max-h-[calc(100svh-3rem)] sm:max-h-[calc(100svh-4rem)] overflow-y-auto overflow-x-hidden',
  className = 'max-w-md'
}: ModalProps) => {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const { t } = useTranslation(['ui'])
  const dialogAriaLabel = ariaLabel || undefined
  const dialogAriaLabelledBy = dialogAriaLabel
    ? undefined
    : title
      ? titleId
      : undefined

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
    const entry: ModalStackEntry = {
      token: Symbol('modal'),
      overlay,
      dialog,
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
          sibling.hasAttribute('data-modal-overlay')
        ) {
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
      if (
        modalStack[modalStack.length - 1] === entry &&
        !dialog.contains(document.activeElement)
      ) {
        dialog.focus()
      }
    }, 50)

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

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      data-modal-overlay=''
      role='presentation'
      className='fixed inset-0 z-(--z-modal) flex items-center justify-center bg-void-black/90 cursor-pointer p-3 sm:p-4'
      style={{ zIndex: 'var(--z-modal)' }}
      onClick={(e: MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className={`relative w-[min(calc(100vw-1.5rem),100%)] sm:w-full max-h-[calc(100svh-1rem)] border-4 border-toxic-green p-3 sm:p-6 bg-void-black shadow-[4px_4px_0px_var(--color-toxic-green)] sm:shadow-[8px_8px_0px_var(--color-toxic-green)] cursor-auto focus:outline-none group ${className}`}
        role='dialog'
        aria-modal='true'
        aria-label={dialogAriaLabel}
        aria-labelledby={dialogAriaLabelledBy}
        tabIndex={-1}
      >
        {/* Brutalist Frame Corners */}
        <UIFrameCorner className='absolute -top-1 -left-1 w-8 h-8 text-toxic-green opacity-50 transition-opacity group-hover:opacity-100' />
        <UIFrameCorner className='absolute -top-1 -right-1 w-8 h-8 text-toxic-green rotate-90 opacity-50 transition-opacity group-hover:opacity-100' />
        <UIFrameCorner className='absolute -bottom-1 -right-1 w-8 h-8 text-toxic-green rotate-180 opacity-50 transition-opacity group-hover:opacity-100' />
        <UIFrameCorner className='absolute -bottom-1 -left-1 w-8 h-8 text-toxic-green -rotate-90 opacity-50 transition-opacity group-hover:opacity-100' />

        <Tooltip
          content={t('ui:closeModal')}
          className='absolute top-2 right-2 sm:-top-3 sm:-right-3 z-20'
        >
          <button
            type='button'
            onClick={onClose}
            aria-label={t('ui:closeModal')}
            className='w-8 h-8 flex items-center justify-center bg-void-black border-2 border-toxic-green text-toxic-green hover:bg-toxic-green hover:text-void-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green'
          >
            <span
              aria-hidden='true'
              className='font-mono text-lg font-bold leading-none select-none'
            >
              ×
            </span>
          </button>
        </Tooltip>

        <div className={`relative z-10 ${contentClassName}`}>
          {title && (
            <h2
              id={titleId}
              className='text-2xl sm:text-3xl font-display text-toxic-green mb-4 uppercase tracking-widest text-center pr-10 sm:pr-0 wrap-break-word'
            >
              {title}
            </h2>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
