import { ReactNode } from 'react'
import { ActionButton } from '../../../ui/shared/ActionButton'

export interface ConfirmButtonProps {
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}

export const ConfirmButton = ({ onClick, disabled, children }: ConfirmButtonProps) => {
  return (
    <ActionButton
      onClick={onClick}
      disabled={disabled}
      variant='custom'
      className='px-3 py-2 text-sm disabled:opacity-40'
      style={{
        background: 'var(--section-accent, var(--color-toxic-green))',
        color: 'var(--color-void-black)'
      }}
    >
      {children}
    </ActionButton>
  )
}
