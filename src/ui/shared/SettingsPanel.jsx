import React from 'react'
import PropTypes from 'prop-types'
import { VolumeSlider } from './VolumeSlider'

export const SettingsPanel = ({
  settings,
  musicVol,
  sfxVol,
  isMuted,
  onMusicChange,
  onSfxChange,
  onToggleMute,
  onToggleCRT,
  onDeleteSave,
  className = ''
}) => {
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Audio Settings */}
      <div>
        <h2 className='font-[Metal_Mania] text-4xl uppercase text-(--toxic-green) mb-6 border-b border-(--ash-gray) pb-2'>
          AUDIO PROTOCOLS
        </h2>
        <div className='space-y-6'>
          <VolumeSlider
            label='MUSIC VOLUME'
            value={musicVol}
            onChange={e => onMusicChange(parseFloat(e.target.value))}
          />
          <VolumeSlider
            label='SFX VOLUME'
            value={sfxVol}
            onChange={e => onSfxChange(parseFloat(e.target.value))}
          />
          <div className='flex items-center justify-between'>
            <label className='font-[Courier_New] text-sm uppercase tracking-wide text-(--star-white)'>
              MUTE ALL
            </label>
            <button
              onClick={onToggleMute}
              className={`w-16 h-8 border-2 border-(--toxic-green) rounded-none shadow-[4px_4px_0px_var(--blood-red)] flex items-center p-1 transition-all ${isMuted ? 'justify-end bg-(--toxic-green)/20' : 'justify-start'}`}
            >
              <div
                className={`w-6 h-6 bg-(--toxic-green) ${isMuted ? 'opacity-50' : 'opacity-100'}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Visual Settings */}
      <div>
        <h2 className='font-[Metal_Mania] text-4xl uppercase text-(--toxic-green) mb-6 border-b border-(--ash-gray) pb-2'>
          VISUAL INTERFACE
        </h2>
        <div className='flex items-center justify-between'>
          <label className='font-[Courier_New] text-sm uppercase tracking-wide text-(--star-white)'>
            CRT EFFECT
          </label>
          <button
            onClick={onToggleCRT}
            className={`w-16 h-8 border-2 border-(--toxic-green) rounded-none shadow-[4px_4px_0px_var(--blood-red)] flex items-center p-1 transition-all ${settings.crtEnabled ? 'justify-end bg-(--toxic-green)/20' : 'justify-start'}`}
          >
            <div
              className={`w-6 h-6 bg-(--toxic-green) ${settings.crtEnabled ? 'opacity-100' : 'opacity-50'}`}
            />
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div>
        <h2 className='font-[Metal_Mania] text-4xl uppercase text-(--blood-red) mb-6 border-b border-(--ash-gray) pb-2'>
          DATA PURGE
        </h2>
        <div className='flex justify-between items-center'>
          <p className='font-[Courier_New] text-lg text-(--ash-gray) max-w-xs'>
            WARNING: This action is irreversible. All tour progress will be
            lost.
          </p>
          <button
            onClick={onDeleteSave}
            className='bg-(--blood-red) text-(--void-black) px-4 py-2 font-bold hover:invert border border-(--blood-red) font-mono'
          >
            DELETE SAVE
          </button>
        </div>
      </div>
    </div>
  )
}

SettingsPanel.propTypes = {
  settings: PropTypes.shape({
    crtEnabled: PropTypes.bool
  }).isRequired,
  musicVol: PropTypes.number.isRequired,
  sfxVol: PropTypes.number.isRequired,
  isMuted: PropTypes.bool.isRequired,
  onMusicChange: PropTypes.func.isRequired,
  onSfxChange: PropTypes.func.isRequired,
  onToggleMute: PropTypes.func.isRequired,
  onToggleCRT: PropTypes.func.isRequired,
  onDeleteSave: PropTypes.func.isRequired,
  className: PropTypes.string
}
