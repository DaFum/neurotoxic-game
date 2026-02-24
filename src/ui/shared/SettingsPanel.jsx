import PropTypes from 'prop-types'
import { useState } from 'react'
import { VolumeSlider, ActionButton, Modal } from './index'
import { LOG_LEVELS } from '../../utils/logger.js'

/**
 * Reusable toggle switch with ON/OFF label.
 */
const ToggleSwitch = ({ isOn, onToggle, ariaLabel }) => (
  <div className='flex items-center gap-2'>
    <span
      className={`font-mono text-[10px] uppercase tracking-widest w-8 text-right transition-colors ${
        isOn ? 'text-(--toxic-green)' : 'text-(--ash-gray)/40'
      }`}
    >
      {isOn ? 'ON' : 'OFF'}
    </span>
    <button
      onClick={onToggle}
      role='switch'
      aria-checked={isOn}
      aria-label={ariaLabel}
      className={`w-16 h-8 border-2 rounded-none shadow-[4px_4px_0px_var(--blood-red)] flex items-center p-1 transition-all ${
        isOn
          ? 'justify-end bg-(--toxic-green)/20 border-(--toxic-green)'
          : 'justify-start border-(--ash-gray)'
      }`}
    >
      <div
        className={`w-6 h-6 transition-colors ${
          isOn ? 'bg-(--toxic-green)' : 'bg-(--ash-gray)'
        }`}
      />
    </button>
  </div>
)

ToggleSwitch.propTypes = {
  isOn: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired
}

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
            <ToggleSwitch
              isOn={isMuted}
              onToggle={onToggleMute}
              ariaLabel={isMuted ? 'Unmute all audio' : 'Mute all audio'}
            />
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
          <ToggleSwitch
            isOn={settings?.crtEnabled ?? false}
            onToggle={onToggleCRT}
            ariaLabel={
              settings?.crtEnabled ? 'Disable CRT Effect' : 'Enable CRT Effect'
            }
          />
        </div>
      </div>

      {/* Log Settings */}
      {import.meta.env.DEV && (
        <div>
          <h2 className='font-[Metal_Mania] text-4xl uppercase text-(--toxic-green) mb-6 border-b border-(--ash-gray) pb-2'>
            LOG PROTOCOLS
          </h2>
          <div className='flex items-center justify-between'>
            <label
              htmlFor='logLevelSelect'
              className='font-[Courier_New] text-sm uppercase tracking-wide text-(--ash-gray)'
            >
              MINIMUM LOG LEVEL
            </label>
            <select
              id='logLevelSelect'
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
      <DataManagement onDeleteSave={onDeleteSave} />
    </div>
  )
}

const DataManagement = ({ onDeleteSave }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const handleOpenConfirm = () => setIsConfirmOpen(true)
  const handleCloseConfirm = () => setIsConfirmOpen(false)
  const handleDeleteSave = () => {
    onDeleteSave()
    setIsConfirmOpen(false)
  }

  return (
    <div>
      <h2 className='font-[Metal_Mania] text-4xl uppercase text-(--blood-red) mb-6 border-b border-(--ash-gray) pb-2'>
        DATA PURGE
      </h2>
      <div className='flex justify-between items-center'>
        <p className='font-[Courier_New] text-lg text-(--ash-gray) max-w-xs'>
          WARNING: This action is irreversible. All tour progress will be lost.
        </p>
        <ActionButton
          onClick={handleOpenConfirm}
          className='bg-(--blood-red) text-(--void-black) border-(--blood-red) shadow-[4px_4px_0px_var(--blood-red)] hover:invert'
        >
          DELETE SAVE
        </ActionButton>
      </div>

      <Modal
        isOpen={isConfirmOpen}
        onClose={handleCloseConfirm}
        title='CONFIRM DELETE'
      >
        <div className='space-y-6'>
          <p className='font-mono text-(--ash-gray)'>
            Are you sure you want to delete your save game? This cannot be
            undone.
          </p>
          <div className='flex gap-4 justify-end'>
            <ActionButton onClick={handleCloseConfirm}>
              CANCEL
            </ActionButton>
            <ActionButton
              onClick={handleDeleteSave}
              className='bg-(--blood-red) text-(--void-black) border-(--blood-red) hover:invert'
            >
              CONFIRM
            </ActionButton>
          </div>
        </div>
      </Modal>
    </div>
  )
}

DataManagement.propTypes = {
  onDeleteSave: PropTypes.func.isRequired
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
