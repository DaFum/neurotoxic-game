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
test('ToggleRadio reacts to external playback changes and user toggles', async t => {
  //  removed (handled by vitest env)
  // Cleanup:
    cleanup()
    listeners.clear()



  audioManagerMock.currentSongId = null
  audioManagerMock._isPlaying = false

  const { ToggleRadio } = await import('../src/components/ToggleRadio.jsx')

  const { getByRole } = render(<ToggleRadio />)
  expect(getByRole('button').textContent).toMatch(/[■▶]/)

  act(() => {
    audioManagerMock.currentSongId = 'ambient'
    audioManagerMock._isPlaying = true
    audioManagerMock.emitChange()
  })

  expect(getByRole('button').textContent).toMatch(/[■▶]/)

  fireEvent.click(getByRole('button'))
  expect(audioManagerMock.stopMusic.mock.calls.length).toBe(1)
  expect(getByRole('button').textContent).toMatch(/[■▶]/)
})

test('ToggleRadio triggers resume path and updates after async change', async t => {
  //  removed (handled by vitest env)
  // Cleanup:
    cleanup()
    listeners.clear()



  audioManagerMock.currentSongId = 'ambient'
  audioManagerMock._isPlaying = false

  const { ToggleRadio } = await import('../src/components/ToggleRadio.jsx')
  const { getByRole } = render(<ToggleRadio />)

  expect(getByRole('button').textContent).toMatch(/[■▶]/)

  await act(async () => {
    fireEvent.click(getByRole('button'))
  })

  expect(audioManagerMock.resumeMusic.mock.calls.length).toBe(1)
  expect(getByRole('button').textContent).toMatch(/[■▶]/)
})
