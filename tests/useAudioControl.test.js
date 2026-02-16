import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import React from 'react'
import { renderHook, act, cleanup } from '@testing-library/react'

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

// Dynamic import of the hook
const { useAudioControl } = await import('../src/hooks/useAudioControl.js')

describe('useAudioControl', () => {
  let dom
  let originalGlobalDescriptors

  beforeEach(() => {
    // Reset mock implementation and values
    mockAudioManager.musicVolume = 0.5
    mockAudioManager.sfxVolume = 0.5
    mockAudioManager.muted = false

    // Create fresh mocks for audioManager methods to reset call history
    mockAudioManager.setMusicVolume = mock.fn((val) => {
        mockAudioManager.musicVolume = val
        return true
    })
    mockAudioManager.setSFXVolume = mock.fn((val) => {
        mockAudioManager.sfxVolume = val
        return true
    })
    mockAudioManager.toggleMute = mock.fn(() => {
        mockAudioManager.muted = !mockAudioManager.muted
        return mockAudioManager.muted
    })

    // For handleError, we can't replace the exported function easily, so we rely on tracking calls or restoring if possible.
    // Assuming mock.restore() might not clear calls for standalone mock.fn(), we will use relative assertions or try to reset.
    // Ideally we'd use mockHandleError.mock.resetCalls() if supported.
    // For now, let's just make sure we check call counts correctly in tests.

    // Setup JSDOM
    originalGlobalDescriptors = new Map(
      ['window', 'document', 'navigator'].map(key => [
        key,
        Object.getOwnPropertyDescriptor(globalThis, key)
      ])
    )
    dom = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'http://localhost'
    })

    for (const [key, value] of [
      ['window', dom.window],
      ['document', dom.window.document],
      ['navigator', dom.window.navigator]
    ]) {
      Object.defineProperty(globalThis, key, {
        value,
        configurable: true,
        writable: true
      })
    }
  })

  afterEach(() => {
    cleanup()
    if (dom) {
      dom.window.close()
    }
    // Restore globals
    for (const key of ['window', 'document', 'navigator']) {
        const descriptor = originalGlobalDescriptors?.get(key)
        if (descriptor) {
          Object.defineProperty(globalThis, key, descriptor)
        } else {
          delete globalThis[key]
        }
      }
      originalGlobalDescriptors = null
      dom = null
  })

  test('initializes with values from audioManager', () => {
    const { result } = renderHook(() => useAudioControl())

    assert.equal(result.current.audioState.musicVol, 0.5)
    assert.equal(result.current.audioState.sfxVol, 0.5)
    assert.equal(result.current.audioState.isMuted, false)
  })

  test('setMusic updates music volume and state', () => {
    const { result } = renderHook(() => useAudioControl())

    act(() => {
      result.current.handleAudioChange.setMusic(0.8)
    })

    assert.equal(mockAudioManager.setMusicVolume.mock.calls.length, 1)
    assert.equal(mockAudioManager.setMusicVolume.mock.calls[0].arguments[0], 0.8)
    assert.equal(mockAudioManager.musicVolume, 0.8)
    assert.equal(result.current.audioState.musicVol, 0.8)
  })

  test('setMusic does not update state if manager returns false', () => {
    mockAudioManager.setMusicVolume.mock.mockImplementation(() => false)
    const { result } = renderHook(() => useAudioControl())

    act(() => {
      result.current.handleAudioChange.setMusic(0.8)
    })

    assert.equal(mockAudioManager.setMusicVolume.mock.calls.length, 1)
    assert.equal(result.current.audioState.musicVol, 0.5) // Original value
  })

  test('setMusic handles exceptions', () => {
    const error = new Error('Music error')
    mockAudioManager.setMusicVolume.mock.mockImplementation(() => { throw error })
    const callsBefore = mockHandleError.mock.calls.length
    const { result } = renderHook(() => useAudioControl())

    act(() => {
      result.current.handleAudioChange.setMusic(0.8)
    })

    assert.equal(mockHandleError.mock.calls.length, callsBefore + 1)
    assert.equal(mockHandleError.mock.calls[callsBefore].arguments[0], error)
    assert.equal(result.current.audioState.musicVol, 0.5) // Original value
  })

  test('setSfx updates sfx volume and state', () => {
    const { result } = renderHook(() => useAudioControl())

    act(() => {
      result.current.handleAudioChange.setSfx(0.2)
    })

    assert.equal(mockAudioManager.setSFXVolume.mock.calls.length, 1)
    assert.equal(mockAudioManager.setSFXVolume.mock.calls[0].arguments[0], 0.2)
    assert.equal(mockAudioManager.sfxVolume, 0.2)
    assert.equal(result.current.audioState.sfxVol, 0.2)
  })

  test('setSfx handles exceptions', () => {
     const error = new Error('SFX error')
     mockAudioManager.setSFXVolume.mock.mockImplementation(() => { throw error })
     const callsBefore = mockHandleError.mock.calls.length
     const { result } = renderHook(() => useAudioControl())

     act(() => {
       result.current.handleAudioChange.setSfx(0.2)
     })

     assert.equal(mockHandleError.mock.calls.length, callsBefore + 1)
     assert.equal(mockHandleError.mock.calls[callsBefore].arguments[0], error)
     assert.equal(result.current.audioState.sfxVol, 0.5)
   })

  test('toggleMute toggles mute state', () => {
    const { result } = renderHook(() => useAudioControl())

    act(() => {
      result.current.handleAudioChange.toggleMute()
    })

    assert.equal(mockAudioManager.toggleMute.mock.calls.length, 1)
    assert.equal(mockAudioManager.muted, true)
    assert.equal(result.current.audioState.isMuted, true)

    act(() => {
      result.current.handleAudioChange.toggleMute()
    })

    assert.equal(mockAudioManager.toggleMute.mock.calls.length, 2)
    assert.equal(mockAudioManager.muted, false)
    assert.equal(result.current.audioState.isMuted, false)
  })

  test('toggleMute handles exceptions', () => {
    const error = new Error('Mute error')
    mockAudioManager.toggleMute.mock.mockImplementation(() => { throw error })
    const callsBefore = mockHandleError.mock.calls.length
    const { result } = renderHook(() => useAudioControl())

    act(() => {
      result.current.handleAudioChange.toggleMute()
    })

    assert.equal(mockHandleError.mock.calls.length, callsBefore + 1)
    assert.equal(mockHandleError.mock.calls[callsBefore].arguments[0], error)
    assert.equal(result.current.audioState.isMuted, false)
  })
})
