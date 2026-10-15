import type { GigModifiers } from '../../../../types'
import type { FinancialBreakdownItem } from '../../../../types/economy'
import { calculateGigModifierCost } from '../../constants'
import { BREAKDOWN_LABEL_KEYS } from '../../breakdownLabelKeys'
import { NEUTRAL_ASSET_MODIFIERS } from '../../../assetSelectors'
import type { AssetModifiers } from '../../../../types/assets'
import type { BalanceConfig } from '../../../../config/balance'
/**
 * One budget-modifier expense line: the gig modifier flag that charges it, the
 * balance-config cost it reads, and its breakdown keys.
 */
interface ModifierExpense {
  readonly modifier: keyof BalanceConfig['modifiers']
  readonly labelKey: string
  readonly detailKey: string
}

/**
 * Budget-modifier expenses in breakdown order.
 */
const MODIFIER_EXPENSES: readonly ModifierExpense[] = [
  {
    modifier: 'catering',
    labelKey: BREAKDOWN_LABEL_KEYS.CATERING,
    detailKey: 'economy:gigExpenses.catering.detail'
  },
  {
    modifier: 'promo',
    labelKey: BREAKDOWN_LABEL_KEYS.SOCIAL_ADS,
    detailKey: 'economy:gigExpenses.socialAds.detail'
  },
  {
    modifier: 'merch',
    labelKey: BREAKDOWN_LABEL_KEYS.MERCH_STAND,
    detailKey: 'economy:gigExpenses.merchStand.detail'
  },
  {
    modifier: 'soundcheck',
    labelKey: BREAKDOWN_LABEL_KEYS.SOUNDCHECK,
    detailKey: 'economy:gigExpenses.soundcheck.detail'
  },
  {
    modifier: 'guestlist',
    labelKey: BREAKDOWN_LABEL_KEYS.GUEST_LIST,
    detailKey: 'economy:gigExpenses.guestList.detail'
  }
]

/**
 * Calculates expenses for the gig.
 *
 * @param modifiers - Active pre-gig modifiers that create gig expenses.
 * @param assetModifiers - Active asset modifiers that adjust modifier costs.
 * @returns Total gig expenses and itemized expense breakdown.
 */
export const calculateGigExpenses = (
  modifiers: Partial<GigModifiers> = {},
  assetModifiers: AssetModifiers = NEUTRAL_ASSET_MODIFIERS
) => {
  modifiers = modifiers || {}
  const expenses: { total: number; breakdown: FinancialBreakdownItem[] } = {
    total: 0,
    breakdown: []
  }

  // Operational Expenses (Modifiers)
  // Transport and subsistence are now exclusively handled during travel phase.

  // Modifiers (Budget items)
  for (const { modifier, labelKey, detailKey } of MODIFIER_EXPENSES) {
    if (!modifiers[modifier]) continue
    const cost = calculateGigModifierCost(modifier, assetModifiers)
    expenses.breakdown.push({ labelKey, value: cost, detailKey })
    expenses.total += cost
  }

  return expenses
}
