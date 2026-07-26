import type { GameState } from '../../types'
import { QuestOfferEngine } from '../../domain/questOfferEngine'
import { getQuestDefinition } from '../questRegistry'
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
  QUEST_ALCHEMIST
} from '../questsConstants'

const defineQuestOfferEvent = <
  T extends {
    id: string
    title: string
    description: string
    options: readonly unknown[]
  }
>(
  questId: string,
  event: T
) => {
  const offer = getQuestDefinition(questId)?.offer
  if (!offer) {
    throw new Error(`Quest offer metadata missing for ${questId}`)
  }

  return {
    ...event,
    category: offer.category,
    trigger: offer.trigger,
    chance: offer.chance,
    condition: (state: GameState): boolean =>
      QuestOfferEngine.canOfferQuest(state, questId)
  }
}

/** Raw quest-offer event definitions consumed by the event registry. */
export const QUEST_EVENTS = [
  defineQuestOfferEvent(QUEST_PICK_OF_DESTINY, {
    id: 'quest_trigger_pick_of_destiny',
    title: 'events:quest_trigger_pick_of_destiny.title',
    description: 'events:quest_trigger_pick_of_destiny.desc',
    options: [
      {
        label: 'events:quest_trigger_pick_of_destiny.opt1.label',
        effect: {
          type: 'quest',
          // Config lives in QUEST_REGISTRY; addQuest merges defaults by id.
          quest: QUEST_PICK_OF_DESTINY
        },
        outcomeText: 'events:quest_trigger_pick_of_destiny.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_pick_of_destiny.opt2.label',
        effect: { type: 'stat', stat: 'luck', value: -1 },
        outcomeText: 'events:quest_trigger_pick_of_destiny.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_VIRAL_DANCE, {
    id: 'quest_trigger_viral_dance',
    title: 'events:quest_trigger_viral_dance.title',
    description: 'events:quest_trigger_viral_dance.desc',
    options: [
      {
        label: 'events:quest_trigger_viral_dance.opt1.label',
        effect: {
          type: 'quest',
          quest: QUEST_VIRAL_DANCE
        },
        outcomeText: 'events:quest_trigger_viral_dance.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_viral_dance.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -5 },
        outcomeText: 'events:quest_trigger_viral_dance.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_SPONSOR_DEMAND, {
    id: 'quest_trigger_sponsor_demand',
    title: 'events:quest_trigger_sponsor_demand.title',
    description: 'events:quest_trigger_sponsor_demand.desc',
    options: [
      {
        label: 'events:quest_trigger_sponsor_demand.opt1.label',
        effect: {
          type: 'quest',
          quest: QUEST_SPONSOR_DEMAND
        },
        outcomeText: 'events:quest_trigger_sponsor_demand.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_sponsor_demand.opt2.label',
        effect: { type: 'stat', stat: 'fame', value: -10 },
        outcomeText: 'events:quest_trigger_sponsor_demand.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_HARMONY_PROJECT, {
    id: 'quest_trigger_harmony_project',
    title: 'events:quest_trigger_harmony_project.title',
    description: 'events:quest_trigger_harmony_project.desc',
    options: [
      {
        label: 'events:quest_trigger_harmony_project.opt1.label',
        effect: {
          type: 'quest',
          quest: QUEST_HARMONY_PROJECT
        },
        outcomeText: 'events:quest_trigger_harmony_project.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_harmony_project.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -5 },
        outcomeText: 'events:quest_trigger_harmony_project.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_LOCAL_LEGEND, {
    id: 'quest_trigger_local_legend',
    title: 'events:quest_trigger_local_legend.title',
    description: 'events:quest_trigger_local_legend.desc',
    options: [
      {
        label: 'events:quest_trigger_local_legend.opt1.label',
        effect: {
          type: 'quest',
          quest: QUEST_LOCAL_LEGEND
        },
        outcomeText: 'events:quest_trigger_local_legend.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_local_legend.opt2.label',
        effect: { type: 'stat', stat: 'fame', value: -15 },
        outcomeText: 'events:quest_trigger_local_legend.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_TOURBUS_INSPECTION, {
    id: 'quest_trigger_tourbus_inspection',
    title: 'events:quest_trigger_tourbus_inspection.title',
    description: 'events:quest_trigger_tourbus_inspection.desc',
    options: [
      {
        label: 'events:quest_trigger_tourbus_inspection.opt1.label',
        effect: { type: 'quest', quest: QUEST_TOURBUS_INSPECTION },
        outcomeText: 'events:quest_trigger_tourbus_inspection.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_tourbus_inspection.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_tourbus_inspection.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_STUDIO_DEMO, {
    id: 'quest_trigger_studio_demo',
    title: 'events:quest_trigger_studio_demo.title',
    description: 'events:quest_trigger_studio_demo.desc',
    options: [
      {
        label: 'events:quest_trigger_studio_demo.opt1.label',
        effect: { type: 'quest', quest: QUEST_STUDIO_DEMO },
        outcomeText: 'events:quest_trigger_studio_demo.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_studio_demo.opt2.label',
        effect: { type: 'stat', stat: 'fame', value: 3 },
        outcomeText: 'events:quest_trigger_studio_demo.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_MERCH_RUSH, {
    id: 'quest_trigger_merch_rush',
    title: 'events:quest_trigger_merch_rush.title',
    description: 'events:quest_trigger_merch_rush.desc',
    options: [
      {
        label: 'events:quest_trigger_merch_rush.opt1.label',
        effect: { type: 'quest', quest: QUEST_MERCH_RUSH },
        outcomeText: 'events:quest_trigger_merch_rush.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_merch_rush.opt2.label',
        effect: { type: 'resource', resource: 'money', value: 50 },
        outcomeText: 'events:quest_trigger_merch_rush.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_VENUE_RESIDENCY, {
    id: 'quest_trigger_venue_residency',
    title: 'events:quest_trigger_venue_residency.title',
    description: 'events:quest_trigger_venue_residency.desc',
    options: [
      {
        label: 'events:quest_trigger_venue_residency.opt1.label',
        effect: { type: 'quest', quest: QUEST_VENUE_RESIDENCY },
        outcomeText: 'events:quest_trigger_venue_residency.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_venue_residency.opt2.label',
        effect: { type: 'stat', stat: 'fame', value: 5 },
        outcomeText: 'events:quest_trigger_venue_residency.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_REGION_TAKEOVER, {
    id: 'quest_trigger_region_takeover',
    title: 'events:quest_trigger_region_takeover.title',
    description: 'events:quest_trigger_region_takeover.desc',
    options: [
      {
        label: 'events:quest_trigger_region_takeover.opt1.label',
        effect: { type: 'quest', quest: QUEST_REGION_TAKEOVER },
        outcomeText: 'events:quest_trigger_region_takeover.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_region_takeover.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -3 },
        outcomeText: 'events:quest_trigger_region_takeover.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_DRAMA_POST, {
    id: 'quest_trigger_drama_post',
    title: 'events:quest_trigger_drama_post.title',
    description: 'events:quest_trigger_drama_post.desc',
    options: [
      {
        label: 'events:quest_trigger_drama_post.opt1.label',
        effect: { type: 'quest', quest: QUEST_DRAMA_POST },
        outcomeText: 'events:quest_trigger_drama_post.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_drama_post.opt2.label',
        effect: { type: 'stat', stat: 'fame', value: -5 },
        outcomeText: 'events:quest_trigger_drama_post.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_PREMIUM_ENDORSEMENT, {
    id: 'quest_trigger_premium_endorsement',
    title: 'events:quest_trigger_premium_endorsement.title',
    description: 'events:quest_trigger_premium_endorsement.desc',
    options: [
      {
        label: 'events:quest_trigger_premium_endorsement.opt1.label',
        effect: { type: 'quest', quest: QUEST_PREMIUM_ENDORSEMENT },
        outcomeText: 'events:quest_trigger_premium_endorsement.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_premium_endorsement.opt2.label',
        effect: { type: 'resource', resource: 'money', value: 100 },
        outcomeText: 'events:quest_trigger_premium_endorsement.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_COMMUNITY_OUTREACH, {
    id: 'quest_trigger_community_outreach',
    title: 'events:quest_trigger_community_outreach.title',
    description: 'events:quest_trigger_community_outreach.desc',
    options: [
      {
        label: 'events:quest_trigger_community_outreach.opt1.label',
        effect: { type: 'quest', quest: QUEST_COMMUNITY_OUTREACH },
        outcomeText: 'events:quest_trigger_community_outreach.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_community_outreach.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -3 },
        outcomeText: 'events:quest_trigger_community_outreach.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_FLAWLESS_RUN, {
    id: 'quest_trigger_flawless_run',
    title: 'events:quest_trigger_flawless_run.title',
    description: 'events:quest_trigger_flawless_run.desc',
    options: [
      {
        label: 'events:quest_trigger_flawless_run.opt1.label',
        effect: { type: 'quest', quest: QUEST_FLAWLESS_RUN },
        outcomeText: 'events:quest_trigger_flawless_run.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_flawless_run.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_flawless_run.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_STICKY_FINGERS, {
    id: 'quest_trigger_sticky_fingers',
    title: 'events:quest_trigger_sticky_fingers.title',
    description: 'events:quest_trigger_sticky_fingers.desc',
    options: [
      {
        label: 'events:quest_trigger_sticky_fingers.opt1.label',
        effect: { type: 'quest', quest: QUEST_STICKY_FINGERS },
        outcomeText: 'events:quest_trigger_sticky_fingers.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_sticky_fingers.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_sticky_fingers.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_SPECIAL_DELIVERY, {
    id: 'quest_trigger_special_delivery',
    title: 'events:quest_trigger_special_delivery.title',
    description: 'events:quest_trigger_special_delivery.desc',
    options: [
      {
        label: 'events:quest_trigger_special_delivery.opt1.label',
        effect: { type: 'quest', quest: QUEST_SPECIAL_DELIVERY },
        outcomeText: 'events:quest_trigger_special_delivery.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_special_delivery.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_special_delivery.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_PERSONA_NON_GRATA, {
    id: 'quest_trigger_persona_non_grata',
    title: 'events:quest_trigger_persona_non_grata.title',
    description: 'events:quest_trigger_persona_non_grata.desc',
    options: [
      {
        label: 'events:quest_trigger_persona_non_grata.opt1.label',
        effect: { type: 'quest', quest: QUEST_PERSONA_NON_GRATA },
        outcomeText: 'events:quest_trigger_persona_non_grata.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_persona_non_grata.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_persona_non_grata.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_MURPHYS_LAW, {
    id: 'quest_trigger_murphys_law',
    title: 'events:quest_trigger_murphys_law.title',
    description: 'events:quest_trigger_murphys_law.desc',
    options: [
      {
        label: 'events:quest_trigger_murphys_law.opt1.label',
        effect: { type: 'quest', quest: QUEST_MURPHYS_LAW },
        outcomeText: 'events:quest_trigger_murphys_law.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_murphys_law.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_murphys_law.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_CRISIS_MANAGER, {
    id: 'quest_trigger_crisis_manager',
    title: 'events:quest_trigger_crisis_manager.title',
    description: 'events:quest_trigger_crisis_manager.desc',
    options: [
      {
        label: 'events:quest_trigger_crisis_manager.opt1.label',
        effect: { type: 'quest', quest: QUEST_CRISIS_MANAGER },
        outcomeText: 'events:quest_trigger_crisis_manager.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_crisis_manager.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_crisis_manager.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_CHAPTER_MARKER, {
    id: 'quest_trigger_chapter_marker',
    title: 'events:quest_trigger_chapter_marker.title',
    description: 'events:quest_trigger_chapter_marker.desc',
    options: [
      {
        label: 'events:quest_trigger_chapter_marker.opt1.label',
        effect: { type: 'quest', quest: QUEST_CHAPTER_MARKER },
        outcomeText: 'events:quest_trigger_chapter_marker.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_chapter_marker.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_chapter_marker.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_PAYDAY, {
    id: 'quest_trigger_payday',
    title: 'events:quest_trigger_payday.title',
    description: 'events:quest_trigger_payday.desc',
    options: [
      {
        label: 'events:quest_trigger_payday.opt1.label',
        effect: { type: 'quest', quest: QUEST_PAYDAY },
        outcomeText: 'events:quest_trigger_payday.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_payday.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_payday.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_MAKE_AMENDS, {
    id: 'quest_trigger_make_amends',
    title: 'events:quest_trigger_make_amends.title',
    description: 'events:quest_trigger_make_amends.desc',
    options: [
      {
        label: 'events:quest_trigger_make_amends.opt1.label',
        effect: { type: 'quest', quest: QUEST_MAKE_AMENDS },
        outcomeText: 'events:quest_trigger_make_amends.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_make_amends.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_make_amends.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_BURNED_BRIDGES, {
    id: 'quest_trigger_burned_bridges',
    title: 'events:quest_trigger_burned_bridges.title',
    description: 'events:quest_trigger_burned_bridges.desc',
    options: [
      {
        label: 'events:quest_trigger_burned_bridges.opt1.label',
        effect: { type: 'quest', quest: QUEST_BURNED_BRIDGES },
        outcomeText: 'events:quest_trigger_burned_bridges.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_burned_bridges.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_burned_bridges.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_VENUE_REGULAR, {
    id: 'quest_trigger_venue_regular',
    title: 'events:quest_trigger_venue_regular.title',
    description: 'events:quest_trigger_venue_regular.desc',
    options: [
      {
        label: 'events:quest_trigger_venue_regular.opt1.label',
        effect: { type: 'quest', quest: QUEST_VENUE_REGULAR },
        outcomeText: 'events:quest_trigger_venue_regular.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_venue_regular.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_venue_regular.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_BRAND_AMBASSADOR, {
    id: 'quest_trigger_brand_ambassador',
    title: 'events:quest_trigger_brand_ambassador.title',
    description: 'events:quest_trigger_brand_ambassador.desc',
    options: [
      {
        label: 'events:quest_trigger_brand_ambassador.opt1.label',
        effect: { type: 'quest', quest: QUEST_BRAND_AMBASSADOR },
        outcomeText: 'events:quest_trigger_brand_ambassador.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_brand_ambassador.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_brand_ambassador.opt2.outcome'
      }
    ]
  }),
  defineQuestOfferEvent(QUEST_ALCHEMIST, {
    id: 'quest_trigger_alchemist',
    title: 'events:quest_trigger_alchemist.title',
    description: 'events:quest_trigger_alchemist.desc',
    options: [
      {
        label: 'events:quest_trigger_alchemist.opt1.label',
        effect: { type: 'quest', quest: QUEST_ALCHEMIST },
        outcomeText: 'events:quest_trigger_alchemist.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_alchemist.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_alchemist.opt2.outcome'
      }
    ]
  })
]
