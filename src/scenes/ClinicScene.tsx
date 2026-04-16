import { useTranslation } from 'react-i18next'
import { GlitchButton } from '../ui/GlitchButton'
import { useClinicLogic } from '../hooks/useClinicLogic'
import { ClinicHeader } from '../components/clinic/ClinicHeader'
import { ClinicMemberCard } from '../components/clinic/ClinicMemberCard'

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
        <ClinicHeader player={player} />

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 flex-1 min-h-0 overflow-y-auto py-4 sm:py-6 custom-scrollbar pr-2'>
          {band.members.map(member => (
            <ClinicMemberCard
              key={member.id}
              member={member}
              player={player}
              healCostMoney={healCostMoney}
              enhanceCostFame={enhanceCostFame}
              healMember={healMember}
              enhanceMember={enhanceMember}
            />
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
