import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from '../testUtils.js'
import React, { useState } from 'react'

// Mock dependencies before importing Settings
const mockChangeScene = mock.fn()
const mockUpdateSettings = mock.fn()
const mockDeleteSave = mock.fn()

mock.module('../../src/context/GameState.jsx', {
  namedExports: {
    useGameState: () => ({
      changeScene: mockChangeScene,
      settings: { crtEnabled: true, logLevel: 1 },
      updateSettings: mockUpdateSettings,
      deleteSave: mockDeleteSave
    })
  }
})

const mockSetMusic = mock.fn()
const mockSetSfx = mock.fn()
const mockToggleMute = mock.fn()

mock.module('../../src/hooks/useAudioControl.js', {
  namedExports: {
    useAudioControl: () => ({
      audioState: { musicVol: 0.5, sfxVol: 0.5, isMuted: false },
      handleAudioChange: {
        setMusic: mockSetMusic,
        setSfx: mockSetSfx,
        toggleMute: mockToggleMute
      }
    })
  }
})

// Mock child components to capture props
// We need to mock the named export from ../../src/ui/shared
const SettingsPanelCapture = mock.fn(() => <div data-testid="settings-panel" />)
mock.module('../../src/ui/shared/index.js', {
  namedExports: {
    SettingsPanel: SettingsPanelCapture,
    VolumeSlider: () => null,
    ActionButton: () => null,
    StatBox: () => null,
    ProgressBar: () => null
  }
})

const GlitchButtonCapture = mock.fn(({ children, onClick }) => (
  <button data-testid="glitch-button" onClick={onClick}>
    {children}
  </button>
))
mock.module('../../src/ui/GlitchButton.jsx', {
  namedExports: {
    GlitchButton: GlitchButtonCapture
  }
})

// Now import Settings
const { Settings } = await import('../../src/scenes/Settings.jsx')

describe('Settings Referential Stability', () => {
  beforeEach(() => {
    setupJSDOM()
    SettingsPanelCapture.mock.resetCalls()
    GlitchButtonCapture.mock.resetCalls()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('handlers should be stable across re-renders', () => {
    const TestWrapper = () => {
      const [count, setCount] = useState(0)
      return (
        <div>
          <button data-testid="rerender" onClick={() => setCount(count + 1)}>
            Rerender ({count})
          </button>
          <Settings />
        </div>
      )
    }

    const { getByTestId } = render(<TestWrapper />)

    // First render calls
    assert.strictEqual(SettingsPanelCapture.mock.calls.length, 1)
    assert.strictEqual(GlitchButtonCapture.mock.calls.length, 1)

    const firstRenderPanelProps = SettingsPanelCapture.mock.calls[0].arguments[0]
    const firstRenderButtonProps = GlitchButtonCapture.mock.calls[0].arguments[0]

    // Trigger re-render of parent
    const rerenderButton = getByTestId('rerender')
    fireEvent.click(rerenderButton)

    // Second render calls
    assert.strictEqual(SettingsPanelCapture.mock.calls.length, 2)
    assert.strictEqual(GlitchButtonCapture.mock.calls.length, 2)

    const secondRenderPanelProps = SettingsPanelCapture.mock.calls[1].arguments[0]
    const secondRenderButtonProps = GlitchButtonCapture.mock.calls[1].arguments[0]

    // Check stability
    const isStable_ToggleCRT = firstRenderPanelProps.onToggleCRT === secondRenderPanelProps.onToggleCRT
    const isStable_LogLevelChange = firstRenderPanelProps.onLogLevelChange === secondRenderPanelProps.onLogLevelChange
    const isStable_Return = firstRenderButtonProps.onClick === secondRenderButtonProps.onClick

    // We print the results for manual verification in this step
    console.log('Stability Baseline Results:')
    console.log(`onToggleCRT stable: ${isStable_ToggleCRT}`)
    console.log(`onLogLevelChange stable: ${isStable_LogLevelChange}`)
    console.log(`onClick (Return) stable: ${isStable_Return}`)

    // Assertions - these will fail in the baseline
    assert.strictEqual(isStable_ToggleCRT, true, 'onToggleCRT should be stable')
    assert.strictEqual(isStable_LogLevelChange, true, 'onLogLevelChange should be stable')
    assert.strictEqual(isStable_Return, true, 'onClick (Return) should be stable')
  })
})
