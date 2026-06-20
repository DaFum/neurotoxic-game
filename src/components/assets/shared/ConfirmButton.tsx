import type { ComponentPropsWithoutRef } from 'react'
import { ActionButton } from '../../../ui/shared/ActionButton'

export type ConfirmButtonProps = ComponentPropsWithoutRef<typeof ActionButton>

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
