/**
 * Modal - A shared overlay component.
 * @module Modal
 */

import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

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

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      // Focus the dialog for accessibility
      setTimeout(() => dialogRef.current?.focus(), 50)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-(--void-black)/90 cursor-pointer'
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className='w-full max-w-md border-4 border-(--toxic-green) p-6 bg-(--void-black) shadow-[0_0_25px_var(--toxic-green-glow)] cursor-auto focus:outline-none'
        role='dialog'
        aria-modal='true'
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <h2 className='text-3xl font-(--font-display) text-(--toxic-green) mb-4 uppercase tracking-widest text-center'>
            {title}
          </h2>
        )}
        {children}
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
