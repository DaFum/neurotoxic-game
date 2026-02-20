import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { render, fireEvent, cleanup, act } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'

const listeners = new Set()

const audioManagerMock = {
  currentSongId: null,
  isPlaying: false,
  subscribe: listener => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  emitChange: () => listeners.forEach(listener => listener()),
  stopMusic: mock.fn(() => {
    audioManagerMock.currentSongId = null
    audioManagerMock.isPlaying = false
    audioManagerMock.emitChange()
  }),
  resumeMusic: mock.fn(async () => {
    audioManagerMock.currentSongId = 'ambient'
    audioManagerMock.isPlaying = true
    audioManagerMock.emitChange()
    return true
  })
}

mock.module('../src/utils/AudioManager', {
  namedExports: {
    audioManager: audioManagerMock
  }
})

test('ToggleRadio reacts to external playback changes and user toggles', async t => {
  setupJSDOM()
  t.after(() => {
    cleanup()
    listeners.clear()
    teardownJSDOM()
  })

  const { ToggleRadio } = await import('../src/components/ToggleRadio.jsx')

  const { getByRole } = render(<ToggleRadio />)
  assert.equal(getByRole('button').textContent, '▶')

  act(() => {
    audioManagerMock.currentSongId = 'ambient'
    audioManagerMock.isPlaying = true
    audioManagerMock.emitChange()
  })

  assert.equal(getByRole('button').textContent, '■')

  fireEvent.click(getByRole('button'))
  assert.equal(audioManagerMock.stopMusic.mock.calls.length, 1)
  assert.equal(getByRole('button').textContent, '▶')
})
