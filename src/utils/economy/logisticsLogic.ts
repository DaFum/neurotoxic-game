import { NEUTRAL_ASSET_MODIFIERS } from '../assetSelectors'
import type { AssetModifiers } from '../../types/assets'
import { clamp0to100, finiteNumberOr } from '../gameState'
import { bandHasTrait } from '../traitUtils'
import type { PlayerState, BandState, SocialState } from '../../types'

import {
  EXPENSE_CONSTANTS,
  TRAVEL_LOGISTICS_PER_100KM,
  TRAVEL_LOGISTICS_PER_FAME_LEVEL,
  TRAVEL_LOGISTICS_CASH_CAP,
  TRAVEL_LOGISTICS_BASE
} from './constants'
import type { MapPoint } from './types'

/**
 * Calculates map travel distance between two node-like values.
 *
 * Reads top-level coordinates first, then legacy `venue` coordinates, and
 * falls back to the map center when coordinates are missing.
 *
 * @param nodeA - Target node-like value.
 * @param nodeB - Source node-like value. Defaults to `null`.
 * @returns Distance used by travel and logistics cost formulas.
 */
export const calculateDistance = (nodeA: unknown, nodeB: unknown = null) => {
  const pointA = (nodeA && typeof nodeA === 'object' ? nodeA : {}) as MapPoint
  const pointB = (nodeB && typeof nodeB === 'object' ? nodeB : {}) as MapPoint
  const x1 = typeof pointA.x === 'number' ? pointA.x : (pointA.venue?.x ?? 50)
  const y1 = typeof pointA.y === 'number' ? pointA.y : (pointA.venue?.y ?? 50)

  const x2 = typeof pointB.x === 'number' ? pointB.x : (pointB.venue?.x ?? 50)
  const y2 = typeof pointB.y === 'number' ? pointB.y : (pointB.venue?.y ?? 50)

  const dx = x1 - x2
  const dy = y1 - y2

  // Distance logic: Relative distance + base cost
  return Math.floor(Math.sqrt(dx * dx + dy * dy) * 5) + 20
}

/**
 * Calculates van fuel consumption and equivalent fuel price for a trip.
 *
 * Applies van upgrades, band traits, and asset fuel modifiers.
 *
 * @param dist - Distance in kilometers.
 * @param playerState - Optional player state for upgrade checks. Defaults to `null`.
 * @param bandState - Optional band state for trait checks. Defaults to `null`.
 * @param assetModifiers - Asset modifiers that adjust fuel usage. Defaults to neutral modifiers.
 * @returns Fuel liters consumed and fuel price for that usage.
 */
export const calculateFuelCost = (
  dist: number,
  playerState: Pick<PlayerState, 'van'> | null = null,
  bandState: Pick<BandState, 'members'> | null = null,
  assetModifiers: AssetModifiers = NEUTRAL_ASSET_MODIFIERS
) => {
  if (dist < 0) return { fuelLiters: 0, fuelCost: 0 }

  let fuelLiters = (dist / 100) * EXPENSE_CONSTANTS.TRANSPORT.FUEL_PER_100KM

  // Check for 'van_tuning' upgrade
  if (
    playerState &&
    playerState.van &&
    playerState.van.upgrades &&
    playerState.van.upgrades.includes('van_tuning')
  ) {
    fuelLiters *= 0.8 // 20% reduction
  }

  // Road Warrior Trait: 15% discount on fuel consumption
  if (bandHasTrait(bandState, 'road_warrior')) {
    fuelLiters *= 0.85
  }

  fuelLiters *= assetModifiers.fuelMultiplier ?? 1.0

  const fuelCost = Math.floor(
    fuelLiters * EXPENSE_CONSTANTS.TRANSPORT.FUEL_PRICE
  )

  return { fuelLiters, fuelCost }
}

/**
 * Calculates guaranteed daily living cost before assets and liabilities.
 *
 * Includes fame-based lifestyle inflation and potential offsets from social
 * media revenue.
 *
 * @param player - Player state containing fame level.
 * @param band - Band state containing members.
 * @param social - Social state containing YouTube followers. Defaults to `{}`.
 * @returns Daily living cost before asset upkeep, asset revenue, and liability payments.
 */
export const calculateGuaranteedDailyCost = (
  player: Pick<PlayerState, 'fameLevel'>,
  band: Pick<BandState, 'members'>,
  social: Partial<Pick<SocialState, 'youtube'>> = {}
) => {
  const bandSize = Array.isArray(band.members) ? band.members.length : 3
  const fameLevel = finiteNumberOr(player.fameLevel, 0)
  const lifestyleInflation = Math.floor(Math.pow(fameLevel, 1.4) * 15)
  let dailyCost =
    EXPENSE_CONSTANTS.DAILY.BASE_COST + bandSize * 8 + lifestyleInflation

  const youtube = finiteNumberOr(social.youtube, 0)
  if (youtube >= 10000) {
    const adRevenue = Math.floor(youtube / 10000) * 10
    dailyCost -= adRevenue
  }

  return dailyCost
}

/**
 * Calculates travel distance, fuel draw, and non-fuel cash logistics cost.
 *
 * Fuel is returned as liters to deduct from the van tank; `totalCost` includes
 * food and logistics only.
 *
 * @param node - Target node-like value.
 * @param fromNode - Source node-like value. Defaults to `null`.
 * @param playerState - Optional player state for upgrade-aware costs. Defaults to `null`.
 * @param bandState - Optional band state for trait checks. Defaults to `null`.
 * @param assetModifiers - Asset modifiers that adjust fuel usage. Defaults to neutral modifiers.
 * @returns Travel distance, fuel liters to consume, and cash cost excluding fuel.
 */
export const calculateTravelExpenses = (
  node: unknown,
  fromNode: unknown = null,
  playerState: Pick<PlayerState, 'fameLevel' | 'money' | 'van'> | null = null,
  bandState: Pick<BandState, 'members'> | null = null,
  assetModifiers: AssetModifiers = NEUTRAL_ASSET_MODIFIERS
) => {
  const dist = calculateDistance(node, fromNode)
  // Fuel is paid by consuming the van's tank (fuelLiters), not as a money cost.
  // Consumers deduct fuelLiters from van.fuel separately, so fuelCost must NOT
  // be folded into totalCost or every move would be charged for fuel twice.
  const { fuelLiters } = calculateFuelCost(
    dist,
    playerState,
    bandState,
    assetModifiers
  )

  const bandSize = bandState?.members?.length ?? 3
  const fameLevel = finiteNumberOr(playerState?.fameLevel, 0)

  // Base food cost
  const foodCost = bandSize * EXPENSE_CONSTANTS.FOOD.FAST_FOOD

  // Keep travel scaling predictable: mild distance pressure, mild fame pressure,
  // and at most a small reserve fee for travelling with a large cash buffer.
  const distanceLogistics = Math.floor(
    (dist / 100) * TRAVEL_LOGISTICS_PER_100KM
  )
  const fameLogistics = Math.floor(fameLevel * TRAVEL_LOGISTICS_PER_FAME_LEVEL)
  const cashReserveFee = Math.min(
    TRAVEL_LOGISTICS_CASH_CAP,
    Math.floor(finiteNumberOr(playerState?.money, 0) / 1000) * 5
  )
  const logisticsCost =
    TRAVEL_LOGISTICS_BASE + distanceLogistics + fameLogistics + cashReserveFee
  const totalCost = foodCost + logisticsCost

  return { dist, fuelLiters, totalCost }
}

/**
 * Calculates the cost to refuel the van to full capacity.
 *
 * `fuelMultiplier` deliberately does NOT apply here: it is a consumption
 * modifier (fewer liters burned per trip, see `calculateFuelCost`). The tank
 * deficit being refilled is physical liters, so discounting the pump price
 * as well would apply the modifier twice (multiplier squared).
 *
 * @param currentFuel - Current fuel level, clamped to the van's fuel range.
 * @returns Cost in euros.
 */
export const calculateRefuelCost = (currentFuel: number) => {
  const safeFuel = clamp0to100(finiteNumberOr(currentFuel, 0))
  const missing = Math.max(0, EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL - safeFuel)
  return Math.ceil(missing * EXPENSE_CONSTANTS.TRANSPORT.FUEL_PRICE)
}

/**
 * Calculates the cost to repair the van to full condition.
 * @param currentCondition - Current condition (0-100).
 * @returns Cost in euros.
 */
export const calculateRepairCost = (currentCondition: number) => {
  const safeCondition = clamp0to100(finiteNumberOr(currentCondition, 0))
  const missing = 100 - safeCondition
  return Math.ceil(missing * EXPENSE_CONSTANTS.TRANSPORT.REPAIR_COST_PER_UNIT)
}

/**
 * Decides whether cash and daily obligations should trigger bankruptcy.
 *
 * @param newMoney - Resulting cash balance; coerced to Number and must
 *   be finite (a TypeError is thrown otherwise). Negative returns immediate
 *   bankruptcy, positive returns never bankrupt.
 * @param netIncome - Latest net income; defaults to
 *   0 when undefined.
 * @param totalDailyObligations - Daily obligations folded into the
 *   break-even check when the balance is exactly 0. Defaults to `0`.
 * @returns True when bankruptcy should trigger.
 * @throws TypeError when `newMoney` cannot be coerced to a finite number.
 */
export const shouldTriggerBankruptcy = (
  newMoney: unknown,
  netIncome: number | null | undefined,
  totalDailyObligations: number = 0
) => {
  const val = Number(newMoney)
  if (!Number.isFinite(val)) {
    throw new TypeError('newMoney must be a finite number')
  }

  // If player has money left, they are not bankrupt.
  if (val > 0) return false

  // If negative balance, instant bankruptcy (debt is fatal).
  // This explicitly catches un-clamped inputs.
  if (val < 0) return true

  // If exactly 0, check if we are bleeding money (netIncome < 0).

  // If netIncome is undefined, default to 0 (assume break-even/safe).
  const income = netIncome ?? 0

  // Bankrupt if at 0 money and net income was strictly negative.
  return income - totalDailyObligations < 0
}
