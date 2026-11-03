import type { Liability, LongTermAsset, AssetModifiers } from '../types/assets'
import { LIABILITY_DEFAULT_DAYS } from './assets/assetConfig'
import {
  getActiveAssetModifiers,
  getAssetTotalDailyRevenue,
  getAssetTotalUpkeep
} from './assets/assetSelectors'
import { finiteNumberOr } from './finiteNumber'

/** Deterministic ordinary-play loan settlement, before daily living costs. */
export const projectRestLiabilities = (
  money: number,
  assets: readonly LongTermAsset[],
  liabilities: Readonly<Record<string, Liability>>
): {
  money: number
  assets: LongTermAsset[]
  liabilities: Record<string, Liability>
  assetDailyCost: number
  installmentDailyCost: number
  assetModifiers: AssetModifiers
} => {
  let cash = finiteNumberOr(money, 0)
  const retained: Record<string, Liability> = {}
  const foreclosed = new Set<string>()
  for (const id in liabilities) {
    if (!Object.hasOwn(liabilities, id)) continue
    const loan = liabilities[id]
    if (!loan) continue
    const principal = Math.max(0, finiteNumberOr(loan.principalRemaining, 0))
    const interest = (principal * finiteNumberOr(loan.interestRate, 0)) / 365
    const payment = Math.min(
      Math.max(0, finiteNumberOr(loan.dailyPayment, 0)),
      principal + interest
    )
    if (cash >= payment) {
      cash -= payment
      const principalRemaining = Math.max(0, principal - (payment - interest))
      const termDaysRemaining = finiteNumberOr(loan.termDaysRemaining, 0) - 1
      if (termDaysRemaining > 0 && principalRemaining > 0) {
        retained[id] = {
          ...loan,
          principalRemaining,
          termDaysRemaining,
          defaultCounter: 0
        }
      }
    } else {
      const defaultCounter = finiteNumberOr(loan.defaultCounter, 0) + 1
      if (defaultCounter >= LIABILITY_DEFAULT_DAYS) foreclosed.add(loan.assetId)
      else retained[id] = { ...loan, defaultCounter }
    }
  }
  let installmentDailyCost = 0
  for (const id in retained) {
    const loan = retained[id]
    if (!loan) continue
    if (foreclosed.has(loan.assetId)) delete retained[id]
    else
      installmentDailyCost += Math.max(0, finiteNumberOr(loan.dailyPayment, 0))
  }
  const retainedAssets = assets.filter(asset => !foreclosed.has(asset.id))
  return {
    money: cash,
    assets: retainedAssets,
    liabilities: retained,
    assetDailyCost: getRestAssetDailyCost(retainedAssets),
    installmentDailyCost,
    assetModifiers: getActiveAssetModifiers(retainedAssets)
  }
}

/** Asset-only settlement, paid before loans and living costs. */
export const getRestAssetDailyCost = (
  assets: readonly LongTermAsset[]
): number =>
  assets.reduce(
    (cost, asset) =>
      cost +
      finiteNumberOr(
        getAssetTotalUpkeep(asset) - getAssetTotalDailyRevenue(asset),
        0
      ),
    0
  )
