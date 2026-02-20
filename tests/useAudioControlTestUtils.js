import { mock } from 'node:test'

// Define mocks
const listeners = new Set()
let stateSnapshot = {
  musicVol: 0.5,
  sfxVol: 0.5,
  isMuted: false,
  isPlaying: false,
  currentSongId: null
}

const mockAudioManager = {
  musicVolume: 0.5,
  sfxVolume: 0.5,
  muted: false,
  currentSongId: null,
  get isPlaying() {
    return this.currentSongId != null
  },
  subscribe: listener => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  emitChange: () => {
    stateSnapshot = {
      musicVol: mockAudioManager.musicVolume,
      sfxVol: mockAudioManager.sfxVolume,
      isMuted: mockAudioManager.muted,
      isPlaying: mockAudioManager.isPlaying,
      currentSongId: mockAudioManager.currentSongId
    }
    listeners.forEach(listener => listener())
  },
  getStateSnapshot: () => stateSnapshot,
  setMusicVolume: mock.fn(),
  setSFXVolume: mock.fn(),
  toggleMute: mock.fn()
}

const mockHandleError = mock.fn()

// Apply mocks before importing the hook
mock.module('../src/utils/AudioManager', {
  namedExports: {
    audioManager: mockAudioManager
  }
})

mock.module('../src/utils/errorHandler', {
  namedExports: {
    handleError: mockHandleError
  }
})

export const mockAudioControlDependencies = {
  mockAudioManager,
  mockHandleError,
  listeners
}

export const setupAudioControlTest = async () => {
  const { useAudioControl } = await import('../src/hooks/useAudioControl.js')
  return { useAudioControl }
}
