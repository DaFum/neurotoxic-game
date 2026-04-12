import { beforeEach, expect, test, vi } from 'vitest'

import { render, fireEvent, cleanup, act } from '@testing-library/react'

const { listeners, audioManagerMock } = vi.hoisted(() => {
  const listeners = new Set()
  const mock = {
    _isPlaying: false,
    currentSongId: null,
    get isPlaying() {
      return mock._isPlaying
    },
    subscribe: listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    emitChange: () => listeners.forEach(listener => listener()),
    stopMusic: vi.fn(() => {
      mock.currentSongId = null
      mock._isPlaying = false
      mock.emitChange()
    }),
    resumeMusic: vi.fn(async () => {
      mock.currentSongId = 'ambient'
      mock._isPlaying = true
      mock.emitChange()
      return true
    })
  }
  return { listeners, audioManagerMock: mock }
})

vi.mock('../src/utils/AudioManager', () => ({
  audioManager: audioManagerMock
}))

import { ToggleRadio } from '../src/components/ToggleRadio.jsx'

beforeEach(() => {
  cleanup()
  listeners.clear()
})

test('ToggleRadio reacts to external playback changes and user toggles', async _t => {
  audioManagerMock._isPlaying = false

  const { getByRole, container } = render(<ToggleRadio />)

  // When not playing, RazorPlayIcon SVG should be rendered
  expect(container.querySelector('svg')).toBeInTheDocument()

  act(() => {
    audioManagerMock.currentSongId = 'ambient'
    audioManagerMock._isPlaying = true
    audioManagerMock.emitChange()
  })

  expect(getByRole('button').textContent).toBe('■')

  fireEvent.click(getByRole('button'))
  expect(audioManagerMock.stopMusic).toHaveBeenCalledTimes(1)
  expect(container.querySelector('svg')).toBeInTheDocument()
})

test('ToggleRadio triggers resume path and updates after async change', async _t => {
  audioManagerMock._isPlaying = false

  const { getByRole, container } = render(<ToggleRadio />)

  expect(container.querySelector('svg')).toBeInTheDocument()

  await act(async () => {
    fireEvent.click(getByRole('button'))
  })

  expect(audioManagerMock.resumeMusic).toHaveBeenCalledTimes(1)
  expect(getByRole('button').textContent).toBe('■')
})
