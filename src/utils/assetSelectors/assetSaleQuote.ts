import type { LongTermAsset, Liability } from '../../types/assets'
import { calculateChassisGrossSaleValue } from './assetFinancials'
import { finiteNumberOr } from '../finiteNumber'

/**
 * Net-proceeds quote for selling a chassis. `gross` is `null` when the asset
 * has no computable sale value (e.g. missing config); callers decide how to
 * surface that (the modal treats it as 0, the reducer rejects the sale).
 */
export interface AssetSaleQuote {
  /** Gross depreciated sale value, or null when uncomputable. */
  gross: number | null
  /** Sanitized sum of principal remaining across the asset's liabilities. */
  debt: number
  /** Net proceeds: `(gross ?? 0) - debt`. */
  net: number
  /** True when net proceeds would be negative (debt exceeds sale value). */
  blocked: boolean
}

/**
 * Pure sale-quote selector shared by the sell modal (display) and the sell
 * reducer (authority). Centralizes the net-proceeds arithmetic so both sides
 * stay aligned; the reducer remains the final authority over the sale outcome.
 *
 * @param asset - Chassis being sold.
 * @param liabilities - Current liabilities map, or undefined.
 * @param day - Current in-game day used for depreciation.
 * @returns Gross value, sanitized debt, net proceeds, and blocked flag.
 */
export const getAssetSaleQuote = (
  asset: LongTermAsset,
  liabilities: Record<string, Liability> | undefined,
  day: number
): AssetSaleQuote => {
  let rawDebt = 0
  const current = liabilities ?? {}
  for (const id in current) {
    if (Object.hasOwn(current, id)) {
      const l = current[id]
      if (l && l.assetId === asset.id) {
        rawDebt += Math.max(0, finiteNumberOr(l.principalRemaining, 0))
      }
    }
  }
  const debt = Math.max(0, finiteNumberOr(rawDebt, 0))
  const gross = calculateChassisGrossSaleValue(asset, day)
  const net = (gross ?? 0) - debt
  const blocked = net < 0
  return { gross, debt, net, blocked }
}
