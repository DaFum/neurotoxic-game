import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Skull } from 'lucide-react'
import { useGameSelector, useGameActions } from '../../context/GameState'
import { audioService } from '../../utils/audio/audioEngine'
import { Tooltip } from '../shared'

/**
 * Configuration properties for the gig pedal controls overlay.
 */
interface GigPedalControlsProps {
  /** Optional class name to customize layout or position. */
  className?: string
}

/**
 * Overlay controls for active pedal effects (e.g. Neuro-decimator, Neurotoxic pedal)
 * during gigs.
 *
 * @param props - Component configuration.
 * @returns The rendered pedal controls, or null if neither pedal is owned.
 */
export const GigPedalControls = memo(function GigPedalControls({
  className
}: GigPedalControlsProps) {
  const hasNeuroDecimator = useGameSelector(
    state => !!state.band?.inventory?.neuroDecimator
  )
  const neuroDecimatorActive = useGameSelector(
    state => !!state.band?.neuroDecimatorActive
  )
  const hasNeurotoxicPedal = useGameSelector(
    state => !!state.band?.inventory?.neurotoxicPedal
  )
  const { toggleNeuroDecimator } = useGameActions()
  const { t } = useTranslation(['ui'])

  if (!hasNeuroDecimator && !hasNeurotoxicPedal) {
    return null
  }

  return (
    <div className={className}>
      {hasNeuroDecimator && (
        <Tooltip
          content={t('ui:hud.decimatorHint', {
            defaultValue: 'Toggles the neuro-decimator audio effect'
          })}
          position='bottom'
        >
          <button
            onClick={() => {
              const nextState = !neuroDecimatorActive
              toggleNeuroDecimator(nextState)
              audioService.setNeuroDecimator(nextState)
            }}
            type='button'
            aria-label={t('ui:hud.toggleDecimator', {
              defaultValue: 'Toggle decimator'
            })}
            aria-pressed={neuroDecimatorActive}
            className={`pointer-events-auto flex-1 min-h-0 border-2 px-3 py-1.5 mb-2 transition-all duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-void-black focus-visible:ring-toxic-green ${
              neuroDecimatorActive
                ? 'bg-blood-red text-void-black border-blood-red shadow-[4px_4px_0px_var(--color-blood-red)]'
                : 'bg-void-black text-blood-red border-blood-red hover:bg-blood-red/20'
            }`}
          >
            <Skull size={14} className='inline mr-2' aria-hidden='true' />
            <span className='font-black uppercase tracking-wider text-xs'>
              {neuroDecimatorActive
                ? t('ui:hud.decimatorActive', {
                    defaultValue: 'DECIMATOR: ON'
                  })
                : t('ui:hud.decimatorInactive', {
                    defaultValue: 'DECIMATOR: OFF'
                  })}
            </span>
          </button>
        </Tooltip>
      )}
      {hasNeurotoxicPedal && (
        <Tooltip
          content={t('ui:hud.neurotoxicHint', {
            defaultValue: 'Neurotoxic pedal is modifying audio output'
          })}
          position='bottom'
        >
          <div
            role='status'
            tabIndex={0}
            className='bg-void-black text-toxic-green border-2 border-toxic-green shadow-[4px_4px_0px_var(--color-toxic-green)] px-3 py-1.5 flex items-center gap-2 animate-pulse mb-2 pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-void-black focus-visible:ring-toxic-green'
          >
            <Skull size={14} className='text-toxic-green' aria-hidden='true' />
            <span className='font-black uppercase tracking-wider text-xs'>
              {t('ui:hud.neurotoxicActive', {
                defaultValue: 'NEUROTOXIC ACTIVE'
              })}
            </span>
          </div>
        </Tooltip>
      )}
    </div>
  )
})
