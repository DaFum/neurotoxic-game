import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi
} from 'vitest'

import { render, cleanup, fireEvent } from '@testing-library/react'

import React, { useState } from 'react'

// Mock dependencies before importing Settings
const mockChangeScene = vi.fn()
const mockUpdateSettings = vi.fn()
const mockDeleteSave = vi.fn()

vi.mock('../../src/context/GameState.jsx', () => ({
  useGameState: () => ({
    changeScene: mockChangeScene,
    settings: { crtEnabled: true, logLevel: 1 },
    updateSettings: mockUpdateSettings,
    deleteSave: mockDeleteSave
  })
}))
const mockSetMusic = vi.fn()
const mockSetSfx = vi.fn()
const mockToggleMute = vi.fn()

vi.mock('../../src/hooks/useAudioControl.js', () => ({
  useAudioControl: () => ({
    audioState: { musicVol: 0.5, sfxVol: 0.5, isMuted: false },
    handleAudioChange: {
      setMusic: mockSetMusic,
      setSfx: mockSetSfx,
      toggleMute: mockToggleMute
    }
  })
}))
// Mock child components to capture props
// We need to mock the named export from ../../src/ui/shared
const SettingsPanelCapture = vi.fn(() => <div data-testid='settings-panel' />)
vi.mock('../../src/ui/shared', () => ({
  SettingsPanel: SettingsPanelCapture,
  VolumeSlider: () => null,
  ActionButton: () => null,
  StatBox: () => null,
  ProgressBar: () => null
}))
const GlitchButtonCapture = vi.fn(({ children, onClick }) => (
  <button type='button' data-testid='glitch-button' onClick={onClick}>
    {children}
  </button>
))
vi.mock('../../src/ui/GlitchButton.jsx', () => ({
  GlitchButton: GlitchButtonCapture
}))
// Now import Settings
const { Settings } = await import('../../src/scenes/Settings.jsx')

describe('Settings Referential Stability', () => {
  beforeEach(() => {
    //  removed (handled by vitest env)
    SettingsPanelCapture.mockReset()
    GlitchButtonCapture.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  test('handlers should be stable across re-renders', () => {
    const TestWrapper = () => {
      const [count, setCount] = useState(0)
      return (
        <div>
          <button data-testid='rerender' onClick={() => setCount(count + 1)}>
            Rerender ({count})
          </button>
          <Settings />
        </div>
      )
    }

    const { getByTestId } = render(<TestWrapper />)

    // First render calls
    expect(SettingsPanelCapture.mock.calls.length).toBe(1)
    expect(GlitchButtonCapture.mock.calls.length).toBe(1)

    const firstRenderPanelProps = SettingsPanelCapture.mock.calls[0][0]
    const firstRenderButtonProps = GlitchButtonCapture.mock.calls[0][0]

    // Trigger re-render of parent
    const rerenderButton = getByTestId('rerender')
    fireEvent.click(rerenderButton)

    // Second render calls
    expect(SettingsPanelCapture.mock.calls.length).toBe(2)
    expect(GlitchButtonCapture.mock.calls.length).toBe(2)

    const secondRenderPanelProps = SettingsPanelCapture.mock.calls[1][0]
    const secondRenderButtonProps = GlitchButtonCapture.mock.calls[1][0]

    // Check stability
    const isStableToggleCRT =
      firstRenderPanelProps.onToggleCRT === secondRenderPanelProps.onToggleCRT
    const isStableLogLevelChange =
      firstRenderPanelProps.onLogLevelChange ===
      secondRenderPanelProps.onLogLevelChange
    const isStableReturn =
      firstRenderButtonProps.onClick === secondRenderButtonProps.onClick

    // We print the results for manual verification in this step
    console.log('Stability Baseline Results:')
    console.log(`onToggleCRT stable: ${isStableToggleCRT}`)
    console.log(`onLogLevelChange stable: ${isStableLogLevelChange}`)
    console.log(`onClick (Return) stable: ${isStableReturn}`)

    // Assertions - these will fail in the baseline
    expect(isStableToggleCRT).toBe(true)
    expect(isStableLogLevelChange).toBe(true)
    expect(isStableReturn).toBe(true)
  })
})
