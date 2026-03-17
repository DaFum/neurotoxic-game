// TODO: Review this file
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { GlitchButton } from '../ui/GlitchButton'
import { useClinicLogic } from '../hooks/useClinicLogic'
import { CLINIC_CONFIG } from '../context/gameConstants'

export const ClinicScene = () => {
  const { t } = useTranslation(['ui'])
  const {
    player,
    band,
    healCostMoney,
    enhanceCostFame,
    healMember,
    enhanceMember,
    leaveClinic
  } = useClinicLogic()

  return (
    <div className='w-full h-full bg-void-black relative overflow-hidden flex flex-col items-center justify-center p-2 sm:p-8'>
      {/* Background Ambience */}
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-toxic-green-5)_0%,var(--color-void-black-90)_100%)] pointer-events-none' />

      <div className='z-10 w-full max-h-full max-w-4xl bg-void-black border-2 border-toxic-green p-4 sm:p-6 shadow-[0_0_20px_var(--color-toxic-green-20)] flex flex-col'>
        <header className='border-b border-toxic-green/50 pb-4 shrink-0'>
          <h2 className='text-2xl sm:text-3xl text-toxic-green font-[Metal_Mania] tracking-widest uppercase'>
            {t('ui:clinic.title', { defaultValue: 'THE VOID CLINIC' })}
          </h2>
          <p className='text-sm text-ash-gray mt-2 font-mono'>
            {t('ui:clinic.lore', {
              defaultValue:
                'Sacrifice money and fame for immediate cybernetic enhancement or synthetic healing.'
            })}
          </p>
          <div className='flex gap-4 mt-4 text-xs font-mono text-star-white'>
            <span>
              {t('ui:clinic.funds', { defaultValue: 'FUNDS:' })} {player.money}€
            </span>
            <span>
              {t('ui:clinic.fame', { defaultValue: 'FAME:' })} {player.fame}
            </span>
          </div>
        </header>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 flex-1 min-h-0 overflow-y-auto py-4 sm:py-6 custom-scrollbar pr-2'>
          {band.members.map(member => (
            <motion.div
              key={member.id}
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
                  {t('ui:clinic.mood', { defaultValue: 'Mood:' })} {member.mood}
                  %
                </div>
              </div>

              <div className='flex flex-col gap-2 mt-auto'>
                <GlitchButton
                  onClick={() => healMember(member.id)}
                  disabled={
                    player.money < healCostMoney ||
                    (member.stamina >= 100 &&
                      (CLINIC_CONFIG.HEAL_MOOD_GAIN === 0 ||
                        member.mood >= 100))
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
                    (member.traits &&
                      member.traits.some(
                        tr => tr.id === CLINIC_CONFIG.CYBER_LUNGS_TRAIT_ID
                      ))
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
          ))}
        </div>

        <footer className='pt-4 border-t border-toxic-green/50 flex justify-end shrink-0'>
          <GlitchButton onClick={leaveClinic} variant='warning'>
            [{t('ui:clinic.leave', { defaultValue: 'LEAVE CLINIC' })}]
          </GlitchButton>
        </footer>
      </div>
    </div>
  )
}

export default ClinicScene
