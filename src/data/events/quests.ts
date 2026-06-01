import type { GameState } from '../../types'
import { QuestOfferEngine } from '../../domain/questOfferEngine'

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
      canOfferQuest(state, 'quest_pick_of_destiny'),
    options: [
      {
        label: 'events:quest_trigger_pick_of_destiny.opt1.label',
        effect: {
          type: 'quest',
          // Config lives in QUEST_REGISTRY; addQuest merges defaults by id.
          quest: { id: 'quest_pick_of_destiny' }
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
    condition: (state: GameState) => canOfferQuest(state, 'quest_viral_dance'),
    options: [
      {
        label: 'events:quest_trigger_viral_dance.opt1.label',
        effect: {
          type: 'quest',
          quest: { id: 'quest_viral_dance' }
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
    condition: (state: GameState) =>
      canOfferQuest(state, 'quest_sponsor_demand'),
    options: [
      {
        label: 'events:quest_trigger_sponsor_demand.opt1.label',
        effect: {
          type: 'quest',
          quest: { id: 'quest_sponsor_demand' }
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
      canOfferQuest(state, 'quest_harmony_project'),
    options: [
      {
        label: 'events:quest_trigger_harmony_project.opt1.label',
        effect: {
          type: 'quest',
          quest: { id: 'quest_harmony_project' }
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
    condition: (state: GameState) => canOfferQuest(state, 'quest_local_legend'),
    options: [
      {
        label: 'events:quest_trigger_local_legend.opt1.label',
        effect: {
          type: 'quest',
          quest: { id: 'quest_local_legend' }
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
  }
]
