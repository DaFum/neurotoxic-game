import { useTranslation } from 'react-i18next'
import type { ComponentPropsWithoutRef } from 'react'
import { ActionButton } from '../../../ui/shared/ActionButton'

/**
 * Properties for the CancelButton component, extending ActionButton props but omitting children.
 */
export type CancelButtonProps = Omit<
  ComponentPropsWithoutRef<typeof ActionButton>,
  'children'
>

/**
 * Renders a standardized cancel button using Brutalist UI aesthetics.
 *
 * @param props - The component properties.
 * @returns A localized cancel button element.
 */
export const CancelButton = ({
  className = '',
  ...rest
}: CancelButtonProps) => {
  const { t } = useTranslation(['ui'])

  return (
    <ActionButton
      variant='custom'
      className={
        'bg-void-black text-ash-gray border-2 border-ash-gray px-3 py-2 text-sm hover:bg-ash-gray hover:text-void-black ' +
        className
      }
      {...rest}
    >
      {t('ui:action_cancel')}
    </ActionButton>
  )
}
