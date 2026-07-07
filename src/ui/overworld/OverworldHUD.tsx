import { useState, memo } from 'react'
import { useGameSelector } from '../../context/GameState'
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
import {
  ProgressBar,
  Tooltip,
  KeyboardShortcutsPanel,
  useKeyboardShortcuts
} from '../shared'
import { BandMemberRow } from '../hud/BandMemberRow'
import { translateLocation } from '../../utils/locationI18n'

/**
 * Top HUD overlay for the Overworld Map showing high-level stats and shortcuts.
 */
export const OverworldHUD = memo(() => {
  const isGenerating = false
  const { t, i18n } = useTranslation(['ui', 'venues'])
  const [showHelp, setShowHelp] = useState(false)

  const money = useGameSelector(state => state.player.money)
  const location = useGameSelector(state => state.player.location)
  const day = useGameSelector(state => state.player.day)
  const fuel = useGameSelector(state => state.player.van?.fuel ?? 0)
  const condition = useGameSelector(state => state.player.van?.condition ?? 100)
  const band = useGameSelector(state => state.band)

  const locationName = translateLocation(t, location, location)

  // Global keyboard shortcuts
  useKeyboardShortcuts({ setShowHelp })

  if (isGenerating) return null

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
          </div>
          <div className='flex items-center gap-2 mb-3 text-star-white/90'>
            <MapIcon size={14} className='text-toxic-green/70' />
            <span>
              {t('ui:hud.day', { defaultValue: 'Day' })} {day} — {locationName}
            </span>
          </div>

          <div className='border-t border-toxic-green/30 pt-3 space-y-2.5'>
            <Tooltip
              content={t('ui:hud.fuelLevel', { defaultValue: 'Fuel Level' })}
              position='bottom'
            >
              <div className='flex items-center gap-2 pointer-events-auto'>
                <Fuel size={14} className='text-warning-yellow shrink-0' />
                <ProgressBar
                  value={fuel}
                  max={100}
                  color='bg-warning-yellow'
                  warn={fuel < 20}
                  size='sm'
                  aria-label={t('ui:hud.fuelLevel', {
                    defaultValue: 'Fuel Level'
                  })}
                />
                <span className='text-xs text-ash-gray w-8 text-right tabular-nums'>
                  {Math.floor(fuel)}
                </span>
              </div>
            </Tooltip>
            <Tooltip
              content={t('ui:hud.vanCondition', {
                defaultValue: 'Van Condition'
              })}
              position='bottom'
            >
              <div className='flex items-center gap-2 pointer-events-auto'>
                <Wrench size={14} className='text-condition-blue shrink-0' />
                <ProgressBar
                  value={condition}
                  max={100}
                  color='bg-condition-blue'
                  warn={condition < 25}
                  size='sm'
                  aria-label={t('ui:hud.vanCondition', {
                    defaultValue: 'Van Condition'
                  })}
                />
                <span className='text-xs text-ash-gray w-8 text-right tabular-nums'>
                  {Math.floor(condition)}
                </span>
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
        <div className='mt-3 pt-2.5 border-t border-toxic-green/30 flex items-center justify-between'>
          <span className='text-xs font-bold text-ash-gray/90'>
            {t('ui:harmony', { defaultValue: 'HARMONY' })}
          </span>
          <div className='flex items-center gap-2.5'>
            <div className='w-24'>
              <ProgressBar
                value={band?.harmony ?? 0}
                max={100}
                color={
                  (band?.harmony ?? 0) < 40 ? 'bg-blood-red' : 'bg-toxic-green'
                }
                size='sm'
                aria-label={t('ui:hud.bandHarmony', {
                  defaultValue: 'Band Harmony'
                })}
              />
            </div>
            <span
              className={`text-xs font-bold tabular-nums ${(band?.harmony ?? 0) < 40 ? 'text-blood-red' : 'text-toxic-green'}`}
            >
              {Math.floor(band?.harmony ?? 0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})
