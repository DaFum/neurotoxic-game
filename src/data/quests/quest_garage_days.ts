import type { QuestDefinition } from '../../types/quest'

/**
 * Put hours into the band's hardware.
 *
 * @remarks
 * Any garage job counts once: buying a chassis, installing a module or
 * repairing an asset. Offered only to tourbus owners, so an install or repair
 * is always within reach even when another chassis is not affordable.
 */
export const quest_garage_days = {
  kind: 'repeatable',
  label: 'events:quest_garage_days.label',
  description: 'events:quest_garage_days.desc',
  deadlineOffset: 20,
  repeatPolicy: 'cooldown',
  cooldownDays: 12,
  progressRules: [
    { event: 'asset.acquired', amount: 'fixed', fixedAmount: 1 },
    { event: 'asset.moduleInstalled', amount: 'fixed', fixedAmount: 1 },
    { event: 'asset.repaired', amount: 'fixed', fixedAmount: 1 }
  ],
  required: 3,
  offer: {
    trigger: 'random',
    category: 'transport',
    chance: 0.05,
    condition: { requiredAssetKind: 'tourbus_chassis' }
  },
  rewards: [
    { type: 'money', amount: 250 },
    { type: 'fame', amount: 100 }
  ],
  failurePenalties: [{ type: 'social.loyalty', amount: -5 }]
} as const satisfies QuestDefinition
