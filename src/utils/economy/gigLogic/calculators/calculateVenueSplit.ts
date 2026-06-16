import type {} from '../../../../data/merch'
import type { GigEconomyData } from '../../types'
import type {} from '../../../../types'
import type {} from '../../../../types/economy'
import { VENUE_SPLIT_RATES } from '../../constants'
import type {} from '../../../../types/assets'
/**
 * Calculates venue split / promoter cut.
 *
 * @param ticketsRevenue - Ticket revenue before venue split.
 * @param gigData - Venue economy data containing difficulty.
 * @returns Split amount and optional expense breakdown item.
 */
export const calculateVenueSplit = (
  ticketsRevenue = 0,
  gigData: GigEconomyData = {}
) => {
  gigData = gigData || {}
  const diff = gigData.diff ?? gigData.difficulty ?? 0
  const splitRate =
    diff >= 5
      ? 0.7
      : Object.hasOwn(VENUE_SPLIT_RATES, diff)
        ? (VENUE_SPLIT_RATES[diff] ?? 0)
        : 0

  if (splitRate > 0) {
    const splitAmount = Math.floor(Math.max(0, ticketsRevenue) * splitRate)
    return {
      amount: splitAmount,
      expenseItem: {
        labelKey: 'economy:gigExpenses.venueSplit.label',
        value: splitAmount,
        detailKey: 'economy:gigExpenses.venueSplit.detail',
        detailParams: { rate: splitRate * 100 }
      }
    }
  }
  return { amount: 0, expenseItem: null }
}
