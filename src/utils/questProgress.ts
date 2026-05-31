import { GameState } from '../types'
import { QuestLifecycle } from '../domain/questLifecycle'
import { QUEST_REGISTRY } from '../data/questRegistry'

export type QuestProgressEvent =
  | {
      type: 'gig_completed'
      score: number
      capacity: number
      venueId: string
      region: string
    }
  | {
      type: 'good_gig'
      score: number
      capacity: number
      venueId: string
      region: string
    }
  | {
      type: 'small_venue_good_gig'
      score: number
      capacity: number
      venueId: string
      region: string
    }
  | { type: 'social_post'; postType: string; followersGain: number }
  | { type: 'followers_gained'; amount: number }
  | { type: 'fame_gained'; amount: number }
  | { type: 'money_earned'; amount: number }
  | { type: 'harmony_recovered'; amount: number }
  | { type: 'item_collected'; itemId: string }
  | { type: 'brand_deal_completed'; dealId: string }
  | { type: 'travel_completed'; region: string }

export const QuestProgress = {
  applyEvent: (state: GameState, event: QuestProgressEvent): GameState => {
    let nextState = { ...state }
    if (!nextState.activeQuests) return nextState

    for (const quest of nextState.activeQuests) {
      const registryEntry =
        QUEST_REGISTRY[quest.id as keyof typeof QUEST_REGISTRY]
      if (!registryEntry) continue

      // Widen narrowed literal to the full event-source union: not every entry
      // in QUEST_REGISTRY exercises every progressSource today, but the dispatch
      // switch must remain exhaustive for new registry entries.
      const progressSource = registryEntry.progressSource as
        | QuestProgressEvent['type']
        | undefined
      if (!progressSource) continue

      let amount = 0

      switch (progressSource) {
        case 'gig_completed':
          if (event.type === 'gig_completed') amount = 1
          break
        case 'good_gig':
          if (event.type === 'good_gig') amount = 1
          break
        case 'small_venue_good_gig':
          if (event.type === 'small_venue_good_gig') amount = 1
          break
        case 'social_post':
          if (event.type === 'social_post') amount = 1
          break
        case 'followers_gained':
          if (
            event.type === 'followers_gained' &&
            Number.isFinite(event.amount)
          )
            amount = event.amount
          break
        case 'fame_gained':
          if (event.type === 'fame_gained' && Number.isFinite(event.amount))
            amount = event.amount
          break
        case 'money_earned':
          if (event.type === 'money_earned' && Number.isFinite(event.amount))
            amount = event.amount
          break
        case 'harmony_recovered':
          if (
            event.type === 'harmony_recovered' &&
            Number.isFinite(event.amount)
          )
            amount = event.amount
          break
        case 'item_collected':
          if (event.type === 'item_collected') amount = 1
          break
        case 'brand_deal_completed':
          if (event.type === 'brand_deal_completed') amount = 1
          break
        case 'travel_completed':
          if (event.type === 'travel_completed') amount = 1
          break
      }

      if (amount > 0) {
        nextState = QuestLifecycle.advanceQuest(nextState, {
          questId: quest.id,
          amount
        })
      }
    }

    return nextState
  }
}
