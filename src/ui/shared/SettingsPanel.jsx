import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { audioManager } from '../../utils/AudioManager'
import { GlitchButton } from '../GlitchButton'

/**
 * Reusable Settings Panel Component.
 * Can be used in Scenes or Modals.
 *
 * @param {object} props
 * @param {object} props.settings - Global settings object.
 * @param {Function} props.updateSettings - Function to update global settings.
 * @param {Function} props.deleteSave - Function to delete save game.
 * @param {string} [props.className] - Optional container class.
 */
export const SettingsPanel = ({
  settings,
  updateSettings,
  deleteSave,
  className = ''
}) => {
  // Local state for sliders to avoid thrashing Context/LocalStorage on every drag event
  const [musicVol, setMusicVol] = useState(audioManager.musicVolume)
  const [sfxVol, setSfxVol] = useState(audioManager.sfxVolume)
  const [isMuted, setIsMuted] = useState(audioManager.muted)

  /**
   * Updates music volume state and audio engine.
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleMusicChange = e => {
    const val = parseFloat(e.target.value)
    setMusicVol(val)
    audioManager.setMusicVolume(val)
  }

  /**
   * Updates SFX volume state and audio engine.
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleSFXChange = e => {
    const val = parseFloat(e.target.value)
    setSfxVol(val)
    audioManager.setSFXVolume(val)
  }

  /**
   * Toggles the mute state.
   */
  const handleMute = () => {
    const muted = audioManager.toggleMute()
    setIsMuted(muted)
  }

  /**
   * Toggles the CRT filter effect.
   */
  const handleCRT = () => {
    updateSettings({ crtEnabled: !settings.crtEnabled })
  }

  /**
   * Prompts for confirmation and deletes the save file.
   */
  const handleDeleteSave = () => {
    if (window.confirm('ARE YOU SURE? THIS WILL ERASE ALL PROGRESS.')) {
      deleteSave()
    }
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Audio */}
      <div className='space-y-4'>
        <h2 className='text-2xl text-(--star-white) border-b border-(--ash-gray) pb-2 font-mono'>
          AUDIO PROTOCOLS
        </h2>

        <div className='flex items-center justify-between'>
          <label className='text-(--toxic-green) font-mono'>MUSIC VOLUME</label>
          <input
            type='range'
            min='0'
            max='1'
            step='0.1'
            value={musicVol}
            onChange={handleMusicChange}
            className='w-1/2 accent-(--toxic-green)'
          />
        </div>

        <div className='flex items-center justify-between'>
          <label className='text-(--toxic-green) font-mono'>SFX VOLUME</label>
          <input
            type='range'
            min='0'
            max='1'
            step='0.1'
            value={sfxVol}
            onChange={handleSFXChange}
            className='w-1/2 accent-(--toxic-green)'
          />
        </div>

        <GlitchButton onClick={handleMute} className='w-full'>
          {isMuted ? 'UNMUTE SYSTEM' : 'MUTE SYSTEM'}
        </GlitchButton>
      </div>

      {/* Visuals */}
      <div className='space-y-4'>
        <h2 className='text-2xl text-(--star-white) border-b border-(--ash-gray) pb-2 font-mono'>
          VISUAL OUTPUT
        </h2>
        <div className='flex items-center justify-between'>
          <span className='text-(--toxic-green) font-mono'>
            CRT SIMULATION
          </span>
          <button
            onClick={handleCRT}
            className={`w-16 h-8 border border-(--toxic-green) flex items-center p-1 transition-all ${settings.crtEnabled ? 'justify-end bg-(--toxic-green)/20' : 'justify-start'}`}
            aria-label='Toggle CRT Effect'
          >
            <div
              className={`w-6 h-6 bg-(--toxic-green) ${settings.crtEnabled ? 'animate-pulse' : 'opacity-50'}`}
            />
          </button>
        </div>
      </div>

      {/* Data */}
      <div className='space-y-4 pt-8 border-t border-(--blood-red)'>
        <GlitchButton
          onClick={handleDeleteSave}
          className='w-full border-(--blood-red) text-(--blood-red) hover:bg-(--blood-red)'
        >
          PURGE DATA
        </GlitchButton>
      </div>
    </div>
  )
}

SettingsPanel.propTypes = {
  settings: PropTypes.object.isRequired,
  updateSettings: PropTypes.func.isRequired,
  deleteSave: PropTypes.func.isRequired,
  className: PropTypes.string
}
