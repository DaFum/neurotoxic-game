import { useState } from 'react'
import { useGameState } from '../context/GameState'
import {
  Map as MapIcon,
  DollarSign,
  Volume2,
  VolumeX,
  Fuel,
  Wrench
} from 'lucide-react'
import { audioManager } from '../utils/AudioManager'

const MiniBar = ({ value, max = 100, color, warn = false }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className='w-full h-1.5 bg-(--void-black) border border-(--ash-gray)/50 overflow-hidden'>
      <div
        className={`h-full transition-all duration-500 ${color} ${warn ? 'animate-fuel-warning' : ''}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/**
 * Heads-Up Display overlay showing player stats, band status, and volume controls.
 */
export const HUD = () => {
  const { player, band } = useGameState()
  const [muted, setMuted] = useState(false)

  const toggleMute = () => {
    const isMuted = audioManager.toggleMute()
    setMuted(isMuted)
  }

  const fuel = player.van?.fuel ?? 0
  const condition = player.van?.condition ?? 100

  return (
    <div className='absolute top-0 left-0 w-full p-3 flex justify-between items-start pointer-events-none z-40 text-xs font-mono'>
      {/* Left Panel - Player Info */}
      <div className='flex flex-col gap-2'>
        <div className='bg-(--void-black)/90 border border-(--toxic-green)/60 backdrop-blur-sm p-2.5 text-(--toxic-green) shadow-[0_0_8px_var(--toxic-green-20)] animate-pulse-glow'>
          <div className='flex items-center gap-2 mb-1.5'>
            <DollarSign size={14} className='text-(--warning-yellow)' />
            <span className='text-sm font-bold tabular-nums'>
              {player.money}€
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

        <button
          onClick={toggleMute}
          aria-label={muted ? 'Unmute system' : 'Mute system'}
          className='pointer-events-auto bg-(--void-black)/90 border border-(--toxic-green)/60 p-2 text-(--toxic-green) w-fit hover:bg-(--toxic-green) hover:text-(--void-black) transition-colors'
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
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
                  <div className='w-12 h-1.5 bg-(--void-black) border border-(--ash-gray)/30 overflow-hidden'>
                    <div
                      className='h-full bg-(--mood-pink) transition-all duration-500'
                      style={{ width: `${m.mood}%` }}
                    />
                  </div>
                  <span className='text-[9px] text-(--mood-pink) w-7 text-right tabular-nums'>
                    {m.mood}%
                  </span>
                </div>
                <div className='flex items-center gap-1' title='Stamina'>
                  <div className='w-12 h-1.5 bg-(--void-black) border border-(--ash-gray)/30 overflow-hidden'>
                    <div
                      className='h-full bg-(--stamina-green) transition-all duration-500'
                      style={{ width: `${m.stamina}%` }}
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
                  className={`h-full transition-all duration-500 ${band.harmony < 30 ? 'bg-(--blood-red)' : 'bg-(--toxic-green)'}`}
                  style={{ width: `${band.harmony}%` }}
                />
              </div>
              <span
                className={`text-[10px] tabular-nums ${band.harmony < 30 ? 'text-(--blood-red)' : 'text-(--toxic-green)'}`}
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
