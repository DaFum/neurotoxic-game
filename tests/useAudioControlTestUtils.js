import { mock } from 'node:test'

// Define mocks
const mockAudioManager = {
  musicVolume: 0.5,
  sfxVolume: 0.5,
  muted: false,
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
  mockHandleError
}

export const setupAudioControlTest = async () => {
  const { useAudioControl } = await import('../src/hooks/useAudioControl.js')
  return { useAudioControl }
}
