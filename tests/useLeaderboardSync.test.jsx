import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useLeaderboardSync } from '../src/hooks/useLeaderboardSync'

// Mock Logger
vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

describe('useLeaderboardSync', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    global.fetch = mockFetch
  })

  afterEach(() => {
    delete global.fetch
  })

  it('skips sync if player ID is missing', () => {
    const player = {
      playerId: null,
      playerName: '',
      money: 100,
      day: 5
    }

    renderHook(() => useLeaderboardSync(player))

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('skips sync if day has not advanced beyond last synced day', () => {
    localStorage.setItem('neurotoxic_last_synced_day', '5')
    const player = {
      playerId: 'id-123',
      playerName: 'Player1',
      money: 100,
      day: 5
    }

    renderHook(() => useLeaderboardSync(player))

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('syncs balance if day > last synced day and player is valid', async () => {
    localStorage.setItem('neurotoxic_last_synced_day', '4')
    mockFetch.mockResolvedValue({ ok: true })

    const player = {
      playerId: 'id-123',
      playerName: 'Player1',
      money: 500,
      day: 5
    }

    renderHook(() => useLeaderboardSync(player))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/leaderboard/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: 'id-123',
          playerName: 'Player1',
          money: 500,
          day: 5
        })
      })
    })

    expect(localStorage.getItem('neurotoxic_last_synced_day')).toBe('5')
  })

  it('does not update localStorage if sync fails', async () => {
    localStorage.setItem('neurotoxic_last_synced_day', '4')
    mockFetch.mockResolvedValue({ ok: false, statusText: 'Server Error' })

    const player = {
      playerId: 'id-123',
      playerName: 'Player1',
      money: 500,
      day: 5
    }

    renderHook(() => useLeaderboardSync(player))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    // Should still be 4 because sync failed
    expect(localStorage.getItem('neurotoxic_last_synced_day')).toBe('4')
  })
})
