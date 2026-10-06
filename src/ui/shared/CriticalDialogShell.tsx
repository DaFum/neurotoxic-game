/**
 * Shared "critical" dialog chrome: dimmed backdrop, scanline FX, hardware strip
 * and severity tab. `EventModal` and `CrisisModal` render their content inside
 * it; modal-stack behaviour (focus trap, inert background, Escape, focus
 * restore) comes from `useModalBehavior`.
 */

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import * as m from 'motion/react-m'
import { MOTION_TRANSITIONS } from '../../config/motion'
import { useModalBehavior } from './useModalBehavior'

const SCANLINE_STYLE = {
  backgroundImage:
    'linear-gradient(transparent 50%, var(--color-void-black-50) 50%)',
  backgroundSize: '100% 4px'
} as const

const noop = () => {}

interface CriticalDialogShellProps {
  /**
   * Called when Escape is pressed while this dialog is topmost. Omit for
   * dialogs that must be answered: Escape is then swallowed, not ignored by
   * the stack, so it cannot reach the scene behind the dialog.
   */
  onClose?: () => void
  /** Called when the dimmed backdrop is clicked; the backdrop is inert without it. */
  onBackdropClick?: () => void
  /** Id of the heading element that names the dialog. */
  labelledBy: string
  /** Text for the hardware severity tab. */
  severityLabel: ReactNode
  /** Classes appended to the full-screen overlay wrapper. */
  overlayClassName?: string
  /** Frame classes (border width, shadow, padding, max width) for the panel. */
  panelClassName: string
  /** Size classes for the severity tab. */
  severityLabelClassName: string
  /**
   * Enables Motion enter/exit transitions. `isExiting` plays the exit and
   * `onAnimationComplete` fires when the wrapper finishes animating.
   */
  animation?: { isExiting: boolean; onAnimationComplete?: () => void }
  /** Re-focuses the dialog whenever this value changes (e.g. a new event id). */
  focusKey?: unknown
  children: ReactNode
}

/**
 * Renders the critical dialog frame around its children.
 * @param props - Close handlers, accessible label id, frame classes, optional Motion state, and content.
 */
export const CriticalDialogShell = ({
  onClose,
  onBackdropClick,
  labelledBy,
  severityLabel,
  overlayClassName = '',
  panelClassName,
  severityLabelClassName,
  animation,
  focusKey,
  children
}: CriticalDialogShellProps) => {
  const { overlayRef, dialogRef } = useModalBehavior(true, onClose ?? noop)

  useEffect(() => {
    dialogRef.current?.focus()
  }, [dialogRef, focusKey])

  const isExiting = animation?.isExiting ?? false
  const transition = isExiting
    ? MOTION_TRANSITIONS.modalExit
    : MOTION_TRANSITIONS.modal
  const fadeProps = animation
    ? {
        initial: { opacity: 0 },
        animate: { opacity: isExiting ? 0 : 1 },
        exit: { opacity: 0, transition: MOTION_TRANSITIONS.modalExit },
        transition
      }
    : {}
  const panelProps = animation
    ? {
        initial: { scale: 0.9, opacity: 0, y: 20 },
        animate: isExiting
          ? { scale: 0.95, opacity: 0, y: 10 }
          : { scale: 1, opacity: 1, y: 0 },
        exit: {
          scale: 0.95,
          opacity: 0,
          y: 10,
          transition: MOTION_TRANSITIONS.modalExit
        },
        transition
      }
    : {}

  return (
    <m.div
      ref={overlayRef}
      data-modal-overlay=''
      role='presentation'
      {...fadeProps}
      onAnimationComplete={animation?.onAnimationComplete}
      className={`fixed inset-0 z-(--z-modal) flex items-center justify-center p-4 ${overlayClassName}`}
    >
      {/* Backdrop */}
      <m.div
        {...fadeProps}
        className='absolute inset-0 bg-void-black/80 backdrop-blur-sm'
        onClick={onBackdropClick}
        aria-hidden='true'
      />
      {/* Scanline FX on background */}
      <div
        className='absolute inset-0 pointer-events-none opacity-20'
        style={SCANLINE_STYLE}
      />

      <m.div
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={labelledBy}
        tabIndex={-1}
        {...panelProps}
        className={`relative w-full max-w-4xl border-toxic-green bg-void-black focus:outline-none motion-safe:animate-[glitch-anim_0.2s_ease-in-out] ${panelClassName}`}
      >
        {/* Hardware details */}
        <div className='absolute top-0 left-0 w-full h-1 bg-toxic-green'></div>
        <div
          className={`absolute top-0 left-2 h-4 bg-toxic-green text-void-black text-xs font-bold text-center leading-4 uppercase ${severityLabelClassName}`}
        >
          {severityLabel}
        </div>

        {children}
      </m.div>
    </m.div>
  )
}
