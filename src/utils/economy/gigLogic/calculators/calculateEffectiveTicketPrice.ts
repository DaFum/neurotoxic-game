import { finiteNumberOr } from '../../../gameState'
import type { GigEconomyData, EconomyContext } from '../../types'
/**
 * Calculates the effective ticket price after applying ticket discounts.
 * @param gigData - Gig economy data containing the base ticket price.
 * @param context - Context object containing flags like discountedTickets.
 * @returns The effective ticket price.
 */
export const calculateEffectiveTicketPrice = (
  gigData: GigEconomyData = {},
  context: EconomyContext = {}
) => {
  if (!gigData) return 0
  context = context || {}
  const price = finiteNumberOr(gigData.price, 0)
  if (context.discountedTickets && price > 10) {
    return Math.floor(price * 0.5)
  }
  return price
}
