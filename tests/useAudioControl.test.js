import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import {
  mockAudioControlDependencies,
  setupAudioControlTest
} from './useAudioControlTestUtils.js'

const { mockAudioManager, mockHandleError } = mockAudioControlDependencies
const { useAudioControl } = await setupAudioControlTest()

describe('useAudioControl', () => {
  beforeEach(() => {
    mockAudioManager.musicVolume = 0.5
    mockAudioManager.sfxVolume = 0.5
    mockAudioManager.muted = false

    mockAudioManager.setMusicVolume.mock.resetCalls()
    mockAudioManager.setMusicVolume.mock.mockImplementation(val => {
      mockAudioManager.musicVolume = val
      return true
    })

    mockAudioManager.setSFXVolume.mock.resetCalls()
    mockAudioManager.setSFXVolume.mock.mockImplementation(val => {
      mockAudioManager.sfxVolume = val
      return true
    })

    mockAudioManager.toggleMute.mock.resetCalls()
    mockAudioManager.toggleMute.mock.mockImplementation(() => {
      mockAudioManager.muted = !mockAudioManager.muted
      return mockAudioManager.muted
    })

    mockHandleError.mock.resetCalls()

    setupJSDOM()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
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
    assert.equal(
      mockAudioManager.setMusicVolume.mock.calls[0].arguments[0],
      0.8
    )
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
    mockAudioManager.setMusicVolume.mock.mockImplementation(() => {
      throw error
    })
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
    mockAudioManager.setSFXVolume.mock.mockImplementation(() => {
      throw error
    })
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
    mockAudioManager.toggleMute.mock.mockImplementation(() => {
      throw error
    })
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
