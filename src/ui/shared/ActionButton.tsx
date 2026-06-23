/**
 * Shared button primitive module for generic overlay and dialogue actions.
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
 * Renders a standard `<button>` with shared action styling and forwarded button attributes.
 *
 * @param props - Button content, event handlers, optional ref, optional `variant`, and standard button attributes.
 */
export const ActionButton = memo(
  ({
    children,
    onClick,
    type = 'button',
    className = '',
    ref,
    variant = 'primary',
    ...rest
  }: ActionButtonProps) => {
    const baseStyles = `min-h-11 font-bold uppercase
                touch-manipulation text-center transition
                focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-toxic-green-20
                disabled:opacity-50 disabled:cursor-not-allowed`
    const variantStyles =
      variant === 'primary'
        ? `px-8 py-4 bg-toxic-green text-void-black
                hover:translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--color-toxic-green-bright)]
                disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:bg-toxic-green`
        : ''

    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        className={`${baseStyles} ${variantStyles} ${className}`}
        {...rest}
      >
        {children}
      </button>
    )
  }
)
