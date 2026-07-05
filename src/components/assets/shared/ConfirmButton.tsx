import type { ComponentPropsWithoutRef } from 'react'
import { ActionButton } from '../../../ui/shared/ActionButton'

/**
 * Defines the property structure for the confirmation button by extending the base action button attributes.
 */
export type ConfirmButtonProps = ComponentPropsWithoutRef<typeof ActionButton>

/**
 * Renders a primary confirmation button with distinctive styling for affirmative actions.
 *
 * @param props - The component attributes inherited from the base action button.
 * @returns The rendered confirmation button element.
 */
export const ConfirmButton = ({
  children,
  className = '',
  style,
  ...rest
}: ConfirmButtonProps) => {
  return (
    <ActionButton
      variant='custom'
      className={'px-3 py-2 text-sm disabled:opacity-40 ' + className}
      style={{
        background: 'var(--section-accent, var(--color-toxic-green))',
        color: 'var(--color-void-black)',
        ...style
      }}
      {...rest}
    >
      {children}
    </ActionButton>
  )
}
