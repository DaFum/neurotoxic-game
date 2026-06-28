import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Texture } from 'pixi.js'
import { useKabelsalatBackground } from '../../src/scenes/kabelsalat/hooks/useKabelsalatBackground'
import { loadTexture } from '../../src/components/stage/stageRenderUtils'
import { logger } from '../../src/utils/logger'
import { resolveGenImageUrl } from '../../src/utils/imageGen'

vi.mock('../../src/components/stage/stageRenderUtils', () => ({
  loadTexture: vi.fn()
}))

vi.mock('../../src/utils/logger', () => ({
  logger: {
    warn: vi.fn()
  }
}))

vi.mock('../../src/utils/imageGen', () => ({
  IMG_PROMPTS: {
    MINIGAME_KABELSALAT_BG: 'MINIGAME_KABELSALAT_BG'
  },
  resolveGenImageUrl: vi.fn()
}))

describe('useKabelsalatBackground', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('handles texture loading error and falls back to raw URL', async () => {
    const rawUrl = 'mock-raw-url.png'
    vi.mocked(resolveGenImageUrl).mockReturnValue(rawUrl)

    const mockError = new Error('Failed to load texture')
    vi.mocked(loadTexture).mockRejectedValue(mockError)

    const { result } = renderHook(() => useKabelsalatBackground())

    // Initial state
    expect(result.current).toBeNull()

    // Wait for the async effect to complete
    await waitFor(() => {
      expect(result.current).toBe(rawUrl)
    })

    // Verify error was logged
    expect(logger.warn).toHaveBeenCalledWith(
      'useKabelsalatBackground',
      'Failed to load Kabelsalat background texture',
      mockError
    )
  })

  it('successfully loads texture and sets source URL', async () => {
    const rawUrl = 'mock-raw-url.png'
    const textureUrl = 'resolved-texture.png'
    vi.mocked(resolveGenImageUrl).mockReturnValue(rawUrl)

    vi.mocked(loadTexture).mockResolvedValue({
      source: {
        resource: {
          src: textureUrl
        }
      }
    } as unknown as Texture)

    const { result } = renderHook(() => useKabelsalatBackground())

    // Initial state
    expect(result.current).toBeNull()

    // Wait for the async effect to complete
    await waitFor(() => {
      expect(result.current).toBe(textureUrl)
    })

    // Verify error was NOT logged
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('successfully loads texture but sets raw URL if resource.src is empty', async () => {
    const rawUrl = 'mock-raw-url.png'
    vi.mocked(resolveGenImageUrl).mockReturnValue(rawUrl)

    vi.mocked(loadTexture).mockResolvedValue({
      source: {
        resource: {
          src: '' // Empty src
        }
      }
    } as unknown as Texture)

    const { result } = renderHook(() => useKabelsalatBackground())

    // Wait for the async effect to complete
    await waitFor(() => {
      expect(result.current).toBe(rawUrl)
    })
  })

  it('handles case where texture resolves to null, falling back to raw URL', async () => {
    const rawUrl = 'mock-raw-url.png'
    vi.mocked(resolveGenImageUrl).mockReturnValue(rawUrl)

    vi.mocked(loadTexture).mockResolvedValue(null)

    const { result } = renderHook(() => useKabelsalatBackground())

    // Wait for the async effect to complete
    await waitFor(() => {
      expect(result.current).toBe(rawUrl)
    })
  })

  it('does not update state if unmounted before fetch completes', async () => {
    const rawUrl = 'mock-raw-url.png'
    vi.mocked(resolveGenImageUrl).mockReturnValue(rawUrl)

    let resolveTexture!: (value: unknown) => void
    const texturePromise = new Promise<unknown>(resolve => {
      resolveTexture = resolve
    })
    vi.mocked(loadTexture).mockReturnValue(texturePromise as unknown as Promise<Texture | null>)

    const { result, unmount } = renderHook(() => useKabelsalatBackground())

    expect(result.current).toBeNull()

    // Unmount before resolving
    unmount()

    // Resolve the promise
    resolveTexture({
      source: {
        resource: {
          src: 'texture-url.png'
        }
      }
    })

    // Flush microtasks to allow the promise chain to execute
    await Promise.resolve()

    // Just verify no warnings/errors are thrown
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('does not update state if unmounted before fetch fails', async () => {
    const rawUrl = 'mock-raw-url.png'
    vi.mocked(resolveGenImageUrl).mockReturnValue(rawUrl)

    let rejectTexture!: (reason: unknown) => void
    const texturePromise = new Promise<unknown>((_, reject) => {
      rejectTexture = reject
    })
    vi.mocked(loadTexture).mockReturnValue(texturePromise as unknown as Promise<Texture | null>)

    const { unmount } = renderHook(() => useKabelsalatBackground())

    // Unmount before rejecting
    unmount()

    // Reject the promise
    const mockError = new Error('Failed to load texture')
    rejectTexture(mockError)

    // Flush microtasks to allow the promise chain to execute
    await Promise.resolve()

    // Verify error was logged (catch block still runs)
    expect(logger.warn).toHaveBeenCalledWith(
      'useKabelsalatBackground',
      'Failed to load Kabelsalat background texture',
      mockError
    )
  })
})
