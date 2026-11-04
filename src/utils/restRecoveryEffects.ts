import type { GameState } from '../types/game'
import type { PendingRestEffects } from '../types/restRecovery'
import {
  FORECLOSURE_FAME_PENALTY,
  LIABILITY_DEFAULT_DAYS
} from './assets/assetConfig'
import {
  buildCrowdfundAsset,
  isPlannedCrowdfundSuccess
} from './assets/assetTicks'
import {
  getAssetAggregateBoni,
  getAssetTotalDailyRevenue,
  getAssetTotalUpkeep
} from './assets/assetSelectors/assetFinancials'
import { getAssetSaleQuote } from './assets/assetSelectors/assetSaleQuote'
import { finiteNumberOr } from './finiteNumber'

export type { PendingRestEffects } from '../types/restRecovery'

/**
 * Bounds fame losses at the earliest possible default and credits frozen
 * campaign rewards. Successful assets can first earn on the following rest.
 * Counting rewards even when a duplicate kind would discard them is optimistic.
 */
export const getPendingRestEffects = (
  _assets: GameState['assets'],
  liabilities: GameState['liabilities'],
  campaigns: GameState['crowdfundCampaigns'] | undefined,
  day: number
): PendingRestEffects => {
  const effects: PendingRestEffects = { fameDrops: [], successes: [] }
  const foreclosureDays = new Map<string, number>()
  for (const liability of Object.values(liabilities ?? {})) {
    if (!liability) continue
    const restDay = Math.max(
      1,
      Math.ceil(
        LIABILITY_DEFAULT_DAYS - finiteNumberOr(liability.defaultCounter, 0)
      )
    )
    foreclosureDays.set(
      liability.assetId,
      Math.min(foreclosureDays.get(liability.assetId) ?? restDay, restDay)
    )
  }
  for (const restDay of foreclosureDays.values()) {
    effects.fameDrops.push({ restDay, amount: FORECLOSURE_FAME_PENALTY })
  }
  for (const campaign of campaigns ?? []) {
    const restDay = Math.max(
      1,
      Math.ceil(finiteNumberOr(campaign.daysRemaining, 0))
    )
    const fame = Math.max(0, finiteNumberOr(campaign.fameStake, 0))
    if (!isPlannedCrowdfundSuccess(campaign)) {
      effects.fameDrops.push({ restDay, amount: fame })
      continue
    }
    const rewardDay = Math.max(0, finiteNumberOr(day, 0)) + restDay - 1
    const asset = buildCrowdfundAsset(campaign, rewardDay)
    const quote = getAssetSaleQuote(asset, {}, rewardDay)
    effects.successes.push({
      restDay,
      fame,
      dailyIncome: Math.max(
        0,
        finiteNumberOr(
          getAssetTotalDailyRevenue(asset) - getAssetTotalUpkeep(asset),
          0
        )
      ),
      passiveFame: Math.max(
        0,
        finiteNumberOr(getAssetAggregateBoni(asset).famePassivePerDay, 0)
      ),
      saleProceeds: quote.blocked
        ? 0
        : Math.max(0, finiteNumberOr(quote.net, 0))
    })
  }
  return effects
}
