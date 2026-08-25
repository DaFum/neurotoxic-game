import type { QuestDefinition } from '../../../types/quest'

/**
 * Creates a standard corporate-aligned quest definition.
 *
 * @remarks
 * This utility applies consistent base attributes for repeatable corporate quests,
 * enforcing specific deadlines, cooldowns, rewards, and failure penalties to ensure
 * uniform balancing across the game's corporate quest line.
 *
 * @param config - The initial quest configuration without the enforced default properties.
 * @returns A complete quest definition with injected corporate standards.
 *
 * @example
 * ```ts
 * const selloutQuest = createCorporateQuest({
 *   id: 'corporate_endorsement',
 *   title: 'Drink Slurm',
 *   description: 'Wear the logo and smile.',
 *   objectives: []
 * });
 * ```
 */
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
