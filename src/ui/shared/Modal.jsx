/**
 * Modal - A shared overlay component.
 * @module Modal
 */

import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { UIFrameCorner } from './Icons'

/**
 * Modal - A shared overlay component.
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible.
 * @param {Function} props.onClose - Callback to close the modal.
 * @param {string} [props.title] - Optional title.
 * @param {React.ReactNode} props.children - Content.
 */
export const Modal = ({ isOpen, onClose, title, children }) => {
  const dialogRef = useRef(null)
  const { t } = useTranslation(['ui'])

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      // Focus the dialog for accessibility ONLY if there isn't an input actively focused inside it
      const timer = setTimeout(() => {
        if (
          dialogRef.current &&
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
      className='fixed inset-0 z-50 flex items-center justify-center bg-(--void-black)/90 cursor-pointer p-4'
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className='relative w-full max-w-md border-2 border-(--toxic-green)/50 p-6 bg-(--void-black) shadow-[0_0_25px_var(--toxic-green-glow)] cursor-auto focus:outline-none group'
        role='dialog'
        aria-modal='true'
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        {/* Brutalist Frame Corners */}
        <UIFrameCorner className='absolute -top-1 -left-1 w-8 h-8 text-(--toxic-green) opacity-50 transition-opacity group-hover:opacity-100' />
        <UIFrameCorner className='absolute -top-1 -right-1 w-8 h-8 text-(--toxic-green) rotate-90 opacity-50 transition-opacity group-hover:opacity-100' />
        <UIFrameCorner className='absolute -bottom-1 -right-1 w-8 h-8 text-(--toxic-green) rotate-180 opacity-50 transition-opacity group-hover:opacity-100' />
        <UIFrameCorner className='absolute -bottom-1 -left-1 w-8 h-8 text-(--toxic-green) -rotate-90 opacity-50 transition-opacity group-hover:opacity-100' />

        <button
          type='button'
          onClick={onClose}
          aria-label={t('ui:close')}
          className='absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-(--void-black) border-2 border-(--toxic-green) text-(--toxic-green) hover:bg-(--toxic-green) hover:text-(--void-black) transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--toxic-green) z-20 group-hover:shadow-[0_0_10px_var(--toxic-green-glow)]'
        >
          <span
            aria-hidden='true'
            className='font-mono text-lg font-bold leading-none select-none'
          >
            ×
          </span>
        </button>

        <div className='relative z-10'>
          {title && (
            <h2 className='text-3xl font-(--font-display) text-(--toxic-green) mb-4 uppercase tracking-widest text-center'>
              {title}
            </h2>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node
}
