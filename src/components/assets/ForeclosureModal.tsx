import { useTranslation } from 'react-i18next'
import { CrisisModal } from '../../ui/shared'
import type { BaseModalProps } from '../../types/ui'

/**
 * Defines the configuration properties for the ForeclosureModal component.
 */
interface Props extends BaseModalProps {
  /** Optional kind label providing context on the specific asset type foreclosed. */
  assetLabel?: string
}

/**
 * Renders the player-facing foreclosure announcement modal.
 *
 * @remarks
 * Triggered by `processLiabilityTick` when a liability's `defaultCounter` hits 7.
 * The reducer has already removed the asset and liability from state; this modal
 * serves purely as the user notification.
 *
 * @param props - The component properties, including the optional asset label, open state, and close callback.
 * @returns A JSX element containing the foreclosure crisis modal.
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
          id: 'close',
          label: t('ui:action_close', { defaultValue: 'Close' }),
          variant: 'danger',
          onClick: onClose
        }
      ]}
    />
  )
}
