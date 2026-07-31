import { describe, it, expect, vi } from 'vitest'
import { derivePostOptions } from '../../../src/utils/postGig/derivations'
import * as socialEngine from '../../../src/utils/socialEngine'
import type { GameState } from '../../../src/types/game'

vi.mock('../../../src/utils/socialEngine', async importOriginal => {
  const actual =
    await importOriginal<typeof import('../../../src/utils/socialEngine')>()
  return {
    ...actual,
    generatePostOptions: vi.fn()
  }
})

describe('derivePostOptions', () => {
  it('returns successful options from generatePostOptions', () => {
    const mockOptions = [{ id: 'opt1' }]
    const activeQuests = [{ id: 'quest_apology_tour' }]
    vi.mocked(socialEngine.generatePostOptions).mockReturnValue(
      mockOptions as unknown as socialEngine.SocialPostOption[]
    )

    const result = derivePostOptions({
      currentGig: { id: 'test-gig' } as unknown as GameState['currentGig'],
      lastGigStats: { score: 100 } as unknown as GameState['lastGigStats'],
      player: { money: 100 } as unknown as GameState['player'],
      band: { name: 'The Testers' } as unknown as GameState['band'],
      social: { followers: 1000 } as unknown as GameState['social'],
      activeEvent: null as unknown as GameState['activeEvent'],
      activeQuests: activeQuests as GameState['activeQuests']
    })

    expect(result.options).toEqual(mockOptions)
    expect(result.error).toBeNull()
    expect(socialEngine.generatePostOptions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ activeQuests })
    )
  })

  it('catches and returns generatePostOptions errors', () => {
    const error = new Error('Test generation error')
    vi.mocked(socialEngine.generatePostOptions).mockImplementation(() => {
      throw error
    })

    const result = derivePostOptions({
      currentGig: { id: 'test-gig' } as unknown as GameState['currentGig'],
      lastGigStats: { score: 100 } as unknown as GameState['lastGigStats'],
      player: { money: 100 } as unknown as GameState['player'],
      band: { name: 'The Testers' } as unknown as GameState['band'],
      social: { followers: 1000 } as unknown as GameState['social'],
      activeEvent: null as unknown as GameState['activeEvent'],
      activeQuests: []
    })

    expect(result.options).toEqual([])
    expect(result.error).toBe(error)
  })

  it('returns empty options when currentGig or lastGigStats are missing', () => {
    const result = derivePostOptions({
      currentGig: null as unknown as GameState['currentGig'],
      lastGigStats: null as unknown as GameState['lastGigStats'],
      player: {} as unknown as GameState['player'],
      band: {} as unknown as GameState['band'],
      social: {} as unknown as GameState['social'],
      activeEvent: null as unknown as GameState['activeEvent'],
      activeQuests: []
    })

    expect(result.options).toEqual([])
    expect(result.error).toBeNull()
  })
})
