import type { QuestDefinition } from '../../types/quest'

export const quest_chapter_marker = {
  kind: 'side',
  label: 'events:quest_chapter_marker.label',
  description: 'events:quest_chapter_marker.desc',
  deadlineOffset: 30,
  repeatPolicy: 'never',
  progressSource: 'story_flag_added',
  progressRules: [
    { event: 'story.flagAdded', amount: 'fixed', fixedAmount: 1 }
  ],
  required: 3,
  offer: { trigger: 'random', category: 'special', chance: 0.05 },
  rewards: [
    { type: 'trait.unlock', traitId: 'road_warrior' },
    { type: 'skill_point', memberIndex: 0 }
  ],
  failurePenalties: [
    { type: 'event.queue', eventId: 'event_bad_press' },
    { type: 'social.loyalty', amount: -5 }
  ]
} as const satisfies QuestDefinition
