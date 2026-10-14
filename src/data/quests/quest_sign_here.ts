import { createCorporateQuest } from './utils/createCorporateQuest'

/**
 * Put the band's name on a brand contract.
 *
 * @remarks
 * Counts the signature, not the payout: any accepted brand offer progresses
 * it. Only one deal can run at a time, so a single signature is the goal.
 */
export const quest_sign_here = createCorporateQuest({
  label: 'events:quest_sign_here.label',
  description: 'events:quest_sign_here.desc',
  progressRules: [
    { event: 'brand.offerAccepted', amount: 'fixed', fixedAmount: 1 }
  ],
  required: 1,
  offer: { trigger: 'random', category: 'financial', chance: 0.06 }
})
