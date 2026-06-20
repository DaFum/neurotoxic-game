import { useTranslation } from 'react-i18next'
import { ActionButton } from '../../../ui/shared/ActionButton'

export interface CancelButtonProps {
  onClick: () => void
}

export const CancelButton = ({ onClick }: CancelButtonProps) => {
  const { t } = useTranslation(['ui'])

  return (
    <ActionButton
      onClick={onClick}
      variant='custom'
      className='bg-void-black text-ash-gray border-2 border-ash-gray px-3 py-2 text-sm hover:bg-ash-gray hover:text-void-black'
    >
      {t('ui:action_cancel')}
    </ActionButton>
  )
}
