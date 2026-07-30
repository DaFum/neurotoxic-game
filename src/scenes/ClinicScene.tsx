import { useTranslation } from 'react-i18next'
import { GlitchButton } from '../ui/GlitchButton'
import { useClinicLogic } from '../hooks/useClinicLogic'
import { ClinicHeader } from '../components/clinic/ClinicHeader'
import { ClinicMemberCard } from '../components/clinic/ClinicMemberCard'
import { CLINIC_CONFIG } from '../context/gameConstants'
import { formatCurrency } from '../utils/numberUtils'

/**
 * Hosts the Void Clinic flow for healing or enhancing band members.
 */
export const ClinicScene = () => {
  const { t, i18n } = useTranslation(['ui'])
  const {
    player,
    band,
    healCostMoney,
    enhanceCostFame,
    harmonyRecoveryCost,
    healMember,
    enhanceMember,
    graftNeuroOverclock,
    recoverHarmony,
    leaveClinic
  } = useClinicLogic()

  if (!player || !band) return null

  return (
    <div className='w-full h-full bg-void-black relative overflow-hidden flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8'>
      {/* Background Ambience */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          backgroundImage:
            'radial-gradient(circle at center, var(--color-toxic-green-5) 0%, rgb(var(--color-void-black-rgb) / 90%) 100%)'
        }}
      />

      <div className='z-10 w-full max-h-full max-w-4xl bg-void-black border-2 border-toxic-green p-4 sm:p-6 shadow-[0_0_20px_var(--color-toxic-green-20)] flex flex-col'>
        <ClinicHeader player={player} />

        {band.harmony < CLINIC_CONFIG.HARMONY_RECOVERY_THRESHOLD && (
          <section className='mt-4 border-2 border-warning-yellow p-4 font-mono'>
            <h3 className='font-display text-warning-yellow uppercase'>
              {t('ui:clinic.harmony_recovery_title', {
                defaultValue: 'CRITICAL BAND RECOVERY'
              })}
            </h3>
            <p className='my-2 text-sm text-star-white'>
              {t('ui:clinic.harmony_recovery_description', {
                defaultValue:
                  'Restore {{harmony}} Harmony without losing a tour day.',
                harmony: CLINIC_CONFIG.HARMONY_RECOVERY_GAIN
              })}
            </p>
            <GlitchButton
              onClick={recoverHarmony}
              disabled={player.money < harmonyRecoveryCost}
              variant='warning'
            >
              {t('ui:clinic.harmony_recovery_button', {
                defaultValue: 'RECOVER BAND ({{cost}})',
                cost: formatCurrency(harmonyRecoveryCost, i18n.language)
              })}
            </GlitchButton>
          </section>
        )}

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
              graftNeuroOverclock={graftNeuroOverclock}
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
