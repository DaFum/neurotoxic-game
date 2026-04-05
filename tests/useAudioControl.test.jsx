import { renderHook, act, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAudioControl } from '../src/hooks/useAudioControl.js'
import { audioManager } from '../src/utils/AudioManager.js'
import { handleError } from '../src/utils/errorHandler.js'

// Mock dependencies
vi.mock('../src/utils/AudioManager.js', () => {
  const listeners = new Set()
  let stateSnapshot = {
    musicVol: 0.5,
    sfxVol: 0.5,
    isMuted: false,
    isPlaying: false,
    currentSongId: null
  }

  const manager = {
    musicVolume: 0.5,
    sfxVolume: 0.5,
    muted: false,
    currentSongId: null,
    get isPlaying() {
      return this.currentSongId != null
    },
    subscribe: vi.fn(listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }),
    emitChange: () => {
      stateSnapshot = {
        musicVol: manager.musicVolume,
        sfxVol: manager.sfxVolume,
        isMuted: manager.muted,
        isPlaying: manager.isPlaying,
        currentSongId: manager.currentSongId
      }
      listeners.forEach(listener => listener())
    },
    getStateSnapshot: vi.fn(() => stateSnapshot),
    setMusicVolume: vi.fn(),
    setSFXVolume: vi.fn(),
    toggleMute: vi.fn(),
    stopMusic: vi.fn(),
    resumeMusic: vi.fn()
  }
  return { audioManager: manager }
})

vi.mock('../src/utils/errorHandler.js', () => ({
  handleError: vi.fn()
}))

describe('useAudioControl hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    audioManager.musicVolume = 0.5
    audioManager.sfxVolume = 0.5
    audioManager.muted = false
    audioManager.currentSongId = null
    audioManager.emitChange()

    audioManager.setMusicVolume.mockImplementation(val => {
      audioManager.musicVolume = val
      audioManager.emitChange()
      return true
    })

    audioManager.setSFXVolume.mockImplementation(val => {
      audioManager.sfxVolume = val
      audioManager.emitChange()
      return true
    })

    audioManager.stopMusic.mockImplementation(() => {
      audioManager.currentSongId = null
      audioManager.emitChange()
    })

    audioManager.resumeMusic.mockImplementation(async () => {
      audioManager.currentSongId = 'ambient'
      audioManager.emitChange()
      return true
    })

    audioManager.toggleMute.mockImplementation(() => {
      audioManager.muted = !audioManager.muted
      audioManager.emitChange()
      return audioManager.muted
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('handles audio state updates correctly (setMusic, setSfx, toggleMute)', async () => {
    const { result } = renderHook(() => useAudioControl())

    // Initial
    expect(result.current.audioState.musicVol).toBe(0.5)
    expect(result.current.audioState.sfxVol).toBe(0.5)
    expect(result.current.audioState.isMuted).toBe(false)

    // setMusic
    act(() => {
      result.current.handleAudioChange.setMusic(0.8)
    })
    expect(audioManager.setMusicVolume).toHaveBeenCalledWith(0.8)
    expect(result.current.audioState.musicVol).toBe(0.8)

    // setSfx
    act(() => {
      result.current.handleAudioChange.setSfx(0.2)
    })
    expect(audioManager.setSFXVolume).toHaveBeenCalledWith(0.2)
    expect(result.current.audioState.sfxVol).toBe(0.2)

    // toggleMute
    act(() => {
      result.current.handleAudioChange.toggleMute()
    })
    expect(audioManager.toggleMute).toHaveBeenCalled()
    expect(result.current.audioState.isMuted).toBe(true)
    act(() => {
      result.current.handleAudioChange.toggleMute()
    })
    expect(result.current.audioState.isMuted).toBe(false)

    // State transitions: play -> stop -> resume -> stop (idempotent)
    act(() => {
      audioManager.currentSongId = 'ambient'
      audioManager.emitChange()
    })
    expect(result.current.audioState.isPlaying).toBe(true)

    act(() => {
      result.current.handleAudioChange.stopMusic()
    })
    expect(audioManager.stopMusic).toHaveBeenCalled()
    expect(result.current.audioState.isPlaying).toBe(false)

    act(() => {
      result.current.handleAudioChange.stopMusic()
    }) // Idempotent check
    expect(audioManager.stopMusic).toHaveBeenCalledTimes(2)
    expect(result.current.audioState.isPlaying).toBe(false)

    await act(async () => {
      await result.current.handleAudioChange.resumeMusic()
    })
    expect(audioManager.resumeMusic).toHaveBeenCalled()
    expect(result.current.audioState.isPlaying).toBe(true)
  })

  it('handles exceptions and failures gracefully', () => {
    const { result } = renderHook(() => useAudioControl())

    // setMusic failure
    audioManager.setMusicVolume.mockImplementationOnce(() => false)
    act(() => {
      result.current.handleAudioChange.setMusic(0.8)
    })
    expect(result.current.audioState.musicVol).toBe(0.5)

    // setMusic exception
    const error1 = new Error('Music error')
    audioManager.setMusicVolume.mockImplementationOnce(() => {
      throw error1
    })
    act(() => {
      result.current.handleAudioChange.setMusic(0.8)
    })
    expect(handleError).toHaveBeenCalledWith(error1, expect.any(Object))

    // setSfx exception
    const error2 = new Error('SFX error')
    audioManager.setSFXVolume.mockImplementationOnce(() => {
      throw error2
    })
    act(() => {
      result.current.handleAudioChange.setSfx(0.2)
    })
    expect(handleError).toHaveBeenCalledWith(error2, expect.any(Object))

    // toggleMute exception
    const error3 = new Error('Mute error')
    audioManager.toggleMute.mockImplementationOnce(() => {
      throw error3
    })
    act(() => {
      result.current.handleAudioChange.toggleMute()
    })
    expect(handleError).toHaveBeenCalledWith(error3, expect.any(Object))
  })

  it('handles external state synchronization and selectors', () => {
    const { result, rerender } = renderHook(() =>
      useAudioControl(
        state => state.currentSongId === 'ambient' && state.isPlaying
      )
    )

    // Inline selector remains stable
    expect(result.current.audioState).toBe(false)
    rerender()
    expect(result.current.audioState).toBe(false)

    // Selector receives focused updates
    act(() => {
      audioManager.currentSongId = 'ambient'
      audioManager.emitChange()
    })
    expect(result.current.audioState).toBe(true)
  })

  it('syncs external mute updates across multiple hook instances', () => {
    const first = renderHook(() => useAudioControl())
    const second = renderHook(() => useAudioControl())

    expect(first.result.current.audioState.isMuted).toBe(false)
    expect(second.result.current.audioState.isMuted).toBe(false)

    act(() => {
      audioManager.muted = true
      audioManager.emitChange()
    })

    expect(first.result.current.audioState.isMuted).toBe(true)
    expect(second.result.current.audioState.isMuted).toBe(true)
  })

  it('polling fallback updates state when subscribe is unavailable', () => {
    vi.useFakeTimers()
    const originalSubscribe = audioManager.subscribe

    try {
      audioManager.subscribe = undefined

      const { result, unmount } = renderHook(() => useAudioControl())
      expect(result.current.audioState.isMuted).toBe(false)

      audioManager.muted = true

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.audioState.isMuted).toBe(true)
      unmount()
    } finally {
      audioManager.subscribe = originalSubscribe
      vi.useRealTimers()
    }
  })
})
