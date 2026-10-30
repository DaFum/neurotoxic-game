import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRhythmGameLogic } from '../../src/hooks/useRhythmGameLogic'

const { fixture, gameStateRef, scoring } = vi.hoisted(() => ({
  fixture: { current: null },
  gameStateRef: { current: {} },
  scoring: vi.fn(() => ({ activateToxicMode: vi.fn() }))
}))
vi.mock('../../src/context/GameState.tsx', () => ({
  useGameSelector: selector => selector(fixture.current),
  useGameSelectorOptional: selector => selector(fixture.current),
  useGameActions: () => ({})
}))
const engine = { stopAudio: vi.fn() }
vi.mock('../../src/context/AudioEngineContext', () => ({
  useAudioEngine: () => engine
}))
vi.mock('../../src/hooks/rhythmGame/useRhythmGameState', () => ({
  useRhythmGameState: () => ({ gameStateRef, state: {}, setters: {} })
}))
vi.mock('../../src/hooks/rhythmGame/useRhythmGameScoring', () => ({
  useRhythmGameScoring: scoring
}))
vi.mock('../../src/hooks/rhythmGame/useRhythmGameAudio', () => ({
  useRhythmGameAudio: () => ({ retryAudioInitialization: vi.fn() })
}))
vi.mock('../../src/hooks/rhythmGame/useRhythmGameLoop', () => ({
  useRhythmGameLoop: () => ({ update: vi.fn() })
}))
vi.mock('../../src/hooks/rhythmGame/useRhythmGameInput', () => ({
  useRhythmGameInput: () => ({ registerInput: vi.fn() })
}))

describe('rhythm game rival venue matching', () => {
  beforeEach(() => {
    gameStateRef.current = {}
    fixture.current = {
      expedition: { status: 'idle' },
      band: { members: [], performance: {} },
      gameMap: { nodes: {} },
      currentGig: { id: 'berlin_so36' },
      rivalBand: { currentLocationId: 'node-1' }
    }
  })

  it.each([
    ['venues:berlin_so36', 'berlin_so36'],
    ['berlin_so36', 'venues:berlin_so36'],
    ['venues:berlin_so36', 'venues:berlin_so36'],
    ['berlin_so36', 'berlin_so36']
  ])('matches node venue %s against current gig %s', (nodeVenueId, gigId) => {
    fixture.current.gameMap.nodes = {
      'node-1': { id: 'node-1', venueId: nodeVenueId }
    }
    fixture.current.currentGig.id = gigId
    const { result } = renderHook(() => useRhythmGameLogic())
    expect(result.current.gameStateRef.current.rivalPenaltyActive).toBe(true)
  })

  it('normalizes the legacy nested venue fallback', () => {
    fixture.current.gameMap.nodes = {
      'node-1': { id: 'node-1', venue: { id: 'venues:berlin_so36' } }
    }
    const { result } = renderHook(() => useRhythmGameLogic())
    expect(result.current.gameStateRef.current.rivalPenaltyActive).toBe(true)
  })

  it('falls back to the nested venue when the top-level venue id is empty', () => {
    fixture.current.gameMap.nodes = {
      'node-1': {
        id: 'node-1',
        venueId: '',
        venue: { id: 'venues:berlin_so36' }
      }
    }
    const { result } = renderHook(() => useRhythmGameLogic())
    expect(result.current.gameStateRef.current.rivalPenaltyActive).toBe(true)
  })

  it('clears the penalty for an absent venue or rival on another node', () => {
    fixture.current.gameMap.nodes = {
      'node-1': { id: 'node-1', venueId: 'berlin_so36' }
    }
    fixture.current.rivalBand.currentLocationId = 'node-2'
    const { result, rerender } = renderHook(() => useRhythmGameLogic())
    expect(result.current.gameStateRef.current.rivalPenaltyActive).toBe(false)
    fixture.current.currentGig = null
    rerender()
    expect(result.current.gameStateRef.current.rivalPenaltyActive).toBe(false)
  })
})
