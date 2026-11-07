import { StrictMode } from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useKabelsalatBackground } from '../../src/scenes/kabelsalat/hooks/useKabelsalatBackground'
import { logger } from '../../src/utils/logger'
import { resolveGenImageUrl } from '../../src/utils/imageGen'
import {
  FakeImage,
  installFakeImage,
  restoreImage
} from '../helpers/fakeImage.js'

vi.mock('../../src/utils/logger', () => ({
  logger: {
    warn: vi.fn()
  }
}))

vi.mock('../../src/utils/imageGen', () => ({
  IMG_PROMPTS: {
    MINIGAME_KABELSALAT_BG: 'MINIGAME_KABELSALAT_BG'
  },
  resolveGenImageUrl: vi.fn(),
  getGenImageUrl: vi.fn(),
  isImageGenerationAvailable: vi.fn(),
  getGeneratedImageFallbackUrl: vi.fn()
}))

const rawUrl = 'mock-raw-url.png'

const onlyImage = (): FakeImage => {
  expect(FakeImage.instances).toHaveLength(1)
  return FakeImage.instances[0] as FakeImage
}

describe('useKabelsalatBackground', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers()
    installFakeImage()
    vi.mocked(resolveGenImageUrl).mockReturnValue(rawUrl)
  })

  afterEach(() => {
    vi.useRealTimers()
    restoreImage()
  })

  it('stays null while the preload is pending and requests the resolved URL', () => {
    const { result } = renderHook(() => useKabelsalatBackground())

    expect(result.current).toBeNull()
    expect(resolveGenImageUrl).toHaveBeenCalledWith('MINIGAME_KABELSALAT_BG')
    const img = onlyImage()
    expect(img.src).toBe(rawUrl)
    expect(img.handlersAttachedAtSrc).toBe(true)
    expect(img.crossOrigin).toBeNull()
  })

  it('returns the resolved URL once the image loads', () => {
    const { result } = renderHook(() => useKabelsalatBackground())

    act(() => onlyImage().load())

    expect(result.current).toBe(rawUrl)
    expect(logger.warn).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('falls back to the resolved URL and warns when the image fails', () => {
    const { result } = renderHook(() => useKabelsalatBackground())

    act(() => onlyImage().fail())

    expect(result.current).toBe(rawUrl)
    expect(logger.warn).toHaveBeenCalledTimes(1)
    expect(logger.warn).toHaveBeenCalledWith(
      'useKabelsalatBackground',
      expect.stringContaining(rawUrl)
    )
    expect(vi.getTimerCount()).toBe(0)
  })

  it('releases the resolved URL and warns after a 10 second stall', () => {
    const { result } = renderHook(() => useKabelsalatBackground())

    act(() => {
      vi.advanceTimersByTime(9999)
    })
    expect(result.current).toBeNull()
    expect(logger.warn).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe(rawUrl)
    expect(logger.warn).toHaveBeenCalledTimes(1)
    expect(logger.warn).toHaveBeenCalledWith(
      'useKabelsalatBackground',
      expect.stringContaining(rawUrl)
    )
  })

  it('ignores image events that arrive after the stall timeout', () => {
    renderHook(() => useKabelsalatBackground())
    const img = onlyImage()

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(img.onload).toBeNull()
    expect(img.onerror).toBeNull()
    expect(logger.warn).toHaveBeenCalledTimes(1)
  })

  it('stays null and warns when the URL cannot be resolved', () => {
    const resolveError = new Error('resolver failed')
    vi.mocked(resolveGenImageUrl).mockImplementation(() => {
      throw resolveError
    })

    const { result } = renderHook(() => useKabelsalatBackground())

    expect(result.current).toBeNull()
    expect(FakeImage.instances).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
    expect(logger.warn).toHaveBeenCalledWith(
      'useKabelsalatBackground',
      'Failed to resolve Kabelsalat background URL',
      resolveError
    )
  })

  it('detaches the handlers and clears the stall timer on unmount', () => {
    const { result, unmount } = renderHook(() => useKabelsalatBackground())
    const img = onlyImage()

    unmount()

    expect(img.onload).toBeNull()
    expect(img.onerror).toBeNull()
    expect(vi.getTimerCount()).toBe(0)

    vi.advanceTimersByTime(10000)
    img.load()
    img.fail()

    expect(result.current).toBeNull()
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('only lets the live effect run settle under StrictMode replay', () => {
    const { result } = renderHook(() => useKabelsalatBackground(), {
      wrapper: StrictMode
    })

    expect(FakeImage.instances).toHaveLength(2)
    const [discarded, live] = FakeImage.instances as [FakeImage, FakeImage]
    expect(discarded.onload).toBeNull()
    expect(discarded.onerror).toBeNull()
    expect(vi.getTimerCount()).toBe(1)

    act(() => {
      discarded.load()
      discarded.fail()
    })
    expect(result.current).toBeNull()

    act(() => live.load())
    expect(result.current).toBe(rawUrl)
    expect(logger.warn).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
})
