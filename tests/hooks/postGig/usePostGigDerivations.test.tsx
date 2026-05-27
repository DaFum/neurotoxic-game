import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePostGigDerivations } from '../../../src/hooks/postGig/usePostGigDerivations'
import * as postGigUtils from '../../../src/utils/postGigUtils'
import * as mapGenerator from '../../../src/utils/mapGenerator'
import * as mapUtils from '../../../src/utils/mapUtils'
import * as assetSelectors from '../../../src/utils/assetSelectors'
import type {
  Venue,
  PlayerState,
  BandState,
  SocialState,
  GigStats
} from '../../../src/types'

vi.mock('../../../src/utils/postGigUtils')
vi.mock('../../../src/utils/mapGenerator')
vi.mock('../../../src/utils/mapUtils')
vi.mock('../../../src/utils/assetSelectors')

describe('usePostGigDerivations', () => {
  const mockTriggerEvent = vi.fn()

  const createDefaultProps = () => ({
    currentGig: { id: 'test-venue' } as Venue,
    player: { location: 'test-city' } as PlayerState,
    gigModifiers: {} as Record<string, unknown>,
    activeEvent: null,
    band: { inventory: {}, merchPrices: {} } as BandState,
    assets: {} as Record<string, unknown>,
    social: {} as SocialState,
    lastGigStats: { score: 85 } as GigStats,
    reputationByRegion: {} as Record<string, unknown>,
    activeStoryFlags: [],
    cityStates: undefined,
    triggerEvent: mockTriggerEvent
  })

  let defaultProps: ReturnType<typeof createDefaultProps>

  beforeEach(() => {
    defaultProps = createDefaultProps()
    vi.clearAllMocks()

    vi.mocked(postGigUtils.calculatePerformanceScore).mockReturnValue(50)
    vi.mocked(postGigUtils.deriveGigContext).mockReturnValue({
      daysSinceLastGig: 1,
      lastGigDifficulty: null
    })
    vi.mocked(postGigUtils.deriveFinancials).mockReturnValue({
      income: { total: 100 },
      expenses: { total: 0 },
      net: 100
    } as ReturnType<typeof postGigUtils.deriveFinancials>)
    vi.mocked(postGigUtils.derivePostOptions).mockReturnValue({
      options: [{ type: 'rest' }] as import('../../../src/types').PostOption[],
      error: null
    })

    vi.mocked(mapUtils.normalizeVenueId).mockReturnValue('normalized-venue')
    vi.mocked(mapGenerator.getCityKeyFromVenueId).mockReturnValue('test-city')
    vi.mocked(mapGenerator.deriveCityTraits).mockReturnValue({
      tech_hub: true
    } as ReturnType<typeof mapGenerator.deriveCityTraits>)

    vi.mocked(assetSelectors.getActiveAssetModifiers).mockReturnValue({})
    mockTriggerEvent.mockReturnValue(true) // Default to event triggered
  })

  it('computes correct memos on render', () => {
    const { result } = renderHook(() => usePostGigDerivations(defaultProps))

    expect(result.current.perfScore).toBe(50)
    expect(result.current.financials).toEqual({
      income: { total: 100 },
      expenses: { total: 0 },
      net: 100
    })
    expect(result.current.postOptions).toEqual([{ type: 'rest' }])
    expect(result.current.postOptionsDerivationError).toBeNull()

    // Verify util calls
    expect(postGigUtils.calculatePerformanceScore).toHaveBeenCalledWith(85)
    expect(postGigUtils.deriveGigContext).toHaveBeenCalledWith(
      defaultProps.currentGig,
      defaultProps.social,
      defaultProps.player
    )
    expect(assetSelectors.getActiveAssetModifiers).toHaveBeenCalledWith(
      defaultProps.assets
    )
    expect(mapUtils.normalizeVenueId).toHaveBeenCalledWith('test-venue')
    expect(mapGenerator.getCityKeyFromVenueId).toHaveBeenCalledWith(
      'normalized-venue'
    )
    expect(mapGenerator.deriveCityTraits).toHaveBeenCalledWith('test-city')

    expect(postGigUtils.deriveFinancials).toHaveBeenCalledWith(
      expect.objectContaining({
        currentGig: defaultProps.currentGig,
        lastGigStats: defaultProps.lastGigStats,
        perfScore: 50,
        cityTraits: { tech_hub: true },
        assetModifiers: {}
      })
    )

    expect(postGigUtils.derivePostOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        currentGig: defaultProps.currentGig,
        lastGigStats: defaultProps.lastGigStats,
        player: defaultProps.player,
        band: defaultProps.band,
        social: defaultProps.social,
        activeEvent: defaultProps.activeEvent
      })
    )
  })

  it('does not trigger events if currentGig is null', () => {
    renderHook(() =>
      usePostGigDerivations({ ...defaultProps, currentGig: null })
    )
    expect(mockTriggerEvent).not.toHaveBeenCalled()
  })

  it('does not trigger events if activeEvent is present', () => {
    renderHook(() =>
      usePostGigDerivations({
        ...defaultProps,
        activeEvent: {
          type: 'some_event',
          id: 'some'
        } as import('../../../src/types').GameEvent
      })
    )
    expect(mockTriggerEvent).not.toHaveBeenCalled()
  })

  it('triggers events in priority order (financial -> special -> band)', () => {
    mockTriggerEvent
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true)

    renderHook(() => usePostGigDerivations(defaultProps))

    expect(mockTriggerEvent).toHaveBeenNthCalledWith(1, 'financial', 'post_gig')
    expect(mockTriggerEvent).toHaveBeenNthCalledWith(2, 'special', 'post_gig')
    expect(mockTriggerEvent).toHaveBeenNthCalledWith(3, 'band', 'post_gig')
  })

  it('stops triggering events once one returns true', () => {
    mockTriggerEvent.mockReturnValueOnce(false).mockReturnValueOnce(true)

    renderHook(() => usePostGigDerivations(defaultProps))

    expect(mockTriggerEvent).toHaveBeenCalledTimes(2)
    expect(mockTriggerEvent).toHaveBeenNthCalledWith(1, 'financial', 'post_gig')
    expect(mockTriggerEvent).toHaveBeenNthCalledWith(2, 'special', 'post_gig')
  })

  it('uses cityStates from props if available instead of deriving', () => {
    const cityStates = {
      'test-city': {
        tech_hub: false
      } as import('../../../src/types').CityTraitState
    }
    renderHook(() => usePostGigDerivations({ ...defaultProps, cityStates }))

    expect(mapGenerator.deriveCityTraits).not.toHaveBeenCalled()
    expect(postGigUtils.deriveFinancials).toHaveBeenCalledWith(
      expect.objectContaining({
        cityTraits: { tech_hub: false }
      })
    )
  })
})
