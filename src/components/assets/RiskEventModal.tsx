import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getRiskEventImagePrompt } from '../../utils/imageGen'
import type { RiskEventType } from '../../types/assets'

interface Props {
  eventType: RiskEventType
  isOpen: boolean
  onClose: () => void
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
      className='max-w-lg'
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
          <button
            type='button'
            onClick={onClose}
            className='border-2 px-3 py-1'
            style={{
              background: 'var(--section-accent, var(--color-toxic-green))',
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
