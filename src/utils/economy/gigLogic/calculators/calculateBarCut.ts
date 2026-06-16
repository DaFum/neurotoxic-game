import type {} from '../../../../data/merch'
import type {} from '../../types'
import type { GigModifiers } from '../../../../types'
import type {} from '../../../../types/economy'
import {
  BAR_RATE_VIP,
  BAR_RATE_NORMAL,
  AVG_SPEND_PER_PERSON_AT_BAR
} from '../../constants'
import type {} from '../../../../types/assets'
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
  const barRevenue = Math.max(
    0,
    Math.floor(ticketsSold * AVG_SPEND_PER_PERSON_AT_BAR * barRate)
  )
  return {
    revenue: barRevenue,
    incomeItem: {
      labelKey: modifiers.guestlist
        ? 'economy:gigIncome.vipBarRevenue.label'
        : 'economy:gigIncome.barCut.label',
      value: barRevenue,
      detailKey: modifiers.guestlist
        ? 'economy:gigIncome.vipBarRevenue.detail'
        : 'economy:gigIncome.barCut.detail',
      detailParams: { percent: barPercent }
    }
  }
}
