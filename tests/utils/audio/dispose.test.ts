import { describe, it, expect, vi, beforeEach } from 'vitest'
import { safeDispose } from '../../../src/utils/audio/dispose'
import { logger } from '../../../src/utils/logger'

vi.mock('../../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

describe('safeDispose', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when passed null', () => {
    const result = safeDispose(null)
    expect(result).toBeNull()
  })

  it('returns null when passed undefined', () => {
    const result = safeDispose(undefined)
    expect(result).toBeNull()
  })

  it('returns null when passed an object without a dispose function', () => {
    const result = safeDispose({ notDispose: () => {} })
    expect(result).toBeNull()
  })

  it('calls dispose and returns null when passed a valid object', () => {
    const disposeMock = vi.fn()
    const node = { dispose: disposeMock }

    const result = safeDispose(node)

    expect(disposeMock).toHaveBeenCalledTimes(1)
    expect(result).toBeNull()
  })

  it('catches errors, logs them, and returns null when dispose throws an error', () => {
    const error = new Error('Disposal failed')
    const disposeMock = vi.fn().mockImplementation(() => {
      throw error
    })
    const node = { dispose: disposeMock }

    const result = safeDispose(node)

    expect(disposeMock).toHaveBeenCalledTimes(1)
    expect(logger.debug).toHaveBeenCalledWith(
      'AudioEngine',
      'Node disposal failed (likely benign)',
      error
    )
    expect(result).toBeNull()
  })
})
