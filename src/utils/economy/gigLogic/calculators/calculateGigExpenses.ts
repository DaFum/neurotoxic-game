import type { GigModifiers } from '../../../../types'
import type { FinancialBreakdownItem } from '../../../../types/economy'
import { calculateGigModifierCost } from '../../constants'
import { NEUTRAL_ASSET_MODIFIERS } from '../../../assetSelectors'
import type { AssetModifiers } from '../../../../types/assets'
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
  if (modifiers.catering) {
    const cost = calculateGigModifierCost('catering', assetModifiers)
    expenses.breakdown.push({
      labelKey: 'economy:gigExpenses.catering.label',
      value: cost,
      detailKey: 'economy:gigExpenses.catering.detail'
    })
    expenses.total += cost
  }

  if (modifiers.promo) {
    const cost = calculateGigModifierCost('promo', assetModifiers)
    expenses.breakdown.push({
      labelKey: 'economy:gigExpenses.socialAds.label',
      value: cost,
      detailKey: 'economy:gigExpenses.socialAds.detail'
    })
    expenses.total += cost
  }

  if (modifiers.merch) {
    const cost = calculateGigModifierCost('merch', assetModifiers)
    expenses.breakdown.push({
      labelKey: 'economy:gigExpenses.merchStand.label',
      value: cost,
      detailKey: 'economy:gigExpenses.merchStand.detail'
    })
    expenses.total += cost
  }

  if (modifiers.soundcheck) {
    const cost = calculateGigModifierCost('soundcheck', assetModifiers)
    expenses.breakdown.push({
      labelKey: 'economy:gigExpenses.soundcheck.label',
      value: cost,
      detailKey: 'economy:gigExpenses.soundcheck.detail'
    })
    expenses.total += cost
  }

  if (modifiers.guestlist) {
    const cost = calculateGigModifierCost('guestlist', assetModifiers)
    expenses.breakdown.push({
      labelKey: 'economy:gigExpenses.guestList.label',
      value: cost,
      detailKey: 'economy:gigExpenses.guestList.detail'
    })
    expenses.total += cost
  }

  return expenses
}
