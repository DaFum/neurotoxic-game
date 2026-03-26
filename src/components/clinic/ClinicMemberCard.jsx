/*
 * (#1) Actual Updates: Extracted ClinicMemberCard into a separate component.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { GlitchButton } from '../../ui/GlitchButton'
import { Tooltip } from '../../ui/shared'
import { CLINIC_CONFIG } from '../../context/gameConstants'

const HealButtonWrapper = ({
  member,
  player,
  healCostMoney,
  healMember,
  t
}) => {
  const healDisabledReason =
    player.money < healCostMoney
      ? t('ui:clinic.notEnoughMoney', { defaultValue: 'Not enough money' })
      : member.stamina >= 100 &&
          (CLINIC_CONFIG.HEAL_MOOD_GAIN === 0 || member.mood >= 100)
        ? t('ui:clinic.fullyHealed', {
            defaultValue: 'Member is already fully healed'
          })
        : null

  const healButton = (
    <GlitchButton
      onClick={() => healMember(member.id)}
      disabled={Boolean(healDisabledReason)}
      variant='primary'
      size='sm'
      className='w-full text-xs py-1'
    >
      {t('ui:clinic.heal_button', {
        defaultValue: 'HEAL ({{cost}}€)',
        cost: healCostMoney
      })}
    </GlitchButton>
  )

  return healDisabledReason ? (
    <Tooltip content={healDisabledReason} className='w-full block'>
      {healButton}
    </Tooltip>
  ) : (
    healButton
  )
}

HealButtonWrapper.propTypes = {
  member: PropTypes.object.isRequired,
  player: PropTypes.object.isRequired,
  healCostMoney: PropTypes.number.isRequired,
  healMember: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
}

const EnhanceButtonWrapper = ({
  member,
  player,
  enhanceCostFame,
  enhanceMember,
  t
}) => {
  const enhanceDisabledReason =
    player.fame < enhanceCostFame
      ? t('ui:clinic.notEnoughFame', { defaultValue: 'Not enough fame' })
      : member.traits?.[CLINIC_CONFIG.CYBER_LUNGS_TRAIT_ID]
        ? t('ui:clinic.alreadyEnhanced', {
            defaultValue: 'Member already has this enhancement'
          })
        : null

  const enhanceButton = (
    <GlitchButton
      onClick={() =>
        enhanceMember(member.id, CLINIC_CONFIG.CYBER_LUNGS_TRAIT_ID)
      }
      disabled={Boolean(enhanceDisabledReason)}
      variant='warning'
      size='sm'
      className='w-full text-xs py-1'
    >
      {t('ui:clinic.enhance_button', {
        defaultValue: 'GRAFT: CYBER LUNGS ({{fame}} Fame)',
        fame: enhanceCostFame
      })}
    </GlitchButton>
  )

  return enhanceDisabledReason ? (
    <Tooltip content={enhanceDisabledReason} className='w-full block'>
      {enhanceButton}
    </Tooltip>
  ) : (
    enhanceButton
  )
}

EnhanceButtonWrapper.propTypes = {
  member: PropTypes.object.isRequired,
  player: PropTypes.object.isRequired,
  enhanceCostFame: PropTypes.number.isRequired,
  enhanceMember: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
}

export const ClinicMemberCard = ({
  member,
  player,
  healCostMoney,
  enhanceCostFame,
  healMember,
  enhanceMember
}) => {
  const { t } = useTranslation(['ui'])

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
        <HealButtonWrapper
          member={member}
          player={player}
          healCostMoney={healCostMoney}
          healMember={healMember}
          t={t}
        />
        <EnhanceButtonWrapper
          member={member}
          player={player}
          enhanceCostFame={enhanceCostFame}
          enhanceMember={enhanceMember}
          t={t}
        />
      </div>
    </motion.div>
  )
}

ClinicMemberCard.propTypes = {
  member: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    stamina: PropTypes.number.isRequired,
    mood: PropTypes.number.isRequired,
    traits: PropTypes.object
  }).isRequired,
  player: PropTypes.shape({
    money: PropTypes.number.isRequired,
    fame: PropTypes.number.isRequired
  }).isRequired,
  healCostMoney: PropTypes.number.isRequired,
  enhanceCostFame: PropTypes.number.isRequired,
  healMember: PropTypes.func.isRequired,
  enhanceMember: PropTypes.func.isRequired
}
