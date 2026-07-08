import { useState, memo } from 'react'
import { useGameSelector, useGameDispatch } from '../context/GameState'
import { audioService } from '../utils/audio/audioEngine'
import { useTranslation } from 'react-i18next'
import {
  Map as MapIcon,
  DollarSign,
  Volume2,
  VolumeX,
  Fuel,
  Wrench,
  HelpCircle,
  Skull
} from 'lucide-react'
import { useAudioControl } from '../hooks/useAudioControl'
import { formatCurrency } from '../utils/numberUtils'
import type { BandMember } from '../types/band'
import {
  ProgressBar,
  Tooltip,
  KeyboardShortcutsPanel,
  useKeyboardShortcuts
} from './shared'
import { BandMemberRow } from './hud/BandMemberRow'
import { translateLocation } from '../utils/locationI18n'

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

  const { toggleNeuroDecimator } = useGameDispatch()
  const { t, i18n } = useTranslation(['ui', 'venues'])
  const locationName = translateLocation(t, playerLocation, playerLocation)
  const [showHelp, setShowHelp] = useState(false)
  const { audioState, handleAudioChange } = useAudioControl()

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    setShowHelp,
    onToggleMute: handleAudioChange.toggleMute
  })

  return (
    <div className='absolute top-0 left-0 w-full p-3 flex justify-between items-start pointer-events-none z-(--z-hud) text-xs font-mono'>
      {/* Left Panel - Player Info */}
      <div className='flex flex-col gap-2'>
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
          <div className='border-t border-toxic-green/20 pt-2 grid grid-cols-2 gap-x-4'>
            <Tooltip
              content={t('ui:hud.fuelLevel', { defaultValue: 'Fuel Level' })}
              position='bottom'
            >
              <div className='flex items-end gap-1.5 pointer-events-auto'>
                <Fuel
                  size={12}
                  className='text-warning-yellow shrink-0 mb-0.5'
                />

                <div className='min-w-0 flex-1'>
                  <div className='text-xs text-ash-gray font-mono tabular-nums mb-0.5 leading-none'>
                    {Math.floor(playerVanFuel)}%
                  </div>

                  <ProgressBar
                    value={playerVanFuel}
                    max={100}
                    color='bg-warning-yellow'
                    warn={playerVanFuel < 20}
                    size='mini'
                    aria-label={t('ui:hud.fuelLevel', {
                      defaultValue: 'Fuel Level'
                    })}
                  />
                </div>
              </div>
            </Tooltip>

            <Tooltip
              content={t('ui:hud.vanCondition', {
                defaultValue: 'Van Condition'
              })}
              position='bottom'
            >
              <div className='flex items-end gap-1.5 pointer-events-auto'>
                <Wrench
                  size={12}
                  className='text-condition-blue shrink-0 mb-0.5'
                />

                <div className='min-w-0 flex-1'>
                  <div className='text-xs text-ash-gray font-mono tabular-nums mb-0.5 leading-none'>
                    {Math.floor(playerVanCondition)}%
                  </div>

                  <ProgressBar
                    value={playerVanCondition}
                    max={100}
                    color='bg-condition-blue'
                    warn={playerVanCondition < 25}
                    size='mini'
                    aria-label={t('ui:hud.vanCondition', {
                      defaultValue: 'Van Condition'
                    })}
                  />
                </div>
              </div>
            </Tooltip>
          </div>
        </div>

        <div className='flex gap-1.5'>
          <Tooltip
            content={
              audioState.isMuted
                ? t('ui:button.unmute', { defaultValue: 'Unmute (M)' })
                : t('ui:button.mute', { defaultValue: 'Mute (M)' })
            }
          >
            <button
              type='button'
              onClick={handleAudioChange.toggleMute}
              aria-label={t('ui:aria.toggleMuteSystem', {
                defaultValue: 'Toggle mute system'
              })}
              aria-pressed={audioState.isMuted}
              className={`pointer-events-auto bg-void-black/90 border min-w-11 min-h-11 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-void-black ${
                audioState.isMuted
                  ? 'border-ash-gray text-ash-gray hover:bg-ash-gray hover:text-void-black focus-visible:ring-ash-gray'
                  : 'border-toxic-green text-toxic-green hover:bg-toxic-green hover:text-void-black focus-visible:ring-toxic-green'
              }`}
            >
              {audioState.isMuted ? (
                <VolumeX size={20} />
              ) : (
                <Volume2 size={20} />
              )}
            </button>
          </Tooltip>
          <Tooltip
            content={t('ui:button.shortcuts', {
              defaultValue: 'Shortcuts (?, h)'
            })}
          >
            <button
              type='button'
              onClick={() => setShowHelp(prev => !prev)}
              aria-expanded={showHelp}
              aria-controls='shortcuts-panel'
              aria-label={t('ui:aria.shortcutsHelp', {
                defaultValue: 'Toggle keyboard shortcuts help'
              })}
              className={`pointer-events-auto bg-void-black/90 border min-w-11 min-h-11 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-void-black ${
                showHelp
                  ? 'border-warning-yellow text-warning-yellow focus-visible:ring-warning-yellow'
                  : 'border-toxic-green text-toxic-green hover:bg-toxic-green hover:text-void-black focus-visible:ring-toxic-green'
              }`}
            >
              <HelpCircle size={20} />
            </button>
          </Tooltip>
        </div>

        {/* Keyboard Shortcuts Overlay */}
        <KeyboardShortcutsPanel showHelp={showHelp} className='w-52' />
      </div>

      {/* Right Panel - Band Status */}
      <div className='flex flex-col gap-2 items-end'>
        {hasNeuroDecimator && (
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
            <Skull size={14} className='inline mr-2' />
            <span className='font-black uppercase tracking-wider text-xs'>
              {neuroDecimatorActive
                ? t('ui:hud.decimatorActive', { defaultValue: 'DECIMATOR: ON' })
                : t('ui:hud.decimatorInactive', {
                    defaultValue: 'DECIMATOR: OFF'
                  })}
            </span>
          </button>
        )}
        {hasNeurotoxicPedal && (
          <div className='bg-void-black text-toxic-green border-2 border-toxic-green shadow-[4px_4px_0px_var(--color-toxic-green)] px-3 py-1.5 flex items-center gap-2 animate-pulse mb-2 pointer-events-auto'>
            <Skull size={14} className='text-toxic-green' />
            <span className='font-black uppercase tracking-wider text-xs'>
              {t('ui:hud.neurotoxicActive', {
                defaultValue: 'NEUROTOXIC ACTIVE'
              })}
            </span>
          </div>
        )}
        <div className='bg-void-black border-2 border-toxic-green p-2.5 text-toxic-green shadow-[4px_4px_0px_var(--color-toxic-green)]'>
          <div className='text-right border-b border-toxic-green/30 mb-2 pb-1 text-xs tracking-widest text-ash-gray'>
            {t('ui:bandStatus', { defaultValue: 'BAND STATUS' })}
          </div>
          <div className='w-52'>
            {(band?.members ?? []).map((m: BandMember, idx: number) => (
              <BandMemberRow
                key={m?.id ?? m?.name ?? `member-${idx}`}
                m={m}
                idx={idx}
                t={t}
              />
            ))}
          </div>
          <div className='mt-2 pt-1.5 border-t border-toxic-green/20 flex items-end justify-between'>
            <span className='text-xs text-ash-gray mb-0.5'>
              {t('ui:harmony', { defaultValue: 'HARMONY' })}
            </span>

            <div className='w-20'>
              <div
                className={`text-xs tabular-nums mb-0.5 leading-none ${
                  (band?.harmony ?? 0) < 40
                    ? 'text-blood-red'
                    : 'text-toxic-green'
                }`}
              >
                {Math.floor(band?.harmony ?? 0)}%
              </div>

              <ProgressBar
                value={band?.harmony ?? 0}
                max={100}
                color={
                  (band?.harmony ?? 0) < 40 ? 'bg-blood-red' : 'bg-toxic-green'
                }
                size='mini'
                showValue={false}
                aria-label={t('ui:hud.bandHarmony', {
                  defaultValue: 'Band Harmony'
                })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
