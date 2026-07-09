import type { QuestDefinition } from '../../../types/quest'

export const createCorporateQuest = (
  config: Omit<
    QuestDefinition,
    | 'kind'
    | 'deadlineOffset'
    | 'repeatPolicy'
    | 'cooldownDays'
    | 'rewards'
    | 'failurePenalties'
  >
): QuestDefinition => {
  return {
    ...config,
    kind: 'repeatable',
    deadlineOffset: 20,
    repeatPolicy: 'cooldown',
    cooldownDays: 8,
    rewards: [
      { type: 'brand.trust', alignment: 'corporate', amount: 10 },
      { type: 'fame', amount: 120 }
    ],
    failurePenalties: [
      { type: 'brand.trust', alignment: 'corporate', amount: -5 },
      { type: 'social.loyalty', amount: -5 }
    ]
  }
}
