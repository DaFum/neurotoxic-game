import { useCallback, useState } from 'react'
import type { PostResult } from '../../types'
import type { BrandDeal } from '../../types/social'

/** Ordered phases used by the post-gig flow. */
export type PostGigPhase = 'REPORT' | 'SOCIAL' | 'DEALS' | 'COMPLETE'

/**
 * Post-gig flow state keyed by phase.
 *
 * @remarks
 * `DEALS` and `COMPLETE` require a `PostResult`, so those phases cannot be entered without one.
 */
export type PostGigFlowState =
  | { phase: 'REPORT'; result?: PostResult | null; offers?: BrandDeal[] }
  | { phase: 'SOCIAL'; result?: PostResult | null; offers?: BrandDeal[] }
  | { phase: 'DEALS'; result: PostResult; offers: BrandDeal[] }
  | { phase: 'COMPLETE'; result: PostResult; offers?: BrandDeal[] }

const PHASE_METADATA: Record<PostGigPhase, { key: string; default: string }> = {
  REPORT: {
    key: 'ui:postGig.phaseReport',
    default: 'GIG REPORT'
  },
  SOCIAL: {
    key: 'ui:postGig.phaseSocialStrategy',
    default: 'SOCIAL MEDIA STRATEGY'
  },
  DEALS: {
    key: 'ui:postGig.phaseBrandOffers',
    default: 'BRAND OFFERS'
  },
  COMPLETE: {
    key: 'ui:postGig.phaseTourUpdate',
    default: 'TOUR UPDATE'
  }
}

/**
 * Manages post-gig local flow state as a discriminated union, tracking post results
 * and brand offers across multi-step effects to guard against empty screens.
 *
 * @returns Post-gig flow state, phase, setters, post result, brand offers, and localized phase title metadata.
 */
export const usePostGigState = () => {
  const [flowState, setFlowState] = useState<PostGigFlowState>({
    phase: 'REPORT'
  })

  /** Stores the gig result on the current flow state without changing the phase. */
  const setPostResult = useCallback((result: PostResult) => {
    setFlowState(prev => ({
      ...prev,
      result
    }))
  }, [])

  /** Stores the brand offers on the current flow state without changing the phase. */
  const setBrandOffers = useCallback((offers: BrandDeal[]) => {
    setFlowState(prev => ({
      ...prev,
      offers
    }))
  }, [])

  /** Moves to the target phase; `DEALS` and `COMPLETE` are ignored while no result exists. */
  const setPhase = useCallback(
    (target: PostGigPhase | ((prev: PostGigPhase) => PostGigPhase)) => {
      setFlowState(prev => {
        const nextPhase =
          typeof target === 'function' ? target(prev.phase) : target
        if (nextPhase === prev.phase) return prev

        if (nextPhase === 'REPORT') {
          return { phase: 'REPORT' }
        }
        if (nextPhase === 'SOCIAL') {
          return { phase: 'SOCIAL' }
        }
        if (nextPhase === 'DEALS') {
          const result = 'result' in prev ? prev.result : null
          if (!result) return prev
          return {
            phase: 'DEALS',
            result,
            offers: 'offers' in prev && prev.offers ? prev.offers : []
          }
        }
        if (nextPhase === 'COMPLETE') {
          const result = 'result' in prev ? prev.result : null
          if (!result) return prev
          return {
            phase: 'COMPLETE',
            result
          }
        }
        return prev
      })
    },
    []
  )

  const phase: PostGigPhase = flowState.phase
  const postResult: PostResult | null =
    'result' in flowState && flowState.result ? flowState.result : null
  const brandOffers: BrandDeal[] =
    'offers' in flowState && flowState.offers ? flowState.offers : []

  const { key: phaseTitleKey, default: phaseTitleDefault } =
    PHASE_METADATA[phase]

  return {
    flowState,
    phase,
    setPhase,
    postResult,
    setPostResult,
    brandOffers,
    setBrandOffers,
    phaseTitleKey,
    phaseTitleDefault
  }
}
