import { createCorporateQuest } from './utils/createCorporateQuest'

export const quest_alchemist = createCorporateQuest({
  label: 'events:quest_alchemist.label',
  description: 'events:quest_alchemist.desc',
  progressSource: 'item_crafted',
  progressRules: [{ event: 'item.crafted', amount: 'fixed', fixedAmount: 1 }],
  required: 2,
  offer: { trigger: 'random', category: 'special', chance: 0.06 }
})
