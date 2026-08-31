import { Modal } from './shared/Modal'
import { GlitchButton } from './GlitchButton'
import { Tooltip } from './shared/Tooltip'
import { useGameSelector } from '../context/GameState'
import { isFiniteNumber } from '../utils/finiteNumber'
import { useTranslation } from 'react-i18next'
import type { ZealotryActionConfig } from '../types'
import { formatCurrency, formatNumber } from '../utils/numberUtils'

/**
 * Pre-translated strings for one zealotry action modal.
 *
 * @remarks
 * Resolved by the caller so every `t()` call stays statically extractable.
 */
interface ZealotryActionModalLabels {
  title: string
  description: string
  costLabel: string
  fameLabel: string
  zealotryLabel: string
  controversyLabel: string
  harmonyCostLabel: string
  alreadyRanToday: string
  cancel: string
  execute: string
}

/**
 * Shared body for the dark-web leak and cult indoctrination modals.
 */
export interface ZealotryActionModalProps {
  config: ZealotryActionConfig
  labels: ZealotryActionModalLabels
  canRun: boolean
  hasRunToday: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Shows a zealotry action's costs, gains, daily lockout, and confirm/cancel actions.
 *
 * @param props - Action configuration, resolved labels, availability state, and handlers.
 */
export const ZealotryActionModal = ({
  config,
  labels,
  canRun,
  hasRunToday,
  onConfirm,
  onCancel
}: ZealotryActionModalProps) => {
  const { t, i18n } = useTranslation(['ui'])
  const player = useGameSelector(state => state.player)
  const band = useGameSelector(state => state.band)
  const social = useGameSelector(state => state.social)

  const isMoneyValid = isFiniteNumber(player?.money)
  const isHarmonyValid = isFiniteNumber(band?.harmony)
  const isControversyValid = isFiniteNumber(social?.controversyLevel)
  const isZealotryValid = isFiniteNumber(social?.zealotry)

  const isAffordable = isMoneyValid && (player?.money as number) >= config.COST
  const hasEnoughHarmony =
    isHarmonyValid && (band?.harmony as number) >= config.HARMONY_COST
  const meetsControversy =
    config.REQUIRED_CONTROVERSY == null ||
    (isControversyValid &&
      (social?.controversyLevel as number) >= config.REQUIRED_CONTROVERSY)
  const meetsZealotry =
    config.REQUIRED_ZEALOTRY == null ||
    (isZealotryValid &&
      (social?.zealotry as number) >= config.REQUIRED_ZEALOTRY)

  const isDisabled = !canRun || hasRunToday
  const disabledReason = hasRunToday
    ? labels.alreadyRanToday
    : !isAffordable
      ? t('ui:zealotry.not_enough_money', {
          defaultValue: 'Not enough money'
        })
      : !hasEnoughHarmony
        ? t('ui:zealotry.not_enough_harmony', {
            defaultValue: 'Not enough band harmony'
          })
        : !meetsControversy
          ? t('ui:zealotry.not_enough_controversy', {
              defaultValue: 'Not enough controversy'
            })
          : !meetsZealotry
            ? t('ui:zealotry.not_enough_zealotry', {
                defaultValue: 'Not enough zealotry'
              })
            : t('ui:shop.messages.purchaseFailed', {
                defaultValue: 'Purchase failed!'
              })

  const executeButton = (
    <GlitchButton variant='danger' onClick={onConfirm} disabled={isDisabled}>
      {labels.execute}
    </GlitchButton>
  )

  return (
    <Modal title={labels.title} onClose={onCancel} isOpen={true}>
      <div className='flex flex-col gap-4 p-4 border border-toxic-green bg-void-black/90 text-star-white'>
        <p className='text-sm'>{labels.description}</p>
        <div className='flex flex-col gap-1 text-sm bg-void-black/50 p-2 border border-toxic-green/50'>
          <div className='text-error-red'>
            {labels.costLabel} {formatCurrency(config.COST, i18n.language)}
          </div>
          <div className='text-stamina-green'>
            {labels.fameLabel} +{formatNumber(config.FAME_GAIN, i18n.language)}
          </div>
          <div className='text-warning-yellow'>
            {labels.zealotryLabel} +
            {formatNumber(config.ZEALOTRY_GAIN, i18n.language)}
          </div>
          <div className='text-toxic-green'>
            {labels.controversyLabel} +
            {formatNumber(config.CONTROVERSY_GAIN, i18n.language)}
          </div>
          <div className='text-error-red'>
            {labels.harmonyCostLabel} -
            {formatNumber(config.HARMONY_COST, i18n.language)}
          </div>
        </div>
        {hasRunToday && (
          <p className='text-error-red text-sm font-bold border border-error-red p-1 text-center'>
            {labels.alreadyRanToday}
          </p>
        )}
        <div className='flex justify-end gap-2 mt-4'>
          <GlitchButton variant='primary' onClick={onCancel}>
            {labels.cancel}
          </GlitchButton>
          {isDisabled ? (
            <Tooltip content={disabledReason}>{executeButton}</Tooltip>
          ) : (
            executeButton
          )}
        </div>
      </div>
    </Modal>
  )
}
