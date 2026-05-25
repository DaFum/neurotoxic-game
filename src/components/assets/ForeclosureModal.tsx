import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getRiskEventImagePrompt } from '../../utils/imageGen'

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
  const { t } = useTranslation(['assets'])
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('assets:foreclosure')}
      className='max-w-lg'
    >
      <div className='flex flex-col gap-3 p-4 font-mono text-sm'>
        <GeneratedImagePanel
          prompt={getRiskEventImagePrompt('foreclosure')}
          alt={t('assets:foreclosure')}
          aspectRatio='16:9'
          sizeHint={{ width: 640, height: 360 }}
        />
        <p style={{ color: 'var(--color-blood)' }}>
          {t('assets:liability.foreclosureNotice')}
          {assetLabel ? ` (${assetLabel})` : ''}
        </p>
        <div className='flex justify-end'>
          <button
            type='button'
            onClick={onClose}
            className='border-2 px-3 py-1'
            style={{
              background: 'var(--color-blood)',
              color: 'var(--color-void)'
            }}
          >
            {t('ui:action_close', { defaultValue: 'Close' })}
          </button>
        </div>
      </div>
    </Modal>
  )
}
