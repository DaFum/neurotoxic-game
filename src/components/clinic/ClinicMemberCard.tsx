import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../utils/numberUtils'
import { GlitchButton } from '../../ui/GlitchButton'
import { Tooltip } from '../../ui/shared'
import { useState } from 'react'
import { CLINIC_CONFIG, CLINIC_GRAFT_COST } from '../../context/gameConstants'
import { GraftModal } from './GraftModal'
import { hasTrait } from '../../utils/traitUtils'
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
  enhanceMember,
  graftNeuroOverclock
}: ClinicMemberCardProps) => {
  const { t, i18n } = useTranslation(['ui'])
  const memberId = member.id
  const canAffordGraft = player.money >= CLINIC_GRAFT_COST
  const hasGraft = hasTrait(member, 'neuro_overclock')
  const [isGraftModalOpen, setIsGraftModalOpen] = useState(false)
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
              : hasTrait(member, CLINIC_CONFIG.CYBER_LUNGS_TRAIT_ID)
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

        <div className='mt-3 border-t border-toxic-green/30 pt-3'>
          <ActionButtonWrapper
            disabledReason={
              missingMemberReason ??
              (!canAffordGraft
                ? t('ui:clinic.notEnoughMoney', {
                    defaultValue: 'Not enough money'
                  })
                : hasGraft
                  ? t('ui:clinic.alreadyGrafted', {
                      defaultValue: 'Member already has this graft'
                    })
                  : null)
            }
          >
            {disabled => (
              <GlitchButton
                onClick={() => setIsGraftModalOpen(true)}
                disabled={disabled}
                variant='danger'
                className='w-full text-xs py-2'
              >
                {hasGraft
                  ? t('ui:clinic.graft_button_applied', {
                      defaultValue: '[ GRAFTED ]'
                    })
                  : t('ui:clinic.graft_button', {
                      defaultValue: '[ GRAFT: NEURO-OVERCLOCK {{cost}} ]',
                      cost: formatCurrency(CLINIC_GRAFT_COST, i18n.language)
                    })}
              </GlitchButton>
            )}
          </ActionButtonWrapper>
        </div>
      </div>

      <GraftModal
        isOpen={isGraftModalOpen}
        onClose={() => setIsGraftModalOpen(false)}
        onConfirm={() => {
          if (memberId) {
            graftNeuroOverclock(memberId)
          }
          setIsGraftModalOpen(false)
        }}
        memberName={
          member.name ||
          t('ui:clinic.unknown_member', { defaultValue: 'Unknown' })
        }
        cost={CLINIC_GRAFT_COST}
      />
    </motion.div>
  )
}
