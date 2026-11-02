import { calculateGuaranteedDailyCost } from './economy'
import {
  ORIGINAL_CONTROL_BALANCE_TUNING,
  getEarlyGameObligationMultiplier,
  type BalanceTuning
} from './balanceTuning'
import type { PlayerState, BandState, SocialState } from '../types'

/**
 * Deterministic part of the daily cash settlement: living obligations scaled
 * by the early-game multiplier, minus YouTube ad revenue.
 *
 * @remarks
 * Excludes the newsletter roll, the wealth drain, and the asset and liability
 * ticks. The day tick (`dailyTickLogic`) and the stranded check
 * (`checkSoftlock`) both price a day with it, so the two cannot drift. Kept
 * out of `dailyTickLogic` so the map utilities do not pull in the whole tick.
 *
 * @param player - Player slice; `day` is the day being settled (after the increment).
 * @param band - Band slice whose size sets the living costs.
 * @param social - Social slice supplying YouTube followers.
 * @param tuning - Balance tuning that sets the early-game multiplier. Defaults to the control tuning.
 * @returns Cash the day costs; negative when YouTube revenue exceeds the obligations.
 */
export const calculateDailyNetCost = (
  player: Pick<PlayerState, 'day' | 'fameLevel'>,
  band: Pick<BandState, 'members'>,
  social: Partial<Pick<SocialState, 'youtube'>>,
  tuning: Readonly<BalanceTuning> = ORIGINAL_CONTROL_BALANCE_TUNING
): number => {
  const obligations = calculateGuaranteedDailyCost(player, band, {
    youtube: 0
  })
  const youtubeRevenue =
    obligations - calculateGuaranteedDailyCost(player, band, social)
  return (
    obligations * getEarlyGameObligationMultiplier(player.day, tuning) -
    youtubeRevenue
  )
}
