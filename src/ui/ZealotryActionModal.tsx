import { Modal } from './shared/Modal'
import { GlitchButton } from './GlitchButton'
import { Tooltip } from './shared/Tooltip'
import { useGameSelector } from '../context/GameState'
import { isFiniteNumber } from '../utils/finiteNumber'
import { useTranslation } from 'react-i18next'
import type { ZealotryActionConfig } from '../types'
import { formatCurrency, formatNumber } from '../utils/numberUtils'
import type { TFunction } from 'i18next'

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
 * `ui:` locale prefixes whose keys follow the standard zealotry modal layout
 * (`title`, `description`, `cost`, `fame`, `zealotry`, `controversy`,
 * `harmony_cost`, `ran_today`, `execute`).
 */
type ZealotryActionI18nPrefix = 'dark_web_leak' | 'cult_indoctrination'

/**
 * Either pre-resolved labels (actions with bespoke copy, e.g. Pirate Radio) or
 * a locale prefix the modal resolves its labels from.
 */
type ZealotryActionModalCopy =
  | { labels: ZealotryActionModalLabels; i18nPrefix?: never }
  | { i18nPrefix: ZealotryActionI18nPrefix; labels?: never }

/**
 * Shared body for the zealotry social-action modals (Pirate Radio, Dark Web
 * Leak, Cult Indoctrination).
 */
type ZealotryActionModalProps = ZealotryActionModalCopy & {
  config: ZealotryActionConfig
  canRun: boolean
  hasRunToday: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Resolves the standard zealotry modal labels from a `ui:` locale prefix.
 *
 * @param t - Translation function scoped to the `ui` namespace.
 * @param prefix - Locale prefix of the action.
 * @returns The translated labels.
 */
const resolvePrefixedLabels = (
  t: TFunction,
  prefix: ZealotryActionI18nPrefix
): ZealotryActionModalLabels => ({
  title: t(`ui:${prefix}.title`),
  description: t(`ui:${prefix}.description`),
  costLabel: t(`ui:${prefix}.cost`, { defaultValue: 'COST:' }),
  fameLabel: t(`ui:${prefix}.fame`, { defaultValue: 'FAME:' }),
  zealotryLabel: t(`ui:${prefix}.zealotry`, { defaultValue: 'ZEALOTRY:' }),
  controversyLabel: t(`ui:${prefix}.controversy`, {
    defaultValue: 'CONTROVERSY:'
  }),
  harmonyCostLabel: t(`ui:${prefix}.harmony_cost`, {
    defaultValue: 'HARMONY COST:'
  }),
  alreadyRanToday: t(`ui:${prefix}.ran_today`),
  cancel: t('ui:action_cancel', { defaultValue: 'CANCEL' }),
  execute: t(`ui:${prefix}.execute`)
})

/**
 * Shows a zealotry action's costs, gains, daily lockout, and confirm/cancel actions.
 *
 * @param props - Action configuration, labels or their locale prefix, availability state, and handlers.
 */
export const ZealotryActionModal = (props: ZealotryActionModalProps) => {
  const { config, canRun, hasRunToday, onConfirm, onCancel } = props
  const { t, i18n } = useTranslation(['ui'])
  const labels =
    props.i18nPrefix !== undefined
      ? resolvePrefixedLabels(t, props.i18nPrefix)
      : props.labels
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
    <GlitchButton
      variant='danger'
      onClick={e => {
        if (isDisabled) {
          e.preventDefault()
          return
        }
        onConfirm()
      }}
      aria-disabled={isDisabled}
    >
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
