import type { QuestDefinition } from '../../types/quest'

/**
 * Keep your assets standing before the next disaster knocks them down.
 *
 * @remarks
 * Counts restored condition points: `asset.conditionChanged` is successful
 * when condition rises, and its amount is the points regained. Offered only
 * to Bandhaus owners, whose daily decay and risk events give it work to do.
 */
export const quest_preventive_maintenance = {
  kind: 'repeatable',
  label: 'events:quest_preventive_maintenance.label',
  description: 'events:quest_preventive_maintenance.desc',
  progressSource: 'asset_condition_changed',
  deadlineOffset: 15,
  repeatPolicy: 'cooldown',
  cooldownDays: 12,
  progressRules: [
    {
      event: 'asset.conditionChanged',
      amount: 'event.amount',
      match: { success: true }
    }
  ],
  required: 40,
  offer: {
    trigger: 'random',
    category: 'special',
    chance: 0.05,
    condition: { requiredAssetKind: 'bandhaus_chassis' }
  },
  rewards: [
    { type: 'band.harmony', amount: 10 },
    { type: 'money', amount: 200 }
  ],
  failurePenalties: [{ type: 'band.harmony', amount: -5 }]
} as const satisfies QuestDefinition
