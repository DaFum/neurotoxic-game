import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  executeAudioAction,
  createAudioHandlers,
  getAudioSnapshot,
  createAudioSubscriber
} from '../../src/hooks/useAudioControl.js'
import { handleError } from '../../src/utils/errorHandler.js'

vi.mock('../../src/utils/errorHandler.js', () => ({
  handleError: vi.fn()
}))

describe('audioControlUtils', () => {
  let mockManager

  beforeEach(() => {
    mockManager = {
      setMusicVolume: vi.fn(),
      setSFXVolume: vi.fn(),
      toggleMute: vi.fn(),
      stopMusic: vi.fn(),
      resumeMusic: vi.fn(),
      getStateSnapshot: vi.fn(),
      subscribe: vi.fn(),
      musicVolume: 0.5,
      sfxVolume: 0.5,
      muted: false,
      isPlaying: false,
      currentSongId: null
    }
    vi.clearAllMocks()
  })

  describe('executeAudioAction', () => {
    it('executes method successfully', () => {
      mockManager.setMusicVolume.mockReturnValue(true)
      const result = executeAudioAction(
        mockManager,
        'setMusicVolume',
        'setMusic',
        0.8
      )
      expect(mockManager.setMusicVolume).toHaveBeenCalledWith(0.8)
      expect(result).toBe(true)
    })

    it('handles errors via handleError', () => {
      const error = new Error('Test error')
      mockManager.setMusicVolume.mockImplementation(() => {
        throw error
      })
      const result = executeAudioAction(
        mockManager,
        'setMusicVolume',
        'setMusic',
        0.8
      )
      expect(handleError).toHaveBeenCalledWith(error, {
        fallbackMessage: 'useAudioControl.setMusic failed',
        silent: true
      })
      expect(result).toBeUndefined()
    })
  })

  describe('createAudioHandlers', () => {
    it('creates handlers mapping to manager methods', async () => {
      const handlers = createAudioHandlers(mockManager)

      handlers.setMusic(0.8)
      expect(mockManager.setMusicVolume).toHaveBeenCalledWith(0.8)

      handlers.setSfx(0.6)
      expect(mockManager.setSFXVolume).toHaveBeenCalledWith(0.6)

      handlers.toggleMute()
      expect(mockManager.toggleMute).toHaveBeenCalled()

      handlers.stopMusic()
      expect(mockManager.stopMusic).toHaveBeenCalled()

      mockManager.resumeMusic.mockReturnValue(Promise.resolve(true))
      const resumeResult = await handlers.resumeMusic()
      expect(mockManager.resumeMusic).toHaveBeenCalled()
      expect(resumeResult).toBe(true)
    })

    it('resumeMusic returns false when returning undefined (error case)', async () => {
      mockManager.resumeMusic.mockImplementation(() => {
        throw new Error('fail')
      })
      const handlers = createAudioHandlers(mockManager)
      const resumeResult = await handlers.resumeMusic()
      expect(resumeResult).toBe(false)
    })
  })

  describe('getAudioSnapshot', () => {
    it('returns state snapshot if native subscribe exists and supported', () => {
      mockManager.getStateSnapshot.mockReturnValue({ isPlaying: true })
      const snapshot = getAudioSnapshot(mockManager, true, { current: null })
      expect(snapshot).toEqual({ isPlaying: true })
    })

    it('builds snapshot manually and caches it if unchanged', () => {
      const fallbackRef = { current: null }
      const snapshot1 = getAudioSnapshot(mockManager, false, fallbackRef)
      expect(snapshot1).toEqual({
        musicVol: 0.5,
        sfxVol: 0.5,
        isMuted: false,
        isPlaying: false,
        currentSongId: null
      })

      const snapshot2 = getAudioSnapshot(mockManager, false, fallbackRef)
      expect(snapshot2).toBe(snapshot1) // cached ref
    })
  })

  describe('createAudioSubscriber', () => {
    it('returns native subscribe when supported', () => {
      const unsub = vi.fn()
      mockManager.subscribe.mockReturnValue(unsub)

      const subscriber = createAudioSubscriber(mockManager, true, false, 1000)
      const listener = vi.fn()
      const cleanup = subscriber(listener)

      expect(mockManager.subscribe).toHaveBeenCalledWith(listener)
      cleanup()
      expect(unsub).toHaveBeenCalled()
    })

    it('sets up polling when subscribe is not supported or pollEvenWithSubscribe is true', () => {
      vi.useFakeTimers()
      const unsub = vi.fn()
      mockManager.subscribe.mockReturnValue(unsub)

      const subscriber = createAudioSubscriber(mockManager, false, false, 1000)
      const listener = vi.fn()
      const cleanup = subscriber(listener)

      vi.advanceTimersByTime(1000)
      expect(listener).toHaveBeenCalledTimes(1)

      cleanup()
      vi.useRealTimers()
    })
  })
})
