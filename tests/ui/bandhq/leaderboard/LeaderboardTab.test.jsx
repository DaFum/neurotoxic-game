import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LeaderboardTab } from '../../../../src/ui/bandhq/leaderboard/LeaderboardTab.tsx'

const loggerMocks = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn()
}))

vi.mock('../../../../src/utils/logger', () => ({
  logger: {
    error: loggerMocks.error,
    info: loggerMocks.info,
    warn: vi.fn()
  }
}))

vi.mock('../../../../src/data/songs', () => ({
  SONGS_DB: [{ id: 'song-1', title: 'Song One', leaderboardId: 'song-one' }],
  SONGS_BY_ID: new Map([
    ['song-1', { id: 'song-1', title: 'Song One', leaderboardId: 'song-one' }]
  ])
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

  it('keeps the active tab enabled and supports roving keyboard focus', async () => {
    const user = userEvent.setup()
    render(<LeaderboardTab />)

    const tabs = screen.getAllByRole('tab')
    const firstTab = tabs[0]
    const secondTab = tabs[1]
    const lastTab = tabs[tabs.length - 1]

    expect(firstTab).toBeEnabled()
    expect(firstTab).toHaveAttribute('aria-selected', 'true')
    expect(firstTab).toHaveAttribute('tabindex', '0')
    for (const tab of tabs.slice(1)) {
      expect(tab).toHaveAttribute('tabindex', '-1')
    }

    firstTab.focus()
    await user.keyboard('{ArrowRight}')

    expect(secondTab).toHaveFocus()
    expect(secondTab).toBeEnabled()
    expect(secondTab).toHaveAttribute('aria-selected', 'true')
    expect(secondTab).toHaveAttribute('tabindex', '0')
    expect(firstTab).toHaveAttribute('tabindex', '-1')

    await user.keyboard('{End}')
    expect(lastTab).toHaveFocus()
    expect(lastTab).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{Home}')
    expect(firstTab).toHaveFocus()
    expect(firstTab).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{ArrowLeft}')
    expect(lastTab).toHaveFocus()
    expect(lastTab).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{ArrowRight}')
    expect(firstTab).toHaveFocus()
    expect(firstTab).toHaveAttribute('aria-selected', 'true')
  })
})
