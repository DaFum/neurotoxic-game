import { memo, useState, useEffect, useCallback } from 'react'
import { useGameState } from '../context/GameState'
import {
  Map as MapIcon,
  DollarSign,
  Volume2,
  VolumeX,
  Fuel,
  Wrench,
  HelpCircle
} from 'lucide-react'
import { audioManager } from '../utils/AudioManager'

const MiniBar = memo(({ value, max = 100, color, warn = false }) => {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div className='w-full h-1.5 bg-(--void-black) border border-(--ash-gray)/50 overflow-hidden'>
      <div
        className={`h-full transition-all duration-500 ${color} ${warn ? 'animate-fuel-warning' : ''}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
})

const SHORTCUTS = [
  { key: '?', desc: 'Toggle this help' },
  { key: 'M', desc: 'Mute / Unmute' },
  { key: '1-4', desc: 'Select event option' },
  { key: '\u2190\u2191\u2192', desc: 'Hit notes (Gig)' },
  { key: 'ESC', desc: 'Close overlays' }
]

/**
 * Heads-Up Display overlay showing player stats, band status, and volume controls.
 */
export const HUD = memo(() => {
  const { player, band } = useGameState()
  const [muted, setMuted] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const toggleMute = useCallback(() => {
    const isMuted = audioManager.toggleMute()
    setMuted(isMuted)
  }, [])

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
        toggleMute()
      }
      if (e.key === 'Escape') {
        setShowHelp(false)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [toggleMute])

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
              {player.money}
              {'\u20AC'}
            </span>
          </div>
          <div className='flex items-center gap-2 mb-2'>
            <MapIcon size={14} />
            <span className='text-(--star-white)/80'>
              Day {player.day} — {player.location}
            </span>
          </div>

          {/* Van Status Mini Bars */}
          <div className='border-t border-(--toxic-green)/20 pt-2 space-y-1.5'>
            <div className='flex items-center gap-2'>
              <Fuel size={12} className='text-(--fuel-yellow) shrink-0' />
              <MiniBar
                value={fuel}
                color='bg-(--fuel-yellow)'
                warn={fuel < 20}
              />
              <span className='text-[10px] text-(--ash-gray) w-8 text-right tabular-nums'>
                {Math.round(fuel)}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <Wrench size={12} className='text-(--condition-blue) shrink-0' />
              <MiniBar
                value={condition}
                color='bg-(--condition-blue)'
                warn={condition < 25}
              />
              <span className='text-[10px] text-(--ash-gray) w-8 text-right tabular-nums'>
                {Math.round(condition)}
              </span>
            </div>
          </div>
        </div>

        <div className='flex gap-1.5'>
          <button
            onClick={toggleMute}
            aria-label={muted ? 'Unmute system' : 'Mute system'}
            className='pointer-events-auto bg-(--void-black)/90 border border-(--toxic-green)/60 p-2 text-(--toxic-green) w-fit hover:bg-(--toxic-green) hover:text-(--void-black) transition-colors'
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button
            onClick={() => setShowHelp(prev => !prev)}
            aria-label='Toggle keyboard shortcuts help'
            className={`pointer-events-auto bg-(--void-black)/90 border p-2 w-fit transition-colors ${
              showHelp
                ? 'border-(--warning-yellow) text-(--warning-yellow)'
                : 'border-(--toxic-green)/60 text-(--toxic-green) hover:bg-(--toxic-green) hover:text-(--void-black)'
            }`}
          >
            <HelpCircle size={14} />
          </button>
        </div>

        {/* Keyboard Shortcuts Overlay */}
        {showHelp && (
          <div className='pointer-events-auto bg-(--void-black)/95 border border-(--toxic-green) p-3 shadow-[0_0_12px_var(--toxic-green-20)] w-52'>
            <div className='text-[10px] text-(--toxic-green) tracking-widest uppercase mb-2 border-b border-(--toxic-green)/30 pb-1'>
              Keyboard Shortcuts
            </div>
            {SHORTCUTS.map(s => (
              <div
                key={s.key}
                className='flex items-center justify-between mb-1 last:mb-0'
              >
                <kbd className='text-[10px] bg-(--ash-gray)/20 border border-(--ash-gray)/40 px-1.5 py-0.5 text-(--star-white) font-mono'>
                  {s.key}
                </kbd>
                <span className='text-[10px] text-(--ash-gray)'>{s.desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel - Band Status */}
      <div className='flex flex-col gap-2 items-end'>
        <div className='bg-(--void-black)/90 border border-(--toxic-green)/60 backdrop-blur-sm p-2.5 text-(--toxic-green) shadow-[0_0_8px_var(--toxic-green-20)]'>
          <div className='text-right border-b border-(--toxic-green)/30 mb-2 pb-1 text-[10px] tracking-widest text-(--ash-gray)'>
            BAND STATUS
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
                <div className='flex items-center gap-1' title='Mood'>
                  <div className='w-12'>
                    <MiniBar value={m.mood} max={100} color='bg-(--mood-pink)' />
                  </div>
                  <span className='text-[9px] text-(--mood-pink) w-7 text-right tabular-nums'>
                    {m.mood}%
                  </span>
                </div>
                <div className='flex items-center gap-1' title='Stamina'>
                  <div className='w-12'>
                    <MiniBar
                      value={m.stamina}
                      max={100}
                      color='bg-(--stamina-green)'
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
            <span className='text-[10px] text-(--ash-gray)'>HARMONY</span>
            <div className='flex items-center gap-2'>
              <div className='w-20 h-1.5 bg-(--void-black) border border-(--ash-gray)/30 overflow-hidden'>
                <div
                  className={`h-full transition-all duration-500 ${band.harmony < 40 ? 'bg-(--blood-red)' : 'bg-(--toxic-green)'}`}
                  style={{ width: `${band.harmony}%` }}
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
})
