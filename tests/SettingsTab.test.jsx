import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { SettingsTab } from '../src/ui/bandhq/SettingsTab.jsx'
import { useSettingsActions } from '../src/hooks/useSettingsActions'

vi.mock('../src/ui/shared', () => ({
  SettingsPanel: ({
    settings,
    musicVol,
    sfxVol,
    isMuted,
    onMusicChange,
    onSfxChange,
    onToggleMute,
    onToggleCRT,
    onLogLevelChange,
    onDeleteSave
  }) => (
    <div data-testid='settings-panel'>
      <span data-testid='crtEnabled'>{settings.crtEnabled ? 'yes' : 'no'}</span>
      <span data-testid='musicVol'>{musicVol}</span>
      <span data-testid='sfxVol'>{sfxVol}</span>
      <span data-testid='isMuted'>{isMuted ? 'yes' : 'no'}</span>

      <button type='button' onClick={() => onMusicChange(0.5)}>Music</button>
      <button type='button' onClick={() => onSfxChange(0.7)}>SFX</button>
      <button type='button' onClick={onToggleMute}>Mute</button>
      <button type='button' onClick={onToggleCRT}>CRT</button>
      <button type='button' onClick={() => onLogLevelChange('INFO')}>LogLevel</button>
      <button type='button' onClick={onDeleteSave}>Delete</button>
    </div>
  )
}))

vi.mock('../src/hooks/useSettingsActions', () => ({
  useSettingsActions: vi.fn(() => ({
    handleToggleCRT: vi.fn(),
    handleLogLevelChange: vi.fn()
  }))
}))

describe('SettingsTab', () => {
  const defaultProps = {
    settings: { crtEnabled: true, logLevel: 'DEBUG' },
    audioState: { musicVol: 0.8, sfxVol: 0.9, isMuted: false },
    onAudioChange: {
      setMusic: vi.fn(),
      setSfx: vi.fn(),
      toggleMute: vi.fn()
    },
    updateSettings: vi.fn(),
    deleteSave: vi.fn()
  }

  test('renders SettingsPanel and passes props correctly', () => {
    render(<SettingsTab {...defaultProps} />)

    expect(screen.getByTestId('settings-panel')).toBeInTheDocument()
    expect(screen.getByTestId('crtEnabled')).toHaveTextContent('yes')
    expect(screen.getByTestId('musicVol')).toHaveTextContent('0.8')
    expect(screen.getByTestId('sfxVol')).toHaveTextContent('0.9')
    expect(screen.getByTestId('isMuted')).toHaveTextContent('no')
  })

  test('calls audio callbacks when interacting with SettingsPanel', () => {
    render(<SettingsTab {...defaultProps} />)

    fireEvent.click(screen.getByText('Music'))
    expect(defaultProps.onAudioChange.setMusic).toHaveBeenCalledWith(0.5)

    fireEvent.click(screen.getByText('SFX'))
    expect(defaultProps.onAudioChange.setSfx).toHaveBeenCalledWith(0.7)

    fireEvent.click(screen.getByText('Mute'))
    expect(defaultProps.onAudioChange.toggleMute).toHaveBeenCalled()
  })

  test('calls deleteSave callback', () => {
    render(<SettingsTab {...defaultProps} />)

    fireEvent.click(screen.getByText('Delete'))
    expect(defaultProps.deleteSave).toHaveBeenCalled()
  })

  test('uses hooks to handle custom settings actions', () => {
    const handleToggleCRTMock = vi.fn()
    const handleLogLevelChangeMock = vi.fn()

    useSettingsActions.mockReturnValueOnce({
      handleToggleCRT: handleToggleCRTMock,
      handleLogLevelChange: handleLogLevelChangeMock
    })

    render(<SettingsTab {...defaultProps} />)

    fireEvent.click(screen.getByText('CRT'))
    expect(handleToggleCRTMock).toHaveBeenCalled()

    fireEvent.click(screen.getByText('LogLevel'))
    expect(handleLogLevelChangeMock).toHaveBeenCalledWith('INFO')
  })
})
