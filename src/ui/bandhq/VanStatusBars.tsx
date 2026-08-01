import type { PlayerState } from '../../types'
import type { TFunction } from 'i18next'
import { ProgressBar } from '../shared'

type VanStatusBarsProps = {
  van: PlayerState['van']
  t: TFunction
  /** Size of the fuel bar. The condition bar is always `sm`. */
  fuelSize?: 'sm' | 'md' | 'mini'
}

/**
 * Fuel and condition bars for the van, shared by the Band HQ stats tab and the
 * detailed-stats van section.
 *
 * @param props - Van slice, translator, and optional fuel-bar sizing.
 */
export const VanStatusBars = ({ van, t, fuelSize }: VanStatusBarsProps) => (
  <div className='space-y-2'>
    <ProgressBar
      label={t('ui:stats.fuel', { defaultValue: 'Fuel' })}
      value={van?.fuel}
      max={100}
      color='bg-fuel-yellow'
      size={fuelSize}
    />
    <ProgressBar
      label={t('ui:stats.condition', { defaultValue: 'Condition' })}
      value={van?.condition}
      max={100}
      color='bg-condition-blue'
      size='sm'
    />
  </div>
)
