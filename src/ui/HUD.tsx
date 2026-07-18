import { memo } from 'react'
import { useGameSelector, useGameDispatch } from '../context/GameState'
import { audioService } from '../utils/audio/audioEngine'
import { useTranslation } from 'react-i18next'
import { Map as MapIcon, DollarSign, Skull } from 'lucide-react'
import { formatCurrency } from '../utils/numberUtils'
import { Tooltip } from './shared'
import {
  BandStatusPanel,
  VanStatusMiniBars
} from './hud/shared/SharedHUDComponents'
import { GigControlsCluster } from '../components/hud/GigControlsCluster'
import { translateLocation } from '../utils/locationI18n'
import { GAME_PHASES } from '../context/gameConstants'

/**
 * Heads-Up Display overlay showing player stats, band status, and volume controls.
 */
export const HUD = memo(() => {
  const playerMoney = useGameSelector(state => state.player.money)
  const playerLocation = useGameSelector(state => state.player.location)
  const playerDay = useGameSelector(state => state.player.day)
  const playerVanFuel = useGameSelector(state => state.player.van?.fuel ?? 0)
  const playerVanCondition = useGameSelector(
    state => state.player?.van?.condition ?? 100
  )

  const hasNeuroDecimator = useGameSelector(
    state => !!state.band?.inventory?.neuroDecimator
  )
  const neuroDecimatorActive = useGameSelector(
    state => !!state.band?.neuroDecimatorActive
  )
  const hasNeurotoxicPedal = useGameSelector(
    state => !!state.band?.inventory?.neurotoxicPedal
  )
  const band = useGameSelector(state => state.band)
  // PRACTICE (Bandprobe) renders the same Gig view, so it hides the same panels.
  const isGigScene = useGameSelector(
    state =>
      state.currentScene === GAME_PHASES.GIG ||
      state.currentScene === GAME_PHASES.PRACTICE
  )

  const { toggleNeuroDecimator } = useGameDispatch()
  const { t, i18n } = useTranslation(['ui', 'venues'])
  const locationName = translateLocation(t, playerLocation, playerLocation)

  return (
    <div className='absolute top-0 left-0 w-full p-3 flex justify-between items-start pointer-events-none z-(--z-hud) text-xs font-mono'>
      {/* Left Panel - Player Info (hidden during gigs) */}
      <div className='flex flex-col gap-2'>
        {!isGigScene && (
          <div className='bg-void-black border-2 border-toxic-green p-2.5 text-toxic-green shadow-[4px_4px_0px_var(--color-toxic-green)]'>
            <div className='flex items-center gap-2 mb-1.5'>
              <DollarSign
                size={14}
                className={
                  playerMoney < 40 ? 'text-blood-red' : 'text-warning-yellow'
                }
              />
              <span
                className={`text-sm font-bold tabular-nums ${playerMoney < 40 ? 'text-blood-red' : ''}`}
              >
                {formatCurrency(playerMoney, i18n.language)}
              </span>
            </div>
            <div className='flex items-center gap-2 mb-2'>
              <MapIcon size={14} />
              <span className='text-star-white/80'>
                {t('ui:hud.day', { defaultValue: 'Day' })} {playerDay} —{' '}
                {locationName}
              </span>
            </div>

            {/* Van Status Mini Bars */}
            <VanStatusMiniBars
              fuel={playerVanFuel}
              condition={playerVanCondition}
              t={t}
            />
          </div>
        )}

        {/* During gigs these controls live in the GigHUD's collapsed
            controls cluster; keyboard shortcuts stay registered above. */}
        {!isGigScene && (
          <GigControlsCluster className='relative z-(--z-hud) pointer-events-none' />
        )}
      </div>

      {/* Right Panel - Band Status. During gigs only the decimator/pedal
          controls stay visible, pushed below the GigHUD top-edge meter bar. */}
      <div
        className={`flex flex-col gap-2 items-end ${isGigScene ? 'mt-24' : ''}`}
      >
        {hasNeuroDecimator && (
          <Tooltip
            content={t('ui:hud.decimatorHint', {
              defaultValue: 'Toggles the neuro-decimator audio effect'
            })}
            position='bottom'
            className='mb-2'
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
              className={`pointer-events-auto flex-1 min-h-0 border-2 px-3 py-1.5 transition-all duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-void-black focus-visible:ring-toxic-green ${
                neuroDecimatorActive
                  ? 'bg-blood-red text-void-black border-blood-red shadow-[4px_4px_0px_var(--color-blood-red)]'
                  : 'bg-void-black text-blood-red border-blood-red hover:bg-blood-red/20'
              }`}
            >
              <Skull size={14} className='inline mr-2' />
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
            className='mb-2'
          >
            <div className='bg-void-black text-toxic-green border-2 border-toxic-green shadow-[4px_4px_0px_var(--color-toxic-green)] px-3 py-1.5 flex items-center gap-2 animate-pulse pointer-events-auto'>
              <Skull size={14} className='text-toxic-green' />
              <span className='font-black uppercase tracking-wider text-xs'>
                {t('ui:hud.neurotoxicActive', {
                  defaultValue: 'NEUROTOXIC ACTIVE'
                })}
              </span>
            </div>
          </Tooltip>
        )}
        {!isGigScene && (
          <BandStatusPanel
            band={band}
            t={t}
            wrapperClassName='pointer-events-auto bg-void-black border-2 border-toxic-green p-2.5 text-toxic-green shadow-[4px_4px_0px_var(--color-toxic-green)]'
          />
        )}
      </div>
    </div>
  )
})
