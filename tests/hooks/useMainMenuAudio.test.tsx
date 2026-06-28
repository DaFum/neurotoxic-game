import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMainMenuAudio } from '../../src/scenes/mainmenu/hooks/useMainMenuAudio'
import { audioService } from '../../src/utils/audio/audioEngine'
import { handleError } from '../../src/utils/errorHandler'

vi.mock('../../src/utils/audio/audioEngine', () => ({
  audioService: {
    ensureAudioContext: vi.fn(),
    startAmbient: vi.fn()
  },
  audioManager: {}
}))

vi.mock('../../src/utils/errorHandler', () => ({
  handleError: vi.fn()
}))

describe('useMainMenuAudio', () => {
  let isMountedRef: { current: boolean }
  let addToast: ReturnType<typeof vi.fn>
  let tRef: { current: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    vi.clearAllMocks()
    isMountedRef = { current: true }
    addToast = vi.fn()
    tRef = { current: vi.fn((key, options) => options?.defaultValue || key) }
  })

  const flushPromises = () => new Promise(process.nextTick)

  it('calls startAmbient when ensureAudioContext succeeds', async () => {
    vi.mocked(audioService.ensureAudioContext).mockResolvedValue(true)
    vi.mocked(audioService.startAmbient).mockResolvedValue()

    const { result } = renderHook(() =>
      useMainMenuAudio(isMountedRef, addToast, tRef)
    )

    act(() => {
      result.current.initializeAudio()
    })

    await flushPromises()

    expect(audioService.ensureAudioContext).toHaveBeenCalled()
    expect(audioService.startAmbient).toHaveBeenCalled()
    expect(handleError).not.toHaveBeenCalled()
  })

  it('reports an issue when ensureAudioContext returns false', async () => {
    vi.mocked(audioService.ensureAudioContext).mockResolvedValue(false)
    vi.mocked(audioService.startAmbient).mockResolvedValue()

    const { result } = renderHook(() =>
      useMainMenuAudio(isMountedRef, addToast, tRef)
    )

    act(() => {
      result.current.initializeAudio()
    })

    await flushPromises()

    expect(audioService.ensureAudioContext).toHaveBeenCalled()
    expect(audioService.startAmbient).not.toHaveBeenCalled()

    expect(handleError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        addToast,
        fallbackMessage: 'Audio initialization failed'
      })
    )

    expect(handleError.mock.calls[0][0].message).toBe('Audio unlock failed')
  })

  it('reports an issue when ensureAudioContext rejects', async () => {
    const error = new Error('Context failure')
    vi.mocked(audioService.ensureAudioContext).mockRejectedValue(error)

    const { result } = renderHook(() =>
      useMainMenuAudio(isMountedRef, addToast, tRef)
    )

    act(() => {
      result.current.initializeAudio()
    })

    await flushPromises()

    expect(audioService.ensureAudioContext).toHaveBeenCalled()
    expect(audioService.startAmbient).not.toHaveBeenCalled()

    expect(handleError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        addToast,
        fallbackMessage: 'Audio initialization failed'
      })
    )
  })

  it('reports an issue when startAmbient rejects', async () => {
    vi.mocked(audioService.ensureAudioContext).mockResolvedValue(true)
    const error = new Error('Ambient failure')
    vi.mocked(audioService.startAmbient).mockRejectedValue(error)

    const { result } = renderHook(() =>
      useMainMenuAudio(isMountedRef, addToast, tRef)
    )

    act(() => {
      result.current.initializeAudio()
    })

    await flushPromises()

    expect(audioService.ensureAudioContext).toHaveBeenCalled()
    expect(audioService.startAmbient).toHaveBeenCalled()

    expect(handleError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        addToast,
        fallbackMessage: 'Failed to start ambient audio'
      })
    )
  })

  it('does not call handleError if unmounted', async () => {
    vi.mocked(audioService.ensureAudioContext).mockResolvedValue(false)

    const { result } = renderHook(() =>
      useMainMenuAudio(isMountedRef, addToast, tRef)
    )

    isMountedRef.current = false // unmount before promise resolves

    act(() => {
      result.current.initializeAudio()
    })

    await flushPromises()

    expect(handleError).not.toHaveBeenCalled()
  })

  it('safely catches errors thrown by handleError', async () => {
    vi.mocked(audioService.ensureAudioContext).mockResolvedValue(false)
    vi.mocked(handleError).mockImplementation(() => {
      throw new Error('Toast failure')
    })

    const { result } = renderHook(() =>
      useMainMenuAudio(isMountedRef, addToast, tRef)
    )

    act(() => {
      result.current.initializeAudio()
    })

    await flushPromises()

    // Should not throw and crash the test
    expect(handleError).toHaveBeenCalled()
  })

  it("bails out early if unmounted when an error occurs", async () => {
    const error = new Error("Any issue")

    const { result } = renderHook(() => useMainMenuAudio(isMountedRef, addToast, tRef))

    isMountedRef.current = false

    // Use a dummy issue manually or trigger a catch flow.
    vi.mocked(audioService.ensureAudioContext).mockRejectedValue(error)
  it('reports an issue when startAmbientSafely throws synchronously inside then', async () => {
    vi.mocked(audioService.ensureAudioContext).mockResolvedValue(true)
    const error = new Error('Sync ambient failure')
    vi.mocked(audioService.startAmbient).mockImplementation(() => {
      throw error
    })

    const { result } = renderHook(() =>
      useMainMenuAudio(isMountedRef, addToast, tRef)
    )

    act(() => {
      result.current.initializeAudio()
    })

    await flushPromises()

    expect(handleError).not.toHaveBeenCalled()
    expect(handleError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        addToast,
        fallbackMessage: 'Audio initialization failed'
      })
    )
  })
})
