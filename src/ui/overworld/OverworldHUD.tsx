import { useState, memo } from 'react'
import {
  Map as MapIcon,
  DollarSign,
  Fuel,
  Wrench,
  HelpCircle
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../utils/numberUtils'
import type { BandMember } from '../../types/band'
import type { PlayerState } from '../../types/player'
import type { BandState } from '../../types/band'
import {
  ProgressBar,
  Tooltip,
  KeyboardShortcutsPanel,
  useKeyboardShortcuts
} from '../shared'
import { BandMemberRow } from '../hud/BandMemberRow'
import { translateLocation } from '../../utils/locationI18n'
import { useAudioControl } from '../../hooks/useAudioControl'

export interface OverworldHUDProps {
  player?: PlayerState
  band?: BandState
}

/**
 * Top HUD overlay for the Overworld Map showing high-level stats and shortcuts.
 */
export const OverworldHUD = memo(({ player, band }: OverworldHUDProps) => {
  const { t, i18n } = useTranslation(['ui', 'venues'])
  const [showHelp, setShowHelp] = useState(false)
  const { handleAudioChange } = useAudioControl()

  const money = player?.money ?? 0
  const location = player?.location ?? ''
  const day = player?.day ?? 0
  const fuel = player?.van?.fuel ?? 0
  const condition = player?.van?.condition ?? 100

  const locationName = translateLocation(t, location, location)

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    setShowHelp,
    onToggleMute: handleAudioChange.toggleMute
  })

  return (
    <div className='absolute top-0 left-0 w-full p-4 pointer-events-none z-(--z-hud) flex justify-between items-start font-mono text-xs'>
      {/* Left Panel - Player Status */}
      <div className='flex flex-col gap-2'>
        <div className='bg-void-black/95 border-2 border-toxic-green p-3 text-toxic-green shadow-[4px_4px_0px_var(--color-toxic-green)] backdrop-blur-sm min-w-[200px] pointer-events-auto transition-transform hover:translate-y-1 hover:translate-x-1 hover:shadow-none'>
          <div className='flex items-center gap-2 mb-2'>
            <DollarSign
              size={16}
              className={money < 40 ? 'text-blood-red' : 'text-warning-yellow'}
            />
            <span
              className={`text-base font-bold tabular-nums ${money < 40 ? 'text-blood-red' : ''}`}
            >
              {formatCurrency(money, i18n.language)}
            </span>
            <div className='flex items-center gap-1 ml-auto border border-ash-gray/30 bg-void-black px-1.5 py-0.5 pointer-events-auto'>
              <span className='text-xxs tracking-widest text-ash-gray/70'>
                {t('ui:overworld.career_fame', { defaultValue: 'FAME' })}
              </span>
              <span className='text-xs font-bold text-star-white tabular-nums'>
                {player?.fame ?? 0}
              </span>
              <span className='text-xxs tracking-widest text-ash-gray/70 ml-1.5'>
                {t('ui:overworld.career_level', { defaultValue: 'LVL' })}
              </span>
              <span className='text-xs font-bold text-star-white tabular-nums'>
                {player?.fameLevel ?? 1}
              </span>
              <span className='text-xxs tracking-widest text-ash-gray/70 ml-1.5'>
                {t('ui:overworld.career_dist', { defaultValue: 'KM' })}
              </span>
              <span className='text-xs font-bold text-star-white tabular-nums'>
                {player?.stats?.totalDistance ?? 0}
              </span>
            </div>
          </div>
          <div className='flex items-center gap-2 mb-3 text-star-white/90'>
            <MapIcon size={14} className='text-toxic-green/70' />
            <span>
              {t('ui:hud.day', { defaultValue: 'Day' })} {day} — {locationName}
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
                    {Math.floor(fuel)}%
                  </div>

                  <ProgressBar
                    value={fuel}
                    max={100}
                    color='bg-warning-yellow'
                    warn={fuel < 20}
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
                    {Math.floor(condition)}%
                  </div>

                  <ProgressBar
                    value={condition}
                    max={100}
                    color='bg-condition-blue'
                    warn={condition < 25}
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

        <div className='flex gap-2'>
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
              className={`pointer-events-auto bg-void-black/95 border min-w-[48px] min-h-[48px] flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-void-black hover:translate-y-1 hover:translate-x-1 ${
                showHelp
                  ? 'border-warning-yellow text-warning-yellow focus-visible:ring-warning-yellow shadow-none translate-y-1 translate-x-1'
                  : 'border-toxic-green text-toxic-green hover:bg-toxic-green hover:text-void-black focus-visible:ring-toxic-green shadow-[4px_4px_0px_var(--color-toxic-green)] hover:shadow-none'
              }`}
            >
              <HelpCircle size={22} />
            </button>
          </Tooltip>
        </div>

        <KeyboardShortcutsPanel showHelp={showHelp} className='w-64 mt-2' />
      </div>

      {/* Right Panel - Band Status */}
      <div className='bg-void-black/95 border-2 border-toxic-green p-3 text-toxic-green shadow-[4px_4px_0px_var(--color-toxic-green)] backdrop-blur-sm pointer-events-auto transition-transform hover:translate-y-1 hover:translate-x-1 hover:shadow-none'>
        <div className='text-right border-b border-toxic-green/40 mb-3 pb-1.5 text-xs font-bold tracking-widest text-ash-gray/90'>
          {t('ui:bandStatus', { defaultValue: 'BAND STATUS' })}
        </div>
        <div className='w-56 space-y-0.5'>
          {(band?.members ?? []).map((m: BandMember, idx: number) => (
            <BandMemberRow
              key={m?.id ?? m?.name ?? `member-${idx}`}
              m={m}
              idx={idx}
              t={t}
            />
          ))}
        </div>
        <div className='mt-3 pt-2.5 border-t border-toxic-green/30 flex items-end justify-between'>
          <span className='text-xs font-bold text-ash-gray/90 mb-0.5'>
            {t('ui:harmony', { defaultValue: 'HARMONY' })}
          </span>

          <div className='w-24'>
            <div
              className={`text-xs font-bold tabular-nums mb-0.5 leading-none ${
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
              size='sm'
              showValue={false}
              aria-label={t('ui:hud.bandHarmony', {
                defaultValue: 'Band Harmony'
              })}
            />
          </div>
        </div>
      </div>
    </div>
  )
})
