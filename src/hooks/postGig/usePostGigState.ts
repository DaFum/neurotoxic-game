import { useCallback, useRef, useState } from 'react'
import type { PostResult } from '../../types'
import type { BrandDeal } from '../../types/social'

/** Ordered phases used by the post-gig flow. */
export type PostGigPhase = 'REPORT' | 'SOCIAL' | 'DEALS' | 'COMPLETE'

export type PostGigFlowState =
  | { phase: 'REPORT' }
  | { phase: 'SOCIAL' }
  | { phase: 'DEALS'; result: PostResult; offers: BrandDeal[] }
  | { phase: 'COMPLETE'; result: PostResult }

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
  const postResultRef = useRef<PostResult | null>(null)
  const brandOffersRef = useRef<BrandDeal[]>([])

  const setPostResult = useCallback((result: PostResult) => {
    postResultRef.current = result
    setFlowState(prev => {
      if (prev.phase === 'DEALS') {
        return { phase: 'DEALS', result, offers: prev.offers }
      }
      if (prev.phase === 'COMPLETE') {
        return { phase: 'COMPLETE', result }
      }
      return prev
    })
  }, [])

  const setBrandOffers = useCallback((offers: BrandDeal[]) => {
    brandOffersRef.current = offers
    setFlowState(prev => {
      if (prev.phase === 'DEALS') {
        return { phase: 'DEALS', result: prev.result, offers }
      }
      return prev
    })
  }, [])

  const setPhase = useCallback(
    (target: PostGigPhase | ((prev: PostGigPhase) => PostGigPhase)) => {
      setFlowState(prev => {
        const nextPhase =
          typeof target === 'function' ? target(prev.phase) : target
        if (nextPhase === prev.phase) return prev

        if (nextPhase === 'REPORT') {
          postResultRef.current = null
          brandOffersRef.current = []
          return { phase: 'REPORT' }
        }
        if (nextPhase === 'SOCIAL') {
          postResultRef.current = null
          brandOffersRef.current = []
          return { phase: 'SOCIAL' }
        }
        if (nextPhase === 'DEALS') {
          const result = postResultRef.current
          if (!result) return prev
          return {
            phase: 'DEALS',
            result,
            offers: brandOffersRef.current
          }
        }
        if (nextPhase === 'COMPLETE') {
          const result = postResultRef.current
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
    'result' in flowState ? flowState.result : null
  const brandOffers: BrandDeal[] = 'offers' in flowState ? flowState.offers : []

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
