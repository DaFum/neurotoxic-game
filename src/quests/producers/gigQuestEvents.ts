import type { QuestEvent } from '../../types'

export interface GigQuestEventInput {
  score: number
  capacity: number
  venueId: string
  region: string
}

const createGigEvent = (
  type: QuestEvent['type'],
  input: GigQuestEventInput
): QuestEvent => ({
  type,
  amount: 1,
  success: true,
  context: {
    score: input.score,
    capacity: input.capacity,
    venueId: input.venueId,
    region: input.region
  }
})

export const createGigCompletedQuestEvent = (
  input: GigQuestEventInput
): QuestEvent => createGigEvent('gig.completed', input)

export const createGoodGigQuestEvent = (
  input: GigQuestEventInput
): QuestEvent => createGigEvent('gig.good', input)

export const createSmallVenueGoodGigQuestEvent = (
  input: GigQuestEventInput
): QuestEvent => createGigEvent('gig.smallVenueGood', input)

export const createSmallVenueGoodQuestEvent = createSmallVenueGoodGigQuestEvent

export const createHarmonyChangedQuestEvent = ({
  amount,
  newHarmony
}: {
  amount: number
  newHarmony: number
}): QuestEvent => ({
  type: 'band.harmonyChanged',
  amount,
  success: true,
  context: { harmony: newHarmony }
})
