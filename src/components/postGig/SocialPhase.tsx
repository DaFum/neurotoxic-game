import { useTranslation } from 'react-i18next'
import { Panel } from '../../ui/shared'
import { ZealotryGauge } from './ZealotryGauge'
import { SocialOptionButton } from './SocialOptionButton'
import type { SocialOption } from '../../types/components'

type SocialPhaseProps = {
  options: SocialOption[]
  onSelect: (option: SocialOption) => void
  trend?: string
  zealotryLevel?: number
}

/**
 * Lets the player choose a post-gig social strategy, with trend and zealotry context.
 * @param props - Social post options, selection callback, trend state, and zealotry level.
 */
export const SocialPhase = ({
  options,
  onSelect,
  trend,
  zealotryLevel = 0
}: SocialPhaseProps) => {
  const { t } = useTranslation()
  return (
    <Panel contentClassName='space-y-4 sm:space-y-6'>
      {/* Zealotry Gauge UI */}
      <ZealotryGauge zealotryLevel={zealotryLevel} />

      <div className='text-center mb-1 sm:mb-2'>
        <h3 className='text-lg sm:text-xl font-mono tracking-widest break-words'>
          {t('economy:social.postToSocial', {
            defaultValue: 'POST TO SOCIAL MEDIA'
          })}
        </h3>
        {trend && (
          <div className='text-xs sm:text-sm text-toxic-green tracking-widest mt-1 font-bold animate-pulse break-words'>
            {t('economy:social.currentTrend', {
              defaultValue: 'CURRENT TREND:'
            })}{' '}
            {trend}
          </div>
        )}
        <div className='text-xs text-ash-gray tracking-wider mt-1'>
          {t('economy:social.chooseStrategy', {
            defaultValue: 'CHOOSE YOUR STRATEGY'
          })}
        </div>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4'>
        {options.map((opt, i: number) => (
          <SocialOptionButton
            key={opt.id}
            opt={opt}
            index={i}
            onSelect={onSelect}
          />
        ))}
      </div>
    </Panel>
  )
}
