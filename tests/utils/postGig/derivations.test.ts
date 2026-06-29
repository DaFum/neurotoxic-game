import { describe, it, expect, vi } from 'vitest'
import { derivePostOptions, deriveGigContext, deriveFinancials } from '../../../src/utils/postGig/derivations'
import * as socialEngine from '../../../src/utils/socialEngine'
import * as economyEngine from '../../../src/utils/economyEngine'
import * as performanceLogic from '../../../src/utils/postGig/performanceLogic'

vi.mock('../../../src/utils/socialEngine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/utils/socialEngine')>()
  return {
    ...actual,
    generatePostOptions: vi.fn(),
  }
})

describe('derivePostOptions', () => {
  it('returns successful options from generatePostOptions', () => {
    const mockOptions = [{ id: 'opt1' }]
    vi.mocked(socialEngine.generatePostOptions).mockReturnValue(mockOptions as any)

    const result = derivePostOptions({
      currentGig: { id: 'test-gig' } as any,
      lastGigStats: { score: 100 } as any,
      player: { money: 100 } as any,
      band: { name: 'The Testers' } as any,
      social: { followers: 1000 } as any,
      activeEvent: null as any
    })

    expect(result.options).toEqual(mockOptions)
    expect(result.error).toBeNull()
  })

  it('catches and returns generatePostOptions errors', () => {
    const error = new Error('Test generation error')
    vi.mocked(socialEngine.generatePostOptions).mockImplementation(() => {
      throw error
    })

    const result = derivePostOptions({
      currentGig: { id: 'test-gig' } as any,
      lastGigStats: { score: 100 } as any,
      player: { money: 100 } as any,
      band: { name: 'The Testers' } as any,
      social: { followers: 1000 } as any,
      activeEvent: null as any
    })

    expect(result.options).toEqual([])
    expect(result.error).toBe(error)
  })

  it('returns empty options when currentGig or lastGigStats are missing', () => {
    const result = derivePostOptions({
      currentGig: null as any,
      lastGigStats: null as any,
      player: {} as any,
      band: {} as any,
      social: {} as any,
      activeEvent: null as any
    })

    expect(result.options).toEqual([])
    expect(result.error).toBeNull()
  })
})
