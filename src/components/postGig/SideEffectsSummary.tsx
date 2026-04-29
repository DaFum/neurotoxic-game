import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { formatCurrency } from '../../utils/numberUtils'
import type { TFunction } from 'i18next'

type SideEffectsResult = {
  moneyChange?: number
  harmonyChange?: number
  controversyChange?: number
  loyaltyChange?: number
  staminaChange?: number
  moodChange?: number
  targetMember?: string
}

type SideEffectsSummaryProps = {
  result: SideEffectsResult
  i18n?: { language?: string }
  t: TFunction
}

export const SideEffectsSummary = ({
  result,
  i18n,
  t
}: SideEffectsSummaryProps) => {
  const getDeltaColorClass = (
    value: number,
    {
      positive = 'text-toxic-green',
      negative = 'text-blood-red',
      neutral = 'text-ash-gray'
    }: { positive?: string; negative?: string; neutral?: string } = {}
  ) => {
    if (value > 0) return positive
    if (value < 0) return negative
    return neutral
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8 }}
      className='mb-8 flex flex-col items-center gap-2 font-mono text-sm'
    >
      {result.moneyChange != null ? (
        <div className={getDeltaColorClass(result.moneyChange)}>
          💰 {formatCurrency(result.moneyChange, i18n?.language, 'always')}
        </div>
      ) : null}

      {result.harmonyChange != null ? (
        <div className={getDeltaColorClass(result.harmonyChange)}>
          🎸 {t('ui:postGig.harmony', { defaultValue: 'Harmony' })}{' '}
          {result.harmonyChange > 0 ? '+' : ''}
          {result.harmonyChange}
        </div>
      ) : null}

      {result.controversyChange != null ? (
        <div
          className={getDeltaColorClass(result.controversyChange, {
            positive: 'text-blood-red',
            negative: 'text-toxic-green'
          })}
        >
          {result.controversyChange > 0 ? '⚠️' : '🛡️'}{' '}
          {t('ui:postGig.controversy', { defaultValue: 'Controversy' })}{' '}
          {result.controversyChange > 0 ? '+' : ''}
          {result.controversyChange}
        </div>
      ) : null}

      {result.loyaltyChange != null ? (
        <div className={getDeltaColorClass(result.loyaltyChange)}>
          🛡️ {t('ui:postGig.loyalty', { defaultValue: 'Loyalty' })}{' '}
          {result.loyaltyChange > 0 ? '+' : ''}
          {result.loyaltyChange}
        </div>
      ) : null}

      {result.staminaChange != null || result.moodChange != null ? (
        <div className='text-ash-gray'>
          👥{' '}
          {result.targetMember
            ? t('ui:postGig.memberAffected', {
                member: result.targetMember,
                defaultValue: `${result.targetMember} Affected`
              })
            : t('ui:postGig.bandAffected', {
                defaultValue: 'Band Affected'
              })}
          {result.staminaChange != null ? (
            <span
              className={`${getDeltaColorClass(result.staminaChange)} ml-2`}
            >
              {result.staminaChange > 0 ? '+' : ''}
              {result.staminaChange}{' '}
              {t('ui:postGig.stamina', { defaultValue: 'Stamina' })}
            </span>
          ) : null}
          {result.moodChange != null ? (
            <span className={`${getDeltaColorClass(result.moodChange)} ml-2`}>
              {result.moodChange > 0 ? '+' : ''}
              {result.moodChange}{' '}
              {t('ui:postGig.mood', { defaultValue: 'Mood' })}
            </span>
          ) : null}
        </div>
      ) : null}
    </motion.div>
  )
}

SideEffectsSummary.propTypes = {
  result: PropTypes.shape({
    moneyChange: PropTypes.number,
    harmonyChange: PropTypes.number,
    controversyChange: PropTypes.number,
    loyaltyChange: PropTypes.number,
    staminaChange: PropTypes.number,
    moodChange: PropTypes.number,
    targetMember: PropTypes.string
  }).isRequired,
  i18n: PropTypes.object,
  t: PropTypes.func.isRequired
}
