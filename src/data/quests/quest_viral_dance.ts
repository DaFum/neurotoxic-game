import type { QuestDefinition } from '../../types/quest'

export const quest_viral_dance = {
  kind: 'repeatable',
  label: 'events:quest_viral_dance.label',
  description: 'events:quest_viral_dance.desc',
  deadlineOffset: 5,
  repeatPolicy: 'cooldown',
  progressSource: 'followers_gained',
  progressRules: [
    {
      event: 'social.followersGained',
      amount: 'event.amount',
      match: { platform: 'tiktok' }
    }
  ],
  required: 500,
  cooldownDays: 7,
  offer: {
    trigger: 'random',
    category: 'band',
    chance: 0.1,
    condition: { social: { maxTiktok: 4999 } }
  },
  rewards: [{ type: 'fame', amount: 500 }],
  failurePenalties: [
    { type: 'social.controversy', amount: 5 },
    { type: 'quest.cooldown', days: 7 }
  ]
} as const satisfies QuestDefinition
