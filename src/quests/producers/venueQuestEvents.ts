import type { QuestEvent } from '../../types'

export const createVenueGigCompletedQuestEvent = ({
  venueId,
  region,
  score
}: {
  venueId: string
  region: string
  score: number
}): QuestEvent => ({
  type: 'venue.gigCompleted',
  amount: 1,
  success: true,
  context: { venueId, region, score },
  tags: [venueId, region]
})

export const createVenueGoodGigQuestEvent = ({
  venueId,
  region,
  score,
  capacity
}: {
  venueId: string
  region: string
  score: number
  capacity?: number
}): QuestEvent => ({
  type: 'venue.goodGig',
  amount: 1,
  success: true,
  context: { venueId, region, score, capacity },
  tags: [venueId, region]
})

export const createVenueReputationChangedQuestEvent = ({
  venueId,
  amount,
  reason
}: {
  venueId: string
  amount: number
  reason?: string
}): QuestEvent => ({
  type: 'venue.reputationChanged',
  amount,
  success: amount >= 0,
  context: { venueId, reason },
  tags: [venueId, reason].filter(
    (entry): entry is string => typeof entry === 'string'
  )
})

export const createRegionReputationChangedQuestEvent = ({
  region,
  amount,
  reason
}: {
  region: string
  amount: number
  reason?: string
}): QuestEvent => ({
  type: 'region.reputationChanged',
  amount,
  success: amount >= 0,
  context: { region, reason },
  tags: [region, reason].filter(
    (entry): entry is string => typeof entry === 'string'
  )
})

export const createVenueBlacklistedQuestEvent = ({
  venueId,
  reason
}: {
  venueId: string
  reason: string
}): QuestEvent => ({
  type: 'venue.blacklisted',
  amount: 1,
  success: false,
  context: { venueId, reason },
  tags: [venueId, reason]
})

export const createVenueUnblacklistedQuestEvent = ({
  venueId,
  reason
}: {
  venueId: string
  reason: string
}): QuestEvent => ({
  type: 'venue.unblacklisted',
  amount: 1,
  success: true,
  context: { venueId, reason },
  tags: [venueId, reason]
})
