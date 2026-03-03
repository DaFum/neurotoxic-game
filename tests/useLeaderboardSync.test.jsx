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
    const gameState = {
      player: {
        playerId: null,
        playerName: '',
        money: 100,
        fame: 0,
        day: 5
      }
    }

    renderHook(() => useLeaderboardSync(gameState))

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('skips sync if day has not advanced beyond last synced day', () => {
    localStorage.setItem('neurotoxic_last_synced_day:id-123', '5')
    const gameState = {
      player: {
        playerId: 'id-123',
        playerName: 'Player1',
        money: 100,
        fame: 0,
        day: 5
      }
    }

    renderHook(() => useLeaderboardSync(gameState))

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('syncs stats if day > last synced day and player is valid', async () => {
    localStorage.setItem('neurotoxic_last_synced_day:id-123', '4')
    mockFetch.mockResolvedValue({ ok: true })

    // Provide all required properties via GameState structure used by the hook
    const gameState = {
      player: {
        playerId: 'id-123',
        playerName: 'Player1',
        money: 500,
        fame: 100,
        day: 5,
        passiveFollowers: 500,
        stats: {
          totalDistance: 120,
          conflictsResolved: 3,
          stageDives: 10
        }
      },
      social: {
        instagram: 1000,
        tiktok: 200,
        youtube: 300,
        newsletter: 50
      }
    }

    renderHook(() => useLeaderboardSync(gameState))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/leaderboard/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: 'id-123',
          playerName: 'Player1',
          money: 500,
          day: 5,
          fame: 100,
          followers: 1550, // 1000 + 200 + 300 + 50
          distance: 120,
          conflicts: 3,
          stageDives: 10
        })
      })
    })

    expect(localStorage.getItem('neurotoxic_last_synced_day:id-123')).toBe('5')
  })

  it('does not update localStorage if sync fails', async () => {
    localStorage.setItem('neurotoxic_last_synced_day:id-123', '4')
    mockFetch.mockResolvedValue({ ok: false, statusText: 'Server Error' })

    const gameState = {
      player: {
        playerId: 'id-123',
        playerName: 'Player1',
        money: 500,
        fame: 100,
        day: 5,
        stats: {
          totalDistance: 120,
          conflictsResolved: 3,
          stageDives: 10
        }
      },
      social: {
        instagram: 1000
      }
    }

    renderHook(() => useLeaderboardSync(gameState))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    // Should still be 4 because sync failed
    expect(localStorage.getItem('neurotoxic_last_synced_day:id-123')).toBe('4')
  })
})
