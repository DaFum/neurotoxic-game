import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import type { ZealotryActionConfig } from '../types'
import { ZealotryActionModal } from './ZealotryActionModal'

type PirateRadioModalProps = {
  onClose: () => void
  onBroadcast: () => void
  canBroadcast: boolean
  hasBroadcastedToday: boolean
  config: ZealotryActionConfig
}

/**
 * Shows the pirate radio broadcast costs, gains, daily lockout, and transmit/cancel actions.
 * @param props - Broadcast configuration, availability state, and handlers.
 */
export const PirateRadioModal = memo(
  ({
    onClose,
    onBroadcast,
    canBroadcast,
    hasBroadcastedToday,
    config
  }: PirateRadioModalProps) => {
    const { t } = useTranslation(['ui'])
    const cooldown = t('ui:pirate_radio.cooldown', {
      defaultValue: 'ON COOLDOWN'
    })

    return (
      <ZealotryActionModal
        config={config}
        canRun={canBroadcast}
        hasRunToday={hasBroadcastedToday}
        onConfirm={onBroadcast}
        onCancel={onClose}
        labels={{
          title: t('ui:pirate_radio.title', {
            defaultValue: 'PIRATE RADIO BROADCAST'
          }),
          description: t('ui:pirate_radio.description', {
            defaultValue:
              'Hack local frequencies and broadcast your rawest tracks. The signal will reach the desperate and the disillusioned, boosting your fame and feeding the cult.'
          }),
          costLabel: t('ui:pirate_radio.cost', {
            defaultValue: 'COST (BRIBES/TECH):'
          }),
          fameLabel: t('ui:pirate_radio.fame_gain', {
            defaultValue: 'FAME GAIN:'
          }),
          zealotryLabel: t('ui:pirate_radio.zealotry_gain', {
            defaultValue: 'ZEALOTRY GAIN:'
          }),
          controversyLabel: t('ui:pirate_radio.controversy_gain', {
            defaultValue: 'CONTROVERSY:'
          }),
          harmonyCostLabel: t('ui:pirate_radio.harmony_cost', {
            defaultValue: 'HARMONY DRAIN:'
          }),
          alreadyRanToday: cooldown,
          cancel: t('ui:action_cancel', { defaultValue: 'CANCEL' }),
          execute: hasBroadcastedToday
            ? cooldown
            : t('ui:button.transmit', { defaultValue: 'TRANSMIT' })
        }}
      />
    )
  }
)
