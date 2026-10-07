import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getRiskEventImagePrompt } from '../../utils/imageGen'
import { ConfirmButton } from './shared/ConfirmButton'
import type { RiskEventType } from '../../types/assets'
import type { BaseModalProps } from '../../types/ui'

interface Props extends BaseModalProps {
  eventType: RiskEventType
}

/**
 * Surfaces a triggered risk event to the player. The reducer applies the
 * condition loss before this modal opens; this is purely informative —
 * acknowledge-only, no actionable decisions.
 *
 * Toasts in handleAdvanceDay already announce the event; this modal is for
 * cases where the section view wants to surface the full event card on
 * arrival (post-tick interstitial), reusing the same i18n keys.
 */
export const RiskEventModal = ({ eventType, isOpen, onClose }: Props) => {
  const { t } = useTranslation(['assets', 'ui'])
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(`assets:risk.event.${eventType}`)}
      className='assets-modal-sheet max-w-lg'
    >
      <div className='flex flex-col gap-3 p-4 font-mono text-sm'>
        <GeneratedImagePanel
          prompt={getRiskEventImagePrompt(eventType)}
          alt={t(`assets:risk.event.${eventType}`)}
          aspectRatio='16:9'
          sizeHint={{ width: 640, height: 360 }}
        />
        <p>{t(`assets:risk.event.${eventType}`)}</p>
        <div className='flex justify-end'>
          <ConfirmButton onClick={onClose}>
            {t('ui:action_close', { defaultValue: 'Close' })}
          </ConfirmButton>
        </div>
      </div>
    </Modal>
  )
}
