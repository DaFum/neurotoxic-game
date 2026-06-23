/**
 * Modal - A shared overlay component.
 */

import { useEffect, useId, useRef } from 'react'
import type { ReactNode, MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { UIFrameCorner } from './Icons'
import { Tooltip } from './Tooltip'

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title?: string
  ariaLabel?: string
  children?: ReactNode
  contentClassName?: string
  className?: string
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
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const titleId = useId()
  const { t } = useTranslation(['ui'])
  const dialogAriaLabel = ariaLabel || undefined
  const dialogAriaLabelledBy = dialogAriaLabel
    ? undefined
    : title
      ? titleId
      : undefined

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      // Focus the dialog for accessibility ONLY if there isn't an input actively focused inside it
      const timer = window.setTimeout(() => {
        if (
          dialogRef.current &&
          dialogRef.current instanceof HTMLElement &&
          !dialogRef.current.contains(document.activeElement)
        ) {
          dialogRef.current.focus()
        }
      }, 50)

      return () => {
        window.removeEventListener('keydown', handleKeyDown)
        clearTimeout(timer)
      }
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className='fixed inset-0 z-(--z-modal) flex items-center justify-center bg-void-black/90 cursor-pointer p-3 sm:p-4'
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
              className='text-2xl sm:text-3xl font-display text-toxic-green mb-4 uppercase tracking-widest text-center pr-10 sm:pr-0 break-words'
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
