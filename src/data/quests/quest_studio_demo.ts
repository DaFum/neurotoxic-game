import type { QuestDefinition } from '../../types/quest'

export const quest_studio_demo = {
  kind: 'side',
  label: 'ui:quests.studioDemo.title',
  description: 'ui:quests.studioDemo.description',
  deadlineOffset: 14,
  repeatPolicy: 'cooldown',
  progressSource: 'good_gig',
  progressRules: [{ event: 'gig.good', amount: 'fixed', fixedAmount: 1 }],
  required: 2,
  cooldownDays: 21,
  offer: {
    trigger: 'random',
    category: 'special',
    chance: 0.06,
    condition: { requiredAssetKind: 'studio_chassis' }
  },
  rewards: [{ type: 'fame', amount: 250 }],
  failurePenalties: [{ type: 'social.controversy', amount: 3 }]
} as const satisfies QuestDefinition
