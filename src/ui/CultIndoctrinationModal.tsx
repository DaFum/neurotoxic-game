import { Modal } from './shared/Modal'
import { GlitchButton } from './GlitchButton'
import { useTranslation } from 'react-i18next'

import type { CultIndoctrinationConfig } from '../types'
import { formatCurrency } from '../utils/numberUtils'

/**
 * Cult indoctrination costs, availability state, and confirmation callbacks.
 */
export interface CultIndoctrinationModalProps {
  config: CultIndoctrinationConfig
  canIndoctrinate: boolean
  onConfirm: () => void
  onCancel: () => void
  hasIndoctrinatedToday: boolean
}

/**
 * Shows the cult indoctrination costs, gains, daily lockout, and confirm/cancel actions.
 * @param props - Indoctrination configuration, availability state, confirm/cancel handlers, and daily-use state.
 */
export const CultIndoctrinationModal = ({
  config,
  canIndoctrinate,
  onConfirm,
  onCancel,
  hasIndoctrinatedToday
}: CultIndoctrinationModalProps) => {
  const { t, i18n } = useTranslation(['ui'])
  return (
    <Modal
      title={t('ui:cult_indoctrination.title', {
        defaultValue: 'Cult Indoctrination'
      })}
      onClose={onCancel}
      isOpen={true}
    >
      <div className='flex flex-col gap-4 p-4 border border-toxic-green bg-void-black/90 text-star-white'>
        <p className='text-sm'>
          {t('ui:cult_indoctrination.description', {
            defaultValue:
              'Indoctrinate followers to instantly boost your fame and zealotry. But beware, it will heavily spark controversy and damage band harmony.'
          })}
        </p>
        <div className='flex flex-col gap-1 text-sm bg-black/50 p-2 border border-toxic-green/50'>
          <div className='text-error-red'>
            {t('ui:cult_indoctrination.cost', { defaultValue: 'COST:' })}{' '}
            {formatCurrency(config.COST, i18n.language)}
          </div>
          <div className='text-stamina-green'>
            {t('ui:cult_indoctrination.fame', { defaultValue: 'FAME:' })} +
            {config.FAME_GAIN}
          </div>
          <div className='text-warning-yellow'>
            {t('ui:cult_indoctrination.zealotry', {
              defaultValue: 'ZEALOTRY:'
            })}{' '}
            +{config.ZEALOTRY_GAIN}
          </div>
          <div className='text-toxic-green'>
            {t('ui:cult_indoctrination.controversy', {
              defaultValue: 'CONTROVERSY:'
            })}{' '}
            +{config.CONTROVERSY_GAIN}
          </div>
          <div className='text-error-red'>
            {t('ui:cult_indoctrination.harmony_cost', {
              defaultValue: 'HARMONY COST:'
            })}{' '}
            -{config.HARMONY_COST}
          </div>
        </div>
        {hasIndoctrinatedToday && (
          <p className='text-error-red text-sm font-bold border border-error-red p-1 text-center'>
            {t('ui:cult_indoctrination.indoctrinated_today', {
              defaultValue: 'Followers already indoctrinated today.'
            })}
          </p>
        )}
        <div className='flex justify-end gap-2 mt-4'>
          <GlitchButton variant='primary' onClick={onCancel}>
            {t('ui:cult_indoctrination.cancel', { defaultValue: 'CANCEL' })}
          </GlitchButton>
          <GlitchButton
            variant='danger'
            onClick={onConfirm}
            disabled={!canIndoctrinate || hasIndoctrinatedToday}
          >
            {t('ui:cult_indoctrination.execute', {
              defaultValue: 'EXECUTE INDOCTRINATION'
            })}
          </GlitchButton>
        </div>
      </div>
    </Modal>
  )
}
