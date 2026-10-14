import type { QuestDefinition } from '../../types/quest'

/**
 * Talk the scene back down after a scandal.
 *
 * @remarks
 * Any calming social beat counts once: a loyalty gain, a controversy drop, or
 * riding a trend. One resolved post can move loyalty and controversy together,
 * so four beats is two or three good posts, not four. Offered only while the
 * controversy is actually hot, which is when the PR panic makes sense.
 */
export const quest_damage_control = {
  kind: 'repeatable',
  label: 'events:quest_damage_control.label',
  description: 'events:quest_damage_control.desc',
  progressSource: 'social_stabilized',
  deadlineOffset: 8,
  repeatPolicy: 'cooldown',
  cooldownDays: 10,
  progressRules: [
    {
      event: 'social.controversyChanged',
      amount: 'fixed',
      fixedAmount: 1,
      match: { success: true }
    },
    {
      event: 'social.loyaltyChanged',
      amount: 'fixed',
      fixedAmount: 1,
      match: { success: true }
    },
    { event: 'social.trendMatched', amount: 'fixed', fixedAmount: 1 }
  ],
  required: 4,
  offer: {
    trigger: 'random',
    category: 'band',
    chance: 0.06,
    condition: { social: { controversyAbove: 40 } }
  },
  rewards: [
    { type: 'social.controversy', amount: -10 },
    { type: 'social.loyalty', amount: 5 }
  ],
  failurePenalties: [{ type: 'social.controversy', amount: 5 }]
} as const satisfies QuestDefinition
