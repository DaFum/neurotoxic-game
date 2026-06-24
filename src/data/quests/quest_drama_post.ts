import type { QuestDefinition } from '../../types/quest'

export const quest_drama_post = {
  kind: 'repeatable',
  label: 'ui:quests.dramaPost.title',
  description: 'ui:quests.dramaPost.description',
  deadlineOffset: 4,
  repeatPolicy: 'cooldown',
  progressSource: 'followers_gained',
  progressRules: [
    {
      event: 'social.followersGained',
      amount: 'event.amount',
      match: { postCategory: 'Drama' }
    }
  ],
  required: 300,
  cooldownDays: 5,
  offer: { trigger: 'random', category: 'band', chance: 0.06 },
  rewards: [{ type: 'money', amount: 150 }],
  failurePenalties: [{ type: 'social.controversy', amount: 5 }]
} as const satisfies QuestDefinition
