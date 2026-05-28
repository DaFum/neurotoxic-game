/**
 * ActionButton - A standardized action button for overlays and dialogues.
 * @module ActionButton
 */

import {
  memo,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type Ref
} from 'react'

type ActionButtonProps = ComponentPropsWithoutRef<'button'> & {
  children: ReactNode
  ref?: Ref<HTMLButtonElement>
  variant?: string
}

/**
 * ActionButton - A standardized action button for overlays and dialogues.
 */
export const ActionButton = memo(
  ({
    children,
    onClick,
    type = 'button',
    className = '',
    ref,
    variant: _variant,
    ...rest
  }: ActionButtonProps) => (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      className={`px-8 py-4 min-h-11 bg-toxic-green text-void-black font-bold uppercase
                touch-manipulation text-center
                hover:scale-105 hover:bg-toxic-green-bright transition
                focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-toxic-green-20
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-toxic-green
                ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
)
