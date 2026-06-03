import type { GameState } from '../../types'
import { QuestOfferEngine } from '../../domain/questOfferEngine'
import {
  QUEST_PICK_OF_DESTINY,
  QUEST_VIRAL_DANCE,
  QUEST_SPONSOR_DEMAND,
  QUEST_HARMONY_PROJECT,
  QUEST_LOCAL_LEGEND
} from '../questsConstants'

const canOfferQuest = (state: GameState, questId: string): boolean =>
  QuestOfferEngine.canOfferQuest(state, questId)

export const QUEST_EVENTS = [
  {
    id: 'quest_trigger_pick_of_destiny',
    category: 'special',
    title: 'events:quest_trigger_pick_of_destiny.title',
    description: 'events:quest_trigger_pick_of_destiny.desc',
    trigger: 'random',
    chance: 0.05,
    condition: (state: GameState) =>
      canOfferQuest(state, QUEST_PICK_OF_DESTINY),
    options: [
      {
        label: 'events:quest_trigger_pick_of_destiny.opt1.label',
        effect: {
          type: 'quest',
          // Config lives in QUEST_REGISTRY; addQuest merges defaults by id.
          quest: { id: QUEST_PICK_OF_DESTINY }
        },
        outcomeText: 'events:quest_trigger_pick_of_destiny.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_pick_of_destiny.opt2.label',
        effect: { type: 'stat', stat: 'luck', value: -1 },
        outcomeText: 'events:quest_trigger_pick_of_destiny.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_viral_dance',
    category: 'band',
    title: 'events:quest_trigger_viral_dance.title',
    description: 'events:quest_trigger_viral_dance.desc',
    trigger: 'random',
    chance: 0.1,
    condition: (state: GameState) => canOfferQuest(state, QUEST_VIRAL_DANCE),
    options: [
      {
        label: 'events:quest_trigger_viral_dance.opt1.label',
        effect: {
          type: 'quest',
          quest: { id: QUEST_VIRAL_DANCE }
        },
        outcomeText: 'events:quest_trigger_viral_dance.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_viral_dance.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -5 },
        outcomeText: 'events:quest_trigger_viral_dance.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_sponsor_demand',
    category: 'financial',
    title: 'events:quest_trigger_sponsor_demand.title',
    description: 'events:quest_trigger_sponsor_demand.desc',
    trigger: 'random',
    chance: 0.08,
    condition: (state: GameState) => canOfferQuest(state, QUEST_SPONSOR_DEMAND),
    options: [
      {
        label: 'events:quest_trigger_sponsor_demand.opt1.label',
        effect: {
          type: 'quest',
          quest: { id: QUEST_SPONSOR_DEMAND }
        },
        outcomeText: 'events:quest_trigger_sponsor_demand.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_sponsor_demand.opt2.label',
        effect: { type: 'stat', stat: 'fame', value: -10 },
        outcomeText: 'events:quest_trigger_sponsor_demand.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_harmony_project',
    category: 'band',
    title: 'events:quest_trigger_harmony_project.title',
    description: 'events:quest_trigger_harmony_project.desc',
    trigger: 'random',
    chance: 0.3, // High chance if condition is met, reduced to 0.3 to prevent spam
    condition: (state: GameState) =>
      canOfferQuest(state, QUEST_HARMONY_PROJECT),
    options: [
      {
        label: 'events:quest_trigger_harmony_project.opt1.label',
        effect: {
          type: 'quest',
          quest: { id: QUEST_HARMONY_PROJECT }
        },
        outcomeText: 'events:quest_trigger_harmony_project.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_harmony_project.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -5 },
        outcomeText: 'events:quest_trigger_harmony_project.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_local_legend',
    category: 'special',
    title: 'events:quest_trigger_local_legend.title',
    description: 'events:quest_trigger_local_legend.desc',
    trigger: 'random',
    chance: 0.07,
    condition: (state: GameState) => canOfferQuest(state, QUEST_LOCAL_LEGEND),
    options: [
      {
        label: 'events:quest_trigger_local_legend.opt1.label',
        effect: {
          type: 'quest',
          quest: { id: QUEST_LOCAL_LEGEND }
        },
        outcomeText: 'events:quest_trigger_local_legend.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_local_legend.opt2.label',
        effect: { type: 'stat', stat: 'fame', value: -15 },
        outcomeText: 'events:quest_trigger_local_legend.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_tourbus_inspection',
    category: 'transport',
    title: 'events:quest_trigger_tourbus_inspection.title',
    description: 'events:quest_trigger_tourbus_inspection.desc',
    trigger: 'random',
    chance: 0.07,
    condition: (state: GameState) =>
      canOfferQuest(state, 'quest_tourbus_inspection'),
    options: [
      {
        label: 'events:quest_trigger_tourbus_inspection.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_tourbus_inspection' } },
        outcomeText: 'events:quest_trigger_tourbus_inspection.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_tourbus_inspection.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_tourbus_inspection.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_studio_demo',
    category: 'special',
    title: 'events:quest_trigger_studio_demo.title',
    description: 'events:quest_trigger_studio_demo.desc',
    trigger: 'random',
    chance: 0.06,
    condition: (state: GameState) => canOfferQuest(state, 'quest_studio_demo'),
    options: [
      {
        label: 'events:quest_trigger_studio_demo.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_studio_demo' } },
        outcomeText: 'events:quest_trigger_studio_demo.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_studio_demo.opt2.label',
        effect: { type: 'stat', stat: 'fame', value: 3 },
        outcomeText: 'events:quest_trigger_studio_demo.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_merch_rush',
    category: 'financial',
    title: 'events:quest_trigger_merch_rush.title',
    description: 'events:quest_trigger_merch_rush.desc',
    trigger: 'random',
    chance: 0.07,
    condition: (state: GameState) => canOfferQuest(state, 'quest_merch_rush'),
    options: [
      {
        label: 'events:quest_trigger_merch_rush.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_merch_rush' } },
        outcomeText: 'events:quest_trigger_merch_rush.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_merch_rush.opt2.label',
        effect: { type: 'stat', stat: 'money', value: 50 },
        outcomeText: 'events:quest_trigger_merch_rush.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_venue_residency',
    category: 'gig',
    title: 'events:quest_trigger_venue_residency.title',
    description: 'events:quest_trigger_venue_residency.desc',
    trigger: 'random',
    chance: 0.06,
    condition: (state: GameState) =>
      canOfferQuest(state, 'quest_venue_residency'),
    options: [
      {
        label: 'events:quest_trigger_venue_residency.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_venue_residency' } },
        outcomeText: 'events:quest_trigger_venue_residency.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_venue_residency.opt2.label',
        effect: { type: 'stat', stat: 'fame', value: 5 },
        outcomeText: 'events:quest_trigger_venue_residency.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_region_takeover',
    category: 'gig',
    title: 'events:quest_trigger_region_takeover.title',
    description: 'events:quest_trigger_region_takeover.desc',
    trigger: 'random',
    chance: 0.05,
    condition: (state: GameState) =>
      canOfferQuest(state, 'quest_region_takeover'),
    options: [
      {
        label: 'events:quest_trigger_region_takeover.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_region_takeover' } },
        outcomeText: 'events:quest_trigger_region_takeover.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_region_takeover.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -3 },
        outcomeText: 'events:quest_trigger_region_takeover.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_drama_post',
    category: 'band',
    title: 'events:quest_trigger_drama_post.title',
    description: 'events:quest_trigger_drama_post.desc',
    trigger: 'random',
    chance: 0.06,
    condition: (state: GameState) => canOfferQuest(state, 'quest_drama_post'),
    options: [
      {
        label: 'events:quest_trigger_drama_post.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_drama_post' } },
        outcomeText: 'events:quest_trigger_drama_post.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_drama_post.opt2.label',
        effect: { type: 'stat', stat: 'fame', value: -5 },
        outcomeText: 'events:quest_trigger_drama_post.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_premium_endorsement',
    category: 'financial',
    title: 'events:quest_trigger_premium_endorsement.title',
    description: 'events:quest_trigger_premium_endorsement.desc',
    trigger: 'random',
    chance: 0.04,
    condition: (state: GameState) =>
      canOfferQuest(state, 'quest_premium_endorsement'),
    options: [
      {
        label: 'events:quest_trigger_premium_endorsement.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_premium_endorsement' } },
        outcomeText: 'events:quest_trigger_premium_endorsement.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_premium_endorsement.opt2.label',
        effect: { type: 'stat', stat: 'money', value: 100 },
        outcomeText: 'events:quest_trigger_premium_endorsement.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_community_outreach',
    category: 'band',
    title: 'events:quest_trigger_community_outreach.title',
    description: 'events:quest_trigger_community_outreach.desc',
    trigger: 'random',
    chance: 0.08,
    condition: (state: GameState) =>
      canOfferQuest(state, 'quest_community_outreach'),
    options: [
      {
        label: 'events:quest_trigger_community_outreach.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_community_outreach' } },
        outcomeText: 'events:quest_trigger_community_outreach.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_community_outreach.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -3 },
        outcomeText: 'events:quest_trigger_community_outreach.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_flawless_run',
    category: 'band',
    title: 'events:quest_trigger_flawless_run.title',
    description: 'events:quest_trigger_flawless_run.desc',
    trigger: 'random',
    chance: 0.08,
    condition: (state: GameState) => canOfferQuest(state, 'quest_flawless_run'),
    options: [
      {
        label: 'events:quest_trigger_flawless_run.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_flawless_run' } },
        outcomeText: 'events:quest_trigger_flawless_run.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_flawless_run.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_flawless_run.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_sticky_fingers',
    category: 'special',
    title: 'events:quest_trigger_sticky_fingers.title',
    description: 'events:quest_trigger_sticky_fingers.desc',
    trigger: 'random',
    chance: 0.06,
    condition: (state: GameState) =>
      canOfferQuest(state, 'quest_sticky_fingers'),
    options: [
      {
        label: 'events:quest_trigger_sticky_fingers.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_sticky_fingers' } },
        outcomeText: 'events:quest_trigger_sticky_fingers.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_sticky_fingers.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_sticky_fingers.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_special_delivery',
    category: 'special',
    title: 'events:quest_trigger_special_delivery.title',
    description: 'events:quest_trigger_special_delivery.desc',
    trigger: 'random',
    chance: 0.06,
    condition: (state: GameState) =>
      canOfferQuest(state, 'quest_special_delivery'),
    options: [
      {
        label: 'events:quest_trigger_special_delivery.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_special_delivery' } },
        outcomeText: 'events:quest_trigger_special_delivery.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_special_delivery.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_special_delivery.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_persona_non_grata',
    category: 'band',
    title: 'events:quest_trigger_persona_non_grata.title',
    description: 'events:quest_trigger_persona_non_grata.desc',
    trigger: 'random',
    chance: 0.05,
    condition: (state: GameState) =>
      canOfferQuest(state, 'quest_persona_non_grata'),
    options: [
      {
        label: 'events:quest_trigger_persona_non_grata.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_persona_non_grata' } },
        outcomeText: 'events:quest_trigger_persona_non_grata.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_persona_non_grata.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_persona_non_grata.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_murphys_law',
    category: 'special',
    title: 'events:quest_trigger_murphys_law.title',
    description: 'events:quest_trigger_murphys_law.desc',
    trigger: 'random',
    chance: 0.05,
    condition: (state: GameState) => canOfferQuest(state, 'quest_murphys_law'),
    options: [
      {
        label: 'events:quest_trigger_murphys_law.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_murphys_law' } },
        outcomeText: 'events:quest_trigger_murphys_law.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_murphys_law.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_murphys_law.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_crisis_manager',
    category: 'special',
    title: 'events:quest_trigger_crisis_manager.title',
    description: 'events:quest_trigger_crisis_manager.desc',
    trigger: 'random',
    chance: 0.05,
    condition: (state: GameState) =>
      canOfferQuest(state, 'quest_crisis_manager'),
    options: [
      {
        label: 'events:quest_trigger_crisis_manager.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_crisis_manager' } },
        outcomeText: 'events:quest_trigger_crisis_manager.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_crisis_manager.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_crisis_manager.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_chapter_marker',
    category: 'special',
    title: 'events:quest_trigger_chapter_marker.title',
    description: 'events:quest_trigger_chapter_marker.desc',
    trigger: 'random',
    chance: 0.05,
    condition: (state: GameState) =>
      canOfferQuest(state, 'quest_chapter_marker'),
    options: [
      {
        label: 'events:quest_trigger_chapter_marker.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_chapter_marker' } },
        outcomeText: 'events:quest_trigger_chapter_marker.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_chapter_marker.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_chapter_marker.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_payday',
    category: 'special',
    title: 'events:quest_trigger_payday.title',
    description: 'events:quest_trigger_payday.desc',
    trigger: 'random',
    chance: 0.06,
    condition: (state: GameState) => canOfferQuest(state, 'quest_payday'),
    options: [
      {
        label: 'events:quest_trigger_payday.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_payday' } },
        outcomeText: 'events:quest_trigger_payday.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_payday.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_payday.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_make_amends',
    category: 'special',
    title: 'events:quest_trigger_make_amends.title',
    description: 'events:quest_trigger_make_amends.desc',
    trigger: 'random',
    chance: 0.05,
    condition: (state: GameState) => canOfferQuest(state, 'quest_make_amends'),
    options: [
      {
        label: 'events:quest_trigger_make_amends.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_make_amends' } },
        outcomeText: 'events:quest_trigger_make_amends.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_make_amends.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_make_amends.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_burned_bridges',
    category: 'financial',
    title: 'events:quest_trigger_burned_bridges.title',
    description: 'events:quest_trigger_burned_bridges.desc',
    trigger: 'random',
    chance: 0.05,
    condition: (state: GameState) =>
      canOfferQuest(state, 'quest_burned_bridges'),
    options: [
      {
        label: 'events:quest_trigger_burned_bridges.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_burned_bridges' } },
        outcomeText: 'events:quest_trigger_burned_bridges.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_burned_bridges.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_burned_bridges.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_venue_regular',
    category: 'gig',
    title: 'events:quest_trigger_venue_regular.title',
    description: 'events:quest_trigger_venue_regular.desc',
    trigger: 'random',
    chance: 0.06,
    condition: (state: GameState) =>
      canOfferQuest(state, 'quest_venue_regular'),
    options: [
      {
        label: 'events:quest_trigger_venue_regular.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_venue_regular' } },
        outcomeText: 'events:quest_trigger_venue_regular.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_venue_regular.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_venue_regular.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_brand_ambassador',
    category: 'financial',
    title: 'events:quest_trigger_brand_ambassador.title',
    description: 'events:quest_trigger_brand_ambassador.desc',
    trigger: 'random',
    chance: 0.06,
    condition: (state: GameState) =>
      canOfferQuest(state, 'quest_brand_ambassador'),
    options: [
      {
        label: 'events:quest_trigger_brand_ambassador.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_brand_ambassador' } },
        outcomeText: 'events:quest_trigger_brand_ambassador.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_brand_ambassador.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_brand_ambassador.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_alchemist',
    category: 'special',
    title: 'events:quest_trigger_alchemist.title',
    description: 'events:quest_trigger_alchemist.desc',
    trigger: 'random',
    chance: 0.06,
    condition: (state: GameState) => canOfferQuest(state, 'quest_alchemist'),
    options: [
      {
        label: 'events:quest_trigger_alchemist.opt1.label',
        effect: { type: 'quest', quest: { id: 'quest_alchemist' } },
        outcomeText: 'events:quest_trigger_alchemist.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_alchemist.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:quest_trigger_alchemist.opt2.outcome'
      }
    ]
  }
]
