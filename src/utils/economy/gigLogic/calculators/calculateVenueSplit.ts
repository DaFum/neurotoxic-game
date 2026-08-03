import { finiteNumberOr } from '../../../gameState'
import type { GigEconomyData } from '../../types'
import { VENUE_SPLIT_RATES } from '../../constants'
import { BREAKDOWN_LABEL_KEYS } from '../../breakdownLabelKeys'
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
  const diff = finiteNumberOr(gigData.diff ?? gigData.difficulty, 0)
  const splitRate =
    diff >= 5
      ? 0.7
      : Object.hasOwn(VENUE_SPLIT_RATES, diff)
        ? (VENUE_SPLIT_RATES[diff] ?? 0)
        : 0

  if (splitRate > 0) {
    // `Math.max(0, …)` alone lets NaN and Infinity through.
    const safeRevenue = Math.max(0, finiteNumberOr(ticketsRevenue, 0))
    const splitAmount = Math.floor(safeRevenue * splitRate)
    return {
      amount: splitAmount,
      expenseItem: {
        labelKey: BREAKDOWN_LABEL_KEYS.VENUE_SPLIT,
        value: splitAmount,
        detailKey: 'economy:gigExpenses.venueSplit.detail',
        detailParams: { rate: splitRate * 100 }
      }
    }
  }
  return { amount: 0, expenseItem: null }
}
