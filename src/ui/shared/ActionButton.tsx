/**
 * Shared button primitive module for generic overlay and dialogue actions.
 */

import {
  memo,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type Ref
} from 'react'

/**
 * Visual variants `ActionButton` styles. `custom` applies no variant chrome and
 * no default focus ring: the caller supplies both through `className`.
 */
type ActionButtonVariant = 'primary' | 'secondary' | 'danger' | 'custom'

type ActionButtonProps = ComponentPropsWithoutRef<'button'> & {
  children: ReactNode
  ref?: Ref<HTMLButtonElement>
  variant?: ActionButtonVariant
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
    const isAriaDisabled =
      rest['aria-disabled'] === true || rest['aria-disabled'] === 'true'

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isAriaDisabled) {
        e.preventDefault()
        return
      }
      onClick?.(e)
    }

    const baseStyles = `min-h-11 font-bold uppercase
                touch-manipulation text-center transition
                focus-visible:outline-none
                disabled:opacity-50 disabled:cursor-not-allowed`
    const defaultFocusRing =
      variant !== 'custom'
        ? 'focus-visible:ring-4 focus-visible:ring-toxic-green-20'
        : ''
    const ariaDisabledStyles = isAriaDisabled
      ? 'opacity-60 cursor-not-allowed border-ash-gray text-ash-gray hover:translate-x-0 hover:translate-y-0 hover:shadow-none'
      : ''
    const variantStyles =
      variant === 'primary'
        ? `px-8 py-4 bg-toxic-green text-void-black
                ${!isAriaDisabled ? 'enabled:hover:translate-x-1 enabled:hover:-translate-y-1 enabled:hover:shadow-[4px_4px_0px_var(--color-toxic-green-bright)]' : ''}`
        : variant === 'secondary'
          ? `border-2 border-steel-gray text-toxic-green
                ${!isAriaDisabled ? 'enabled:hover:border-toxic-green enabled:hover:bg-toxic-green enabled:hover:text-void-black' : ''}`
          : variant === 'danger'
            ? `border-2 border-blood-red text-star-white
                ${!isAriaDisabled ? 'enabled:hover:bg-blood-red enabled:hover:text-void-black' : ''}`
            : ''

    return (
      <button
        ref={ref}
        type={type}
        onClick={handleClick}
        className={`${baseStyles} ${defaultFocusRing} ${variantStyles} ${ariaDisabledStyles} ${className}`}
        {...rest}
      >
        {children}
      </button>
    )
  }
)
