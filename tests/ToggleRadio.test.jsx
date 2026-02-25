import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

import { render, fireEvent, cleanup, act } from '@testing-library/react'


const listeners = new Set()

const audioManagerMock = {
  _isPlaying: false,
  currentSongId: null,
  get isPlaying() {
    return this._isPlaying
  },
  subscribe: listener => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  emitChange: () => listeners.forEach(listener => listener()),
  stopMusic: vi.fn(() => {
    audioManagerMock.currentSongId = null
    audioManagerMock._isPlaying = false
    audioManagerMock.emitChange()
  }),
  resumeMusic: vi.fn(async () => {
    audioManagerMock.currentSongId = 'ambient'
    audioManagerMock._isPlaying = true
    audioManagerMock.emitChange()
    return true
  })
}

vi.mock('../src/utils/AudioManager', () => ({
    audioManager: audioManagerMock
  }))
beforeEach(() => {
    cleanup()
    listeners.clear()
})

test('ToggleRadio reacts to external playback changes and user toggles', async t => {
  audioManagerMock._isPlaying = false

  const { ToggleRadio } = await import('../src/components/ToggleRadio.jsx')

  const { getByRole } = render(<ToggleRadio />)
  expect(getByRole('button').textContent).toBe('▶')

  act(() => {
    audioManagerMock.currentSongId = 'ambient'
    audioManagerMock._isPlaying = true
    audioManagerMock.emitChange()
  })

  expect(getByRole('button').textContent).toBe('■')

  fireEvent.click(getByRole('button'))
  expect(audioManagerMock.stopMusic).toHaveBeenCalledTimes(1)
  expect(getByRole('button').textContent).toBe('▶')
})

test('ToggleRadio triggers resume path and updates after async change', async t => {
  audioManagerMock._isPlaying = false

  const { ToggleRadio } = await import('../src/components/ToggleRadio.jsx')
  const { getByRole } = render(<ToggleRadio />)

  expect(getByRole('button').textContent).toBe('▶')

  await act(async () => {
    fireEvent.click(getByRole('button'))
  })

  expect(audioManagerMock.resumeMusic).toHaveBeenCalledTimes(1)
  expect(getByRole('button').textContent).toBe('■')
})
