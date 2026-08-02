import { useTranslation } from 'react-i18next'

import type { CultIndoctrinationConfig } from '../types'
import { ZealotryActionModal } from './ZealotryActionModal'

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
  const { t } = useTranslation(['ui'])
  return (
    <ZealotryActionModal
      config={config}
      canRun={canIndoctrinate}
      hasRunToday={hasIndoctrinatedToday}
      onConfirm={onConfirm}
      onCancel={onCancel}
      labels={{
        title: t('ui:cult_indoctrination.title', {
          defaultValue: 'Cult Indoctrination'
        }),
        description: t('ui:cult_indoctrination.description', {
          defaultValue:
            'Indoctrinate followers to instantly boost your fame and zealotry. But beware, it will heavily spark controversy and damage band harmony.'
        }),
        costLabel: t('ui:cult_indoctrination.cost', { defaultValue: 'COST:' }),
        fameLabel: t('ui:cult_indoctrination.fame', { defaultValue: 'FAME:' }),
        zealotryLabel: t('ui:cult_indoctrination.zealotry', {
          defaultValue: 'ZEALOTRY:'
        }),
        controversyLabel: t('ui:cult_indoctrination.controversy', {
          defaultValue: 'CONTROVERSY:'
        }),
        harmonyCostLabel: t('ui:cult_indoctrination.harmony_cost', {
          defaultValue: 'HARMONY COST:'
        }),
        alreadyRanToday: t('ui:cult_indoctrination.indoctrinated_today', {
          defaultValue: 'Followers already indoctrinated today.'
        }),
        cancel: t('ui:cult_indoctrination.cancel', { defaultValue: 'CANCEL' }),
        execute: t('ui:cult_indoctrination.execute', {
          defaultValue: 'EXECUTE INDOCTRINATION'
        })
      }}
    />
  )
}
