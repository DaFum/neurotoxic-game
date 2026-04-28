import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
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

export const SocialPhase = ({
  options,
  onSelect,
  trend,
  zealotryLevel = 0
}: SocialPhaseProps) => {
  const { t } = useTranslation()
  return (
    <Panel contentClassName='space-y-6'>
      {/* Zealotry Gauge UI */}
      <ZealotryGauge zealotryLevel={zealotryLevel} />

      <div className='text-center mb-2'>
        <h3 className='text-xl font-mono tracking-widest'>
          {t('economy:social.postToSocial', {
            defaultValue: 'POST TO SOCIAL MEDIA'
          })}
        </h3>
        {trend && (
          <div className='text-sm text-toxic-green tracking-widest mt-1 font-bold animate-pulse'>
            {t('economy:social.currentTrend', {
              defaultValue: 'CURRENT TREND:'
            })}{' '}
            {trend}
          </div>
        )}
        <div className='text-[10px] text-ash-gray tracking-wider mt-1'>
          {t('economy:social.chooseStrategy', {
            defaultValue: 'CHOOSE YOUR STRATEGY'
          })}
        </div>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
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

SocialPhase.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      platform: PropTypes.string.isRequired
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  trend: PropTypes.string,
  zealotryLevel: PropTypes.number
}
