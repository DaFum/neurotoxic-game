import React, { useState } from 'react'
import { useGameState } from '../context/GameState'
import { audioManager } from '../utils/AudioManager'
import { GlitchButton } from '../ui/GlitchButton'

/**
 * Settings scene for configuring audio, visuals, and data management.
 */
export const Settings = () => {
  const { changeScene, settings, updateSettings, deleteSave } = useGameState()

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
    <div className='flex flex-col items-center justify-center h-full w-full bg-(--void-black) z-50 p-8'>
      <h1 className="text-6xl text-(--toxic-green) font-['Metal_Mania'] mb-12">
        SYSTEM CONFIG
      </h1>

      <div className='w-full max-w-2xl border-2 border-(--toxic-green) p-8 bg-(--void-black)/80 space-y-8'>
        {/* Audio */}
        <div className='space-y-4'>
          <h2 className='text-2xl text-(--star-white) border-b border-(--ash-gray) pb-2'>
            AUDIO PROTOCOLS
          </h2>

          <div className='flex items-center justify-between'>
            <label className='text-(--toxic-green)'>MUSIC VOLUME</label>
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
            <label className='text-(--toxic-green)'>SFX VOLUME</label>
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
          <h2 className='text-2xl text-(--star-white) border-b border-(--ash-gray) pb-2'>
            VISUAL OUTPUT
          </h2>
          <div className='flex items-center justify-between'>
            <span className='text-(--toxic-green)'>CRT SIMULATION</span>
            <button
              onClick={handleCRT}
              className={`w-16 h-8 border border-(--toxic-green) flex items-center p-1 ${settings.crtEnabled ? 'justify-end bg-(--toxic-green)/20' : 'justify-start'}`}
            >
              <div
                className={`w-6 h-6 bg-(--toxic-green) ${settings.crtEnabled ? 'animate-pulse' : 'opacity-50'}`}
              />
            </button>
          </div>
        </div>

        {/* Data */}
        <div className='space-y-4 pt-8 border-t border-red-900'>
          <GlitchButton
            onClick={handleDeleteSave}
            className='w-full border-(--blood-red) text-(--blood-red) hover:bg-red-900'
          >
            PURGE DATA
          </GlitchButton>
        </div>
      </div>

      <div className='mt-8'>
        <GlitchButton onClick={() => changeScene('MENU')}>RETURN</GlitchButton>
      </div>
    </div>
  )
}
