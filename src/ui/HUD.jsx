import React, { useState } from 'react'
import { useGameState } from '../context/GameState'
import { Map, Users, DollarSign, Volume2, VolumeX } from 'lucide-react'
import { audioManager } from '../utils/AudioManager'

/**
 * Heads-Up Display overlay showing player stats, band status, and volume controls.
 */
export const HUD = () => {
  const { player, band } = useGameState()
  const [muted, setMuted] = useState(false)

  /**
   * Toggles global audio mute.
   */
  const toggleMute = () => {
    const isMuted = audioManager.toggleMute()
    setMuted(isMuted)
  }

  return (
    <div className='absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-40 text-sm font-mono'>
      <div className='flex flex-col gap-2'>
        <div className='bg-(--void-black)/80 border border-(--toxic-green) p-2 text-(--toxic-green) shadow-[0_0_10px_var(--toxic-green)]'>
          <div className='flex items-center gap-2'>
            <DollarSign size={16} />
            <span>{player.money}€</span>
          </div>
          <div className='flex items-center gap-2'>
            <Map size={16} />
            <span>
              Tag {player.day}: {player.location}
            </span>
          </div>
        </div>

        {/* Volume Control */}
        <button
          onClick={toggleMute}
          className='pointer-events-auto bg-(--void-black)/80 border border-(--toxic-green) p-2 text-(--toxic-green) w-fit hover:bg-(--toxic-green) hover:text-(--void-black) transition-colors'
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      <div className='flex flex-col gap-2 items-end'>
        <div className='bg-(--void-black)/80 border border-(--toxic-green) p-2 text-(--toxic-green) shadow-[0_0_10px_var(--toxic-green)]'>
          <div className='text-right border-b border-(--toxic-green) mb-1'>
            BAND STATUS
          </div>
          {band.members.map(m => (
            <div key={m.name} className='flex justify-between w-48'>
              <span>{m.name}</span>
              <div className='flex gap-2'>
                <span title='Mood'>{m.mood}% 😊</span>
                <span title='Stamina'>{m.stamina}% ⚡</span>
              </div>
            </div>
          ))}
          <div className='mt-1 text-right text-(--blood-red)'>
            Harmony: {band.harmony}%
          </div>
        </div>
      </div>
    </div>
  )
}

HUD.propTypes = {
  // Validated via context mostly, but if props were passed:
  // player: PropTypes.shape({ money: PropTypes.number, day: PropTypes.number, location: PropTypes.string }),
  // band: PropTypes.shape({ members: PropTypes.array, harmony: PropTypes.number })
}
