import { useTranslation } from 'react-i18next'

import type { DarkWebLeakConfig } from '../types'
import { ZealotryActionModal } from './ZealotryActionModal'

/**
 * Dark-web leak costs, availability state, and confirmation callbacks.
 */
export interface DarkWebLeakModalProps {
  config: DarkWebLeakConfig
  canLeak: boolean
  onConfirm: () => void
  onCancel: () => void
  hasLeakedToday: boolean
}

/**
 * Shows the dark-web leak costs, gains, daily lockout, and confirm/cancel actions.
 * @param props - Leak configuration, availability state, confirm/cancel handlers, and daily-use state.
 */
export const DarkWebLeakModal = ({
  config,
  canLeak,
  onConfirm,
  onCancel,
  hasLeakedToday
}: DarkWebLeakModalProps) => {
  const { t } = useTranslation(['ui'])
  return (
    <ZealotryActionModal
      config={config}
      canRun={canLeak}
      hasRunToday={hasLeakedToday}
      onConfirm={onConfirm}
      onCancel={onCancel}
      labels={{
        title: t('ui:dark_web_leak.title', {
          defaultValue: 'Dark Web Data Leak'
        }),
        description: t('ui:dark_web_leak.description', {
          defaultValue:
            'Leak unreleased tracks to the dark web to instantly boost your fame and zealotry. But beware, it will spark controversy and damage band harmony.'
        }),
        costLabel: t('ui:dark_web_leak.cost', { defaultValue: 'COST:' }),
        fameLabel: t('ui:dark_web_leak.fame', { defaultValue: 'FAME:' }),
        zealotryLabel: t('ui:dark_web_leak.zealotry', {
          defaultValue: 'ZEALOTRY:'
        }),
        controversyLabel: t('ui:dark_web_leak.controversy', {
          defaultValue: 'CONTROVERSY:'
        }),
        harmonyCostLabel: t('ui:dark_web_leak.harmony_cost', {
          defaultValue: 'HARMONY COST:'
        }),
        alreadyRanToday: t('ui:dark_web_leak.leaked_today', {
          defaultValue: 'Data leaked for today.'
        }),
        cancel: t('ui:dark_web_leak.cancel', { defaultValue: 'CANCEL' }),
        execute: t('ui:dark_web_leak.execute', { defaultValue: 'EXECUTE LEAK' })
      }}
    />
  )
}
