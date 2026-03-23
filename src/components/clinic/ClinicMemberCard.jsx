import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { GlitchButton } from '../../ui/GlitchButton'
import { CLINIC_CONFIG } from '../../context/gameConstants'

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
        <GlitchButton
          onClick={() => healMember(member.id)}
          disabled={
            player.money < healCostMoney ||
            (member.stamina >= 100 &&
              (CLINIC_CONFIG.HEAL_MOOD_GAIN === 0 || member.mood >= 100))
          }
          variant='primary'
          size='sm'
          className='w-full text-xs py-1'
        >
          {t('ui:clinic.heal_button', {
            defaultValue: 'HEAL ({{cost}}€)',
            cost: healCostMoney
          })}
        </GlitchButton>

        <GlitchButton
          onClick={() =>
            enhanceMember(member.id, CLINIC_CONFIG.CYBER_LUNGS_TRAIT_ID)
          }
          disabled={
            player.fame < enhanceCostFame ||
            !!member.traits?.[CLINIC_CONFIG.CYBER_LUNGS_TRAIT_ID]
          }
          variant='warning'
          size='sm'
          className='w-full text-xs py-1'
        >
          {t('ui:clinic.enhance_button', {
            defaultValue: 'GRAFT: CYBER LUNGS ({{fame}} Fame)',
            fame: enhanceCostFame
          })}
        </GlitchButton>
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
