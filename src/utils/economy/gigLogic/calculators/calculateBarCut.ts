import { finiteNumberOr } from '../../../gameState'
import type { GigModifiers } from '../../../../types'
import {
  BAR_RATE_VIP,
  BAR_RATE_NORMAL,
  AVG_SPEND_PER_PERSON_AT_BAR
} from '../../constants'
import { BREAKDOWN_LABEL_KEYS } from '../../breakdownLabelKeys'
/**
 * Calculates bar-cut income from ticket attendance and guestlist/VIP modifiers.
 *
 * @param ticketsSold - Number of tickets sold for the gig.
 * @param modifiers - Active pre-gig modifiers that determine normal versus VIP bar cut.
 * @returns Bar revenue and income breakdown item.
 */
export const calculateBarCut = (
  ticketsSold = 0,
  modifiers: Partial<GigModifiers> = {}
) => {
  modifiers = modifiers || {}
  const barRate = modifiers.guestlist ? BAR_RATE_VIP : BAR_RATE_NORMAL
  const barPercent = Math.round(barRate * 100)
  // `Math.max(0, …)` alone lets NaN and Infinity through: NaN fails the
  // comparison and Infinity wins it.
  const safeTicketsSold = Math.max(0, finiteNumberOr(ticketsSold, 0))
  const barRevenue = Math.max(
    0,
    Math.floor(safeTicketsSold * AVG_SPEND_PER_PERSON_AT_BAR * barRate)
  )
  return {
    revenue: barRevenue,
    incomeItem: {
      labelKey: modifiers.guestlist
        ? BREAKDOWN_LABEL_KEYS.VIP_BAR_REVENUE
        : BREAKDOWN_LABEL_KEYS.BAR_CUT,
      value: barRevenue,
      detailKey: modifiers.guestlist
        ? 'economy:gigIncome.vipBarRevenue.detail'
        : 'economy:gigIncome.barCut.detail',
      detailParams: { percent: barPercent }
    }
  }
}
