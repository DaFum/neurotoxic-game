import { finiteNumberOr } from '../../../gameState'
import type { GigEconomyData, EconomyContext } from '../../types'
import type { GigModifiers } from '../../../../types'
import { TICKET_SALES_CONSTANTS } from '../../constants'
import { calculateEffectiveTicketPrice } from './calculateEffectiveTicketPrice'
/**
 * Calculates ticket sales revenue and attendance.
 *
 * @param gigData - Venue economy data such as capacity, ticket price, difficulty, and guarantee.
 * @param playerFame - Current player fame used for attendance scaling.
 * @param modifiers - Active pre-gig modifiers that can influence draw.
 * @param context - Reputation, controversy, price, and recent-gig context.
 * @returns Ticket revenue, tickets sold, and the income breakdown item.
 */
export const calculateTicketIncome = (
  gigData: GigEconomyData = {},
  playerFame = 0,
  modifiers: Partial<GigModifiers> = {},
  context: EconomyContext = {}
) => {
  gigData = gigData || {}
  modifiers = modifiers || {}
  context = context || {}
  // Base draw is ~30%. Fame fills the rest.
  const baseDrawRatio = TICKET_SALES_CONSTANTS.BASE_DRAW_RATIO
  // Fame needs to be ~8x capacity to fill it easily
  const baseCapacity = Math.max(0, finiteNumberOr(gigData.capacity, 0))
  const safeCapacity = Math.max(1, baseCapacity) // Prevent division by zero or negative

  // Logarithmic fame scaling: fame matters more at low levels, flattens at high levels.
  // Denominator scales with venue capacity so large venues require proportionally more fame.
  const fameRatio = Math.min(
    1.0,
    Math.log(Math.max(0, playerFame) + 1) /
      Math.log(safeCapacity * TICKET_SALES_CONSTANTS.FAME_CAPACITY_SCALER + 1)
  )
  let fillRate =
    baseDrawRatio + fameRatio * TICKET_SALES_CONSTANTS.FAME_FILL_WEIGHT

  // Promo Boost
  if (modifiers.promo) fillRate += 0.22

  // Soundcheck Boost (word-of-mouth from quality prep)
  if (modifiers.soundcheck) fillRate += 0.2

  const gigDifficulty = gigData.diff ?? gigData.difficulty
  const daysSinceLastGig = context.daysSinceLastGig
  const hasValidDaysSinceLastGig =
    typeof daysSinceLastGig === 'number' &&
    Number.isFinite(daysSinceLastGig) &&
    daysSinceLastGig > 0

  // Gig frequency vs quality gap penalty
  if (
    context.lastGigDifficulty === gigDifficulty &&
    hasValidDaysSinceLastGig &&
    daysSinceLastGig < 4
  ) {
    fillRate -= 0.15
  }

  // Controversy attendance penalty: -1% per point above 40, max -30%
  const controversyLevel = finiteNumberOr(context.controversyLevel, 0)
  if (controversyLevel >= 40) {
    fillRate -= Math.min(0.3, (controversyLevel - 40) * 0.01)
  }

  // Regional reputation bonus/penalty
  const regionRep = context.regionRep ?? 0
  if (regionRep < 0) {
    fillRate -= Math.min(0.2, Math.abs(regionRep) * 0.002) // -2% per -10 rep, max -20%
  } else if (regionRep > 0) {
    fillRate += Math.min(0.2, regionRep * 0.002) // +2% per +10 rep, max +20%
  }

  // Discounted tickets flag: +10% fill
  if (context.discountedTickets) {
    fillRate += 0.1
  }

  // Price Sensitivity: Higher price reduces attendance slightly unless Fame is very high
  const ticketPrice = calculateEffectiveTicketPrice(gigData, context)
  if (!context.discountedTickets && ticketPrice > 15) {
    const pricePenalty = (ticketPrice - 15) * 0.02 // -2% per Euro over 15
    const mitigation = fameRatio * 0.5
    fillRate -= Math.max(0, pricePenalty - mitigation)
  }

  fillRate = Math.min(1.0, Math.max(0.1, fillRate)) // Clamp 10% - 100%

  const ticketsSold = Math.floor(baseCapacity * fillRate)
  const revenue = Math.max(
    0,
    ticketsSold * Math.max(0, finiteNumberOr(ticketPrice, 0))
  )

  return {
    revenue,
    ticketsSold,
    breakdownItem: {
      labelKey: 'economy:gigIncome.ticketSales.label',
      value: revenue,
      detailKey: 'economy:gigIncome.ticketSales.detail',
      detailParams: { sold: ticketsSold, capacity: baseCapacity }
    }
  }
}
