import { useState, useEffect } from 'react'
import { useGameState } from '../context/GameState'
import { useTranslation } from 'react-i18next'
import {
  Map as MapIcon,
  DollarSign,
  Volume2,
  VolumeX,
  Fuel,
  Wrench,
  HelpCircle
} from 'lucide-react'
import { useAudioControl } from '../hooks/useAudioControl'
import { ProgressBar, Tooltip } from './shared'
import { translateLocation } from '../utils/locationI18n'

const SHORTCUTS = [
  { key: '?', desc: 'Toggle this help', descKey: 'ui:shortcuts.toggleHelp' },
  { key: 'M', desc: 'Mute / Unmute', descKey: 'ui:shortcuts.mute' },
  { key: '1-4', desc: 'Select event option', descKey: 'ui:shortcuts.selectEvent' },
  { key: '\u2190\u2191\u2192', desc: 'Hit notes (Gig)', descKey: 'ui:shortcuts.hitNotes' },
  { key: 'ESC', desc: 'Close overlays', descKey: 'ui:shortcuts.closeOverlays' }
]

/**
 * Heads-Up Display overlay showing player stats, band status, and volume controls.
 */
export const HUD = () => {
  const { player, band } = useGameState()
  const { t } = useTranslation(['ui', 'venues'])
  const locationName = translateLocation(t, player.location, player.location)
  const [showHelp, setShowHelp] = useState(false)
  const { audioState, handleAudioChange } = useAudioControl()

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKey = e => {
      if (e.key === '?' || (e.key === 'h' && !e.ctrlKey && !e.metaKey)) {
        // Don't trigger if user is typing in an input
        if (
          e.target.tagName === 'INPUT' ||
          e.target.tagName === 'TEXTAREA' ||
          e.target.tagName === 'SELECT'
        )
          return
        setShowHelp(prev => !prev)
      }
      if (e.key === 'm' && !e.ctrlKey && !e.metaKey) {
        if (
          e.target.tagName === 'INPUT' ||
          e.target.tagName === 'TEXTAREA' ||
          e.target.tagName === 'SELECT'
        )
          return
        handleAudioChange.toggleMute()
      }
      if (e.key === 'Escape') {
        setShowHelp(false)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleAudioChange])

  const fuel = player.van?.fuel ?? 0
  const condition = player.van?.condition ?? 100

  return (
    <div className='absolute top-0 left-0 w-full p-3 flex justify-between items-start pointer-events-none z-40 text-xs font-mono'>
      {/* Left Panel - Player Info */}
      <div className='flex flex-col gap-2'>
        <div className='bg-(--void-black)/90 border border-(--toxic-green)/60 backdrop-blur-sm p-2.5 text-(--toxic-green) shadow-[0_0_8px_var(--toxic-green-20)] animate-pulse-glow'>
          <div className='flex items-center gap-2 mb-1.5'>
            <DollarSign
              size={14}
              className={
                player.money < 40
                  ? 'text-(--blood-red)'
                  : 'text-(--warning-yellow)'
              }
            />
            <span
              className={`text-sm font-bold tabular-nums ${player.money < 40 ? 'text-(--blood-red)' : ''}`}
            >
              {t('ui:currency', { value: player.money, defaultValue: `${player.money} \u20AC` })}
            </span>
          </div>
          <div className='flex items-center gap-2 mb-2'>
            <MapIcon size={14} />
            <span className='text-(--star-white)/80'>
              {t('ui:hud.day', { defaultValue: 'Day' })} {player.day} — {locationName}
            </span>
          </div>

          {/* Van Status Mini Bars */}
          <div className='border-t border-(--toxic-green)/20 pt-2 space-y-1.5'>
            <div className='flex items-center gap-2'>
              <Fuel size={12} className='text-(--fuel-yellow) shrink-0' />
              <ProgressBar
                value={fuel}
                max={100}
                color='bg-(--fuel-yellow)'
                warn={fuel < 20}
                size='mini'
                aria-label={t('ui:hud.fuelLevel', { defaultValue: 'Fuel Level' })}
              />
              <span className='text-[10px] text-(--ash-gray) w-8 text-right tabular-nums'>
                {Math.round(fuel)}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <Wrench size={12} className='text-(--condition-blue) shrink-0' />
              <ProgressBar
                value={condition}
                max={100}
                color='bg-(--condition-blue)'
                warn={condition < 25}
                size='mini'
                aria-label={t('ui:hud.vanCondition', { defaultValue: 'Van Condition' })}
              />
              <span className='text-[10px] text-(--ash-gray) w-8 text-right tabular-nums'>
                {Math.round(condition)}
              </span>
            </div>
          </div>
        </div>

        <div className='flex gap-1.5'>
          <Tooltip content={audioState.isMuted ? t('ui:button.unmute', { defaultValue: 'Unmute (M)' }) : t('ui:button.mute', { defaultValue: 'Mute (M)' })}>
            <button
              type='button'
              onClick={handleAudioChange.toggleMute}
              aria-label={audioState.isMuted ? t('ui:aria.unmuteSystem', { defaultValue: 'Unmute system' }) : t('ui:aria.muteSystem', { defaultValue: 'Mute system' })}
              className='pointer-events-auto bg-(--void-black)/90 border border-(--toxic-green)/60 p-2 text-(--toxic-green) w-fit hover:bg-(--toxic-green) hover:text-(--void-black) transition-colors block'
            >
              {audioState.isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </Tooltip>
          <Tooltip content={t('ui:button.shortcuts', { defaultValue: 'Shortcuts (?)' })}>
            <button
              type='button'
              onClick={() => setShowHelp(prev => !prev)}
              aria-label={t('ui:aria.shortcutsHelp', { defaultValue: 'Toggle keyboard shortcuts help' })}
              className={`pointer-events-auto bg-(--void-black)/90 border p-2 w-fit transition-colors block ${
                showHelp
                  ? 'border-(--warning-yellow) text-(--warning-yellow)'
                  : 'border-(--toxic-green)/60 text-(--toxic-green) hover:bg-(--toxic-green) hover:text-(--void-black)'
              }`}
            >
              <HelpCircle size={14} />
            </button>
          </Tooltip>
        </div>

        {/* Keyboard Shortcuts Overlay */}
        {showHelp && (
          <div className='pointer-events-auto bg-(--void-black)/95 border border-(--toxic-green) p-3 shadow-[0_0_12px_var(--toxic-green-20)] w-52'>
            <div className='text-[10px] text-(--toxic-green) tracking-widest uppercase mb-2 border-b border-(--toxic-green)/30 pb-1'>
              {t('ui:keyboardShortcuts', { defaultValue: 'Keyboard Shortcuts' })}
            </div>
            {SHORTCUTS.map(s => (
              <div
                key={s.key}
                className='flex items-center justify-between mb-1 last:mb-0'
              >
                <kbd className='text-[10px] bg-(--ash-gray)/20 border border-(--ash-gray)/40 px-1.5 py-0.5 text-(--star-white) font-mono'>
                  {s.key}
                </kbd>
                <span className='text-[10px] text-(--ash-gray)'>{t(s.descKey, { defaultValue: s.desc })}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel - Band Status */}
      <div className='flex flex-col gap-2 items-end'>
        <div className='bg-(--void-black)/90 border border-(--toxic-green)/60 backdrop-blur-sm p-2.5 text-(--toxic-green) shadow-[0_0_8px_var(--toxic-green-20)]'>
          <div className='text-right border-b border-(--toxic-green)/30 mb-2 pb-1 text-[10px] tracking-widest text-(--ash-gray)'>
            {t('ui:bandStatus', { defaultValue: 'BAND STATUS' })}
          </div>
          {band.members.map(m => (
            <div
              key={m.name}
              className='flex items-center justify-between w-52 mb-1.5 last:mb-0'
            >
              <span className='text-(--star-white)/80 text-[11px]'>
                {m.name}
              </span>
              <div className='flex items-center gap-1.5'>
                <div className='flex items-center gap-1' title={t('ui:hud.mood', { defaultValue: 'Mood' })}>
                  <div className='w-12'>
                    <ProgressBar
                      value={m.mood}
                      max={100}
                      color='bg-(--mood-pink)'
                      size='mini'
                      aria-label={t('ui:hud.memberMood', { name: m.name, defaultValue: `${m.name} Mood` })}
                    />
                  </div>
                  <span className='text-[9px] text-(--mood-pink) w-7 text-right tabular-nums'>
                    {m.mood}%
                  </span>
                </div>
                <div className='flex items-center gap-1' title={t('ui:hud.stamina', { defaultValue: 'Stamina' })}>
                  <div className='w-12'>
                    <ProgressBar
                      value={m.stamina}
                      max={100}
                      color='bg-(--stamina-green)'
                      size='mini'
                      aria-label={t('ui:hud.memberStamina', { name: m.name, defaultValue: `${m.name} Stamina` })}
                    />
                  </div>
                  <span className='text-[9px] text-(--stamina-green) w-7 text-right tabular-nums'>
                    {m.stamina}%
                  </span>
                </div>
              </div>
            </div>
          ))}
          <div className='mt-2 pt-1.5 border-t border-(--toxic-green)/20 flex items-center justify-between'>
            <span className='text-[10px] text-(--ash-gray)'>
              {t('ui:harmony', { defaultValue: 'HARMONY' })}
            </span>
            <div className='flex items-center gap-2'>
              <div className='w-20'>
                <ProgressBar
                  value={band.harmony}
                  max={100}
                  color={
                    band.harmony < 40
                      ? 'bg-(--blood-red)'
                      : 'bg-(--toxic-green)'
                  }
                  size='mini'
                  aria-label={t('ui:hud.bandHarmony', { defaultValue: 'Band Harmony' })}
                />
              </div>
              <span
                className={`text-[10px] tabular-nums ${band.harmony < 40 ? 'text-(--blood-red)' : 'text-(--toxic-green)'}`}
              >
                {band.harmony}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
