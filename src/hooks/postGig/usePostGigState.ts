import { useState } from 'react'
import type { PostResult } from '../../types'
import type { BrandDeal } from '../../types/social'

export const usePostGigState = () => {
  const [phase, setPhase] = useState('REPORT') // REPORT, SOCIAL, DEALS, COMPLETE
  const [postResult, setPostResult] = useState<PostResult | null>(null)
  const [brandOffers, setBrandOffers] = useState<BrandDeal[]>([])

  const phaseTitleKey =
    {
      REPORT: 'ui:postGig.phaseReport',
      SOCIAL: 'ui:postGig.phaseSocialStrategy',
      DEALS: 'ui:postGig.phaseBrandOffers',
      COMPLETE: 'ui:postGig.phaseTourUpdate'
    }[phase] ?? 'ui:postGig.phaseTourUpdate'

  const phaseTitleDefault =
    {
      REPORT: 'GIG REPORT',
      SOCIAL: 'SOCIAL MEDIA STRATEGY',
      DEALS: 'BRAND OFFERS',
      COMPLETE: 'TOUR UPDATE'
    }[phase] ?? 'TOUR UPDATE'

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
