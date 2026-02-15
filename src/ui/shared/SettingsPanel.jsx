import PropTypes from 'prop-types'
import { VolumeSlider } from './VolumeSlider'
import { LOG_LEVELS } from '../../utils/logger.js'

export const SettingsPanel = ({
  settings,
  musicVol = 0,
  sfxVol = 0,
  isMuted = false,
  onMusicChange = () => {},
  onSfxChange = () => {},
  onToggleMute = () => {},
  onToggleCRT = () => {},
  onLogLevelChange = () => {},
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
            <label className='font-[Courier_New] text-sm uppercase tracking-wide text-(--ash-gray)'>
              MUTE ALL
            </label>
            <button
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute all audio' : 'Mute all audio'}
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
          <label className='font-[Courier_New] text-sm uppercase tracking-wide text-(--ash-gray)'>
            CRT EFFECT
          </label>
          <button
            onClick={onToggleCRT}
            aria-label={
              settings?.crtEnabled ? 'Disable CRT Effect' : 'Enable CRT Effect'
            }
            className={`w-16 h-8 border-2 border-(--toxic-green) rounded-none shadow-[4px_4px_0px_var(--blood-red)] flex items-center p-1 transition-all ${settings?.crtEnabled ? 'justify-end bg-(--toxic-green)/20' : 'justify-start'}`}
          >
            <div
              className={`w-6 h-6 bg-(--toxic-green) ${settings?.crtEnabled ? 'opacity-100' : 'opacity-50'}`}
            />
          </button>
        </div>
      </div>

      {/* Log Settings */}
      {import.meta.env.DEV && (
        <div>
          <h2 className='font-[Metal_Mania] text-4xl uppercase text-(--toxic-green) mb-6 border-b border-(--ash-gray) pb-2'>
            LOG PROTOCOLS
          </h2>
          <div className='flex items-center justify-between'>
            <label className='font-[Courier_New] text-sm uppercase tracking-wide text-(--ash-gray)'>
              MINIMUM LOG LEVEL
            </label>
            <select
              value={settings?.logLevel ?? LOG_LEVELS.DEBUG}
              onChange={e => onLogLevelChange(parseInt(e.target.value, 10))}
              className='bg-(--void-black) text-(--toxic-green) border-2 border-(--toxic-green) p-1 font-mono focus:outline-none'
            >
              {Object.entries(LOG_LEVELS).map(([key, value]) => (
                <option key={key} value={value}>
                  {key}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

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
            onClick={() => {
              if (
                window.confirm(
                  'Are you sure you want to delete your save game?'
                )
              ) {
                onDeleteSave()
              }
            }}
            className='bg-(--blood-red) text-(--void-black) px-4 py-2 font-bold hover:invert border-2 border-(--blood-red) rounded-none shadow-[4px_4px_0px_var(--blood-red)] font-mono'
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
    crtEnabled: PropTypes.bool,
    logLevel: PropTypes.number
  }),
  musicVol: PropTypes.number,
  sfxVol: PropTypes.number,
  isMuted: PropTypes.bool,
  onMusicChange: PropTypes.func,
  onSfxChange: PropTypes.func,
  onToggleMute: PropTypes.func,
  onToggleCRT: PropTypes.func,
  onLogLevelChange: PropTypes.func,
  onDeleteSave: PropTypes.func.isRequired,
  className: PropTypes.string
}
