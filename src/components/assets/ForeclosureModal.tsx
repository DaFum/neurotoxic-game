import { useTranslation } from 'react-i18next'
import { CrisisModal } from '../../ui/shared'

interface Props {
  // Optional kind label — sections may pass a pre-resolved
  // `assets:kind.<kind>`-translated string here.
  assetLabel?: string
  isOpen: boolean
  onClose: () => void
}

/**
 * Foreclosure announcement. Triggered by processLiabilityTick when a
 * liability's defaultCounter hits 7. The reducer has already removed the
 * asset + liability; this modal is the player-facing notification.
 */
export const ForeclosureModal = ({ assetLabel, isOpen, onClose }: Props) => {
  const { t } = useTranslation(['assets', 'ui'])
  return (
    <CrisisModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('assets:foreclosure')}
      description={
        assetLabel
          ? t('assets:liability.foreclosureNoticeWithAsset', {
              asset: assetLabel
            })
          : t('assets:liability.foreclosureNotice')
      }
      className='assets-modal-sheet max-w-lg'
      actions={[
        {
          label: t('ui:action_close', { defaultValue: 'Close' }),
          variant: 'danger',
          onClick: onClose
        }
      ]}
    />
  )
}
