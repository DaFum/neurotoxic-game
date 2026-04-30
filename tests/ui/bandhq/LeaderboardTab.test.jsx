import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LeaderboardTab } from '../../../src/ui/bandhq/LeaderboardTab.tsx'

const loggerMocks = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn()
}))

vi.mock('../../../src/utils/logger', () => ({
  logger: {
    error: loggerMocks.error,
    info: loggerMocks.info,
    warn: vi.fn()
  }
}))

vi.mock('../../../src/data/songs', () => ({
  SONGS_DB: [{ id: 'song-1', title: 'Song One', leaderboardId: 'song-one' }],
  SONGS_BY_ID: {
    'song-1': { id: 'song-1', title: 'Song One', leaderboardId: 'song-one' }
  }
}))

describe('LeaderboardTab', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('treats missing local leaderboard endpoints as unavailable instead of a crash-level load error', async () => {
    render(<LeaderboardTab />)

    await waitFor(() =>
      expect(screen.getByText('ui:leaderboard.unavailable')).toBeInTheDocument()
    )

    expect(loggerMocks.error).not.toHaveBeenCalled()
    expect(loggerMocks.info).toHaveBeenCalledWith(
      'Leaderboard',
      expect.stringContaining('endpoint unavailable')
    )
  })
})
