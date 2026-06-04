import { useState } from 'react'
import type { PostResult } from '../../types'
import type { BrandDeal } from '../../types/social'

/** Ordered phases used by the post-gig flow. */
export type PostGigPhase = 'REPORT' | 'SOCIAL' | 'DEALS' | 'COMPLETE'

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
 * Manages post-gig local phase, social-post result, and brand-offer state.
 *
 * @returns Post-gig phase state, setters, brand offers, and localized phase title metadata.
 */
export const usePostGigState = () => {
  const [phase, setPhase] = useState<PostGigPhase>('REPORT')
  const [postResult, setPostResult] = useState<PostResult | null>(null)
  const [brandOffers, setBrandOffers] = useState<BrandDeal[]>([])

  const { key: phaseTitleKey, default: phaseTitleDefault } =
    PHASE_METADATA[phase]

  return {
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
