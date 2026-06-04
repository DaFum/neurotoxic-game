import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../utils/numberUtils'
import { GlitchButton } from '../../ui/GlitchButton'
import { Tooltip } from '../../ui/shared'
import { CLINIC_CONFIG } from '../../context/gameConstants'
import type {
  ClinicMemberCardProps,
  ActionButtonWrapperProps
} from '../../types/components'

const ActionButtonWrapper = ({
  disabledReason,
  children
}: ActionButtonWrapperProps) => {
  const buttonWithDisabled = children(Boolean(disabledReason))

  return disabledReason ? (
    <Tooltip content={disabledReason}>{buttonWithDisabled}</Tooltip>
  ) : (
    buttonWithDisabled
  )
}
/**
 * Displays one band member's clinic treatment options and affordability state.
 * @param props - Band member, player resources, clinic costs, and heal/enhance callbacks.
 */
export const ClinicMemberCard = ({
  member,
  player,
  healCostMoney,
  enhanceCostFame,
  healMember,
  enhanceMember
}: ClinicMemberCardProps) => {
  const { t, i18n } = useTranslation(['ui'])
  const memberId = member.id
  const isFullyHealed =
    member.stamina >= 100 &&
    (CLINIC_CONFIG.HEAL_MOOD_GAIN <= 0 || member.mood >= 100)
  const missingMemberReason = !memberId
    ? t('ui:clinic.invalidMember', {
        defaultValue: 'Member unavailable'
      })
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className='border border-toxic-green/30 bg-shadow-black/50 p-4 flex flex-col gap-4'
    >
      <div className='font-bold text-toxic-green text-xl uppercase'>
        {member.name}
      </div>

      <div className='text-xs font-mono text-ash-gray flex flex-col gap-1'>
        <div>
          {t('ui:clinic.stamina', { defaultValue: 'Stamina:' })}{' '}
          {member.stamina}%
        </div>
        <div>
          {t('ui:clinic.mood', { defaultValue: 'Mood:' })} {member.mood}%
        </div>
      </div>

      <div className='flex flex-col gap-2 mt-auto'>
        <ActionButtonWrapper
          disabledReason={
            missingMemberReason ??
            (player.money < healCostMoney
              ? t('ui:clinic.notEnoughMoney', {
                  defaultValue: 'Not enough money'
                })
              : isFullyHealed
                ? t('ui:clinic.fullyHealed', {
                    defaultValue: 'Member is already fully healed'
                  })
                : null)
          }
        >
          {disabled => (
            <GlitchButton
              onClick={() => {
                if (memberId) healMember(memberId)
              }}
              variant='primary'
              size='sm'
              disabled={disabled}
              className='w-full text-xs py-1'
            >
              {t('ui:clinic.heal_button', {
                defaultValue: 'HEAL ({{cost}})',
                cost: formatCurrency(healCostMoney, i18n.language)
              })}
            </GlitchButton>
          )}
        </ActionButtonWrapper>

        <ActionButtonWrapper
          disabledReason={
            missingMemberReason ??
            (player.fame < enhanceCostFame
              ? t('ui:clinic.notEnoughFame', {
                  defaultValue: 'Not enough fame'
                })
              : member.traits?.[CLINIC_CONFIG.CYBER_LUNGS_TRAIT_ID]
                ? t('ui:clinic.alreadyEnhanced', {
                    defaultValue: 'Member already has this enhancement'
                  })
                : null)
          }
        >
          {disabled => (
            <GlitchButton
              onClick={() => {
                if (memberId) {
                  enhanceMember(memberId, CLINIC_CONFIG.CYBER_LUNGS_TRAIT_ID)
                }
              }}
              variant='warning'
              size='sm'
              disabled={disabled}
              className='w-full text-xs py-1'
            >
              {t('ui:clinic.enhance_button', {
                defaultValue: 'GRAFT: CYBER LUNGS ({{fame}} Fame)',
                fame: enhanceCostFame
              })}
            </GlitchButton>
          )}
        </ActionButtonWrapper>
      </div>
    </motion.div>
  )
}
