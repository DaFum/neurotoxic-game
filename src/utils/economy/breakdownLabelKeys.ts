/**
 * Single source of truth for the i18n keys used by gig-economy breakdown lines.
 *
 * @remarks
 * Every `FinancialBreakdownItem.labelKey` emitted by the gig economy must come
 * from this object (or from {@link buildMerchSalesLabelKey} for the one
 * per-item merch line). A formula step that invents its own key would show up
 * in the debug trace but not in the player-facing breakdown, and the
 * registry test in `tests/utils/economy/breakdownLabelKeys.test.js` asserts the
 * emitted set stays a subset of {@link BREAKDOWN_LABEL_KEYS}.
 */
export const BREAKDOWN_LABEL_KEYS = {
  TICKET_SALES: 'economy:gigIncome.ticketSales.label',
  GUARANTEE: 'economy:gigIncome.guarantee.label',
  CULT_DONATIONS: 'economy:cultDonations',
  BAR_CUT: 'economy:gigIncome.barCut.label',
  VIP_BAR_REVENUE: 'economy:gigIncome.vipBarRevenue.label',
  S_RANK_SHOW: 'economy:gigIncome.sRankShow.label',
  BAD_SHOW: 'economy:gigIncome.badShow.label',
  SCANDAL_SUPPORT: 'economy:gigIncome.scandalSupport.label',
  TECH_SPONSOR: 'economy:gigIncome.techSponsor.label',
  BEER_SPONSOR: 'economy:gigIncome.beerSponsor.label',
  BRAND_SPONSOR: 'economy:gigIncome.brandSponsor.label',
  TIP_BONUS: 'economy:gigIncome.tipBonus.label',
  BAND_BONUS: 'economy:gigIncome.bandBonus.label',
  VENUE_SPLIT: 'economy:gigExpenses.venueSplit.label',
  MANAGEMENT_FEE: 'economy:gigExpenses.managementFee.label',
  PAYOUT_DAMPENER: 'economy:gigExpenses.payoutDampener.label',
  OVERAGE_FEE: 'economy:gigExpenses.overageFee.label',
  DEMAND_SATURATION: 'economy:gigExpenses.demandSaturation.label',
  PERFORMANCE_PENALTY: 'economy:gigExpenses.performancePenalty.label',
  CATERING: 'economy:gigExpenses.catering.label',
  SOCIAL_ADS: 'economy:gigExpenses.socialAds.label',
  MERCH_STAND: 'economy:gigExpenses.merchStand.label',
  SOUNDCHECK: 'economy:gigExpenses.soundcheck.label',
  GUEST_LIST: 'economy:gigExpenses.guestList.label'
} as const

/**
 * Any label key emitted by a gig-economy breakdown line.
 */
export type BreakdownLabelKey =
  (typeof BREAKDOWN_LABEL_KEYS)[keyof typeof BREAKDOWN_LABEL_KEYS]

/**
 * Prefix shared by every per-merch-item breakdown line.
 *
 * @remarks
 * Merch lines are the one place a static registry entry is impossible: the key
 * carries the inventory item id. Routing them through
 * {@link buildMerchSalesLabelKey} keeps a single place to audit.
 */
export const MERCH_SALES_LABEL_KEY_PREFIX = 'economy:gigIncome.merchSales.'

/**
 * Builds the breakdown label key for one merch inventory item.
 *
 * @param itemKey - Merch inventory item id.
 * @returns Namespaced i18n key for that item's revenue line.
 */
export const buildMerchSalesLabelKey = (itemKey: string): string =>
  `${MERCH_SALES_LABEL_KEY_PREFIX}${itemKey}.label`

/**
 * Whether a label key belongs to the registry, including dynamic merch lines.
 *
 * @param labelKey - Label key emitted by a breakdown line.
 * @returns `true` when the key is registered or a well-formed merch key.
 */
export const isRegisteredBreakdownLabelKey = (labelKey: string): boolean => {
  const registered: readonly string[] = Object.values(BREAKDOWN_LABEL_KEYS)
  if (registered.includes(labelKey)) return true
  if (!labelKey.startsWith(MERCH_SALES_LABEL_KEY_PREFIX)) return false
  // The item id segment must be non-empty: `merchSales..label` names no item
  // and cannot resolve to a real merch label.
  const itemSegment = labelKey.slice(
    MERCH_SALES_LABEL_KEY_PREFIX.length,
    -'.label'.length
  )
  return labelKey.endsWith('.label') && itemSegment.length > 0
}
