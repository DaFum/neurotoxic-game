import type { GameState } from '../../types'
import { QuestOfferEngine } from '../../domain/questOfferEngine'
import { getQuestDefinition, type QuestRegistryId } from '../questRegistry'
import {
  QUEST_PICK_OF_DESTINY,
  QUEST_VIRAL_DANCE,
  QUEST_SPONSOR_DEMAND,
  QUEST_HARMONY_PROJECT,
  QUEST_LOCAL_LEGEND,
  QUEST_TOURBUS_INSPECTION,
  QUEST_STUDIO_DEMO,
  QUEST_MERCH_RUSH,
  QUEST_VENUE_RESIDENCY,
  QUEST_REGION_TAKEOVER,
  QUEST_DRAMA_POST,
  QUEST_PREMIUM_ENDORSEMENT,
  QUEST_COMMUNITY_OUTREACH,
  QUEST_FLAWLESS_RUN,
  QUEST_STICKY_FINGERS,
  QUEST_SPECIAL_DELIVERY,
  QUEST_PERSONA_NON_GRATA,
  QUEST_MURPHYS_LAW,
  QUEST_CRISIS_MANAGER,
  QUEST_CHAPTER_MARKER,
  QUEST_PAYDAY,
  QUEST_MAKE_AMENDS,
  QUEST_BURNED_BRIDGES,
  QUEST_VENUE_REGULAR,
  QUEST_BRAND_AMBASSADOR,
  QUEST_ALCHEMIST,
  QUEST_EXPEDITION_RUN_GOAL,
  QUEST_EXPEDITION_NEMESIS,
  QUEST_EXPEDITION_META_UNLOCK,
  QUEST_DAMAGE_CONTROL,
  QUEST_SIGN_HERE,
  QUEST_BEST_BEFORE,
  QUEST_EXPEDITION_EXIT_STRATEGY,
  QUEST_GARAGE_DAYS,
  QUEST_PREVENTIVE_MAINTENANCE,
  QUEST_HARD_KNOCKS,
  QUEST_STAGE_TIME
} from '../questsConstants'

interface QuestOfferRow {
  id: string
  declineEffect: unknown
}

const defineQuestOfferEvent = (
  questId: QuestRegistryId,
  { id, declineEffect }: QuestOfferRow
) => {
  const offer = getQuestDefinition(questId)?.offer
  if (!offer) {
    throw new Error(`Quest offer metadata missing for ${questId}`)
  }

  return {
    id,
    title: `events:${id}.title`,
    description: `events:${id}.desc`,
    category: offer.category,
    trigger: offer.trigger,
    chance: offer.chance,
    condition: (state: GameState): boolean =>
      QuestOfferEngine.canOfferQuest(state, questId),
    options: [
      {
        label: `events:${id}.opt1.label`,
        effect: {
          type: 'quest',
          quest: questId
        },
        outcomeText: `events:${id}.opt1.outcome`
      },
      {
        label: `events:${id}.opt2.label`,
        effect: declineEffect,
        outcomeText: `events:${id}.opt2.outcome`
      }
    ]
  }
}

/** Raw quest-offer event definitions consumed by the event registry. */
export const QUEST_EVENTS = [
  defineQuestOfferEvent(QUEST_PICK_OF_DESTINY, {
    id: 'quest_trigger_pick_of_destiny',
    declineEffect: { type: 'stat', stat: 'luck', value: -1 }
  }),
  defineQuestOfferEvent(QUEST_VIRAL_DANCE, {
    id: 'quest_trigger_viral_dance',
    declineEffect: { type: 'stat', stat: 'mood', value: -5 }
  }),
  defineQuestOfferEvent(QUEST_SPONSOR_DEMAND, {
    id: 'quest_trigger_sponsor_demand',
    declineEffect: { type: 'stat', stat: 'fame', value: -10 }
  }),
  defineQuestOfferEvent(QUEST_HARMONY_PROJECT, {
    id: 'quest_trigger_harmony_project',
    declineEffect: { type: 'stat', stat: 'mood', value: -5 }
  }),
  defineQuestOfferEvent(QUEST_LOCAL_LEGEND, {
    id: 'quest_trigger_local_legend',
    declineEffect: { type: 'stat', stat: 'fame', value: -15 }
  }),
  defineQuestOfferEvent(QUEST_TOURBUS_INSPECTION, {
    id: 'quest_trigger_tourbus_inspection',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_STUDIO_DEMO, {
    id: 'quest_trigger_studio_demo',
    declineEffect: { type: 'stat', stat: 'fame', value: 3 }
  }),
  defineQuestOfferEvent(QUEST_MERCH_RUSH, {
    id: 'quest_trigger_merch_rush',
    declineEffect: { type: 'resource', resource: 'money', value: 50 }
  }),
  defineQuestOfferEvent(QUEST_VENUE_RESIDENCY, {
    id: 'quest_trigger_venue_residency',
    declineEffect: { type: 'stat', stat: 'fame', value: 5 }
  }),
  defineQuestOfferEvent(QUEST_REGION_TAKEOVER, {
    id: 'quest_trigger_region_takeover',
    declineEffect: { type: 'stat', stat: 'mood', value: -3 }
  }),
  defineQuestOfferEvent(QUEST_DRAMA_POST, {
    id: 'quest_trigger_drama_post',
    declineEffect: { type: 'stat', stat: 'fame', value: -5 }
  }),
  defineQuestOfferEvent(QUEST_PREMIUM_ENDORSEMENT, {
    id: 'quest_trigger_premium_endorsement',
    declineEffect: { type: 'resource', resource: 'money', value: 100 }
  }),
  defineQuestOfferEvent(QUEST_COMMUNITY_OUTREACH, {
    id: 'quest_trigger_community_outreach',
    declineEffect: { type: 'stat', stat: 'mood', value: -3 }
  }),
  defineQuestOfferEvent(QUEST_FLAWLESS_RUN, {
    id: 'quest_trigger_flawless_run',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_STICKY_FINGERS, {
    id: 'quest_trigger_sticky_fingers',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_SPECIAL_DELIVERY, {
    id: 'quest_trigger_special_delivery',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_PERSONA_NON_GRATA, {
    id: 'quest_trigger_persona_non_grata',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_MURPHYS_LAW, {
    id: 'quest_trigger_murphys_law',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_CRISIS_MANAGER, {
    id: 'quest_trigger_crisis_manager',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_CHAPTER_MARKER, {
    id: 'quest_trigger_chapter_marker',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_PAYDAY, {
    id: 'quest_trigger_payday',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_MAKE_AMENDS, {
    id: 'quest_trigger_make_amends',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_BURNED_BRIDGES, {
    id: 'quest_trigger_burned_bridges',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_VENUE_REGULAR, {
    id: 'quest_trigger_venue_regular',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_BRAND_AMBASSADOR, {
    id: 'quest_trigger_brand_ambassador',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_ALCHEMIST, {
    id: 'quest_trigger_alchemist',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_EXPEDITION_RUN_GOAL, {
    id: 'quest_trigger_expedition_run_goal',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_EXPEDITION_NEMESIS, {
    id: 'quest_trigger_expedition_nemesis',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_EXPEDITION_META_UNLOCK, {
    id: 'quest_trigger_expedition_meta_unlock',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_EXPEDITION_EXIT_STRATEGY, {
    id: 'quest_trigger_expedition_exit_strategy',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_DAMAGE_CONTROL, {
    id: 'quest_trigger_damage_control',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_SIGN_HERE, {
    id: 'quest_trigger_sign_here',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_BEST_BEFORE, {
    id: 'quest_trigger_best_before',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_GARAGE_DAYS, {
    id: 'quest_trigger_garage_days',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_PREVENTIVE_MAINTENANCE, {
    id: 'quest_trigger_preventive_maintenance',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_HARD_KNOCKS, {
    id: 'quest_trigger_hard_knocks',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  }),
  defineQuestOfferEvent(QUEST_STAGE_TIME, {
    id: 'quest_trigger_stage_time',
    declineEffect: { type: 'stat', stat: 'mood', value: -2 }
  })
]
