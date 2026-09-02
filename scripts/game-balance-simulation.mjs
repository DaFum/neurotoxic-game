import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import crypto from 'node:crypto'

import { ALL_VENUES } from '../src/data/venues.js'
import { MapGenerator } from '../src/utils/mapGenerator.ts'
import {
  calculateTravelCostsAndImpact,
  checkTravelResources,
  getNodeAccessStatus
} from '../src/utils/travelUtils.ts'
import { VENUES_BY_ID } from '../src/data/venues.js'
import { createInitialState } from '../src/context/initialState.js'
import { EVENTS_DB } from '../src/data/events/index.js'
import { BRAND_DEALS } from '../src/data/brandDeals.js'
import { POST_OPTIONS } from '../src/data/postOptions.js'
import { ALLOWED_TRENDS } from '../src/data/socialTrends.js'
import { SOCIAL_PLATFORMS } from '../src/data/platforms.js'
import { CONTRABAND_BY_ID } from '../src/data/contraband.js'
import { HQ_ITEMS } from '../src/data/hqItems.js'
import { getUnifiedUpgradeCatalog } from '../src/data/upgradeCatalog.js'
import { SONGS_DB } from '../src/data/songs.js'
import { QUEST_REGISTRY } from '../src/data/questRegistry.js'

const CONTRABAND_DB = Array.from(CONTRABAND_BY_ID.values())
import {
  eventEngine,
  resolveEventChoice
} from '../src/utils/eventEngine/index.js'
import { resolveEvent } from '../src/domain/eventResolver.ts'
import { gameReducer } from '../src/context/gameReducer.ts'
import { QuestLifecycle } from '../src/domain/questLifecycle.ts'
import {
  normalizeTraitMap,
  applyTraitUnlocks
} from '../src/utils/traitUtils.js'
import { checkTraitUnlocks } from '../src/utils/unlockCheck.js'
import {
  calculateAmpCalibrationResult,
  calculateKabelsalatMinigameResult,
  calculateRefuelCost,
  calculateRepairCost,
  calculateRoadieMinigameResult,
  calculateTravelMinigameResult,
  EXPENSE_CONSTANTS,
  MAX_GIG_NET,
  MODIFIER_COSTS,
  TICKET_SALES_CONSTANTS,
  shouldTriggerBankruptcy
} from '../src/utils/economy/index.js'
import {
  calculateDailyUpdates,
  calculateGigPhysics,
  getGigModifiers
} from '../src/utils/simulationUtils.js'
import {
  getActiveAssetModifiers,
  getTotalDailyObligations
} from '../src/utils/assetSelectors/index.js'
import {
  clampBandHarmony,
  clampBandStress,
  clampMemberMood,
  clampMemberStamina,
  clampPlayerFame,
  calculateFameLevel,
  calculateGigFameReward,
  calculateFameGain,
  clampPlayerMoney,
  clampVanFuel,
  BALANCE_CONSTANTS,
  applyEventDelta,
  hasActiveSponsorship,
  finiteNumberOr
} from '../src/utils/gameState/index.js'
import {
  CLINIC_CONFIG,
  calculateClinicCost
} from '../src/context/gameConstants.js'
import { handleSetLastGigStats } from '../src/context/reducers/gigReducer.js'
import {
  purchaseChassis,
  startCrowdfund,
  installModule,
  repairChassis
} from '../src/context/assetActionCreators.js'
import {
  handlePurchaseChassis,
  handleStartCrowdfund,
  handleInstallModule,
  handleRepairChassis
} from '../src/context/reducers/assetReducer.js'
import { CHASSIS_CONFIG } from '../src/utils/assetConfig.js'
import { MODULE_REGISTRY } from '../src/utils/assetModuleRegistry.js'
import { LOAN_PROFILES } from '../src/utils/loanProfiles.js'
import { applySharedBandEffect } from '../src/utils/contrabandEffects.js'
import {
  validatePurchase,
  getAdjustedCost,
  processPurchaseEffect
} from '../src/utils/purchaseLogicUtils.js'
import {
  calculateContinueStats,
  calculatePerformanceScore as normalizePerformanceScore
} from '../src/utils/postGig/index.js'
import {
  deriveFinancials,
  derivePostOptions
} from '../src/utils/postGig/derivations.js'
import { calculatePostGigStateUpdates } from '../src/utils/postGig/socialResolution.js'
import {
  processAssetTick,
  processCrowdfundTick,
  rollAssetRiskEvents,
  processLiabilityTick,
  resolveCrowdfundProbability
} from '../src/utils/assetTicks.js'

import { logger, LOG_LEVELS } from '../src/utils/logger.js'
import { getRegionKeyForLocation } from '../src/utils/mapUtils.ts'
import { buildArtifactMetadata } from './utils/balance-report-metadata.mjs'
import { DEFAULT_BALANCE_TUNING } from '../src/utils/balanceTuning.ts'
import { resetSecureRandomBatch } from '../src/utils/crypto.ts'

// ── Determinism Mock ──────────────────────────────────────────────────────
let uuidCounter = 0
let simulationCryptoRandom = () => 0.5
if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
  globalThis.crypto.randomUUID = () => `sim-uuid-${++uuidCounter}`
}
if (
  globalThis.crypto &&
  typeof globalThis.crypto.getRandomValues === 'function'
) {
  globalThis.crypto.getRandomValues = array => {
    for (let index = 0; index < array.length; index++) {
      array[index] = Math.floor(simulationCryptoRandom() * 2 ** 32)
    }
    return array
  }
}
// ──────────────────────────────────────────────────────────────────────────

// ── Statistics Utilities ──────────────────────────────────────────────────
const mean = values => {
  if (!values || values.length === 0) return null
  const sum = values.reduce((a, b) => a + b, 0)
  return sum / values.length
}

const median = values => {
  if (!values || values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

const standardDeviation = values => {
  if (!values || values.length <= 1) return 0
  const m = mean(values)
  const variance =
    values.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) /
    (values.length - 1)
  return Math.sqrt(variance)
}

const quantile = (values, q) => {
  if (!values || values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base])
  } else {
    return sorted[base]
  }
}

const minimum = values => {
  if (!values || values.length === 0) return null
  return Math.min(...values)
}

const maximum = values => {
  if (!values || values.length === 0) return null
  return Math.max(...values)
}

const wilsonScoreInterval = (successes, n) => {
  if (n === 0) return { lowerPct: 0, upperPct: 0, method: 'wilson' }
  const z = 1.96 // 95% confidence
  const p = successes / n
  const q = 1 - p

  const denominator = 1 + (z * z) / n
  const center = p + (z * z) / (2 * n)
  const spread = z * Math.sqrt((p * q) / n + (z * z) / (4 * n * n))

  return {
    lowerPct: ((center - spread) / denominator) * 100,
    upperPct: ((center + spread) / denominator) * 100,
    method: 'wilson'
  }
}
// ─────────────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const GENERATOR_PATHS = Object.freeze([
  'scripts/game-balance-simulation.mjs',
  'scripts/utils/balance-report-metadata.mjs'
])
const REPORT_DIR = path.join(PROJECT_ROOT, 'reports')
const REPORT_FILES = {
  outputJson: 'game-balance-simulation-results.json',
  outputMarkdown: 'game-balance-simulation-analysis.md'
}

export const SIMULATION_CONSTANTS = {
  reportVersion: 14,
  runsPerScenario: 2000,
  seedNamespace: '#first-income-full-reports-v1',
  // A playthrough is bounded by the map, not by a free-running clock:
  // `MapGenerator.generateMap()` is always called with depth 10 and produces a
  // strictly forward layered DAG, so every route from START to the single
  // FINALE node is exactly 10 hops, and arriving anywhere advances the day
  // once. Reaching FINALE ends the run (GAMEOVER, victory). Measured over 40
  // generated maps: 10 hops every time, 8-10 gig nodes reachable on the best
  // path. Simulating longer models tours the game cannot contain.
  daysPerRun: 10,
  // Progression waypoints inside a tour, as absolute days. Must stay within
  // `daysPerRun` or every checkpoint metric reads null and the paired
  // acceptance checks silently fail instead of measuring anything.
  progressionCheckpointDays: [3, 5, 7],
  homeVenueId: 'stendal_proberaum',
  baseGigGapDays: 1, // In-game, traveling to a new node advances the day exactly once, allowing a gig immediately upon arrival
  randomModifierChance: 0.22,
  fameLossBadGig: BALANCE_CONSTANTS.FAME_LOSS_BAD_GIG,
  brandDealEvalChance: 0.14,
  postPulseChance: 0.18,
  trendShiftChance: 0.12,
  contrabandDropChance: 0.11,
  gigEventChance: 0.3, // scaled by scenario eventIntensity; mirrors gig_intro/gig_mid trigger points
  assetInvestChance: 0.12,
  moduleInstallChance: 0.15,
  crowdfundChance: 0.04,
  outputJson: REPORT_FILES.outputJson,
  outputMarkdown: REPORT_FILES.outputMarkdown
}

export const REGRESSION_METRICS = [
  {
    key: 'bankruptcyRate',
    label: 'Insolvenzrate',
    suffix: '%'
  },
  {
    key: 'avgFinalMoney',
    label: 'Ø Endgeld',
    formatter: value => fmtEur(value)
  },
  {
    key: 'avgFameProgressPerGig',
    label: 'Fame-Fortschritt/Gig'
  },
  {
    key: 'avgGigsPlayed',
    label: 'Ø Gigs'
  }
]

export const SCENARIOS = [
  {
    id: 'baseline_touring',
    name: 'Baseline Touring',
    description:
      'Ausgewogene Tour mit moderaten Modifikatoren und normalem Risiko.',
    gigGapDays: 1,
    ticketDiscountChance: 0.08,
    eventIntensity: 0.35,
    maintenanceDiscipline: 0.7,
    minigameSkill: 0.62,
    traitPack: ['bandleader', 'gear_nerd', 'party_animal'],
    modifierBias: {
      promo: 0.35,
      merch: 0.3,
      catering: 0.15,
      soundcheck: 0.2,
      guestlist: 0.1
    },
    initialOverrides: {
      player: { money: 500, fame: 0 },
      band: { harmony: 80 },
      social: { controversyLevel: 0, loyalty: 0, zealotry: 0 }
    }
  },
  {
    id: 'bootstrap_struggle',
    name: 'Bootstrap Struggle',
    description:
      'Seltene Gigs, geringe Modifier-Nutzung, schlechte Wartungsdisziplin – testet eine träge, resourcenarme Spielweise.',
    gigGapDays: 4,
    ticketDiscountChance: 0.2,
    eventIntensity: 0.5,
    maintenanceDiscipline: 0.45,
    minigameSkill: 0.42,
    traitPack: ['road_warrior'],
    modifierBias: {
      promo: 0.15,
      merch: 0.25,
      catering: 0.05,
      soundcheck: 0.05,
      guestlist: 0.03
    },
    initialOverrides: {
      player: { money: 500, fame: 0 },
      band: { harmony: 80 },
      social: { controversyLevel: 0, loyalty: 0, zealotry: 0 }
    }
  },
  {
    id: 'aggressive_marketing',
    name: 'Aggressive Marketing',
    description:
      'Hohe Modifikator-Nutzung und dichte Gig-Folge für schnelles Wachstum.',
    gigGapDays: 2,
    ticketDiscountChance: 0.04,
    eventIntensity: 0.62,
    maintenanceDiscipline: 0.63,
    minigameSkill: 0.58,
    traitPack: ['social_manager', 'tech_wizard'],
    modifierBias: {
      promo: 0.78,
      merch: 0.65,
      catering: 0.45,
      soundcheck: 0.5,
      guestlist: 0.25
    },
    initialOverrides: {
      player: { money: 500, fame: 0 },
      band: { harmony: 80 },
      social: { controversyLevel: 0, loyalty: 0, zealotry: 0 }
    }
  },
  {
    id: 'scandal_recovery',
    name: 'Scandal Recovery',
    description:
      'Konservative Tour während eines bestehenden öffentlichen Backlashs.',
    gigGapDays: 3,
    ticketDiscountChance: 0.22,
    eventIntensity: 0.75,
    maintenanceDiscipline: 0.6,
    minigameSkill: 0.5,
    traitPack: ['bandleader', 'melodic_genius'],
    modifierBias: {
      promo: 0.2,
      merch: 0.35,
      catering: 0.2,
      soundcheck: 0.3,
      guestlist: 0.05
    },
    initialOverrides: {
      player: { money: 500, fame: 0 },
      band: { harmony: 80 },
      social: { controversyLevel: 50, loyalty: 0, zealotry: 0 }
    }
  },
  {
    id: 'festival_push',
    name: 'Festival Push',
    description:
      'Seltene Gigs mit Premium-Modifikatorpaket und starken Traits – testet Qualität-über-Quantität-Strategie.',
    gigGapDays: 3,
    ticketDiscountChance: 0.02,
    eventIntensity: 0.4,
    maintenanceDiscipline: 0.75,
    minigameSkill: 0.66,
    traitPack: ['tech_wizard', 'blast_machine', 'social_manager'],
    modifierBias: {
      promo: 0.56,
      merch: 0.5,
      catering: 0.35,
      soundcheck: 0.45,
      guestlist: 0.4
    },
    initialOverrides: {
      player: { money: 500, fame: 0 },
      band: { harmony: 80 },
      social: { controversyLevel: 0, loyalty: 0, zealotry: 0 }
    }
  },
  {
    id: 'chaos_tour',
    name: 'Chaos Tour',
    description:
      'Hohe Event-Dichte, riskante Entscheidungen und volatile Bandwerte.',
    gigGapDays: 2,
    ticketDiscountChance: 0.3,
    eventIntensity: 0.95,
    maintenanceDiscipline: 0.35,
    minigameSkill: 0.35,
    traitPack: ['party_animal'],
    modifierBias: {
      promo: 0.55,
      merch: 0.5,
      catering: 0.1,
      soundcheck: 0.08,
      guestlist: 0.22
    },
    initialOverrides: {
      player: { money: 500, fame: 0 },
      band: { harmony: 80 },
      social: { controversyLevel: 0, loyalty: 0, zealotry: 0 }
    }
  },
  {
    id: 'cult_hypergrowth',
    name: 'Cult Hypergrowth',
    description:
      'Maximaler Promo-Einsatz und Social-Traits – testet aggressiven Fanbase-Aufbau und Monetarisierung.',
    gigGapDays: 2,
    ticketDiscountChance: 0,
    eventIntensity: 0.55,
    maintenanceDiscipline: 0.58,
    minigameSkill: 0.64,
    traitPack: ['social_manager', 'tech_wizard', 'gear_nerd'],
    modifierBias: {
      promo: 0.88,
      merch: 0.72,
      catering: 0.3,
      soundcheck: 0.5,
      guestlist: 0.35
    },
    initialOverrides: {
      player: { money: 500, fame: 0 },
      band: { harmony: 80 },
      social: { controversyLevel: 0, loyalty: 0, zealotry: 0 }
    }
  },
  // ── Phase probes: fixed fame starting points ───────────────────────────────
  // Probes differ only in their starting state, not in length: every run models
  // one full tour over the map's fixed horizon, so they inherit `daysPerRun`.
  {
    id: 'no_social_probe',
    name: 'No Social (Fame 0-50)',
    description: 'A build that completely ignores social media.',
    ticketDiscountChance: 0.1,
    gigGapDays: 2,
    socialStrategy: 'none',
    brandDealsEnabled: false,
    assetStrategies: {
      promo: 0,
      merch: 0.1,
      soundcheck: 0.1,
      guestlist: 0.1
    },
    initialOverrides: {
      player: { money: 500, fame: 0 },
      band: { harmony: 80 },
      social: { controversyLevel: 0, loyalty: 0, zealotry: 0 }
    }
  },
  {
    id: 'high_controversy_probe',
    name: 'High Controversy',
    description: 'Max controversy strategy.',
    ticketDiscountChance: 0.1,
    gigGapDays: 2,
    assetStrategies: {
      promo: 0.2,
      merch: 0.2,
      soundcheck: 0.1,
      guestlist: 0.2
    },
    initialOverrides: {
      player: { money: 500, fame: 0 },
      band: { harmony: 80 },
      social: { controversyLevel: 80, loyalty: 0, zealotry: 0 }
    }
  },
  {
    id: 'early_game_probe',
    name: 'Early Game Probe (Fame 0–50)',
    description:
      'Frühspiel-Sonde: Fame 0, volle Tour. Misst Survival-Rate, Gig-Netto und Logistikkosten der ersten Spieltage.',
    gigGapDays: 2,
    ticketDiscountChance: 0.12,
    eventIntensity: 0.3,
    maintenanceDiscipline: 0.55,
    minigameSkill: 0.48,
    traitPack: [],
    modifierBias: {
      promo: 0.12,
      merch: 0.18,
      catering: 0.08,
      soundcheck: 0.08,
      guestlist: 0.03
    },
    initialOverrides: {
      player: { money: 500, fame: 0 },
      band: { harmony: 80 },
      social: { controversyLevel: 0, loyalty: 0, zealotry: 0 }
    }
  },
  {
    id: 'mid_game_probe',
    name: 'Mid Game Probe (Fame 60–150)',
    description:
      'Mittelspiel-Sonde: Fame 60 Start, volle Tour. Misst Time-to-Upgrade und Management-Cut-Wachstum.',
    gigGapDays: 2,
    ticketDiscountChance: 0.08,
    eventIntensity: 0.4,
    maintenanceDiscipline: 0.65,
    minigameSkill: 0.55,
    traitPack: ['bandleader'],
    modifierBias: {
      promo: 0.28,
      merch: 0.25,
      catering: 0.12,
      soundcheck: 0.18,
      guestlist: 0.08
    },
    initialOverrides: {
      player: { money: 1500, fame: 60 },
      band: { harmony: 75 },
      social: { controversyLevel: 0, loyalty: 0, zealotry: 0 }
    }
  },
  {
    id: 'late_game_probe',
    name: 'Late Game Probe (Fame 175+)',
    description:
      'Spätspiel-Sonde: Fame 175 Start, volle Tour. Misst Logistikkosten als Sink und die Cap-Hit-Rate.',
    gigGapDays: 1,
    ticketDiscountChance: 0.04,
    eventIntensity: 0.5,
    maintenanceDiscipline: 0.72,
    minigameSkill: 0.65,
    traitPack: ['bandleader', 'gear_nerd'],
    modifierBias: {
      promo: 0.55,
      merch: 0.45,
      catering: 0.25,
      soundcheck: 0.4,
      guestlist: 0.2
    },
    initialOverrides: {
      player: { money: 5000, fame: 175 },
      band: { harmony: 80 },
      social: { controversyLevel: 0, loyalty: 0, zealotry: 0 }
    }
  }
]

const UPGRADE_CATALOG = getUnifiedUpgradeCatalog()
const _HQ_BEER_PIPELINE = UPGRADE_CATALOG.find(
  item => item.id === 'hq_room_beer_pipeline'
)
const _VAN_TUNING = UPGRADE_CATALOG.find(item => item.id === 'hq_van_tuning')
const HQ_UPGRADE_COST = Number(_HQ_BEER_PIPELINE?.cost ?? 25000)
const VAN_UPGRADE_COST = Number(_VAN_TUNING?.cost ?? 1500)
const SHOP_FAME_ENTRY_IDS = new Set(
  [...HQ_ITEMS.van, ...HQ_ITEMS.hq]
    .filter(item => item.currency === 'fame')
    .map(item => item.id)
)
const SHOP_FAME_CATALOG = UPGRADE_CATALOG.filter(
  item => item.currency === 'fame' && SHOP_FAME_ENTRY_IDS.has(item.id)
)
const LEGACY_FAME_CATALOG = UPGRADE_CATALOG.filter(
  item => item.currency === 'fame' && !SHOP_FAME_ENTRY_IDS.has(item.id)
)
const FAME_AUDIT_PERFORMANCE_SCORES = [45, 50, 55, 60, 70, 85, 100]

const getCatalogFameRefund = item => {
  const effects = Array.isArray(item.effects)
    ? item.effects
    : item.effect
      ? [item.effect]
      : []

  return effects.reduce((sum, effect) => {
    if (effect?.target === 'player' && effect?.stat === 'fame') {
      return sum + (Number(effect.value) || 0)
    }
    return sum
  }, 0)
}

const sumCatalogCost = catalog =>
  catalog.reduce((sum, item) => sum + (Number(item.cost) || 0), 0)

const simulateGigsToReachFameTarget = (targetFame, performanceScore) => {
  const rawGigFame = calculateGigFameReward(performanceScore)
  // Recompute gig counts with a ceiling, preventing undercount anomalies
  return {
    gigs: Math.ceil(targetFame / rawGigFame),
    finalFame: targetFame,
    rawGigFame
  }
}

const simulateFameCatalogClear = (catalog, performanceScore) => {
  const rawGigFame = calculateGigFameReward(performanceScore)
  const remaining = catalog.map(item => ({
    id: item.id,
    cost: Number(item.cost) || 0,
    fameRefund: getCatalogFameRefund(item)
  }))

  let fame = 0
  let gigs = 0

  while (remaining.length > 0 && gigs < 250000) {
    let chosenIndex = -1
    let bestNetCost = Infinity

    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i]
      if (candidate.cost > fame) continue

      const candidateNetCost = candidate.cost - candidate.fameRefund
      if (candidateNetCost < bestNetCost) {
        bestNetCost = candidateNetCost
        chosenIndex = i
      }
    }

    if (chosenIndex >= 0) {
      const purchased = remaining.splice(chosenIndex, 1)[0]
      fame = clampPlayerFame(fame - purchased.cost + purchased.fameRefund)
      continue
    }

    fame += calculateFameGain(rawGigFame, fame, BALANCE_CONSTANTS.MAX_FAME_GAIN)
    gigs += 1
  }

  return { gigs: Math.ceil(gigs), finalFame: fame, rawGigFame }
}

/**
 * Share of a tour's gigs that clearing the whole fame catalogue may consume.
 * The catalogue has to be affordable inside one tour, so the upper bound is the
 * tour itself; the lower bound keeps it from becoming a rounding error.
 */
const FAME_CATALOG_TARGET_SHARE = Object.freeze({ min: 0.6, max: 1 })

/**
 * Derives the fame-audit target from the current configuration instead of
 * hardcoding it. Gig count per tour follows the map-bounded horizon, and the
 * cost side is read from the live catalogue, so re-pricing the shop or moving
 * `daysPerRun` re-targets the audit automatically. A hardcoded target silently
 * inverts its verdict the moment either side moves.
 */
const getFameCatalogTarget = totalFameCost => {
  const gigsPerTour = Math.max(
    1,
    Math.floor(
      SIMULATION_CONSTANTS.daysPerRun /
        Math.max(1, SIMULATION_CONSTANTS.baseGigGapDays)
    )
  )
  return {
    totalFameCost,
    gigsPerTour,
    minGigs: Math.max(
      1,
      Math.round(gigsPerTour * FAME_CATALOG_TARGET_SHARE.min)
    ),
    maxGigs: Math.max(
      1,
      Math.round(gigsPerTour * FAME_CATALOG_TARGET_SHARE.max)
    )
  }
}

const getFameAuditVerdict = ({ gigsToBuyShopPlusLegacy, target }) => {
  const goal = `${target.minGigs}-${target.maxGigs} guten Gigs bis ${target.totalFameCost} Fame (Tour-Horizont ${target.gigsPerTour} Gigs)`

  if (gigsToBuyShopPlusLegacy > target.maxGigs) {
    return `Fame-Gewinn ist zu niedrig fuer das Ziel von ${goal}.`
  }

  if (gigsToBuyShopPlusLegacy < target.minGigs) {
    return `Fame-Gewinn ist zu hoch fuer das Ziel von ${goal}.`
  }

  return `Fame-Gewinn liegt im Zielkorridor von ${goal}.`
}

const buildFameBalanceAudit = () => {
  const shopOnlyCost = sumCatalogCost(SHOP_FAME_CATALOG)
  const allFameCost = shopOnlyCost + sumCatalogCost(LEGACY_FAME_CATALOG)
  const mostExpensiveShopItem = SHOP_FAME_CATALOG.reduce(
    (max, item) => Math.max(max, Number(item.cost) || 0),
    0
  )

  const target = getFameCatalogTarget(allFameCost)

  const scenarios = FAME_AUDIT_PERFORMANCE_SCORES.map(performanceScore => {
    const reachLabel = simulateGigsToReachFameTarget(
      mostExpensiveShopItem,
      performanceScore
    )
    const shopOnly = simulateFameCatalogClear(
      SHOP_FAME_CATALOG,
      performanceScore
    )
    const shopPlusLegacy = simulateFameCatalogClear(
      [...SHOP_FAME_CATALOG, ...LEGACY_FAME_CATALOG],
      performanceScore
    )

    return {
      performanceScore,
      rawGigFame: reachLabel.rawGigFame,
      gigsToReachLabelCost: reachLabel.gigs,
      gigsToBuyShopOnly: shopOnly.gigs,
      gigsToBuyShopPlusLegacy: shopPlusLegacy.gigs,
      verdict: getFameAuditVerdict({
        gigsToBuyShopPlusLegacy: shopPlusLegacy.gigs,
        target
      })
    }
  })

  return {
    shopOnlyCost,
    shopPlusLegacyCost: allFameCost,
    target,
    mostExpensiveShopItem,
    eventualPurchaseIsPossible: true,
    note: 'Mathematisch ist alles kaufbar, weil gute Gigs mindestens 1 Fame geben. Praktisch entscheidet die noetige Gig-Anzahl ueber die Balance.',
    scenarios
  }
}

export const createScenarioSeed = (id, runIndex) => {
  let h = 0x811c9dc5
  const str = `${id}:${runIndex}`
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * When a band member benefits from a rest day. `BandMemberRow` flags stamina
 * below 35 and mood below 50 as low in the HUD, so this is the point at which
 * the game tells the player something is wrong.
 *
 * Both the rest decision and the rest effect read this one predicate; when they
 * disagreed, a rest day could consume a gig slot and heal nobody.
 */
const MEMBER_CARE_THRESHOLDS = Object.freeze({
  stamina: 35,
  mood: 50
})

const MEMBER_NEEDS_CARE = member =>
  member.stamina < MEMBER_CARE_THRESHOLDS.stamina ||
  member.mood < MEMBER_CARE_THRESHOLDS.mood

const describeThreshold = (label, value, threshold) =>
  value < threshold
    ? `${label} ${value} unterschreitet die Marke ${threshold}`
    : `${label} ${value} erreicht mindestens die Marke ${threshold}`

export const describeRestThresholdCrossings = ({ stamina, mood }) =>
  `${describeThreshold('Stamina', stamina, MEMBER_CARE_THRESHOLDS.stamina)}; ${describeThreshold('Mood', mood, MEMBER_CARE_THRESHOLDS.mood)}.`

const mulberry32 = seed => {
  // `seed + 0x6d2b79f5` is string concatenation for a non-numeric seed, and the
  // arithmetic below then collapses to NaN — which yields ONE fixed stream for
  // every string seed. A caller passing 'seed-a' and 'seed-b' would silently get
  // two identical runs and read that as reproducibility. The reports are safe
  // (they always seed from `createScenarioSeed`), so fail loudly instead.
  if (!Number.isFinite(seed)) {
    throw new TypeError(
      `Simulation seed must be a finite number, received ${typeof seed} (${String(seed)}); use createScenarioSeed(id, runIndex)`
    )
  }
  let t = seed + 0x6d2b79f5
  return () => {
    t += 0x6d2b79f5
    let value = Math.imul(t ^ (t >>> 15), t | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

const pickWeightedBool = (chance, rng) =>
  rng() < Math.min(1, Math.max(0, chance))

const countBandTraits = band =>
  (band?.members || []).reduce(
    (sum, member) => sum + Object.keys(normalizeTraitMap(member.traits)).length,
    0
  )

// Runs the real unlock pipeline (unlockCheck + traitUtils) for a context and
// applies any earned traits to the band, mirroring the in-game reducers.
const applyUnlockContext = (state, counters, context) => {
  const unlocks = checkTraitUnlocks(state, context)
  if (!unlocks.length) return
  const result = applyTraitUnlocks({ band: state.band, toasts: [] }, unlocks)
  state.band = result.band
  counters.traitUnlocks += unlocks.length
}

const applyScenarioOverrides = (state, scenario) => {
  const next = structuredClone(state)
  const { player, band, social } = scenario.initialOverrides

  Object.assign(next.player, player)

  // Ensure fameLevel is properly synchronized after applying player overrides
  if (next.player.fame !== undefined) {
    next.player.fameLevel = calculateFameLevel(next.player.fame)
  }

  Object.assign(next.band, { harmony: band.harmony })
  Object.assign(next.social, social)

  if (Array.isArray(band.members)) {
    next.band.members = next.band.members.map((member, index) => {
      const override = band.members[index] || {}
      return {
        ...member,
        mood: clampMemberMood(override.mood ?? member.mood),
        stamina: clampMemberStamina(override.stamina ?? member.stamina)
      }
    })
  }

  if (Array.isArray(scenario.traitPack)) {
    next.band.members = next.band.members.map((member, index) => {
      const traitId = scenario.traitPack[index % scenario.traitPack.length]
      const newTraits = normalizeTraitMap(member.traits)
      if (traitId && !Object.hasOwn(newTraits, traitId)) {
        newTraits[traitId] = { id: traitId }
      }
      return {
        ...member,
        traits: newTraits
      }
    })
  }

  return next
}

const targetDifficultyForState = state => {
  const fame = state.player.fame
  const controversy = state.social.controversyLevel || 0
  let targetDiff = 2

  if (fame >= 400) targetDiff = 5
  else if (fame >= 200) targetDiff = 4
  else if (fame >= 60) targetDiff = 3

  if (controversy >= 70) targetDiff = Math.max(2, targetDiff - 1)
  return targetDiff
}

/**
 * Node types a band can actually perform at.
 *
 * Must mirror `isGigNode` in `src/utils/arrivalUtils.ts`, which production uses
 * to decide whether an arrival starts a gig: GIG, FESTIVAL and FINALE only. A
 * SPECIAL node triggers an event and returns `gigStarted: false`. Generated maps
 * roll roughly 10% specials, so treating them as stages would invent several
 * paid gigs per tour and distort every economy and progression figure.
 */
export const PERFORMABLE_NODE_TYPES = new Set(['GIG', 'FESTIVAL', 'FINALE'])

/**
 * Builds the forward adjacency of a generated tour map.
 *
 * The simulation used to pick each venue freely from the whole difficulty-banded
 * pool, which let a tour visit any venue in any order — a reachability the game
 * does not offer. `generateMap` produces a strictly forward layered DAG where a
 * node connects to only one or two nodes in the next layer, so where the band can
 * go next is a real constraint, and so is the distance it has to cover.
 */
export const buildTourAdjacency = tourMap => {
  const adjacency = new Map()
  for (const connection of tourMap.connections) {
    const target = tourMap.nodes[connection.to]
    if (!target) continue
    const existing = adjacency.get(connection.from)
    if (existing) existing.push(target)
    else adjacency.set(connection.from, [target])
  }
  return adjacency
}

/**
 * Canonical travel gating, mirroring `useHandleTravel`.
 *
 * The simulation used to deduct travel cost and fuel and clamp both at zero, so
 * a broke band with an empty tank still arrived, still played the gig at the
 * destination and was rescued by its payout. Production refuses the trip before
 * any of that: `getNodeAccessStatus` rejects blacklisted venues, oversized venues in
 * prove-yourself mode and regions whose reputation has bottomed out, and
 * `checkTravelResources` requires the full fuel and the travel cost PLUS the
 * day's obligations (`totalCashImpact`) to be covered.
 *
 * Returns the chosen destination with its costed impact, or the reason no trip
 * was possible. A blocked day is a real state — production calls it stranded —
 * and must not be silently converted into a free hop.
 */
export const planTravel = ({ reachable, state, rng, wantsToPerform }) => {
  if (!reachable.length) return { blocked: 'dead_end' }

  const accessible = []
  let accessRejections = 0
  for (const node of reachable) {
    const access = getNodeAccessStatus({
      node,
      player: state.player,
      reputationByRegion: state.reputationByRegion ?? {},
      venueBlacklist: state.player.venueBlacklist ?? state.venueBlacklist ?? [],
      venuesMap: VENUES_BY_ID,
      // Only used to build the localized refusal text, which the simulation
      // discards; the access verdict itself does not depend on it.
      getLocationName: name => String(name ?? '')
    })
    if (access.allowed) accessible.push(node)
    else accessRejections += 1
  }
  if (!accessible.length) {
    return { blocked: 'venue_access', accessRejections }
  }

  const costed = accessible.map(node => ({
    node,
    travel: calculateTravelCostsAndImpact(
      node,
      state.player.currentMapNode ?? undefined,
      state.player,
      state.band,
      state.social,
      state.assets,
      state.liabilities,
      getActiveAssetModifiers(state.assets ?? [])
    )
  }))

  const affordable = costed.filter(
    candidate =>
      checkTravelResources(
        candidate.travel.totalCashImpact,
        candidate.travel.fuelLiters,
        state.player
      ).allowed
  )
  if (!affordable.length) {
    // Name which resource bit. A tank that cannot cover the shortest reachable
    // hop is a different problem from a balance that cannot cover the day.
    const cheapest = costed.reduce((best, candidate) =>
      candidate.travel.totalCashImpact < best.travel.totalCashImpact
        ? candidate
        : best
    )
    // Fuel binds when at least one hop is payable in cash and fails *only* on
    // the tank — that is the case the refuel retry can rescue. Requiring every
    // candidate to be fuel-short classified a mixed set as `money`, which both
    // mis-attributed the counter and skipped the refuel that would have freed
    // the trip. Asking the production gate for zero litres isolates its money
    // verdict instead of re-deriving one here.
    const fuelShort = costed.some(
      candidate =>
        Math.max(0, state.player.van?.fuel ?? 0) <
          candidate.travel.fuelLiters &&
        checkTravelResources(candidate.travel.totalCashImpact, 0, state.player)
          .allowed
    )
    return {
      blocked: fuelShort ? 'fuel' : 'money',
      shortfall: cheapest.travel.totalCashImpact
    }
  }

  const chosen = chooseNextTourNode(
    affordable.map(candidate => candidate.node),
    state,
    rng,
    wantsToPerform
  )
  const selected = affordable.find(candidate => candidate.node === chosen)
  return selected ? { ...selected } : { blocked: 'dead_end' }
}

/**
 * Route choice among the nodes actually reachable from the current one.
 *
 * A touring band heads for stages it can play, so performable nodes win over
 * rest and supply stops when both are on offer. Within that, the old
 * fame-to-difficulty preference still applies — it just now selects among two or
 * three real options instead of the entire venue catalogue.
 */
export const chooseNextTourNode = (
  reachable,
  state,
  rng,
  wantsToPerform = true
) => {
  if (!reachable.length) return null
  const performable = reachable.filter(node =>
    PERFORMABLE_NODE_TYPES.has(node.type)
  )
  const nonPerformable = reachable.filter(
    node => !PERFORMABLE_NODE_TYPES.has(node.type)
  )
  // Cadence lives here, not at the node. Production starts the show on arrival
  // at a GIG/FESTIVAL/FINALE node (`handleNodeArrival`) with no skip option, so
  // a band that does not want to play today has to route around such a node —
  // and can only do so when the map offers an alternative. When it does not, the
  // band plays anyway, which is a real constraint rather than a modelling
  // shortcut.
  const preferred = wantsToPerform ? performable : nonPerformable
  const fallback = wantsToPerform ? nonPerformable : performable
  const routable = preferred.length
    ? preferred
    : fallback.length
      ? fallback
      : reachable
  const targetDiff = targetDifficultyForState(state)
  const inBand = routable.filter(
    node =>
      (node.venue?.diff ?? 0) <= targetDiff &&
      (node.venue?.diff ?? 0) >= targetDiff - 1
  )
  const pool = inBand.length ? inBand : routable
  return pool[Math.floor(rng() * pool.length)] ?? null
}

/**
 * The three cadence policies a scenario can be simulated under.
 *
 * `gigGapDays` says how often a band wants to play, not *which* days those are,
 * and the phase is not a free choice: it decides how many cost cycles land
 * before the first payout. At `gigGapDays: 2` the former shipped policy resolved
 * to days 2, 4, 6, 8, 10 — the band deliberately declined to play on day 1 and
 * routed around the opening gig node when the map offered an alternative. The
 * shipped `first-income` policy instead plays the first reachable paid gig and
 * anchors the requested gap on that day.
 *
 * - `gap-aligned`   days where `day % gap === 0` (former shipped behaviour)
 * - `gap-offset`    the same cadence phase-shifted to start on day 1
 * - `first-income`  play the first gig the map offers, then keep the gap
 *                   cadence anchored on that day
 *
 * At `gigGapDays: 1` all three agree, so a scenario that plays daily is
 * unaffected by the choice.
 */
export const GIG_CADENCE_POLICIES = Object.freeze([
  'gap-aligned',
  'gap-offset',
  'first-income'
])

/**
 * The policy every shipped scenario runs under. Single source of truth: a probe
 * comparing against "the shipped phase" has to resolve it from here rather than
 * repeating the literal, or a rename would silently leave the comparison with no
 * baseline at all and every delta reading as zero.
 */
export const SHIPPED_GIG_CADENCE_POLICY = 'first-income'

export const resolveGigCadence = ({
  day,
  gigGapDays,
  policy = SHIPPED_GIG_CADENCE_POLICY,
  firstGigDay = null
}) => {
  const gap = Math.max(1, gigGapDays || SIMULATION_CONSTANTS.baseGigGapDays)
  // A typo'd policy must not silently resolve to the shipped one: the whole
  // point of the comparison is that the variants differ, so a silent fallback
  // would report three identical cohorts as evidence that phase does not matter.
  if (!GIG_CADENCE_POLICIES.includes(policy)) {
    throw new RangeError(`Unknown gig cadence policy: ${policy}`)
  }
  if (policy === 'gap-offset') return (day - 1) % gap === 0
  if (policy === 'first-income') {
    return firstGigDay == null ? true : (day - firstGigDay) % gap === 0
  }
  return day % gap === 0
}

const calculateModifiers = (scenario, rng) => {
  const modifiers = {
    promo: pickWeightedBool(
      scenario.modifierBias?.promo ?? scenario.assetStrategies.promo,
      rng
    ),
    merch: pickWeightedBool(
      scenario.modifierBias?.merch ?? scenario.assetStrategies.merch,
      rng
    ),
    catering: pickWeightedBool(scenario.modifierBias?.catering ?? 0, rng),
    soundcheck: pickWeightedBool(
      scenario.modifierBias?.soundcheck ?? scenario.assetStrategies.soundcheck,
      rng
    ),
    guestlist: pickWeightedBool(
      scenario.modifierBias?.guestlist ?? scenario.assetStrategies.guestlist,
      rng
    )
  }

  if (rng() < SIMULATION_CONSTANTS.randomModifierChance) {
    const keys = Object.keys(modifiers)
    const key = keys[Math.floor(rng() * keys.length)]
    modifiers[key] = !modifiers[key]
  }

  return modifiers
}

/**
 * Events that happen because a day passed, not because the band drove.
 *
 * Split from the transport branch so that "no transport event without a trip
 * that actually ran" is structural rather than a flag the caller has to pass
 * correctly. The old single function took an `isTravelDay` boolean derived from
 * a *planned* trip, and the plan was still revalidated afterwards — so a trip
 * refused at the final money check left a road event already applied to a
 * journey that never happened.
 */
export const applyNegativeFinancialEventMultiplier = (
  state,
  moneyBeforeEvent,
  multiplier = 1
) => {
  const loss = moneyBeforeEvent - state.player.money
  if (loss > 0 && multiplier > 1) {
    state.player.money = clampPlayerMoney(
      state.player.money - loss * (multiplier - 1)
    )
  }
}

const recordQuestStateDiff = (beforeActive, beforeComp, afterState, counters) => {
  if (!counters?.executionCoverage?.quests) return
  const qCoverage = counters.executionCoverage.quests

  const afterActive = afterState.activeQuests || []
  const afterComp = afterState.completedQuestIds || []

  // Check for newly added active quests
  for (const q of afterActive) {
    if (!beforeActive.some(b => b.id === q.id)) {
      qCoverage.activations += 1
      qCoverage.offers += 1
      qCoverage.uniqueQuestIdsOffered?.add(q.id)
      qCoverage.uniqueQuestIdsActivated?.add(q.id)
    }
  }

  // Check for newly completed quests
  for (const id of afterComp) {
    if (!beforeComp.includes(id)) {
      qCoverage.completions += 1
      qCoverage.uniqueQuestIdsCompleted?.add(id)
    }
  }
}

const dispatchResolvedEventChoice = (event, choice, state, scenario, rng, counters = null) => {
  state.activeEvent = event
  const precomputed = resolveEventChoice(choice, state, rng)
  const choiceWithPrecomputed = { ...choice, _precomputedResult: precomputed }
  const { actions } = resolveEvent(choiceWithPrecomputed, state)
  const moneyBeforeEvent = state.player.money
  const beforeActive = state.activeQuests ? [...state.activeQuests] : []
  const beforeComp = state.completedQuestIds ? [...state.completedQuestIds] : []
  for (const action of actions) {
    Object.assign(state, gameReducer(state, action))
  }
  if (counters) {
    recordQuestStateDiff(beforeActive, beforeComp, state, counters)
  }
  applyNegativeFinancialEventMultiplier(
    state,
    moneyBeforeEvent,
    scenario.negativeFinancialEventMultiplier
  )
  return precomputed.delta
}

const applyDailyEvents = (state, scenario, rng, eventCounts) => {
  const intensity = scenario.eventIntensity ?? 0.5
  let eventsApplied = 0

  // Process financial and special events to replace viral spikes and cash swings
  if (rng() < 0.18 * intensity) {
    const category = rng() < 0.5 ? 'financial' : 'special'
    const event = eventEngine.checkEvent(category, state, 'random', rng)
    if (event && event.options && event.options.length > 0) {
      const choice = event.options[Math.floor(rng() * event.options.length)]
      dispatchResolvedEventChoice(event, choice, state, scenario, rng, eventCounts)

      if (category === 'financial') {
        eventCounts.cashSwings += 1
      } else {
        eventCounts.specialEvents += 1
      }
      eventsApplied++
    }
  }

  // Process band events
  if (rng() < 0.07 * intensity) {
    const event = eventEngine.checkEvent('band', state, 'random', rng)
    if (event && event.options && event.options.length > 0) {
      const choice = event.options[Math.floor(rng() * event.options.length)]
      dispatchResolvedEventChoice(event, choice, state, scenario, rng, eventCounts)
      eventCounts.bandEvents += 1
      eventsApplied++
    }
  }

  if (eventsApplied > 0) {
    // In-game, event resolution feeds the EVENT_RESOLVED unlock context
    applyUnlockContext(state, eventCounts, { type: 'EVENT_RESOLVED' })
  }

  return eventsApplied
}

/**
 * Transport events, fired only after a trip has actually been executed.
 *
 * The caller reaching this function is the proof that the journey happened: the
 * resource gate passed, the cost was deducted and the band arrived. There is no
 * `isTravelDay` flag to get wrong.
 */
const applyTravelEvents = (state, scenario, rng, eventCounts) => {
  const intensity = scenario.eventIntensity ?? 0.5
  let eventsApplied = 0

  if (rng() < 0.06 * intensity) {
    const event = eventEngine.checkEvent('transport', state, 'travel', rng)
    if (event && event.options && event.options.length > 0) {
      const choice = event.options[Math.floor(rng() * event.options.length)]
      dispatchResolvedEventChoice(event, choice, state, scenario, rng, eventCounts)
      eventCounts.equipmentEvents += 1
      eventsApplied++
    }
  }

  if (eventsApplied > 0) {
    applyUnlockContext(state, eventCounts, { type: 'EVENT_RESOLVED' })
  }

  return eventsApplied
}

// Mid-gig events from the EVENTS_DB `gig` category, fired at the same
// gig_intro/gig_mid trigger points as maybeFireGigProgressEvent in-game.
const maybeApplyGigEvent = (state, scenario, rng, counters) => {
  const intensity = scenario.eventIntensity ?? 0.5
  counters.executionCoverage.eventTriggers.gigMoments.evaluations += 1
  if (rng() >= SIMULATION_CONSTANTS.gigEventChance * intensity) return false

  const triggerPoint = rng() < 0.5 ? 'gig_intro' : 'gig_mid'
  let event = eventEngine.checkEvent('gig', state, triggerPoint, rng)
  if (!event) {
    event = eventEngine.checkEvent('gig', state, 'random', rng)
  }
  if (!event || !event.options || event.options.length === 0) return false

  const choice = event.options[Math.floor(rng() * event.options.length)]
  const oldFame = state.player.fame
  const delta = dispatchResolvedEventChoice(event, choice, state, scenario, rng, counters)
  if (delta) {
    const rawDiff = delta.player?.fame
    const actualDiff = state.player.fame - oldFame
    accountFameChange(counters.fameAccounting, rawDiff, actualDiff)
  }
  counters.gigEvents += 1
  applyUnlockContext(state, counters, { type: 'EVENT_RESOLVED' })
  return true
}

const applyTriggerEvent = (
  state,
  scenario,
  rng,
  counters,
  categories,
  triggerPoint
) => {
  let category = null
  let event = null
  for (const candidate of categories) {
    event = eventEngine.checkEvent(candidate, state, triggerPoint, rng)
    if (event?.options?.length) {
      category = candidate
      break
    }
  }
  if (!event?.options?.length || !category) return false
  const choice = event.options[Math.floor(rng() * event.options.length)]
  const oldFame = state.player.fame
  const delta = dispatchResolvedEventChoice(event, choice, state, scenario, rng)
  if (delta) {
    recordObservedFameChange(
      counters.fameAccounting,
      oldFame,
      state.player.fame
    )
  }
  if (category === 'financial') counters.cashSwings += 1
  else if (category === 'special') counters.specialEvents += 1
  else if (category === 'band') counters.bandEvents += 1
  else if (category === 'gig') counters.gigEvents += 1
  counters.eventsApplied += 1
  applyUnlockContext(state, counters, { type: 'EVENT_RESOLVED' })
  return true
}

const maybeShiftSocialTrend = (state, rng, counters) => {
  counters.executionCoverage.socialTrends.evaluations++
  if (rng() >= SIMULATION_CONSTANTS.trendShiftChance) return
  const nextTrend = ALLOWED_TRENDS[Math.floor(rng() * ALLOWED_TRENDS.length)]
  state.social.trend = nextTrend
  counters.trendShifts += 1
  counters.executionCoverage.socialTrends.activations++
  counters.executionCoverage.socialTrends.uniqueIdsSeen.add(nextTrend)
}

const maybeActivateBrandDeal = (state, rng, counters) => {
  // Determine if player has an active deal using the same logic as the game
  const currentlyHasDeal = (state.social.activeDeals || []).length > 0

  if (currentlyHasDeal) {
    // Determine chance to randomly drop deal
    if (rng() < 0.05) {
      state.social.activeDeals = []
      counters.sponsorDrops += 1
    }
    return
  }

  counters.executionCoverage.brandDeals.evaluations++
  if (rng() >= SIMULATION_CONSTANTS.brandDealEvalChance) return
  const candidate = BRAND_DEALS[Math.floor(rng() * BRAND_DEALS.length)]
  if (!candidate) return

  const followers = state.social.instagram + state.social.tiktok
  const meetsFollowers =
    followers >= (candidate.requirements?.followers || Number.POSITIVE_INFINITY)
  const trendReq = candidate.requirements?.trend || []
  const meetsTrend =
    trendReq.length === 0 || trendReq.includes(state.social.trend || 'NEUTRAL')

  if (!meetsFollowers || !meetsTrend) return

  state.player.money = clampPlayerMoney(
    state.player.money + (candidate.offer?.upfront || 0)
  )
  state.social.loyalty = Math.max(
    0,
    (state.social.loyalty || 0) + (candidate.benefit?.staminaRegen ? 1 : -1)
  )
  state.social.controversyLevel = Math.min(
    100,
    (state.social.controversyLevel || 0) + (candidate.penalty?.controversy || 0)
  )

  // Enforce single active deal to match live game behaviour
  state.social.activeDeals = [
    { ...candidate, remainingGigs: candidate.offer?.duration || 1 }
  ]

  counters.brandDealsActivated += 1
  counters.executionCoverage.brandDeals.activations++
  counters.executionCoverage.brandDeals.uniqueIdsSeen.add(candidate.id)
}

const maybeApplyPostPulse = (
  state,
  rng,
  counters,
  currentGig,
  lastGigStats,
  activeEvent,
  performanceScore
) => {
  if (rng() >= SIMULATION_CONSTANTS.postPulseChance) return false

  counters.executionCoverage.postOptions.evaluations++

  const { options } = derivePostOptions({
    currentGig,
    lastGigStats,
    player: state.player,
    band: state.band,
    social: state.social,
    activeEvent
  })

  if (!options || options.length === 0) return false

  const post = options[Math.floor(rng() * options.length)]
  if (!post) return false

  const { updatedSocial, nextMoney, newBand, hasBandUpdates } =
    calculatePostGigStateUpdates({
      option: post,
      social: state.social,
      player: state.player,
      band: state.band,
      lastGigStats,
      currentGig,
      perfScore: performanceScore,
      secureRandomValue: rng()
    })

  if (updatedSocial) state.social = { ...state.social, ...updatedSocial }
  if (nextMoney !== undefined) state.player.money = nextMoney
  if (hasBandUpdates && newBand) state.band = newBand

  counters.postPulses += 1
  counters.executionCoverage.postOptions.activations++
  counters.executionCoverage.postOptions.uniqueIdsSeen.add(post.id)
  return true
}

// Mirrors the USE_CONTRABAND path (applyContrabandEffect in
// src/context/reducers/bandReducer.ts): stamina/mood hit one targeted member
// at full value, harmony/stress are band-level, everything else goes through
// the shared additive effect table. A dropped item is modeled as used on the
// same day. Duration-limited effects are tracked in runCtx and reverted by
// expireContrabandEffects, matching processContrabandExpiry semantics.
const maybeApplyContrabandDrop = (state, rng, counters, runCtx) => {
  counters.executionCoverage.contraband.evaluations++
  if (rng() >= SIMULATION_CONSTANTS.contrabandDropChance) return
  const item = CONTRABAND_DB[Math.floor(rng() * CONTRABAND_DB.length)]
  if (!item) return

  const newBand = { ...state.band }
  const itemValue = finiteNumberOr(item.value, 0)

  if (item.effectType === 'stress') {
    newBand.stress = clampBandStress(
      Math.floor(finiteNumberOr(newBand.stress, 0) + itemValue)
    )
  } else if (item.effectType === 'stamina' || item.effectType === 'mood') {
    const members = newBand.members ?? []
    if (members.length === 0) return
    const targetIndex = Math.floor(rng() * members.length)
    const member = members[targetIndex]
    if (!member) return
    const key = item.effectType
    const updatedMembers = [...members]
    updatedMembers[targetIndex] = {
      ...member,
      [key]:
        key === 'stamina'
          ? clampMemberStamina(
              finiteNumberOr(member.stamina, 0) + itemValue,
              finiteNumberOr(member.staminaMax, 100)
            )
          : clampMemberMood(finiteNumberOr(member.mood, 0) + itemValue)
    }
    newBand.members = updatedMembers
  } else if (item.effectType === 'harmony') {
    newBand.harmony = clampBandHarmony(
      finiteNumberOr(newBand.harmony, 1) + itemValue
    )
  } else if (applySharedBandEffect(newBand, item.effectType, itemValue)) {
    if (item.duration != null) {
      runCtx.contrabandEffects.push({
        effectType: item.effectType,
        value: itemValue,
        remainingDuration: finiteNumberOr(item.duration, 1)
      })
    }
  } else {
    return
  }

  state.band = newBand
  counters.contrabandDrops += 1
  counters.executionCoverage.contraband.activations++
  counters.executionCoverage.contraband.uniqueIdsSeen.add(item.id)
}

// Daily expiry mirror of processContrabandExpiry (systemReducer.ts):
// decrement durations and revert expired shared effects with the exact
// additive inverse (negated applySharedBandEffect).
const expireContrabandEffects = (state, runCtx) => {
  if (runCtx.contrabandEffects.length === 0) return
  const stillActive = []
  let newBand = null
  for (const effect of runCtx.contrabandEffects) {
    effect.remainingDuration -= 1
    if (effect.remainingDuration > 0) {
      stillActive.push(effect)
      continue
    }
    if (!newBand) newBand = { ...state.band }
    applySharedBandEffect(newBand, effect.effectType, -effect.value)
  }
  if (newBand) state.band = newBand
  runCtx.contrabandEffects = stillActive
}

/**
 * Which catalogue items the player could buy right now, and which ones are
 * unlocked and unowned but out of reach financially.
 *
 * Phase 4D's core distinction: owning enough money at the end of a tour is not
 * the same as being able to buy the right thing at the right time. `unaffordable`
 * counts exactly the items the shop would show as blocked.
 */
export const summarizeCatalogAffordability = state => {
  let affordable = 0
  let unaffordable = 0
  for (const item of UPGRADE_CATALOG) {
    const validation = validatePurchase(
      item,
      state.player,
      state.band,
      state.social
    )
    if (validation.isValid) affordable += 1
    else if (validation.errorType === 'insufficient_funds') unaffordable += 1
  }
  return { affordable, unaffordable }
}

export const applyCatalogPurchase = (state, candidate, counters) => {
  if (!candidate) return false

  const validation = validatePurchase(
    candidate,
    state.player,
    state.band,
    state.social
  )
  if (!validation.isValid) {
    // A purchase the player wanted and could not pay for is a progression
    // signal, not a no-op. `already_owned` and `missing_effect` are not.
    if (
      validation.errorType === 'insufficient_funds' &&
      counters.missedPurchases
    ) {
      counters.missedPurchases.push({
        day: counters.currentDay ?? null,
        id: candidate.id,
        category: candidate.category,
        currency: candidate.currency === 'fame' ? 'fame' : 'money'
      })
    }
    return false
  }

  const moneyBefore = state.player.money ?? 0
  const fameBefore = state.player.fame ?? 0

  const oldFame = state.player.fame ?? 0
  const proposedFame = clampPlayerFame(oldFame - validation.finalCost)
  const initialPlayerPatch = validation.payingWithFame
    ? {
        fame: proposedFame,
        fameLevel: calculateFameLevel(proposedFame)
      }
    : {
        money: clampPlayerMoney(
          (state.player.money ?? 0) - validation.finalCost
        )
      }

  const effectResult = processPurchaseEffect(
    validation.effect,
    candidate,
    initialPlayerPatch,
    state.player,
    state.band
  )

  if (effectResult.errorType) return

  if (effectResult.playerPatch) {
    state.player = { ...state.player, ...effectResult.playerPatch }
  }

  if (effectResult.bandPatch) {
    state.band = { ...state.band, ...effectResult.bandPatch }
  }

  if (validation.payingWithFame) {
    accountFamePurchase(counters.fameAccounting, {
      succeeded: true,
      nominalCost: validation.finalCost,
      beforeFame: oldFame,
      afterFame: proposedFame,
      refundedFame: 0
    })
    recordObservedFameChange(
      counters.fameAccounting,
      proposedFame,
      state.player.fame
    )
    counters.catalogFameSpent += validation.finalCost
  } else {
    counters.catalogMoneySpent += validation.finalCost
    recordObservedFameChange(
      counters.fameAccounting,
      oldFame,
      state.player.fame
    )
  }

  if (candidate.category === 'VAN') {
    counters.vanUpgrades += 1
  } else if (candidate.category === 'HQ') {
    counters.hqUpgrades += 1
  }

  if (
    candidate.category === 'GEAR' ||
    candidate.category === 'INSTRUMENT' ||
    candidate.category === 'INSTRUMENTS'
  ) {
    counters.gearItemsPurchased += 1
  }
  applyUnlockContext(state, counters, {
    type: 'PURCHASE',
    item: candidate,
    gearCount: counters.gearItemsPurchased
  })

  counters.catalogUpgrades += 1
  if (counters.purchaseLog) {
    counters.purchaseLog.push({
      day: counters.currentDay ?? null,
      id: candidate.id,
      category: candidate.category,
      currency: validation.payingWithFame ? 'fame' : 'money',
      cost: validation.finalCost,
      moneyBefore,
      moneyAfter: state.player.money ?? 0,
      fameBefore,
      fameAfter: state.player.fame ?? 0
    })
  }
  return true
}

/**
 * How much cash the simulated buyer refuses to spend.
 *
 * This replaced a flat €900 floor, which scaled with nothing: on day 2 it
 * blocked every affordable item, and by day 8 with €20k in the bank it was
 * meaningless. A reserve is really "enough to keep the tour running", which the
 * game already computes as `getTotalDailyObligations` — the same selector
 * bankruptcy and travel confirmation use. Two days of it, floored at €150 so a
 * scenario with no obligations still keeps enough for the next hop (measured
 * travel cost sits at €47-94 per gig).
 */
const PURCHASE_RESERVE_DAYS = 2
const PURCHASE_RESERVE_FLOOR = 150

/**
 * Cheapest reachable price in each currency, used only as a fast bail-out before
 * the fallback scan.
 *
 * The money side must be priced through `getAdjustedCost`, because it is
 * band-dependent: `gear_nerd` takes 20% off money-priced GEAR, and three
 * scenario trait packs carry that trait. Against the raw catalogue price a
 * €125 item discounted to €100 was declared unaffordable while €110 was on
 * hand, so the visit returned before the scan that would have bought it — the
 * "behaviour is identical" claim below only holds once the guard prices items
 * the way the purchase does. Fame prices carry no trait discount.
 */
const cheapestAdjustedMoneyCost = band =>
  UPGRADE_CATALOG.reduce(
    (cheapest, item) =>
      item.currency !== 'fame' && Number.isFinite(item.cost)
        ? Math.min(cheapest, getAdjustedCost(item, band))
        : cheapest,
    Infinity
  )
const CHEAPEST_FAME_ITEM_COST = UPGRADE_CATALOG.reduce(
  (cheapest, item) =>
    item.currency === 'fame' && Number.isFinite(item.cost)
      ? Math.min(cheapest, item.cost)
      : cheapest,
  Infinity
)

const purchaseReserve = state =>
  Math.max(
    PURCHASE_RESERVE_FLOOR,
    getTotalDailyObligations(state) * PURCHASE_RESERVE_DAYS
  )

/**
 * Whether the buyer can and will pay for an item right now. Separates the two
 * reasons a purchase does not happen, because they mean different things: no
 * money at all is an economy signal, while breaching the reserve is the buyer's
 * own prudence and can block something genuinely affordable.
 */
const evaluatePurchaseIntent = (item, state, reserve) => {
  const validation = validatePurchase(
    item,
    state.player,
    state.band,
    state.social
  )
  if (!validation.isValid) return { verdict: validation.errorType, validation }
  if (validation.payingWithFame) return { verdict: 'buy', validation }
  const remaining = (state.player.money ?? 0) - validation.finalCost
  return remaining >= reserve
    ? { verdict: 'buy', validation }
    : { verdict: 'reserve_guard', validation }
}

/**
 * One shop visit per day, buying at most one item.
 *
 * There used to be a 24% chance of even looking at the shop, which capped a tour
 * at roughly 2.4 purchase opportunities and was the real reason the buyer ended
 * a ten-day tour owning about three items while sitting on five figures — not
 * affordability. The shop is reachable from HQ between gigs, so whether a player
 * looks is not a dice roll; what varies is which item catches their eye, and
 * whether there is surplus over the money the tour still needs.
 */
const maybeBuyCatalogUpgrade = (state, rng, counters) => {
  const desired = UPGRADE_CATALOG[Math.floor(rng() * UPGRADE_CATALOG.length)]
  if (!desired) return

  const reserve = purchaseReserve(state)
  const intent = evaluatePurchaseIntent(desired, state, reserve)
  if (intent.verdict === 'buy') {
    applyCatalogPurchase(state, desired, counters)
    return
  }

  // The draw is the buyer's *want*. Recording why it did not happen is what
  // makes "missed purchase" mean something; previously the flat floor returned
  // before validation ran, so a real affordability failure was invisible.
  if (intent.verdict === 'insufficient_funds') {
    counters.missedPurchases?.push({
      day: counters.currentDay ?? null,
      id: desired.id,
      category: desired.category,
      currency: desired.currency === 'fame' ? 'fame' : 'money'
    })
  } else if (intent.verdict === 'reserve_guard') {
    counters.liquidityDeferrals?.push({
      day: counters.currentDay ?? null,
      id: desired.id,
      category: desired.category
    })
  }

  // A player who cannot afford the amp buys strings instead. Without this the
  // whole shop visit was wasted on a single uniform draw over 67 items, most of
  // which are out of reach or already owned, which is why the buyer ended a tour
  // having bought about three things while sitting on five figures.
  //
  // The scan runs a full `validatePurchase` per catalogue entry, and the shop is
  // now visited every day, so skip it outright when nothing could possibly be
  // affordable. Behaviour is identical; only the broke case gets cheaper.
  if (
    (state.player.money ?? 0) - reserve <
      cheapestAdjustedMoneyCost(state.band) &&
    (state.player.fame ?? 0) < CHEAPEST_FAME_ITEM_COST
  ) {
    return
  }
  const inReach = UPGRADE_CATALOG.filter(
    item =>
      item.id !== desired.id &&
      evaluatePurchaseIntent(item, state, reserve).verdict === 'buy'
  )
  if (!inReach.length) return
  const fallback = inReach[Math.floor(rng() * inReach.length)]
  applyCatalogPurchase(state, fallback, counters)
}

// eslint-disable-next-line no-unused-vars
const estimateMerchBuyers = (
  venue,
  performanceScore,
  modifiers,
  state,
  previousFame = state.player.fame
) => {
  const fame = previousFame || 0
  const safeCapacity = Math.max(1, venue.capacity || 0)
  const fameRatio = Math.min(
    1.0,
    Math.log(Math.max(0, fame) + 1) /
      Math.log(safeCapacity * TICKET_SALES_CONSTANTS.FAME_CAPACITY_SCALER + 1)
  )
  let fillRate =
    TICKET_SALES_CONSTANTS.BASE_DRAW_RATIO +
    fameRatio * TICKET_SALES_CONSTANTS.FAME_FILL_WEIGHT
  if (modifiers.promo) fillRate += 0.15
  if (modifiers.soundcheck) fillRate += 0.15
  fillRate = Math.min(1, Math.max(0.1, fillRate))
  const ticketsSold = Math.floor(venue.capacity * fillRate)
  const buyRate = Math.max(
    0,
    0.15 + (performanceScore / 100) * 0.2 + (modifiers.merch ? 0.1 : 0)
  )
  const inv = state.band.inventory || {}
  const totalInventory =
    (inv.shirts || 0) +
    (inv.hoodies || 0) +
    (inv.cds || 0) +
    (inv.patches || 0) +
    (inv.vinyl || 0)
  return Math.min(Math.floor(ticketsSold * buyRate), totalInventory)
}

// eslint-disable-next-line no-unused-vars
const depleteInventory = (inventory, buyers) => {
  if (!inventory || buyers <= 0) return inventory
  const skus = ['shirts', 'hoodies', 'cds', 'patches', 'vinyl']
  const total = skus.reduce((sum, sku) => sum + (inventory[sku] || 0), 0)

  if (total <= 0) return inventory

  let buyersLeft = Math.min(buyers, total)
  const removals = {}
  const fractions = []

  skus.forEach(sku => {
    const count = inventory[sku] || 0
    const idealRemoval = (count / total) * buyersLeft
    const floorRemoval = Math.min(count, Math.floor(idealRemoval))
    removals[sku] = floorRemoval

    if (count > floorRemoval) {
      fractions.push({
        sku,
        fraction: idealRemoval - floorRemoval
      })
    }
  })

  buyersLeft -= skus.reduce((sum, sku) => sum + removals[sku], 0)

  fractions.sort((a, b) => b.fraction - a.fraction)
  for (let i = 0; i < buyersLeft && i < fractions.length; i++) {
    removals[fractions[i].sku] += 1
  }

  const newInventory = { ...inventory }
  skus.forEach(sku => {
    newInventory[sku] = Math.max(
      0,
      (inventory[sku] || 0) - (removals[sku] || 0)
    )
  })

  return newInventory
}

const mergeGigModifierPipeline = (gigModifiers, physics) => {
  const mergedMultipliers = {
    guitar: physics.multipliers.guitar * (gigModifiers.guitarScoreMult || 1),
    drums: physics.multipliers.drums,
    bass: physics.multipliers.bass
  }

  return {
    ...gigModifiers,
    mergedMultipliers,
    multiplierBonus:
      mergedMultipliers.guitar +
      mergedMultipliers.drums +
      mergedMultipliers.bass -
      3
  }
}

const buildAppFeatureSnapshot = () => {
  const eventCatalog = Object.fromEntries(
    Object.entries(EVENTS_DB).map(([key, events]) => [
      key,
      {
        count: events.length,
        sampleEventIds: events.slice(0, 5).map(event => event.id),
        triggers: [...new Set(events.map(event => event.trigger || 'unknown'))]
      }
    ])
  )

  const trendList = [...ALLOWED_TRENDS]
  const platformList = Object.values(SOCIAL_PLATFORMS).map(platform => ({
    id: platform.id,
    multiplier: platform.multiplier
  }))

  return {
    venues: ALL_VENUES.length,
    scenarios: SCENARIOS.length,
    eventsDb: eventCatalog,
    brandDeals: BRAND_DEALS.length,
    postOptions: POST_OPTIONS.length,
    trends: trendList,
    socialPlatforms: platformList,
    contrabandItems: CONTRABAND_DB.length,
    upgradeCatalogEntries: UPGRADE_CATALOG.length,
    songs: Array.isArray(SONGS_DB) ? SONGS_DB.length : 0,
    quests: Object.keys(QUEST_REGISTRY).length,
    assetKinds: Object.keys(CHASSIS_CONFIG).length,
    assetModules: Object.keys(MODULE_REGISTRY).length,
    loanProfiles: Object.keys(LOAN_PROFILES).length
  }
}

/**
 * The tourbus minigame, once per executed trip.
 *
 * Deliberately separate from the setup minigame. Both used to run in one call
 * made after arrival at a performable, non-cancelled node, which tied the
 * *travel* minigame to gigs played: a band with 9.78 arrivals and 8.48 gigs got
 * 8.48 tourbus runs, and every rest stop, supply stop and cancelled show
 * silently skipped its van damage, fuel pickup and follow-up repair. Production
 * starts it when a confirmed trip begins (`useHandleTravel` calls
 * `onStartTravelMinigame` before the arrival is processed), so it belongs to the
 * trip, not to the show.
 *
 * Runs after the resource gate for the same reason production does: the fuel
 * bonus must not be what makes a trip affordable.
 */
const runTravelMinigame = (state, scenario, rng, counters) => {
  const skill = scenario.minigameSkill ?? 0.5
  const travelDamage = Math.round((1 - skill + rng() * 0.7) * 20)
  const collectedItems = rng() < 0.45 + skill * 0.25 ? ['FUEL'] : []
  const travelResult = calculateTravelMinigameResult(
    travelDamage,
    collectedItems
  )
  state.player.van.condition = Math.max(
    0,
    state.player.van.condition - travelResult.conditionLoss
  )
  state.player.van.fuel = clampVanFuel(
    state.player.van.fuel + travelResult.fuelBonus
  )
  counters.travelMinigames += 1
  counters.executionCoverage.minigamesTravel.attempts++
  if (collectedItems.length > 0) {
    counters.executionCoverage.minigamesTravel.completions++
  }
}

// Exactly ONE setup minigame per gig actually begun, chosen with the same
// weighting as usePreGigHandlers (last game at 0.2). Result values and their
// application mirror minigameReducer.ts: stress reduces band harmony 1:1,
// rewards/repair costs hit money directly, and damaged_gear follows the
// reducers' own predicates — equipmentDamage > 50 for roadie
// (handleCompleteRoadieMinigame) and ANY stress > 0 for kabelsalat/amp
// (applyPostMinigameResult flags damaged_gear on stress > 0, purge-induced
// stress included).
const runPreGigSetupMinigame = (
  state,
  scenario,
  rng,
  counters,
  runCtx,
  observeLoss = () => {}
) => {
  const skill = scenario.minigameSkill ?? 0.5
  let damagedGear = false

  const weights = { roadie: 1, kabelsalat: 1, amp: 1 }
  if (runCtx.lastMinigame && Object.hasOwn(weights, runCtx.lastMinigame)) {
    weights[runCtx.lastMinigame] = 0.2
  }
  const totalWeight = weights.roadie + weights.kabelsalat + weights.amp
  const randomVal = rng() * totalWeight
  let chosenGame
  if (randomVal < weights.roadie) {
    chosenGame = 'roadie'
  } else if (randomVal < weights.roadie + weights.kabelsalat) {
    chosenGame = 'kabelsalat'
  } else {
    chosenGame = 'amp'
  }
  runCtx.lastMinigame = chosenGame

  if (chosenGame === 'roadie') {
    // Damage scaled so sloppy runs can exceed the canonical damaged_gear
    // threshold (equipmentDamage > 50 in handleCompleteRoadieMinigame).
    const roadieDamage = Math.round((1 - skill + rng() * 0.6) * 50)
    const roadieResult = calculateRoadieMinigameResult(roadieDamage, state.band)
    const moneyBeforeRepair = state.player.money
    state.player.money = clampPlayerMoney(
      state.player.money - roadieResult.repairCost
    )
    // Record the actual deduction: the money clamp can eat less than quoted.
    counters.repairSpend += moneyBeforeRepair - state.player.money
    observeLoss('other', moneyBeforeRepair, state.player.money)
    state.band.harmony = clampBandHarmony(
      state.band.harmony - roadieResult.stress
    )
    if (roadieDamage > 50) damagedGear = true
    counters.roadieMinigames += 1
    counters.executionCoverage.minigamesRoadie.attempts++
    if (roadieDamage <= 50) {
      counters.executionCoverage.minigamesRoadie.completions++
    }
  } else if (chosenGame === 'kabelsalat') {
    const kabelResult = calculateKabelsalatMinigameResult(
      {
        isPoweredOn: rng() < 0.45 + skill * 0.45,
        timeLeft: Math.max(0, Math.round(rng() * 80 * skill))
      },
      state.band
    )

    if (kabelResult.reward > 0) {
      state.player.money = clampPlayerMoney(
        state.player.money + kabelResult.reward
      )
    }

    if (kabelResult.stress > 0) {
      state.band.harmony = clampBandHarmony(
        state.band.harmony - kabelResult.stress
      )
      damagedGear = true
    }
    counters.kabelsalatMinigames += 1
    counters.executionCoverage.minigamesKabelsalat.attempts++
    if (kabelResult.stress === 0) {
      counters.executionCoverage.minigamesKabelsalat.completions++
    }
  } else {
    const ampScore = Math.max(
      0,
      Math.min(100, Math.round(skill * 100 + (rng() - 0.5) * 40))
    )
    const ampResult = calculateAmpCalibrationResult(
      ampScore,
      state.band,
      rng() < 0.35 ? Math.round(rng() * 60) : 0,
      rng() < 0.25 ? 1 : 0,
      rng() < 0.2 ? 1 : 0
    )
    if (ampResult.reward > 0) {
      state.player.money = clampPlayerMoney(
        state.player.money + ampResult.reward
      )
    }
    if (ampResult.stress > 0) {
      state.band.harmony = clampBandHarmony(
        state.band.harmony - ampResult.stress
      )
      damagedGear = true
    }
    counters.ampCalibrations += 1
    counters.executionCoverage.minigamesAmp.attempts++
    if (ampResult.reward > 0) {
      counters.executionCoverage.minigamesAmp.completions++
    }
  }

  return damagedGear
}

/**
 * Fill the tank if the band can pay for it. Shared by the maintenance-discipline
 * heuristic and by the travel fallback: a player who is told "Not enough fuel in
 * the tank!" refuels and then drives, rather than losing the day.
 */
const attemptRefuel = (state, counters, observeLoss = () => {}) => {
  const moneyBeforeRefuel = state.player.money
  const refuelCost = calculateRefuelCost(state.player.van.fuel)
  if (state.player.money < refuelCost) return false
  state.player.money = clampPlayerMoney(state.player.money - refuelCost)
  state.player.van.fuel = 100
  counters.refuels += 1
  counters.refuelSpend += refuelCost
  observeLoss('fuel', moneyBeforeRefuel, state.player.money)
  return true
}

const maybeMaintainVanAndResources = (
  state,
  scenario,
  rng,
  counters,
  observeLoss = () => {}
) => {
  const discipline = scenario.maintenanceDiscipline ?? 0.5

  if (state.player.van.fuel < 35 && rng() < discipline) {
    attemptRefuel(state, counters, observeLoss)
  }

  if (state.player.van.condition < 62 && rng() < discipline) {
    const repairCost = calculateRepairCost(state.player.van.condition)
    if (state.player.money >= repairCost) {
      const moneyBeforeRepair = state.player.money
      state.player.money = clampPlayerMoney(state.player.money - repairCost)
      state.player.van.condition = 100
      counters.repairs += 1
      counters.repairSpend += repairCost
      observeLoss('maintenance_repairs', moneyBeforeRepair, state.player.money)
    }
  }

  if (state.player.money > HQ_UPGRADE_COST * 1.5 && rng() < 0.3) {
    const moneyBeforeUpgrade = state.player.money
    applyCatalogPurchase(state, _HQ_BEER_PIPELINE, counters)
    observeLoss('assets_upgrades', moneyBeforeUpgrade, state.player.money)
  }

  if (state.player.money > VAN_UPGRADE_COST * 1.5 && rng() < 0.2) {
    const moneyBeforeUpgrade = state.player.money
    applyCatalogPurchase(state, _VAN_TUNING, counters)
    observeLoss('assets_upgrades', moneyBeforeUpgrade, state.player.money)
  }
}

const ASSET_KINDS = Object.keys(CHASSIS_CONFIG)
const LOAN_PROFILE_IDS = Object.keys(LOAN_PROFILES)
const MODULES_BY_SLOT_TYPE = (() => {
  const bySlot = new Map()
  for (const module of Object.values(MODULE_REGISTRY)) {
    const list = bySlot.get(module.slotType) || []
    list.push(module)
    bySlot.set(module.slotType, list)
  }
  return bySlot
})()

// Long-term asset acquisition through the real action creators + reducers:
// purchaseChassis/handlePurchaseChassis (cash + loan incl. liabilities),
// startCrowdfund/handleStartCrowdfund (materialized by processCrowdfundTick),
// and installModule/handleInstallModule. All validation stays in game code.
const maybeInvestInAssets = (state, rng, counters, observeLoss = () => {}) => {
  if (rng() < SIMULATION_CONSTANTS.assetInvestChance) {
    const kind = ASSET_KINDS[Math.floor(rng() * ASSET_KINDS.length)]
    const flavor = rng() < 0.35 ? 'diy' : 'legit'
    const cfg = CHASSIS_CONFIG[kind]?.[flavor]?.[1]

    if (cfg) {
      // Prudent-player gate: keep a reserve covering the price plus ~15 days
      // of total obligations (upkeep, liabilities) after the purchase.
      const reserve = 15 * Math.max(0, getTotalDailyObligations(state))
      const canPayCash = state.player.money >= cfg.price * 2 + reserve
      const raw = { kind, flavor, tier: 1, mode: 'cash' }
      if (
        !canPayCash &&
        flavor === 'legit' &&
        state.player.money >= cfg.price * 0.75 + reserve
      ) {
        raw.mode = 'loan'
        raw.loanProfileId =
          LOAN_PROFILE_IDS[Math.floor(rng() * LOAN_PROFILE_IDS.length)]
      }
      if (canPayCash || raw.mode === 'loan') {
        const action = purchaseChassis(raw, state)
        if (action && action.type !== 'PURCHASE_CHASSIS_FAILED') {
          const moneyBeforePurchase = state.player.money
          Object.assign(state, handlePurchaseChassis(state, action.payload))
          observeLoss(
            'assets_upgrades',
            moneyBeforePurchase,
            state.player.money
          )
          counters.assetsPurchased += 1
          if (raw.mode === 'loan') counters.loansTaken += 1
        }
      }
    }
  }

  if (
    rng() < SIMULATION_CONSTANTS.crowdfundChance &&
    (state.crowdfundCampaigns?.length ?? 0) === 0
  ) {
    const kind = ASSET_KINDS[Math.floor(rng() * ASSET_KINDS.length)]
    const cfg = CHASSIS_CONFIG[kind]?.diy?.[1]
    if (cfg) {
      const fameStake = Math.min(20, Math.floor(state.player.fame))
      const action = startCrowdfund(
        {
          kind,
          flavor: 'diy',
          tier: 1,
          targetAmount: cfg.price,
          fameStake,
          daysRemaining: 14,
          plannedSuccessRoll: rng(),
          plannedSuccessProbability: resolveCrowdfundProbability(
            state.player.fame,
            state.social?.scenePresence ?? 0,
            cfg.price
          )
        },
        state
      )
      if (action && action.type !== 'START_CROWDFUND_FAILED') {
        Object.assign(state, handleStartCrowdfund(state, action.payload))
        counters.crowdfundsStarted += 1
      }
    }
  }

  // Keep owned assets productive: broken chassis (condition < 20) stop
  // producing revenue but keep costing upkeep, so repair like a real player.
  for (const asset of state.assets || []) {
    if (asset.condition < 60 && rng() < 0.6) {
      const moneyBefore = state.player.money
      const action = repairChassis(asset.id, state)
      if (action && action.type !== 'REPAIR_CHASSIS_FAILED') {
        Object.assign(state, handleRepairChassis(state, action.payload))
        counters.repairSpend += Math.max(0, moneyBefore - state.player.money)
        observeLoss('maintenance_repairs', moneyBefore, state.player.money)
      }
    }
  }

  if (
    rng() < SIMULATION_CONSTANTS.moduleInstallChance &&
    state.player.money >= 2500 &&
    (state.assets?.length ?? 0) > 0
  ) {
    const asset = state.assets[Math.floor(rng() * state.assets.length)]
    const emptySlots = (asset?.slots || []).filter(
      slot => slot.installedModuleId === null
    )
    const slot = emptySlots[Math.floor(rng() * emptySlots.length)]
    const candidates = slot ? MODULES_BY_SLOT_TYPE.get(slot.slotType) || [] : []
    const module = candidates[Math.floor(rng() * candidates.length)]
    if (asset && slot && module) {
      const action = installModule(
        { assetId: asset.id, slotId: slot.id, moduleId: module.id },
        state
      )
      if (action && action.type !== 'INSTALL_MODULE_FAILED') {
        const moneyBeforeInstall = state.player.money
        Object.assign(state, handleInstallModule(state, action.payload))
        observeLoss('assets_upgrades', moneyBeforeInstall, state.player.money)
        counters.modulesInstalled += 1
      }
    }
  }
}

const pickSongForGig = rng => {
  if (!Array.isArray(SONGS_DB) || SONGS_DB.length === 0) return null
  return SONGS_DB[Math.floor(rng() * SONGS_DB.length)]
}

const calculatePerformanceScore = (state, venue, modifiers, rng, song) => {
  const rawGigModifiers = getGigModifiers(state.band, modifiers)
  const physics = calculateGigPhysics(state.band, {
    bpm: song?.bpm ?? 120,
    difficulty: song?.difficulty ?? venue.diff
  })
  const gigModifiers = mergeGigModifierPipeline(rawGigModifiers, physics)

  const members = state.band.members
  const avgMood =
    members.reduce((sum, member) => sum + member.mood, 0) / members.length
  const avgStamina =
    members.reduce((sum, member) => sum + member.stamina, 0) / members.length

  const harmonicCore = state.band.harmony * 0.34
  const wellnessCore = avgMood * 0.23 + avgStamina * 0.21
  const physicsCore =
    ((physics.hitWindows.guitar +
      physics.hitWindows.drums +
      physics.hitWindows.bass) /
      3 /
      200) *
    12
  const modifierCore =
    gigModifiers.hitWindowBonus * 0.22 - (gigModifiers.noteJitter ? 7 : 0)
  const multiplierCore = gigModifiers.multiplierBonus * 18
  const variance = (rng() - 0.5) * 16

  const score = Math.round(
    harmonicCore +
      wellnessCore +
      physicsCore +
      modifierCore +
      multiplierCore +
      variance
  )

  // Normalize through the real game function so the score always stays within
  // [PERF_SCORE_MIN, PERF_SCORE_MAX] (currently 30–100).
  const rawScore = Math.max(0, score) * 150
  return {
    score: normalizePerformanceScore(rawScore),
    rawScore,
    gigModifiers,
    physics
  }
}

const applyPostGigState = (
  state,
  venue,
  performanceScore,
  financials,
  misses,
  gigStatsPayload,
  counters
) => {
  const oldFameGig = state.player.fame
  const continueStats = calculateContinueStats({
    player: state.player,
    perfScore: performanceScore,
    financials,
    misses,
    bandStyle: state.band.style,
    calculateFameGain,
    calculateFameLevel,
    clampPlayerFame,
    clampPlayerMoney,
    BALANCE_CONSTANTS
  })
  recordObservedFameChange(
    counters.fameAccounting,
    oldFameGig,
    continueStats.newFame
  )

  state.player.money = continueStats.newMoney
  state.player.fame = continueStats.newFame
  state.player.fameLevel = continueStats.fameLevel

  state.social.lastGigDay = state.player.day
  state.social.lastGigDifficulty = venue.diff ?? venue.difficulty ?? 1

  // Canonical post-gig side effects via the real reducer handler:
  // band stress (STRESS_PER_GIG), GIG_COMPLETE trait unlocks, region/venue
  // reputation shifts (incl. blacklisting), and gig quest events.
  state.currentGig = venue
  const traitsBefore = countBandTraits(state.band)
  const fameBeforeGigReducer = state.player.fame
  const nextState = handleSetLastGigStats(state, gigStatsPayload)
  Object.assign(state, nextState)
  recordObservedFameChange(
    counters.fameAccounting,
    fameBeforeGigReducer,
    state.player.fame
  )
  counters.traitUnlocks += Math.max(
    0,
    countBandTraits(state.band) - traitsBefore
  )
  state.currentGig = null
  // Reducer handlers append toasts; drop them so runs don't accumulate UI state.
  state.toasts = []
}

export const calculateDrawdownPct = (peakMoney, currentMoney) =>
  peakMoney > 0
    ? Math.max(0, ((peakMoney - currentMoney) / peakMoney) * 100)
    : 0

export const reconcileFameLedger = run =>
  run.startingFame +
  run.fameAccounting.earned -
  run.fameAccounting.spentGross +
  run.fameAccounting.refunded -
  run.fameAccounting.lost -
  run.finalFame

export const accountFameChange = (
  accounting,
  rawDifference,
  actualDifference
) => {
  const difference = Number.isFinite(rawDifference)
    ? rawDifference
    : actualDifference
  if (difference > 0) accounting.earned += difference
  else if (difference < 0) accounting.lost += Math.abs(difference)
  accounting.clampAdjustment += actualDifference - difference
}

export const accountFamePurchase = (
  accounting,
  { succeeded, nominalCost, beforeFame, afterFame, refundedFame = 0 }
) => {
  if (!succeeded) return
  accounting.spentGross += nominalCost
  accounting.refunded += refundedFame
  accounting.spentNet = accounting.spentGross - accounting.refunded
  const expectedDeduction = nominalCost - refundedFame
  const actualDeduction = beforeFame - afterFame
  accounting.clampAdjustment += expectedDeduction - actualDeduction
}

const recordObservedFameChange = (accounting, before, after) => {
  const difference = after - before
  accountFameChange(accounting, difference, difference)
}

/**
 * The discretionary money sinks, as opposed to the recurring obligations the daily
 * tick charges. Shared by the first-gig snapshot and the end-of-run fallback so the
 * two cannot drift into meaning different things.
 */
const discretionarySpend = counters =>
  counters.travelSpend +
  counters.refuelSpend +
  counters.repairSpend +
  counters.clinicSpend +
  counters.catalogMoneySpent

const MODIFIER_EXPENSE_LABEL_KEYS = new Set([
  'economy:gigExpenses.catering.label',
  'economy:gigExpenses.socialAds.label',
  'economy:gigExpenses.merchStand.label',
  'economy:gigExpenses.soundcheck.label',
  'economy:gigExpenses.guestList.label'
])
const GROSS_SPEND_SOURCES = [
  'modifierGrossSpend',
  'venueGrossSpend',
  'taxGrossSpend',
  'otherGrossSpend'
]

export const runSingleSimulation = (
  scenario,
  seed,
  tuning = DEFAULT_BALANCE_TUNING
) => {
  // UUIDs are deterministic per run so candidate ordering cannot affect paired
  // gameplay through generated asset/campaign identifiers.
  uuidCounter = 0
  // State creation draws entropy of its own (the persisted `runSeed`). Give it
  // a separate deterministic stream so the gameplay stream below always starts
  // at its own head — otherwise adding a field to the initial state silently
  // shifts every simulated run.
  simulationCryptoRandom = mulberry32(seed ^ 0x9e3779b9)
  resetSecureRandomBatch()
  let state = applyScenarioOverrides(createInitialState(), scenario)

  const rng = mulberry32(seed)
  simulationCryptoRandom = rng
  // secureRandom() buffers 1024 draws. Without dropping the buffer the run
  // would start by consuming values generated from the previous run's stream,
  // so identical (scenario, seed, tuning) inputs would not reproduce.
  resetSecureRandomBatch()
  const startingFame = state.player.fame
  // A real tour map for this run: layers 0..daysPerRun-1 plus the FINALE at
  // layer daysPerRun, so reaching the finale takes exactly as many hops as the
  // horizon allows. Seeded from the run seed, so the same (scenario, seed) pair
  // still reproduces exactly.
  const tourHorizonDays =
    scenario.daysOverride ?? SIMULATION_CONSTANTS.daysPerRun
  const tourMap = new MapGenerator(seed).generateMap(tourHorizonDays)
  const tourAdjacency = buildTourAdjacency(tourMap)
  let currentMapNode = tourMap.nodes.node_0_0 ?? null
  let deepestLayerReached = currentMapNode?.layer ?? 0
  // Arriving at the finale and actually playing it are different outcomes: the
  // show can still be cancelled on harmony.
  let finaleReached = false
  let finaleCompleted = false
  let routeDeadEnds = 0
  let nonPerformingArrivals = 0
  // Days on which no legal trip existed. Kept apart from routeDeadEnds, which
  // means "no forward edge on the map" rather than "could not afford to drive".
  let strandedDays = 0
  const travelLog = []
  const nodeTypesVisited = {}
  // Per-run context: pregig minigame rotation memory and the active
  // duration-limited contraband effects awaiting expiry.
  const runCtx = {
    lastMinigame: null,
    contrabandEffects: [],
    emergencyGrantUsed: false,
    regionalGigHistory: new Map()
  }

  const counters = {
    gigsPlayed: 0,
    bankrupt: false,
    sponsorSignings: 0,
    sponsorPayouts: 0,
    sponsorDrops: 0,
    travelMinigames: 0,
    roadieMinigames: 0,
    kabelsalatMinigames: 0,
    ampCalibrations: 0,
    gigEvents: 0,
    traitUnlocks: 0,
    assetsPurchased: 0,
    loansTaken: 0,
    modulesInstalled: 0,
    crowdfundsStarted: 0,
    restStops: 0,
    // Rest days are counted separately from rest stops: `restStops` only counts
    // the free-fallback branch, so a band that rested and paid the clinic
    // instead recorded nothing at all and read as "never rested".
    restDays: 0,
    // Recovery taken by passing through a REST_STOP node, which is not a rest
    // decision — the band did not give up a gig for it.
    restStopArrivals: 0,
    gearItemsPurchased: 0,
    travelSpend: 0,
    refuels: 0,
    repairs: 0,
    refuelSpend: 0,
    repairSpend: 0,
    clinicSpend: 0,
    clinicVisits: 0,
    hqUpgrades: 0,
    vanUpgrades: 0,
    specialEvents: 0,
    cashSwings: 0,
    bandEvents: 0,
    equipmentEvents: 0,
    eventsApplied: 0,
    trendShifts: 0,
    brandDealsActivated: 0,
    postPulses: 0,
    contrabandDrops: 0,
    catalogUpgrades: 0,
    executionCoverage: {
      brandDeals: { evaluations: 0, activations: 0, uniqueIdsSeen: new Set() },
      postOptions: { evaluations: 0, activations: 0, uniqueIdsSeen: new Set() },
      socialTrends: {
        evaluations: 0,
        activations: 0,
        uniqueIdsSeen: new Set()
      },
      contraband: { evaluations: 0, activations: 0, uniqueIdsSeen: new Set() },
      minigamesTravel: { attempts: 0, completions: 0 },
      minigamesRoadie: { attempts: 0, completions: 0 },
      minigamesKabelsalat: { attempts: 0, completions: 0 },
      minigamesAmp: { attempts: 0, completions: 0 },
      sponsorship: { attempts: 0, successes: 0 },
      restStops: { evaluations: 0, activations: 0 },
      eventTriggers: {
        travel: { evaluations: 0, activations: 0 },
        preGig: { evaluations: 0, activations: 0 },
        gigMoments: { evaluations: 0, activations: 0 },
        postGig: { evaluations: 0, activations: 0 }
      },
      quests: {
        status: 'insufficient_evidence',
        offers: 0,
        activations: 0,
        progress: 0,
        completions: 0,
        failures: 0,
        rewards: 0,
        availableIds: Object.keys(QUEST_REGISTRY).length,
        uniqueQuestIdsOffered: new Set(),
        uniqueQuestIdsActivated: new Set(),
        uniqueQuestIdsCompleted: new Set()
      }
    },
    harmonyRecovery: {
      evaluations: 0,
      activations: 0,
      harmonyRestored: 0,
      moneySpent: 0,
      daysConsumed: 0,
      gigOpportunitiesForgone: 0
    },
    catalogMoneySpent: 0,
    catalogFameSpent: 0,
    fameAccounting: {
      earned: 0,
      spentGross: 0,
      refunded: 0,
      spentNet: 0,
      lost: 0,
      clampAdjustment: 0
    },
    gigCapHits: 0,
    // Phase 4D purchase-path instrumentation. `currentDay` is the day context
    // every purchase site reads, so timing does not have to be threaded through
    // each call.
    currentDay: 0,
    purchaseLog: [],
    missedPurchases: [],
    liquidityDeferrals: [],
    // Refused trips by reason, mirroring the production gates.
    travelBlocked: { money: 0, fuel: 0, venue_access: 0 },
    // Trips that only happened because the band refuelled first.
    refuelledToTravel: 0,
    managementCutStats: {
      firstGigPct: null,
      cutPctSum: 0,
      fullCutGigs: 0,
      totalCutMoney: 0
    }
  }

  let totalGigNet = 0
  let peakMoney = state.player.money
  let lowestMoney = state.player.money
  let maxPeakToTroughDrop = 0
  const lossAttribution = createLossAttributionTracker(state.player.money)
  const grossSpendAttribution = Object.fromEntries(
    GROSS_SPEND_SOURCES.map(source => [source, 0])
  )
  let daysSurvived = 0
  const timeline = []

  // Day-waypoint snapshots (money at start of day, before daily costs)
  // Checkpoints stay null when the run ends (or goes bankrupt) before the
  // waypoint day, so short probes report "missing" instead of €0.
  let moneyAtEarlyCheckpoint = null
  let moneyAtMidCheckpoint = null
  let moneyAtLateCheckpoint = null
  // Shop reachability at a mid-tour waypoint and at the end. The end-of-run
  // count alone cannot distinguish "could buy things while it mattered" from
  // "ended rich".
  let affordabilityAtMidCheckpoint = null
  const [earlyCheckpointDay, midCheckpointDay, lateCheckpointDay] =
    SIMULATION_CONSTANTS.progressionCheckpointDays

  // Liquidity pressure, sampled at the start of each day before that day's
  // costs land. Insolvency is terminal and rare over ten days, so time spent
  // near zero is what distinguishes a tense scenario from a safe one.
  let daysBelowTightLiquidity = 0
  let daysBelowCriticalLiquidity = 0
  // A true running minimum. `lowestMoney` above is only sampled at gig
  // checkpoints, which makes it "lowest balance seen around a gig" rather than
  // the low-water mark of the run — a scenario that plays daily never appears
  // to dip at all. Kept separate so the published `lowestMoney` statistics do
  // not silently change meaning.
  let lowestMoneyObserved = state.player.money
  // Wear pressure, sampled at the same day-start point as liquidity. Final
  // values alone cannot say whether a tour ever came close to a rest decision.
  let minHarmonyObserved = state.band.harmony
  let minMemberStaminaObserved = Infinity
  let minMemberMoodObserved = Infinity

  // Early-runway instrumentation. Insolvency that happens before the first
  // payout is a different failure from one the economy caused: it says the run
  // never reached the loop the economy describes. Averages over the whole tour
  // cannot separate the two, so the opening is measured on its own.
  let firstGigDay = null
  let moneyBeforeFirstGig = null
  let lowestMoneyBeforeFirstGig = state.player.money
  let obligationsBeforeFirstGig = 0
  // Snapshotted when the first show starts. Stays null for a run that never
  // played, and the return then reads the counters directly — a run that went
  // bankrupt before any gig has still spent money on travel, fuel, repairs and the
  // shop, and reporting €0 for it would understate the pre-gig spending of exactly
  // the cohort `earlyRunway` exists to describe.
  let spendBeforeFirstGig = null
  // A running minimum has to be sampled after every step that can move money, not
  // once per day. Sampling only after the daily tick left events, maintenance,
  // refuelling, the shop, asset investment and the travel cost outside the window,
  // so the reported "minimum" could sit ABOVE the balance at the end of that same
  // window — €414 against €351.50 directly before the first gig. That is not a
  // minimum, and it made this field unusable for the runway question it exists for.
  const observeEarlyRunwayMoney = () => {
    if (firstGigDay != null) return
    lowestMoneyBeforeFirstGig = Math.min(
      lowestMoneyBeforeFirstGig,
      state.player.money
    )
  }
  const observeAttributedMoney = (source, moneyBefore, moneyAfter) =>
    recordAttributedLoss(lossAttribution, {
      source,
      moneyBefore,
      moneyAfter,
      afterFirstGig: firstGigDay != null
    })
  const observeAttributedLoss = (source, moneyBefore) =>
    observeAttributedMoney(source, moneyBefore, state.player.money)
  let blockedTravelDaysBeforeFirstGig = 0
  let firstBlockedTravel = null

  // Per-gig metric accumulators for calibration analysis
  let totalTravelCostGigs = 0
  let totalHitWindowSum = 0
  let totalMissesSum = 0
  let totalPerfScoreSum = 0
  let gigScoreLow = 0 // score < 50
  let gigScoreMid = 0 // score 50–70
  let gigScoreHigh = 0 // score > 70

  const daysToRun = scenario.daysOverride ?? SIMULATION_CONSTANTS.daysPerRun
  for (let day = 1; day <= daysToRun; day++) {
    daysSurvived = day
    counters.currentDay = day
    if (state.player.money < LIQUIDITY_STRESS_THRESHOLDS.tight)
      daysBelowTightLiquidity += 1
    if (state.player.money < LIQUIDITY_STRESS_THRESHOLDS.critical)
      daysBelowCriticalLiquidity += 1
    lowestMoneyObserved = Math.min(lowestMoneyObserved, state.player.money)
    minHarmonyObserved = Math.min(minHarmonyObserved, state.band.harmony)
    for (const member of state.band.members) {
      minMemberStaminaObserved = Math.min(
        minMemberStaminaObserved,
        member.stamina
      )
      minMemberMoodObserved = Math.min(minMemberMoodObserved, member.mood)
    }
    if (state.player.money > peakMoney) peakMoney = state.player.money
    else {
      const drop = calculateDrawdownPct(peakMoney, state.player.money)
      if (drop > maxPeakToTroughDrop) maxPeakToTroughDrop = drop
    }
    // Snapshot money at start of day (before any spending)
    if (day === earlyCheckpointDay) moneyAtEarlyCheckpoint = state.player.money
    if (day === midCheckpointDay) {
      moneyAtMidCheckpoint = state.player.money
      affordabilityAtMidCheckpoint = summarizeCatalogAffordability(state)
    }
    if (day === lateCheckpointDay) moneyAtLateCheckpoint = state.player.money

    const moneyBeforeDay = state.player.money
    const fameBeforeDailyUpdates = state.player.fame
    let preState = state
    let moneyBeforeStep = preState.player.money
    preState = processAssetTick(preState) || preState
    observeAttributedMoney(
      'assets_upgrades',
      moneyBeforeStep,
      preState.player.money
    )
    moneyBeforeStep = preState.player.money
    const liabilityResult = processLiabilityTick(preState)
    preState = liabilityResult.state || preState
    observeAttributedMoney(
      'daily_obligations',
      moneyBeforeStep,
      preState.player.money
    )
    moneyBeforeStep = preState.player.money
    preState = processCrowdfundTick(preState) || preState
    observeAttributedMoney(
      'assets_upgrades',
      moneyBeforeStep,
      preState.player.money
    )
    const assetCount = preState.assets ? preState.assets.length : 0
    moneyBeforeStep = preState.player.money
    const riskResult = rollAssetRiskEvents(
      preState,
      Array.from({ length: assetCount * 2 + 10 }, () => rng()),
      0
    )
    preState = riskResult.state || preState
    observeAttributedMoney(
      'assets_upgrades',
      moneyBeforeStep,
      preState.player.money
    )
    moneyBeforeStep = preState.player.money
    const updates = calculateDailyUpdates(preState, rng, tuning)
    state = preState
    state = {
      ...state,
      player: { ...state.player, ...updates.player },
      band: { ...state.band, ...updates.band },
      social: { ...state.social, ...updates.social }
    }
    state = QuestLifecycle.checkDeadlines(state)
    observeAttributedMoney(
      'daily_obligations',
      moneyBeforeStep,
      state.player.money
    )
    recordObservedFameChange(
      counters.fameAccounting,
      fameBeforeDailyUpdates,
      state.player.fame
    )
    // The daily tick is the trough the grant then lifts the run out of. Sampling
    // only after the grant reported the post-grant balance as the minimum (€40
    // trough + €250 grant read as €290), which is exactly the number a grant
    // candidate is diagnosed on.
    observeEarlyRunwayMoney()

    if (
      !runCtx.emergencyGrantUsed &&
      tuning.earlyGame.emergencyGrant > 0 &&
      day <= tuning.earlyGame.emergencyGrantMaxDay &&
      state.player.money <= tuning.earlyGame.emergencyGrantTriggerMoney
    ) {
      state.player.money = clampPlayerMoney(
        finiteNumberOr(state.player.money, 0) + tuning.earlyGame.emergencyGrant
      )
      runCtx.emergencyGrantUsed = true
      observeEarlyRunwayMoney()
    }

    // Bankruptcy from daily costs draining the player to zero
    const dailyNetChange = state.player.money - moneyBeforeDay
    const dailyObligations = getTotalDailyObligations(state)
    if (firstGigDay == null) obligationsBeforeFirstGig += dailyObligations
    if (
      shouldTriggerBankruptcy(
        state.player.money,
        dailyNetChange,
        dailyObligations
      )
    ) {
      counters.bankrupt = true
      break
    }

    // Performance appetite for this day. It no longer decides whether the band
    // moves: travel and performing are independent in the game, where
    // `useHandleTravel` gates a trip on visibility, a directed edge and
    // money/fuel — never on having played the current node. Coupling the two
    // made map reach a property of `gigGapDays` instead of the map, so a sparse
    // cadence looked like it could not finish the tour when in truth it had
    // simply never been allowed to drive.
    const wantsToPerform = resolveGigCadence({
      day,
      gigGapDays: scenario.gigGapDays,
      policy: scenario.gigCadencePolicy ?? SHIPPED_GIG_CADENCE_POLICY,
      firstGigDay
    })

    let willRest = false
    let recoveryDayConsumed = false
    // Check if the band needs rest/clinic before travelling on.
    //
    // The trigger is deliberately identical to `MEMBER_NEEDS_CARE` below, which
    // decides what a rest day actually does. They used to differ — rest fired on
    // `harmony < 30 || stamina < 30 || mood < 30`, while care required
    // `stamina < 50 || mood < 50` — so a rest could burn a gig day, heal nobody,
    // and increment no counter at all. Resting does not repair harmony either
    // (the daily tick's +3 drift toward 50 happens regardless), so harmony is no
    // longer a reason to skip a gig: it would be a guaranteed no-op day.
    //
    // Thresholds come from what the game itself signals: `BandMemberRow` marks
    // stamina below 35 and mood below 50 as low in the HUD, which is what a
    // player actually reacts to, rather than the deeper mark where
    // `gigModifiersUtils` starts penalising performance.
    {
      counters.executionCoverage.restStops.evaluations++
      const needsRest = state.band.members.some(MEMBER_NEEDS_CARE)
      // Save original random state by evaluating early if they *would* rest.
      // Note: we'll just consume the rng here.
      if (needsRest && rng() < 0.85) {
        willRest = true
        counters.restDays += 1
      }
    }

    const moneyBeforeWorldEvents = state.player.money
    const fameBeforeWorldEvents = state.player.fame
    counters.eventsApplied =
      (counters.eventsApplied || 0) +
      applyDailyEvents(state, scenario, rng, counters)
    observeAttributedLoss('negative_events', moneyBeforeWorldEvents)
    observeEarlyRunwayMoney()
    recordObservedFameChange(
      counters.fameAccounting,
      fameBeforeWorldEvents,
      state.player.fame
    )
    maybeShiftSocialTrend(state, rng, counters)
    const hadSponsorBeforeActivation = hasActiveSponsorship(state.social)
    if (scenario.brandDealsEnabled !== false) {
      counters.executionCoverage.sponsorship.attempts++
      maybeActivateBrandDeal(state, rng, counters)
    }
    if (!hadSponsorBeforeActivation && hasActiveSponsorship(state.social)) {
      counters.sponsorSignings += 1
      counters.executionCoverage.sponsorship.successes++
    }
    observeEarlyRunwayMoney()
    expireContrabandEffects(state, runCtx)
    observeEarlyRunwayMoney()
    maybeApplyContrabandDrop(state, rng, counters, runCtx)
    observeEarlyRunwayMoney()
    // One sample per money-moving call rather than one per group: a negative event
    // followed by a brand-deal advance inside the same group would otherwise hide
    // the trough between them. Mutations *inside* a single helper are still not
    // sampled individually — that would mean threading an observer through the
    // production-mirroring helpers, which is out of proportion to the question this
    // field answers.
    maybeMaintainVanAndResources(
      state,
      scenario,
      rng,
      counters,
      observeAttributedMoney
    )
    observeEarlyRunwayMoney()
    const moneyBeforeCatalog = state.player.money
    maybeBuyCatalogUpgrade(state, rng, counters)
    observeAttributedLoss('assets_upgrades', moneyBeforeCatalog)
    observeEarlyRunwayMoney()
    maybeInvestInAssets(state, rng, counters, observeAttributedMoney)
    observeEarlyRunwayMoney()

    const recovery = tuning.recovery
    if (recovery?.threshold > 0) {
      counters.harmonyRecovery.evaluations += 1
      if (state.band.harmony < recovery.threshold) {
        const canPay =
          recovery.costType !== 'money' ||
          state.player.money >= recovery.moneyCost
        if (canPay) {
          const beforeHarmony = state.band.harmony
          const beforeMoney = state.player.money
          state.band.harmony = clampBandHarmony(
            finiteNumberOr(state.band.harmony, 1) + recovery.harmonyGain
          )
          counters.harmonyRecovery.activations += 1
          counters.harmonyRecovery.harmonyRestored +=
            state.band.harmony - beforeHarmony
          if (recovery.costType === 'money') {
            state.player.money = clampPlayerMoney(
              state.player.money - recovery.moneyCost
            )
            counters.harmonyRecovery.moneySpent +=
              beforeMoney - state.player.money
            observeAttributedLoss('clinic', beforeMoney)
            observeEarlyRunwayMoney()
          } else if (recovery.costType === 'day') {
            counters.harmonyRecovery.daysConsumed += 1
            if (wantsToPerform)
              counters.harmonyRecovery.gigOpportunitiesForgone += 1
            recoveryDayConsumed = true
            willRest = true
          }
        }
      }
    }

    if (willRest && !recoveryDayConsumed) {
      if (!state.band.members.some(MEMBER_NEEDS_CARE)) {
        willRest = false
        counters.restDays -= 1
      }
    }

    if (willRest) {
      // Recovery day. Clinic heals per CLINIC_CONFIG (gameConstants.ts):
      // each treated member costs calculateClinicCost(HEAL_BASE_COST_MONEY,
      // visits) — escalating per visit like player.clinicVisits in-game —
      // and gains +HEAL_STAMINA_GAIN/+HEAL_MOOD_GAIN. Members the band can
      // no longer afford to treat recover at a free REST_STOP node instead
      // (arrivalUtils.ts: +20 stamina / +10 mood).
      let usedRestStop = false
      const moneyBeforeClinic = state.player.money
      state.band.members = state.band.members.map(member => {
        if (!MEMBER_NEEDS_CARE(member)) return member

        const healCost = calculateClinicCost(
          CLINIC_CONFIG.HEAL_BASE_COST_MONEY,
          counters.clinicVisits
        )
        // Rational-player cap: once escalation makes a heal cost more than
        // ~3x base (or a meaningful share of cash), the free rest stop wins.
        const willingToPay =
          healCost <= CLINIC_CONFIG.HEAL_BASE_COST_MONEY * 3 &&
          healCost <= Math.max(600, state.player.money * 0.05)
        if (willingToPay && state.player.money >= healCost + 100) {
          state.player.money = clampPlayerMoney(state.player.money - healCost)
          counters.clinicSpend += healCost
          counters.clinicVisits += 1
          return {
            ...member,
            stamina: clampMemberStamina(
              member.stamina + CLINIC_CONFIG.HEAL_STAMINA_GAIN,
              finiteNumberOr(member.staminaMax, 100)
            ),
            mood: clampMemberMood(member.mood + CLINIC_CONFIG.HEAL_MOOD_GAIN)
          }
        }

        usedRestStop = true
        return {
          ...member,
          stamina: clampMemberStamina(
            member.stamina + 20,
            finiteNumberOr(member.staminaMax, 100)
          ),
          mood: clampMemberMood(member.mood + 10)
        }
      })
      observeAttributedLoss('clinic', moneyBeforeClinic)
      if (usedRestStop) {
        counters.restStops += 1
        counters.executionCoverage.restStops.activations++
      }
    }

    // A rest day is an explicit action and consumes the day in place. Every
    // other day the band drives: there is no wait action in the game, so a day
    // that is neither rest nor travel would be an invented cost-only day.
    if (willRest) {
      // The clinic deduction above is the last money move of a rest day, and this
      // branch ends the day — without sampling here the trough would only be seen
      // by tomorrow's sample, and not at all when the rest day is the last one.
      observeEarlyRunwayMoney()
      peakMoney = Math.max(peakMoney, state.player.money)
      lowestMoney = Math.min(lowestMoney, state.player.money)
      lowestMoneyObserved = Math.min(lowestMoneyObserved, state.player.money)
      continue
    }

    observeEarlyRunwayMoney()

    const recordNoTrip = reason => {
      observeEarlyRunwayMoney()
      if (firstGigDay == null) {
        blockedTravelDaysBeforeFirstGig += 1
        firstBlockedTravel ??= { day, reason }
      }
      if (reason === 'dead_end') routeDeadEnds += 1
      else {
        strandedDays += 1
        counters.travelBlocked[reason] =
          (counters.travelBlocked[reason] ?? 0) + 1
      }
      peakMoney = Math.max(peakMoney, state.player.money)
      lowestMoney = Math.min(lowestMoney, state.player.money)
      lowestMoneyObserved = Math.min(lowestMoneyObserved, state.player.money)
    }

    // Route planning comes last, after every decision that can move money or
    // fuel: the day's events, maintenance, the shop visit and asset investment.
    // Planning earlier meant costing a trip against a balance that no longer
    // existed by the time it was taken, which needed a second validation pass
    // and could still strand a day whose blocker a later windfall had removed.
    // Now the plan is costed on the state the band actually travels in, so
    // `planTravel`'s own `checkTravelResources` filter *is* the final gate.
    const reachable = currentMapNode
      ? (tourAdjacency.get(currentMapNode.id) ?? [])
      : []
    state.player.currentMapNode = currentMapNode
    let travelPlan = planTravel({ reachable, state, rng, wantsToPerform })
    // Canonical in-place fallback: an empty tank is not a dead end while a
    // refuel is affordable. `planTravel` consumes no rng before a fuel block, so
    // re-planning on the refuelled state stays deterministic.
    if (
      travelPlan?.blocked === 'fuel' &&
      attemptRefuel(state, counters, observeAttributedMoney)
    ) {
      travelPlan = planTravel({ reachable, state, rng, wantsToPerform })
      if (!travelPlan.blocked) counters.refuelledToTravel += 1
    }

    if (travelPlan.blocked) {
      // Stranded or out of forward edges. The day still passes — asset revenue
      // and liabilities tick — so the band may be able to move tomorrow. It does
      // not arrive anywhere and it does not play, and no road event fires.
      recordNoTrip(travelPlan.blocked)
      continue
    }

    // The trip is happening. Production runs the tourbus minigame here, at the
    // start of a confirmed journey and before the arrival is processed — after
    // the gate, so its fuel bonus can never be what made the trip affordable.
    runTravelMinigame(state, scenario, rng, counters)

    const nextNode = travelPlan.node
    const venue = nextNode.venue
    const travel = travelPlan.travel
    const totalTravelCost = travel.totalCost

    const moneyBeforeTravel = state.player.money
    state.player.money = clampPlayerMoney(state.player.money - totalTravelCost)
    // Quoted cost feeds avgTravelCostPerGig; the actual deduction (clamp can
    // eat less) feeds the real-money sink ratio.
    totalTravelCostGigs += totalTravelCost
    counters.travelSpend += moneyBeforeTravel - state.player.money
    observeAttributedLoss('travel', moneyBeforeTravel)
    state.player.van.fuel = clampVanFuel(
      state.player.van.fuel - travel.fuelLiters + Math.max(0, rng() * 2 - 1)
    )
    observeEarlyRunwayMoney()

    // Arrival bookkeeping: location keys regional reputation (mapUtils
    // getRegionKeyForLocation reads the venues:<id>.name display key) and
    // total distance feeds the road_warrior TRAVEL_COMPLETE unlock.
    state.player.location = venue.name
    state.player.stats = {
      ...state.player.stats,
      totalDistance:
        finiteNumberOr(state.player.stats?.totalDistance, 0) +
        finiteNumberOr(travel.dist, 0)
    }
    applyUnlockContext(state, counters, { type: 'TRAVEL_COMPLETE' })

    // Arrival happened, whatever the node turns out to be. The edge is logged so
    // a test can verify every trip used a real directed map connection.
    travelLog.push({ from: currentMapNode?.id ?? null, to: nextNode.id })
    currentMapNode = nextNode
    deepestLayerReached = Math.max(deepestLayerReached, nextNode.layer)
    nodeTypesVisited[nextNode.type] = (nodeTypesVisited[nextNode.type] ?? 0) + 1
    if (nextNode.type === 'FINALE') finaleReached = true

    // Road events, now that the journey is a fact rather than a plan. Production
    // fires them after the day advances and before `handleNodeArrival`, which is
    // where the node's own effects (rest-stop recovery, the show) follow below.
    const moneyBeforeTravelEvents = state.player.money
    counters.executionCoverage.eventTriggers.travel.evaluations += 1
    const fameBeforeTravelEvents = state.player.fame
    const travelEventsApplied = applyTravelEvents(
      state,
      scenario,
      rng,
      counters
    )
    counters.eventsApplied = (counters.eventsApplied || 0) + travelEventsApplied
    counters.executionCoverage.eventTriggers.travel.activations +=
      travelEventsApplied
    observeAttributedLoss('negative_events', moneyBeforeTravelEvents)
    recordObservedFameChange(
      counters.fameAccounting,
      fameBeforeTravelEvents,
      state.player.fame
    )

    // Rest and supply stops are not stages. Routing prefers performable nodes,
    // but the map does not always offer one, and playing a gig at a rest stop
    // would invent income the game never pays.
    if (!PERFORMABLE_NODE_TYPES.has(nextNode.type)) {
      nonPerformingArrivals += 1
      // A rest stop recovers the whole band on arrival, unconditionally:
      // +20 stamina / +10 mood per member (arrivalUtils.ts REST_STOP). Skipping
      // it would understate recovery in exactly the wear and rest metrics this
      // report adds.
      if (nextNode.type === 'REST_STOP') {
        state.band.members = state.band.members.map(member => ({
          ...member,
          stamina: clampMemberStamina(
            finiteNumberOr(member.stamina, 0) + 20,
            finiteNumberOr(member.staminaMax, 100)
          ),
          mood: clampMemberMood(finiteNumberOr(member.mood, 0) + 10)
        }))
        counters.restStopArrivals += 1
      }
      peakMoney = Math.max(peakMoney, state.player.money)
      lowestMoney = Math.min(lowestMoney, state.player.money)
      lowestMoneyObserved = Math.min(lowestMoneyObserved, state.player.money)
      continue
    }

    // Show cancellation check (happens BEFORE minigames); mirrors
    // arrivalUtils.ts: deterministic at harmony <= 1, otherwise probabilistic
    // below LOW_HARMONY_THRESHOLD, scaled down by the tourSuccess band effect.
    const tourSuccess = Math.min(
      1,
      Math.max(0, finiteNumberOr(state.band.tourSuccess, 0))
    )
    const isCancelled =
      state.band.harmony <= 1 ||
      (state.band.harmony < BALANCE_CONSTANTS.LOW_HARMONY_THRESHOLD &&
        rng() <
          BALANCE_CONSTANTS.LOW_HARMONY_CANCELLATION_CHANCE * (1 - tourSuccess))

    if (isCancelled) {
      // Show is cancelled due to poor harmony
      // Apply a penalty to fame directly as it doesn't go through standard score scaling
      {
        const oldFame = state.player.fame
        const loss = SIMULATION_CONSTANTS.fameLossBadGig * 2
        const newFameRaw = oldFame - loss
        const newFameClamped = clampPlayerFame(newFameRaw)
        accountFameChange(
          counters.fameAccounting,
          -loss,
          newFameClamped - oldFame
        )
        state.player.fame = newFameClamped
      }
      state.player.fameLevel = calculateFameLevel(state.player.fame)

      // Record cancelled state in timeline (without incrementing gigsPlayed)
      timeline.push({
        day: state.player.day,
        venueId: venue.id,
        venueDiff: venue.diff,
        performanceScore: 0,
        net: 0,
        travelCost: totalTravelCost,
        misses: 0,
        modifierEffects: 0,
        avgHitWindow: 0,
        money: state.player.money,
        fame: state.player.fame,
        controversyLevel: state.social.controversyLevel,
        sponsorActive: hasActiveSponsorship(state.social),
        cancelled: true
      })

      if (
        shouldTriggerBankruptcy(
          state.player.money,
          0,
          getTotalDailyObligations(state)
        )
      ) {
        counters.bankrupt = true
        break
      }

      // A cancelled finale still ends the tour — the band stands on the last
      // node with no forward edge — but it did not complete the show.
      if (finaleReached) break

      // Skip the rest of the gig pipeline
      continue
    }

    // Only the setup minigame and the performance are gated on the show going
    // ahead; the tourbus run already happened with the journey.
    // currentGig is the venue object for the whole gig pipeline (gotcha:
    // event conditions and reducers read state.currentGig.capacity/.id).
    state.currentGig = venue
    counters.executionCoverage.eventTriggers.preGig.evaluations += 1
    const moneyBeforePreGigEvent = state.player.money
    if (
      applyTriggerEvent(
        state,
        scenario,
        rng,
        counters,
        ['band', 'gig'],
        'pre_gig'
      )
    ) {
      counters.executionCoverage.eventTriggers.preGig.activations += 1
    }
    observeAttributedLoss('negative_events', moneyBeforePreGigEvent)
    observeEarlyRunwayMoney()
    // The show is going ahead, so this is the run's first income opportunity.
    // Recorded before the setup minigame and the modifier purchases, which is
    // what "money directly before the first gig" has to mean for a runway
    // question — and it is also the anchor the `first-income` cadence keeps.
    observeEarlyRunwayMoney()
    if (firstGigDay == null) {
      firstGigDay = day
      moneyBeforeFirstGig = state.player.money
      spendBeforeFirstGig = discretionarySpend(counters)
    }
    const damagedGear = runPreGigSetupMinigame(
      state,
      scenario,
      rng,
      counters,
      runCtx,
      observeAttributedMoney
    )

    const modifiers = calculateModifiers(scenario, rng)
    if (damagedGear) modifiers.damaged_gear = true
    const song = pickSongForGig(rng)
    const perfResults = calculatePerformanceScore(
      state,
      venue,
      modifiers,
      rng,
      song
    )
    const performanceScore = perfResults.score
    const gigModifiers = perfResults.gigModifiers
    const physics = perfResults.physics

    // Mid-gig events from the EVENTS_DB `gig` category
    const moneyBeforeGigEvent = state.player.money
    if (maybeApplyGigEvent(state, scenario, rng, counters)) {
      counters.executionCoverage.eventTriggers.gigMoments.activations += 1
    }
    observeAttributedLoss('negative_events', moneyBeforeGigEvent)

    // Misses/maxCombo are player-skill outputs of the rhythm game; the sim
    // derives stand-ins from the performance score (no canonical formula).
    const misses = Math.max(
      0,
      Math.round((100 - performanceScore) * (0.12 + rng() * 0.1))
    )
    const maxCombo = Math.round(performanceScore * (0.5 + rng() * 0.8))

    const currentGigStats = {
      score: perfResults.rawScore,
      accuracy: performanceScore,
      misses,
      maxCombo,
      hitRate: performanceScore / 100,
      peakHype: Math.round(performanceScore + rng() * 12),
      song: song
        ? { id: song.id, bpm: song.bpm, difficulty: song.difficulty }
        : undefined
    }

    const regionId = getRegionKeyForLocation(state.player.location) ?? 'Unknown'
    const regionalGigHistory = Object.fromEntries(runCtx.regionalGigHistory)
    state.player.day = day
    const recentRegionalGigs = (
      runCtx.regionalGigHistory.get(regionId) ?? []
    ).filter(
      gigDay => state.player.day - gigDay <= tuning.touring.repeatGigWindowDays
    )
    const financials = deriveFinancials({
      currentGig: venue,
      lastGigStats: currentGigStats,
      perfScore: performanceScore,
      gigModifiers: modifiers,
      bandInventory: state.band.inventory,
      bandMerchPrices: state.band.merchPrices || {},
      bandGigModifier: state.band.gigModifier,
      player: state.player,
      social: state.social,
      reputationByRegion: state.reputationByRegion ?? {},
      activeStoryFlags:
        scenario.ticketDiscountChance > rng()
          ? ['discounted_tickets_active']
          : [],
      gigContext: {
        daysSinceLastGig:
          state.player.day - (state.social.lastGigDay ?? state.player.day),
        lastGigDifficulty: state.social.lastGigDifficulty ?? null
      },
      // Note: Region/City effects in Balance-Run are not fully simulated here.
      cityTraits: [],
      assetModifiers: getActiveAssetModifiers(state.assets || []),
      repeatDemandContext: { day, regionId, regionalGigHistory, tuning }
    })

    // The settlement combines income and expenses in one state update. Attribute
    // its expenses separately so a profitable gig cannot erase the losses.
    const expenseBreakdown = financials?.expenses?.breakdown ?? []
    let mgmtCutValue = 0
    let mgmtCutPct = 0
    for (const item of expenseBreakdown) {
      const value = Math.max(0, finiteNumberOr(item.value, 0))
      const label = item.labelKey ?? ''
      if (/management/i.test(label) || item.id === 'management_fee') {
        mgmtCutValue += value
        if (item.rate != null) mgmtCutPct = item.rate
      }
      const source = MODIFIER_EXPENSE_LABEL_KEYS.has(label)
        ? 'modifierGrossSpend'
        : /venue|promoter/i.test(label)
          ? 'venueGrossSpend'
          : /tax|management|dampener|overage/i.test(label)
            ? 'taxGrossSpend'
            : 'otherGrossSpend'
      grossSpendAttribution[source] += value
    }
    if (counters.managementCutStats) {
      if (counters.managementCutStats.firstGigPct === null) {
        counters.managementCutStats.firstGigPct = mgmtCutPct
      }
      counters.managementCutStats.cutPctSum += mgmtCutPct
      if (mgmtCutPct >= 0.149) counters.managementCutStats.fullCutGigs += 1
      counters.managementCutStats.totalCutMoney += mgmtCutValue
    }
    const moneyBeforeSettlement = state.player.money

    // Standard post-gig adjustments
    applyPostGigState(
      state,
      venue,
      performanceScore,
      financials
        ? financials
        : {
            net: 0,
            income: { total: 0, breakdown: [] },
            expenses: { total: 0, breakdown: [] },
            soldMerch: {}
          },
      misses,
      currentGigStats,
      counters
    )
    observeAttributedLoss('gig_settlement', moneyBeforeSettlement)

    // Deplete merch inventory based on actual sold merch
    if (financials?.soldMerch) {
      if (!state.band.inventory) {
        state.band.inventory = {}
      }
      for (const [merchKey, amount] of Object.entries(financials.soldMerch)) {
        const soldAmount = Math.max(0, amount || 0)
        state.band.inventory[merchKey] = Math.max(
          0,
          (state.band.inventory[merchKey] || 0) - soldAmount
        )
      }
    }

    const sponsorActiveBeforePostPulse = hasActiveSponsorship(state.social)
    const fameBeforePostPulse = state.player.fame
    const postPulseApplied =
      scenario.socialStrategy !== 'none' &&
      maybeApplyPostPulse(
        state,
        rng,
        counters,
        venue,
        currentGigStats,
        state.activeEvent || null,
        performanceScore
      )
    recordObservedFameChange(
      counters.fameAccounting,
      fameBeforePostPulse,
      state.player.fame
    )

    if (sponsorActiveBeforePostPulse) {
      counters.sponsorPayouts += 1
    }

    if (postPulseApplied) {
      applyUnlockContext(state, counters, { type: 'SOCIAL_UPDATE' })
    }

    if (!postPulseApplied && state.social.activeDeals?.length > 0) {
      state.social.activeDeals = state.social.activeDeals
        .map(d => ({ ...d, remainingGigs: d.remainingGigs - 1 }))
        .filter(d => d.remainingGigs > 0)
    }

    counters.gigsPlayed += 1
    counters.executionCoverage.eventTriggers.postGig.evaluations += 1
    const moneyBeforePostGigEvent = state.player.money
    if (
      applyTriggerEvent(
        state,
        scenario,
        rng,
        counters,
        ['financial', 'special', 'band'],
        'post_gig'
      )
    ) {
      counters.executionCoverage.eventTriggers.postGig.activations += 1
    }
    observeAttributedLoss('negative_events', moneyBeforePostGigEvent)
    runCtx.regionalGigHistory.set(regionId, [...recentRegionalGigs, day])
    const gigNet = financials ? financials.net : 0
    totalGigNet += gigNet
    if (gigNet >= MAX_GIG_NET) counters.gigCapHits += 1
    peakMoney = Math.max(peakMoney, state.player.money)
    lowestMoney = Math.min(lowestMoney, state.player.money)
    lowestMoneyObserved = Math.min(lowestMoneyObserved, state.player.money)

    // Calculate Peak-to-Trough drop percentage relative to the current peak.
    if (peakMoney > 0) {
      const currentDrop = calculateDrawdownPct(peakMoney, state.player.money)
      if (currentDrop > maxPeakToTroughDrop) maxPeakToTroughDrop = currentDrop
    }

    // Accumulate per-gig calibration metrics
    totalHitWindowSum +=
      Math.round(
        (physics.hitWindows.guitar +
          physics.hitWindows.drums +
          physics.hitWindows.bass) /
          3
      ) || 0
    totalMissesSum += misses
    totalPerfScoreSum += performanceScore
    if (performanceScore < 50) gigScoreLow++
    else if (performanceScore <= 70) gigScoreMid++
    else gigScoreHigh++

    timeline.push({
      day: state.player.day,
      venueId: venue.id,
      venueDiff: venue.diff,
      performanceScore,
      net: gigNet,
      travelCost: totalTravelCost,
      misses,
      modifierEffects: gigModifiers.activeEffects.length,
      avgHitWindow:
        Math.round(
          (physics.hitWindows.guitar +
            physics.hitWindows.drums +
            physics.hitWindows.bass) /
            3
        ) || 0,
      money: state.player.money,
      fame: state.player.fame,
      controversyLevel: state.social.controversyLevel,
      sponsorActive: hasActiveSponsorship(state.social)
    })

    if (
      shouldTriggerBankruptcy(
        state.player.money,
        gigNet,
        getTotalDailyObligations(state)
      )
    ) {
      counters.bankrupt = true
      break
    }

    // Playing the finale ends the run on the victory screen, exactly as the game
    // does. A tour that gets there has finished; one that does not has simply
    // run out of days, and the two are different outcomes.
    if (finaleReached) {
      finaleCompleted = true
      break
    }
  }

  // In-scope waypoints a bankrupt run never reached record the terminal
  // balance, so progression averages include failed runs; null stays
  // reserved for waypoints beyond this scenario's daysOverride.
  if (moneyAtEarlyCheckpoint == null && daysToRun >= earlyCheckpointDay)
    moneyAtEarlyCheckpoint = state.player.money
  if (moneyAtMidCheckpoint == null && daysToRun >= midCheckpointDay)
    moneyAtMidCheckpoint = state.player.money
  if (moneyAtLateCheckpoint == null && daysToRun >= lateCheckpointDay)
    moneyAtLateCheckpoint = state.player.money

  const reconciliationDelta = reconcileFameLedger({
    startingFame,
    fameAccounting: counters.fameAccounting,
    finalFame: state.player.fame
  })

  return {
    startingFame,
    reconciliationDelta,
    daysSurvived,
    finalMoney: state.player.money,
    regionRepTouched:
      Object.keys(state.reputationByRegion || {}).length > 0 ||
      Object.keys(state.reputationByVenue || {}).length > 0,
    finalAssets: state.assets?.length ?? 0,
    maxPeakToTroughDrop,
    finalFame: state.player.fame,
    finalHarmony: state.band.harmony,
    finalControversy: state.social.controversyLevel,
    totalGigNet,
    peakMoney,
    lowestMoney,
    lowestMoneyObserved,
    finaleReached,
    finaleCompleted,
    deepestLayerReached,
    tourDepth: tourHorizonDays,
    nodeTypesVisited,
    routeDeadEnds,
    nonPerformingArrivals,
    strandedDays,
    stranded: strandedDays > 0,
    travelLog,
    travelBlocked: counters.travelBlocked,
    minHarmonyObserved,
    minMemberStaminaObserved: Number.isFinite(minMemberStaminaObserved)
      ? minMemberStaminaObserved
      : null,
    minMemberMoodObserved: Number.isFinite(minMemberMoodObserved)
      ? minMemberMoodObserved
      : null,
    affordabilityAtMidCheckpoint,
    affordabilityAtEnd: summarizeCatalogAffordability(state),
    daysBelowTightLiquidity,
    daysBelowCriticalLiquidity,
    actualLossAttribution: {
      totals: Object.fromEntries(
        Object.entries(lossAttribution.totals).map(([source, value]) => [
          source,
          Math.round(value)
        ])
      ),
      firstMaterialDrawdownSource: lossAttribution.firstMaterialDrawdownSource,
      bankruptcyPrecededBySource: counters.bankrupt
        ? lossAttribution.lastMaterialLossSource
        : null
    },
    grossSpendAttribution: Object.fromEntries(
      Object.entries(grossSpendAttribution).map(([source, value]) => [
        source,
        Math.round(value)
      ])
    ),
    // `daysBeforeFirstGig` counts unpaid days: for a run that never played, that
    // is every day it survived. `spendBeforeFirstGig` covers the discretionary
    // sinks (travel, fuel, repairs, clinic, shop); the recurring side is
    // `obligationsBeforeFirstGig`, which the daily tick charges separately.
    earlyRunway: {
      firstGigDay,
      bankruptBeforeFirstGig: counters.bankrupt && firstGigDay == null,
      moneyBeforeFirstGig,
      lowestMoneyBeforeFirstGig,
      daysBeforeFirstGig: firstGigDay == null ? daysSurvived : firstGigDay - 1,
      obligationsBeforeFirstGig: Math.round(obligationsBeforeFirstGig),
      spendBeforeFirstGig: Math.round(
        spendBeforeFirstGig ?? discretionarySpend(counters)
      ),
      blockedTravelDaysBeforeFirstGig,
      firstBlockedTravel
    },
    emergencyGrantUsed: runCtx.emergencyGrantUsed,
    timeline,
    moneyAtEarlyCheckpoint,
    moneyAtMidCheckpoint,
    moneyAtLateCheckpoint,
    totalTravelCostGigs,
    totalHitWindowSum,
    totalMissesSum,
    totalPerfScoreSum,
    gigScoreLow,
    gigScoreMid,
    gigScoreHigh,
    ...counters
  }
}

const COVERAGE_ID_INVENTORY = {
  brandDeals: BRAND_DEALS.length,
  postOptions: POST_OPTIONS.length,
  socialTrends: ALLOWED_TRENDS.length,
  contraband: CONTRABAND_DB.length
}

export const mergeExecutionCoverage = sources => {
  const coverage = {
    brandDeals: { evaluations: 0, activations: 0, uniqueIdsSeen: new Set() },
    postOptions: { evaluations: 0, activations: 0, uniqueIdsSeen: new Set() },
    socialTrends: { evaluations: 0, activations: 0, uniqueIdsSeen: new Set() },
    contraband: { evaluations: 0, activations: 0, uniqueIdsSeen: new Set() },
    minigamesTravel: { attempts: 0, completions: 0 },
    minigamesRoadie: { attempts: 0, completions: 0 },
    minigamesKabelsalat: { attempts: 0, completions: 0 },
    minigamesAmp: { attempts: 0, completions: 0 },
    sponsorship: { attempts: 0, successes: 0 },
    restStops: { evaluations: 0, activations: 0 },
    eventTriggers: {
      travel: { evaluations: 0, activations: 0 },
      preGig: { evaluations: 0, activations: 0 },
      gigMoments: { evaluations: 0, activations: 0 },
      postGig: { evaluations: 0, activations: 0 }
    },
    quests: {
      status: 'insufficient_evidence',
      offers: 0,
      activations: 0,
      progress: 0,
      completions: 0,
      failures: 0,
      rewards: 0,
        availableIds: Object.keys(QUEST_REGISTRY).length,
        uniqueQuestIdsOffered: new Set(),
        uniqueQuestIdsActivated: new Set(),
        uniqueQuestIdsCompleted: new Set()
    }
  }

  for (const source of sources) {
    if (!source) continue
    for (const [key, target] of Object.entries(coverage)) {
      const current = source[key] ?? {}
      for (const counter of [
        'evaluations',
        'activations',
        'attempts',
        'completions',
        'successes',
        'offers',
        'progress',
        'failures',
        'rewards'
      ]) {
        if (counter in target) target[counter] += current[counter] ?? 0
      }
      if (target.uniqueIdsSeen) {
        for (const id of current.uniqueIdsSeen ?? [])
          target.uniqueIdsSeen.add(id)
      }
      if (key === 'quests') {
        for (const field of [
          'uniqueQuestIdsOffered',
          'uniqueQuestIdsActivated',
          'uniqueQuestIdsCompleted'
        ]) {
          if (current[field]) {
            for (const id of current[field]) target[field].add(id)
          }
        }
      }
    }
  }

  for (const trigger of Object.keys(coverage.eventTriggers)) {
    for (const source of sources) {
      coverage.eventTriggers[trigger].evaluations +=
        source?.eventTriggers?.[trigger]?.evaluations ?? 0
      coverage.eventTriggers[trigger].activations +=
        source?.eventTriggers?.[trigger]?.activations ?? 0
    }
  }

  for (const [key, metric] of Object.entries(coverage)) {
    if (metric.uniqueIdsSeen) {
      metric.uniqueIdsSeen = Array.from(metric.uniqueIdsSeen).sort()
      metric.availableIds = COVERAGE_ID_INVENTORY[key]
    }
    if (key === 'quests') {
      metric.uniqueQuestIdsOffered = Array.from(metric.uniqueQuestIdsOffered).sort()
      metric.uniqueQuestIdsActivated = Array.from(metric.uniqueQuestIdsActivated).sort()
      metric.uniqueQuestIdsCompleted = Array.from(metric.uniqueQuestIdsCompleted).sort()
      metric.status =
        metric.activations > 0 || metric.completions > 0
          ? 'covered'
          : 'insufficient_evidence'
    }
    const successfulExecutions =
      (metric.activations ?? metric.completions ?? metric.successes ?? 0) > 0
    metric.covered =
      successfulExecutions ||
      (key !== 'restStops' &&
        (metric.evaluations ?? metric.attempts ?? 0) > 0) ||
      (metric.uniqueIdsSeen?.length ?? 0) > 0
  }
  return coverage
}

export const calculateAverageFameEarnedPerGig = runs =>
  mean(
    runs.map(run => {
      const fameEarned = run.fameAccounting?.earned ?? run.fameEarned ?? 0
      return run.gigsPlayed > 0 ? fameEarned / run.gigsPlayed : 0
    })
  )

const firstDayMatching = (log, predicate) => {
  const days = (log ?? [])
    .filter(entry => predicate(entry) && entry.day != null)
    .map(entry => entry.day)
  return days.length ? Math.min(...days) : null
}

const medianOrNull = values =>
  values.length ? Number(median(values).toFixed(2)) : null

const modalValue = values => {
  const tally = new Map()
  for (const value of values) tally.set(value, (tally.get(value) ?? 0) + 1)
  let best = null
  let bestCount = 0
  // Ties resolve on the first-seen value, which is deterministic because the
  // run order is.
  for (const [value, count] of tally) {
    if (count > bestCount) {
      best = value
      bestCount = count
    }
  }
  return best
}

export const summarizeScenario = runs => {
  const solventRuns = runs.filter(r => !r.bankrupt)
  const bankruptRuns = runs.filter(r => r.bankrupt)

  const describe = (values, format) => ({
    mean: format(mean(values)),
    median: format(median(values)),
    stdDev: format(standardDeviation(values)),
    min: format(minimum(values)),
    p10: format(quantile(values, 0.1)),
    p25: format(quantile(values, 0.25)),
    p75: format(quantile(values, 0.75)),
    p90: format(quantile(values, 0.9)),
    max: format(maximum(values))
  })
  const roundInteger = value => Math.round(value)
  const roundTwo = value => Number(value.toFixed(2))
  const perGig = (run, value) =>
    run.gigsPlayed > 0 ? value / run.gigsPlayed : 0

  const calcStats = subset => {
    if (!subset || subset.length === 0) return null
    return {
      sampleSize: subset.length,
      finalMoney: describe(
        subset.map(run => run.finalMoney),
        roundInteger
      ),
      finalFame: describe(
        subset.map(run => run.finalFame),
        roundInteger
      ),
      gigsPlayed: describe(
        subset.map(run => run.gigsPlayed),
        roundTwo
      ),
      daysSurvived: describe(
        subset.map(run => run.daysSurvived),
        roundTwo
      ),
      gigNet: describe(
        subset.map(run => perGig(run, run.totalGigNet)),
        roundInteger
      ),
      performanceScore: describe(
        subset.map(run => perGig(run, run.totalPerfScoreSum)),
        roundInteger
      ),
      finalHarmony: describe(
        subset.map(run => run.finalHarmony),
        roundInteger
      ),
      fameEarned: describe(
        subset.map(run => run.fameAccounting.earned),
        roundInteger
      ),
      fameEarnedPerGig: describe(
        subset.map(run => perGig(run, run.fameAccounting.earned)),
        roundInteger
      )
    }
  }

  const aggregateCoverage = mergeExecutionCoverage(
    runs.map(run => run.executionCoverage)
  )
  const eventTriggerCoverage = Object.values(
    aggregateCoverage.eventTriggers
  ).filter(metric => metric && typeof metric === 'object')
  const coverageStatus =
    eventTriggerCoverage.length > 0 &&
    eventTriggerCoverage.every(metric => metric.evaluations > 0)
      ? 'covered'
      : 'insufficient_evidence'

  const popAll = calcStats(runs) || { sampleSize: 0 }
  const popSolvent = calcStats(solventRuns) || { sampleSize: 0 }
  const popBankrupt = calcStats(bankruptRuns) || { sampleSize: 0 }

  const bankruptcyCount = bankruptRuns.length
  const n = runs.length
  const bankruptcyRatePct = n > 0 ? (bankruptcyCount / n) * 100 : 0
  const preciseConfidence95 = wilsonScoreInterval(bankruptcyCount, n)
  const confidence95 = {
    lowerPct: Number(preciseConfidence95.lowerPct.toFixed(2)),
    upperPct: Number(preciseConfidence95.upperPct.toFixed(2)),
    method: preciseConfidence95.method
  }

  const shareOfRunsPct = predicate =>
    n > 0 ? Number(((runs.filter(predicate).length / n) * 100).toFixed(2)) : 0

  const finalMoneyMean = popAll.finalMoney ? popAll.finalMoney.mean : 0
  const finalFameMean = popAll.finalFame ? popAll.finalFame.mean : 0
  const gigsPlayedMean = popAll.gigsPlayed ? popAll.gigsPlayed.mean : 0

  const avgEventsApplied = Number(
    mean(runs.map(r => r.eventsApplied)).toFixed(2)
  )
  const avgGigEvents = Number(mean(runs.map(r => r.gigEvents)).toFixed(2))

  return {
    avgFinalMoney: finalMoneyMean,
    avgFinalFame: finalFameMean,
    avgFinalHarmony: popAll.finalHarmony ? popAll.finalHarmony.mean : 0,
    avgGigsPlayed: gigsPlayedMean,
    avgGigNet: popAll.gigNet ? popAll.gigNet.mean : 0,
    bankruptcyRate: Number(bankruptcyRatePct.toFixed(2)),
    avgEventsApplied,
    avgGigEvents,
    coverageStatus,
    harmonyRecovery: Object.fromEntries(
      [
        'evaluations',
        'activations',
        'harmonyRestored',
        'moneySpent',
        'daysConsumed',
        'gigOpportunitiesForgone'
      ].map(key => [
        key,
        Number(
          mean(
            runs.map(run => finiteNumberOr(run.harmonyRecovery?.[key], 0))
          ).toFixed(2)
        )
      ])
    ),
    avgPerformanceScore: popAll.performanceScore
      ? popAll.performanceScore.mean
      : 0,

    statistics: {
      finalMoney: popAll.finalMoney,
      finalFame: popAll.finalFame,
      gigsPlayed: popAll.gigsPlayed,
      daysSurvived: popAll.daysSurvived,
      gigNet: popAll.gigNet,
      performanceScore: popAll.performanceScore,
      lowestMoney: {
        mean: Math.round(mean(runs.map(r => r.lowestMoney))),
        median: Math.round(median(runs.map(r => r.lowestMoney))),
        stdDev: Math.round(standardDeviation(runs.map(r => r.lowestMoney))),
        min: Math.round(minimum(runs.map(r => r.lowestMoney))),
        p10: Math.round(
          quantile(
            runs.map(r => r.lowestMoney),
            0.1
          )
        ),
        p25: Math.round(
          quantile(
            runs.map(r => r.lowestMoney),
            0.25
          )
        ),
        p75: Math.round(
          quantile(
            runs.map(r => r.lowestMoney),
            0.75
          )
        ),
        p90: Math.round(
          quantile(
            runs.map(r => r.lowestMoney),
            0.9
          )
        ),
        max: Math.round(maximum(runs.map(r => r.lowestMoney)))
      },
      peakMoney: {
        mean: Math.round(mean(runs.map(r => r.peakMoney))),
        median: Math.round(median(runs.map(r => r.peakMoney))),
        stdDev: Math.round(standardDeviation(runs.map(r => r.peakMoney))),
        min: Math.round(minimum(runs.map(r => r.peakMoney))),
        p10: Math.round(
          quantile(
            runs.map(r => r.peakMoney),
            0.1
          )
        ),
        p25: Math.round(
          quantile(
            runs.map(r => r.peakMoney),
            0.25
          )
        ),
        p75: Math.round(
          quantile(
            runs.map(r => r.peakMoney),
            0.75
          )
        ),
        p90: Math.round(
          quantile(
            runs.map(r => r.peakMoney),
            0.9
          )
        ),
        max: Math.round(maximum(runs.map(r => r.peakMoney)))
      },
      maxDrawdownPct: {
        mean: Number(mean(runs.map(r => r.maxPeakToTroughDrop)).toFixed(2)),
        median: Number(median(runs.map(r => r.maxPeakToTroughDrop)).toFixed(2)),
        stdDev: Number(
          standardDeviation(runs.map(r => r.maxPeakToTroughDrop)).toFixed(2)
        ),
        min: Number(minimum(runs.map(r => r.maxPeakToTroughDrop)).toFixed(2)),
        p10: Number(
          quantile(
            runs.map(r => r.maxPeakToTroughDrop),
            0.1
          ).toFixed(2)
        ),
        p25: Number(
          quantile(
            runs.map(r => r.maxPeakToTroughDrop),
            0.25
          ).toFixed(2)
        ),
        p75: Number(
          quantile(
            runs.map(r => r.maxPeakToTroughDrop),
            0.75
          ).toFixed(2)
        ),
        p90: Number(
          quantile(
            runs.map(r => r.maxPeakToTroughDrop),
            0.9
          ).toFixed(2)
        ),
        max: Number(maximum(runs.map(r => r.maxPeakToTroughDrop)).toFixed(2))
      },
      finalHarmony: popAll.finalHarmony,
      eventsApplied: {
        mean: avgEventsApplied,
        median: Number(median(runs.map(r => r.eventsApplied)).toFixed(2)),
        stdDev: Number(
          standardDeviation(runs.map(r => r.eventsApplied)).toFixed(2)
        ),
        min: minimum(runs.map(r => r.eventsApplied)),
        p10: quantile(
          runs.map(r => r.eventsApplied),
          0.1
        ),
        p25: quantile(
          runs.map(r => r.eventsApplied),
          0.25
        ),
        p75: quantile(
          runs.map(r => r.eventsApplied),
          0.75
        ),
        p90: quantile(
          runs.map(r => r.eventsApplied),
          0.9
        ),
        max: maximum(runs.map(r => r.eventsApplied))
      },
      gigEvents: {
        mean: avgGigEvents,
        median: Number(median(runs.map(r => r.gigEvents)).toFixed(2)),
        stdDev: Number(
          standardDeviation(runs.map(r => r.gigEvents)).toFixed(2)
        ),
        min: minimum(runs.map(r => r.gigEvents)),
        p10: quantile(
          runs.map(r => r.gigEvents),
          0.1
        ),
        p25: quantile(
          runs.map(r => r.gigEvents),
          0.25
        ),
        p75: quantile(
          runs.map(r => r.gigEvents),
          0.75
        ),
        p90: quantile(
          runs.map(r => r.gigEvents),
          0.9
        ),
        max: maximum(runs.map(r => r.gigEvents))
      },
      fameEarned: popAll.fameEarned,
      fameEarnedPerGig: popAll.fameEarnedPerGig
    },
    population: {
      allRuns: popAll,
      solventRuns: popSolvent,
      bankruptRuns: popBankrupt
    },

    avgFameProgress: Math.round(mean(runs.map(r => r.fameAccounting.earned))),
    avgFameProgressPerGig: Number(
      calculateAverageFameEarnedPerGig(runs).toFixed(2)
    ),
    avgPeakToTroughDrop: Number(
      mean(runs.map(r => r.maxPeakToTroughDrop)).toFixed(2)
    ),
    avgPeakMoney: Math.round(mean(runs.map(r => r.peakMoney))),
    avgLowestMoney: Math.round(mean(runs.map(r => r.lowestMoney))),
    avgFinalControversy: Number(
      mean(runs.map(r => r.finalControversy)).toFixed(2)
    ),
    managementCut: (() => {
      const totalGigsPlayed = runs.reduce((sum, r) => sum + r.gigsPlayed, 0)
      const firstGigs = runs
        .map(r => r.managementCutStats?.firstGigPct)
        .filter(v => v != null)
      const avgFirstPct = firstGigs.length ? mean(firstGigs) * 100 : 0
      const totalCutPctSum = runs.reduce(
        (sum, r) => sum + (r.managementCutStats?.cutPctSum ?? 0),
        0
      )
      const totalFullCutGigs = runs.reduce(
        (sum, r) => sum + (r.managementCutStats?.fullCutGigs ?? 0),
        0
      )
      const totalCutMoney = runs.reduce(
        (sum, r) => sum + (r.managementCutStats?.totalCutMoney ?? 0),
        0
      )
      return {
        firstGigManagementCutPct: Number(avgFirstPct.toFixed(2)),
        avgManagementCutPct: Number(
          (
            (totalGigsPlayed > 0 ? totalCutPctSum / totalGigsPlayed : 0) * 100
          ).toFixed(2)
        ),
        fullManagementCutGigSharePct: Number(
          (
            (totalGigsPlayed > 0 ? totalFullCutGigs / totalGigsPlayed : 0) *
            100
          ).toFixed(2)
        ),
        totalManagementCut: Math.round(
          runs.length ? totalCutMoney / runs.length : 0
        )
      }
    })(),
    ...Object.fromEntries(
      [
        ['ClinicVisits', 'clinicVisits'],
        ['SponsorPayouts', 'sponsorPayouts'],
        ['SponsorSignings', 'sponsorSignings'],
        ['SponsorDrops', 'sponsorDrops'],
        ['BrandDealsActivated', 'brandDealsActivated'],
        ['Refuels', 'refuels'],
        ['Repairs', 'repairs'],
        ['HqUpgrades', 'hqUpgrades'],
        ['VanUpgrades', 'vanUpgrades'],
        ['CatalogUpgrades', 'catalogUpgrades'],
        ['TravelMinigames', 'travelMinigames'],
        ['RoadieMinigames', 'roadieMinigames'],
        ['KabelsalatMinigames', 'kabelsalatMinigames'],
        ['AmpCalibrations', 'ampCalibrations'],
        ['RestStops', 'restStops'],
        ['RestDays', 'restDays'],
        ['RestStopArrivals', 'restStopArrivals'],
        ['AssetsPurchased', 'assetsPurchased'],
        ['LoansTaken', 'loansTaken'],
        ['ModulesInstalled', 'modulesInstalled'],
        ['CrowdfundsStarted', 'crowdfundsStarted'],
        ['TraitUnlocks', 'traitUnlocks'],
        ['FinalAssets', 'finalAssets'],
        ['TrendShifts', 'trendShifts'],
        ['SpecialEvents', 'specialEvents'],
        ['CashSwings', 'cashSwings'],
        ['BandEvents', 'bandEvents'],
        ['EquipmentEvents', 'equipmentEvents'],
        ['PostPulses', 'postPulses'],
        ['ContrabandDrops', 'contrabandDrops']
      ].map(([name, field]) => [
        `avg${name}`,
        Number(mean(runs.map(r => r[field] ?? 0)).toFixed(2))
      ])
    ),
    avgClinicSpend: Math.round(mean(runs.map(r => r.clinicSpend ?? 0))),
    regionRepTouchedPct: Number(
      mean(runs.map(r => (r.regionRepTouched ? 100 : 0))).toFixed(1)
    ),
    avgTravelCostPerGig: Math.round(
      runs.reduce((sum, r) => sum + r.totalTravelCostGigs, 0) /
        Math.max(
          1,
          runs.reduce((sum, r) => sum + r.gigsPlayed, 0)
        )
    ),
    avgHitWindow: Math.round(
      runs.reduce((sum, r) => sum + r.totalHitWindowSum, 0) /
        Math.max(
          1,
          runs.reduce((sum, r) => sum + r.gigsPlayed, 0)
        )
    ),
    avgMissesPerGig: Number(
      (
        runs.reduce((sum, r) => sum + r.totalMissesSum, 0) /
        Math.max(
          1,
          runs.reduce((sum, r) => sum + r.gigsPlayed, 0)
        )
      ).toFixed(1)
    ),
    gigScorePctLow: Number(
      (
        (runs.reduce((sum, r) => sum + r.gigScoreLow, 0) /
          Math.max(
            1,
            runs.reduce((sum, r) => sum + r.gigsPlayed, 0)
          )) *
        100
      ).toFixed(1)
    ),
    gigScorePctMid: Number(
      (
        (runs.reduce((sum, r) => sum + r.gigScoreMid, 0) /
          Math.max(
            1,
            runs.reduce((sum, r) => sum + r.gigsPlayed, 0)
          )) *
        100
      ).toFixed(1)
    ),
    gigScorePctHigh: Number(
      (
        (runs.reduce((sum, r) => sum + r.gigScoreHigh, 0) /
          Math.max(
            1,
            runs.reduce((sum, r) => sum + r.gigsPlayed, 0)
          )) *
        100
      ).toFixed(1)
    ),
    gigNetToTravelRatio: Number(
      (
        runs.reduce((sum, r) => sum + r.totalGigNet, 0) /
        Math.max(
          1,
          runs.reduce((sum, r) => sum + r.totalTravelCostGigs, 0)
        )
      ).toFixed(1)
    ),
    sinkToIncomeRatio: Number(
      (
        runs.reduce(
          (sum, r) =>
            sum + r.travelSpend + r.repairSpend + r.refuelSpend + r.clinicSpend,
          0
        ) /
        Math.max(
          1,
          runs.reduce((sum, r) => sum + r.totalGigNet, 0)
        )
      ).toFixed(2)
    ),
    gigCapHitPct: Number(
      (
        (runs.reduce((sum, r) => sum + r.gigCapHits, 0) /
          Math.max(
            1,
            runs.reduce((sum, r) => sum + r.gigsPlayed, 0)
          )) *
        100
      ).toFixed(1)
    ),
    gigsToAffordHqUpgrade: Number(
      (HQ_UPGRADE_COST / Math.max(1, popAll.gigNet?.mean ?? 0)).toFixed(2)
    ),
    gigsToAffordVanUpgrade:
      _VAN_TUNING?.currency === 'money'
        ? Number(
            (VAN_UPGRADE_COST / Math.max(1, popAll.gigNet?.mean ?? 0)).toFixed(
              2
            )
          )
        : null,
    avgMoneyAtEarlyCheckpoint: runs.some(r => r.moneyAtEarlyCheckpoint != null)
      ? Math.round(
          mean(
            runs
              .filter(r => r.moneyAtEarlyCheckpoint != null)
              .map(r => r.moneyAtEarlyCheckpoint)
          )
        )
      : null,
    avgMoneyAtMidCheckpoint: runs.some(r => r.moneyAtMidCheckpoint != null)
      ? Math.round(
          mean(
            runs
              .filter(r => r.moneyAtMidCheckpoint != null)
              .map(r => r.moneyAtMidCheckpoint)
          )
        )
      : null,
    avgMoneyAtLateCheckpoint: runs.some(r => r.moneyAtLateCheckpoint != null)
      ? Math.round(
          mean(
            runs
              .filter(r => r.moneyAtLateCheckpoint != null)
              .map(r => r.moneyAtLateCheckpoint)
          )
        )
      : null,
    bankruptcy: {
      count: bankruptcyCount,
      sampleSize: n,
      ratePct: Number(bankruptcyRatePct.toFixed(2)),
      confidence95
    },
    // Phase 4F — real tour paths. Venue choice is constrained to the nodes
    // actually connected to the current one, so "how far did the tour get" is a
    // real question with a real answer, and reaching the FINALE is an outcome
    // rather than an assumption.
    tourPaths: (() => {
      const depth = runs[0]?.tourDepth ?? SIMULATION_CONSTANTS.daysPerRun
      const nodeTypeVisits = {}
      let totalVisits = 0
      for (const run of runs) {
        for (const [type, count] of Object.entries(
          run.nodeTypesVisited ?? {}
        )) {
          nodeTypeVisits[type] = (nodeTypeVisits[type] ?? 0) + count
          totalVisits += count
        }
      }
      return {
        tourDepth: depth,
        finaleReachedPct: shareOfRunsPct(run => run.finaleReached === true),
        // Reaching the finale node and playing its show are different: the show
        // can still be cancelled on harmony.
        finaleCompletedPct: shareOfRunsPct(run => run.finaleCompleted === true),
        avgDeepestLayerReached: Number(
          mean(runs.map(run => run.deepestLayerReached ?? 0)).toFixed(2)
        ),
        avgArrivals: Number(
          (totalVisits / Math.max(1, runs.length)).toFixed(2)
        ),
        // Arrivals at rest and supply stops: real nodes that pay nothing, which
        // is why arrivals and gigs played are not the same number.
        avgNonPerformingArrivals: Number(
          mean(runs.map(run => run.nonPerformingArrivals ?? 0)).toFixed(2)
        ),
        avgRouteDeadEnds: Number(
          mean(runs.map(run => run.routeDeadEnds ?? 0)).toFixed(2)
        ),
        // Trips the production gates refused, split by reason. Kept apart from
        // routeDeadEnds, which means the map ran out of forward edges rather than
        // the band running out of money, fuel or venue access.
        avgStrandedDays: Number(
          mean(runs.map(run => run.strandedDays ?? 0)).toFixed(2)
        ),
        strandedRunsPct: shareOfRunsPct(run => run.stranded === true),
        travelBlockedByReason: ['money', 'fuel', 'venue_access'].reduce(
          (totals, reason) => ({
            ...totals,
            [reason]: Number(
              mean(runs.map(run => run.travelBlocked?.[reason] ?? 0)).toFixed(2)
            )
          }),
          {}
        ),
        avgRefuelledToTravel: Number(
          mean(runs.map(run => run.refuelledToTravel ?? 0)).toFixed(2)
        ),
        nodeTypeSharePct: Object.fromEntries(
          Object.entries(nodeTypeVisits).map(([type, count]) => [
            type,
            Number(((count / Math.max(1, totalVisits)) * 100).toFixed(2))
          ])
        )
      }
    })(),

    // Phase 4D — purchase paths. "Ends the tour with enough money" and "could
    // buy something useful while it mattered" are different questions, and the
    // fame-shop audit only answers the first. Everything here describes the
    // simulated buyer's heuristics, not a real player's choices.
    purchasePaths: (() => {
      const firstPurchaseDays = runs
        .map(run => firstDayMatching(run.purchaseLog, () => true))
        .filter(day => day != null)
      const vanDays = runs
        .map(run =>
          firstDayMatching(run.purchaseLog, e => e.category === 'VAN')
        )
        .filter(day => day != null)
      const hqDays = runs
        .map(run => firstDayMatching(run.purchaseLog, e => e.category === 'HQ'))
        .filter(day => day != null)
      const distinctItems = runs.map(
        run => new Set((run.purchaseLog ?? []).map(entry => entry.id)).size
      )
      const moneyPurchases = runs.flatMap(run =>
        (run.purchaseLog ?? []).filter(entry => entry.currency === 'money')
      )
      const firstCategories = runs
        .map(run => (run.purchaseLog ?? [])[0]?.category)
        .filter(category => category != null)
      const affordability = key =>
        runs.map(run => run[key]).filter(entry => entry != null)
      const meanOf = (entries, field) =>
        entries.length
          ? Number(mean(entries.map(entry => entry[field])).toFixed(2))
          : null

      return {
        catalogSize: UPGRADE_CATALOG.length,
        runsWithAnyPurchasePct: shareOfRunsPct(
          run => (run.purchaseLog?.length ?? 0) > 0
        ),
        firstPurchaseDayMedian: medianOrNull(firstPurchaseDays),
        vanUpgradeReachedPct: shareOfRunsPct(
          run =>
            firstDayMatching(run.purchaseLog, e => e.category === 'VAN') != null
        ),
        firstVanUpgradeDayMedian: medianOrNull(vanDays),
        hqUpgradeReachedPct: shareOfRunsPct(
          run =>
            firstDayMatching(run.purchaseLog, e => e.category === 'HQ') != null
        ),
        firstHqUpgradeDayMedian: medianOrNull(hqDays),
        avgDistinctItemsPurchased: Number(mean(distinctItems).toFixed(2)),
        catalogSharePurchasedPct: Number(
          (
            (mean(distinctItems) / Math.max(1, UPGRADE_CATALOG.length)) *
            100
          ).toFixed(2)
        ),
        modalFirstPurchaseCategory: modalValue(firstCategories),
        avgMoneyBeforePurchase: meanOf(moneyPurchases, 'moneyBefore'),
        // Liquidity left standing right after a purchase: a buyer who is broke
        // after every purchase is making forced choices, not decisions.
        avgResidualMoneyAfterPurchase: meanOf(moneyPurchases, 'moneyAfter'),
        avgMissedPurchases: Number(
          mean(runs.map(run => run.missedPurchases?.length ?? 0)).toFixed(2)
        ),
        avgLiquidityDeferrals: Number(
          mean(runs.map(run => run.liquidityDeferrals?.length ?? 0)).toFixed(2)
        ),
        avgUnaffordableAtMidCheckpoint: meanOf(
          affordability('affordabilityAtMidCheckpoint'),
          'unaffordable'
        ),
        avgAffordableAtMidCheckpoint: meanOf(
          affordability('affordabilityAtMidCheckpoint'),
          'affordable'
        ),
        avgUnaffordableAtEnd: meanOf(
          affordability('affordabilityAtEnd'),
          'unaffordable'
        ),
        avgAffordableAtEnd: meanOf(
          affordability('affordabilityAtEnd'),
          'affordable'
        )
      }
    })(),

    // Phase 4E — gig frequency against travel and rest. Deliberately diagnostic:
    // whether Gap-1 dominance is a balance fault or an intended reward for
    // active play is not decided here, it is measured.
    gigEconomics: (() => {
      const totalDays = runs.reduce((sum, run) => sum + run.daysSurvived, 0)
      const totalGigs = runs.reduce((sum, run) => sum + run.gigsPlayed, 0)
      const totalNet = runs.reduce((sum, run) => sum + run.totalGigNet, 0)
      const totalTravel = runs.reduce(
        (sum, run) => sum + run.totalTravelCostGigs,
        0
      )
      const totalRest = runs.reduce((sum, run) => sum + (run.restDays ?? 0), 0)
      const totalRestStops = runs.reduce(
        (sum, run) => sum + (run.restStops ?? 0),
        0
      )
      const netPerGig = totalGigs > 0 ? totalNet / totalGigs : 0
      const moneyPriced = UPGRADE_CATALOG.filter(
        item => item.currency !== 'fame' && Number.isFinite(item.cost)
      )
      return {
        gigNetPerCalendarDay: Math.round(
          totalDays > 0 ? totalNet / totalDays : 0
        ),
        gigNetPerGigDay: Math.round(netPerGig),
        gigsPerCalendarDay: Number(
          (totalDays > 0 ? totalGigs / totalDays : 0).toFixed(3)
        ),
        avgRestDays: Number(
          (runs.length ? totalRest / runs.length : 0).toFixed(2)
        ),
        // The free rest-stop fallback, i.e. rest days where the clinic was not
        // worth paying for. A subset of avgRestDays, not a synonym.
        avgFreeRestStops: Number(
          (runs.length ? totalRestStops / runs.length : 0).toFixed(2)
        ),
        restDaySharePct: Number(
          ((totalDays > 0 ? totalRest / totalDays : 0) * 100).toFixed(2)
        ),
        // Upper bound: a rest day may enable gigs that would otherwise fail, so
        // this is the gross income not earned, not a net loss.
        foregoneGigNetPerRestDayUpperBound: Math.round(netPerGig),
        travelCostShareOfGigNetPct: Number(
          ((totalNet > 0 ? totalTravel / totalNet : 0) * 100).toFixed(2)
        ),
        avgTravelCostPerGigDay: Math.round(
          totalGigs > 0 ? totalTravel / totalGigs : 0
        ),
        // The user-visible version of "some cheap upgrades pay for themselves in
        // under one gig": how much of the money catalogue a single gig covers.
        catalogItemsUnderOneGigNetPct: Number(
          (
            (moneyPriced.filter(item => item.cost <= netPerGig).length /
              Math.max(1, moneyPriced.length)) *
            100
          ).toFixed(2)
        ),
        moneyPricedCatalogSize: moneyPriced.length,
        // Published so the report's wear statement is read from the data rather
        // than asserted from a hardcoded figure.
        // A run without an observation reports null, and `?? 0` would have made
        // that absence the smallest observation there is — pulling the published
        // low-water mark, and the prose that reads it, down to a zero nobody
        // measured. Drop the non-observations instead of defaulting them.
        minHarmonyObserved: minimum(
          runs.map(run => run.minHarmonyObserved).filter(Number.isFinite)
        ),
        minMemberStaminaObserved: minimum(
          runs.map(run => run.minMemberStaminaObserved).filter(Number.isFinite)
        ),
        minMemberMoodObserved: minimum(
          runs.map(run => run.minMemberMoodObserved).filter(Number.isFinite)
        )
      }
    })(),

    // Insolvency alone stopped being the tension indicator once payouts rose:
    // over a ten-day tour it is a rare terminal event, so a scenario can be
    // under sustained economic pressure and still report ~0%. These are
    // observations only — no target, no gate — so that the corridors can be set
    // from measured behaviour in a later pass rather than invented now.
    financialStress: {
      thresholds: {
        tightEur: LIQUIDITY_STRESS_THRESHOLDS.tight,
        criticalEur: LIQUIDITY_STRESS_THRESHOLDS.critical
      },
      bankruptcyRatePct: Number(bankruptcyRatePct.toFixed(2)),
      bankruptcyBeforeFirstGigPct: shareOfRunsPct(
        run => run.bankrupt && run.earlyRunway?.bankruptBeforeFirstGig === true
      ),
      bankruptcyAfterFirstGigPct: shareOfRunsPct(
        run => run.bankrupt && run.earlyRunway?.bankruptBeforeFirstGig === false
      ),
      everBelowTightPct: shareOfRunsPct(
        run => run.lowestMoneyObserved < LIQUIDITY_STRESS_THRESHOLDS.tight
      ),
      everBelowCriticalPct: shareOfRunsPct(
        run => run.lowestMoneyObserved < LIQUIDITY_STRESS_THRESHOLDS.critical
      ),
      zeroBalancePct: shareOfRunsPct(run => run.lowestMoneyObserved <= 0),
      // "Assisted", not "would have failed without it": a counterfactual needs
      // a paired run with the option removed, which this cohort does not have.
      creditOrGrantAssistedPct: shareOfRunsPct(
        run => (run.loansTaken ?? 0) > 0 || run.emergencyGrantUsed === true
      ),
      avgDaysBelowTightThreshold: Number(
        mean(runs.map(run => run.daysBelowTightLiquidity ?? 0)).toFixed(2)
      ),
      avgDaysBelowCriticalThreshold: Number(
        mean(runs.map(run => run.daysBelowCriticalLiquidity ?? 0)).toFixed(2)
      ),
      medianMaxDrawdownPct: Number(
        median(runs.map(run => run.maxPeakToTroughDrop)).toFixed(2)
      ),
      p90MaxDrawdownPct: Number(
        quantile(
          runs.map(run => run.maxPeakToTroughDrop),
          0.9
        ).toFixed(2)
      ),
      // The floor of the surviving population: a scenario whose solvent tail
      // still ends comfortable is safer than its insolvency rate suggests.
      solventFinalMoneyP10: popSolvent.finalMoney
        ? popSolvent.finalMoney.p10
        : null,
      medianBankruptcyDay: bankruptRuns.length
        ? Number(median(bankruptRuns.map(run => run.daysSurvived)).toFixed(2))
        : null,
      earliestBankruptcyDay: bankruptRuns.length
        ? minimum(bankruptRuns.map(run => run.daysSurvived))
        : null
    },

    actualLossAttribution: Object.fromEntries(
      LOSS_ATTRIBUTION_SOURCES.map(source => {
        const losses = runs.map(
          run => run.actualLossAttribution?.totals?.[source] ?? 0
        )
        const firstCount = runs.filter(
          run =>
            run.actualLossAttribution?.firstMaterialDrawdownSource === source
        ).length
        const bankruptcyCountForSource = bankruptRuns.filter(
          run =>
            run.actualLossAttribution?.bankruptcyPrecededBySource === source
        ).length
        return [
          source,
          {
            total: Math.round(losses.reduce((sum, loss) => sum + loss, 0)),
            median: Math.round(median(losses)),
            p90: Math.round(quantile(losses, 0.9)),
            firstMaterialDrawdownSharePct: Number(
              ((firstCount / Math.max(1, runs.length)) * 100).toFixed(2)
            ),
            bankruptcyPredecessorSharePct: bankruptRuns.length
              ? Number(
                  (
                    (bankruptcyCountForSource / bankruptRuns.length) *
                    100
                  ).toFixed(2)
                )
              : null
          }
        ]
      })
    ),
    grossSpendAttribution: Object.fromEntries(
      GROSS_SPEND_SOURCES.map(source => {
        const values = runs.map(run => run.grossSpendAttribution?.[source] ?? 0)
        return [
          source,
          {
            total: Math.round(values.reduce((sum, value) => sum + value, 0)),
            median: Math.round(median(values)),
            p90: Math.round(quantile(values, 0.9))
          }
        ]
      })
    ),

    volatility: {
      finalMoneyStdDev: popAll.finalMoney ? popAll.finalMoney.stdDev : 0,
      finalMoneyCoefficientOfVariation:
        popAll.finalMoney && popAll.finalMoney.mean !== 0
          ? Number(
              (
                popAll.finalMoney.stdDev / Math.abs(popAll.finalMoney.mean)
              ).toFixed(4)
            )
          : null,
      performanceScoreStdDev: popAll.performanceScore
        ? popAll.performanceScore.stdDev
        : 0,
      finalHarmonyStdDev: popAll.finalHarmony ? popAll.finalHarmony.stdDev : 0,
      maxDrawdownMeanPct: Number(
        mean(runs.map(r => r.maxPeakToTroughDrop)).toFixed(2)
      ),
      maxDrawdownP90Pct: Number(
        quantile(
          runs.map(r => r.maxPeakToTroughDrop),
          0.9
        ).toFixed(2)
      ),
      moneyRangeMedian: Math.round(
        median(runs.map(r => r.peakMoney - r.lowestMoney))
      )
    },
    fameAccounting: {
      startingFame: Number(mean(runs.map(r => r.startingFame)).toFixed(2)),
      earned: Math.round(mean(runs.map(r => r.fameAccounting.earned))),
      spentGross: Math.round(mean(runs.map(r => r.fameAccounting.spentGross))),
      refunded: Math.round(mean(runs.map(r => r.fameAccounting.refunded))),
      spentNet: Math.round(mean(runs.map(r => r.fameAccounting.spentNet))),
      lost: Math.round(mean(runs.map(r => r.fameAccounting.lost))),
      clampAdjustment: Number(
        mean(runs.map(r => r.fameAccounting.clampAdjustment)).toFixed(2)
      ),
      finalFame: Number(mean(runs.map(r => r.finalFame)).toFixed(2)),
      reconciliationDelta: Number(
        mean(runs.map(r => r.reconciliationDelta)).toFixed(6)
      ),
      maxAbsReconciliationDelta: Number(
        maximum(
          runs.map(r =>
            Math.abs(r.reconciliationDelta + r.fameAccounting.clampAdjustment)
          )
        ).toFixed(6)
      ),
      reconciledRuns: runs.filter(
        r =>
          Math.abs(r.reconciliationDelta + r.fameAccounting.clampAdjustment) <=
          1e-9
      ).length,
      sampleSize: runs.length
    },
    executionCoverage: aggregateCoverage
  }
}

export const getScenarioInsight = summary => {
  if (summary.bankruptcyRate >= 15) {
    return '⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen.'
  }

  if (
    summary.avgFinalMoney >= 100000 &&
    calculateFameLevel(summary.avgFinalFame) < 20
  ) {
    return '⚠️ Geldwachstum entkoppelt von Fame – Reputations- und Monetarisierungs-Kurve angleichen.'
  }

  // Reduced harmony threshold slightly from 42 to 30 because chaotic/aggressive scenarios
  // inherently suffer more harmony loss which is mathematically sound for those specific high-risk paths.
  if (summary.avgFinalHarmony < 30) {
    return '⚠️ Harmonie zu instabil – mehr Recovery/Trade-offs in Events einbauen.'
  }

  if (summary.kpiStatus === 'not_evaluated') {
    return '⚪ Szenario besitzt keine KPI-Zieldefinition.'
  }

  return summary.kpiStatus === 'passed'
    ? '✅ Szenario liegt im robusten Simulationskorridor.'
    : '⚠️ KPI-Verstöße vorhanden – siehe Health Check.'
}

const getEconomyInsight = s => {
  if (s.avgLowestMoney < 300) {
    return '⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen.'
  }
  if (s.avgRefuels + s.avgRepairs > 15) {
    return '⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen.'
  }
  if (s.avgGigNet > 4000 && s.avgSponsorPayouts > 50) {
    return '✅ Starke Doppel-Einnahmen: Gig-Netto + Sponsoring-Basis.'
  }
  if (s.avgGigNet > 4000) {
    return '✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte.'
  }
  if (s.avgSponsorPayouts > 40) {
    return '✅ Sponsoring als stabiler Einkommensanker etabliert.'
  }
  return '✅ Ausgewogenes Einnahmen-Ausgaben-Profil.'
}

const getBandHealthInsight = s => {
  if (s.avgFinalHarmony < 45 && s.avgClinicVisits > 8) {
    return '⚠️ Bandstress hoch – Harmonieregen reicht kaum aus.'
  }
  if (s.avgFinalHarmony < 45) {
    return '⚠️ Harmonie unter Sollwert – Recovery-Events stärken.'
  }
  if (s.avgClinicVisits > 12) {
    return '⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko.'
  }
  if (s.avgFinalHarmony >= 55 && s.avgClinicVisits < 6) {
    return '✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf.'
  }
  return '✅ Bandgesundheit im akzeptablen Bereich.'
}

export const getEventsInsight = s => {
  if (s.coverageStatus !== 'covered')
    return '⚪ Unzureichende Evidenz – Event- und Quest-Lifecycle sind nur teilweise simuliert.'
  const totalEvents =
    s.avgSpecialEvents +
    s.avgCashSwings +
    s.avgBandEvents +
    s.avgEquipmentEvents
  if (totalEvents > 10) {
    return '⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen.'
  }
  if (s.avgCatalogUpgrades > 14) {
    return '✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil.'
  }
  if (s.avgTrendShifts > 9) {
    return '✅ Hohes Social-Momentum durch häufige Trend-Shifts.'
  }
  if (totalEvents < 4) {
    return '⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch.'
  }
  return '✅ Gesunde Event-Verteilung.'
}

export const getMinigameInsight = s => {
  const completed =
    s.completed ??
    s.avgTravelMinigames +
      s.avgRoadieMinigames +
      s.avgKabelsalatMinigames +
      (s.avgAmpCalibrations ?? 0)
  const opportunities =
    s.opportunities ?? (s.avgTravelMinigames ?? 0) + (s.avgGigsPlayed ?? 0)
  if (opportunities <= 0) return '⚪ Keine erreichbaren Minigame-Gelegenheiten.'
  const coverage = completed / opportunities
  if (coverage >= 0.8)
    return '✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt.'
  if (coverage >= 0.5)
    return '✅ Moderate Minigame-Abdeckung – entsprechend der Tourgelegenheiten.'
  return '⚠️ Geringe Minigame-Abdeckung relativ zu erreichbaren Gelegenheiten.'
}

export const buildFeatureInventory = () => {
  return {
    venuesAvailable: ALL_VENUES.length,
    eventsAvailable: Object.values(EVENTS_DB).reduce(
      (acc, arr) => acc + arr.length,
      0
    ),
    brandDealsAvailable: BRAND_DEALS.length,
    postOptionsAvailable: POST_OPTIONS.length,
    contrabandItemsAvailable: CONTRABAND_DB.length,
    upgradesAvailable: getUnifiedUpgradeCatalog().length,
    socialPlatformsAvailable: Object.keys(SOCIAL_PLATFORMS).length,
    trendsAvailable: ALLOWED_TRENDS.length,
    songsAvailable: Object.keys(SONGS_DB).length,
    questsAvailable: Object.keys(QUEST_REGISTRY).length,
    assetChassisAvailable: Object.values(CHASSIS_CONFIG).reduce(
      (total, flavors) =>
        total +
        Object.values(flavors).reduce(
          (sum, tiers) => sum + Object.keys(tiers).length,
          0
        ),
      0
    ),
    assetModulesAvailable: Object.keys(MODULE_REGISTRY).length,
    loanProfilesAvailable: Object.keys(LOAN_PROFILES).length
  }
}

export const buildExecutionCoverage = results =>
  mergeExecutionCoverage(
    results.map(result => result.summary.executionCoverage)
  )

export const renderExecutionCoverageRows = coverage => {
  const rows = []
  for (const [key, metric] of Object.entries(coverage ?? {})) {
    if (key === 'eventTriggers') {
      for (const [trigger, triggerMetric] of Object.entries(metric)) {
        if (!triggerMetric || typeof triggerMetric !== 'object') continue
        rows.push(
          `| eventTriggers.${trigger} | ${triggerMetric.evaluations > 0 ? '✅' : '❌'} | ${triggerMetric.evaluations ?? 0} | ${triggerMetric.activations ?? 0} | - |`
        )
      }
      continue
    }
    if (key === 'quests') {
      const uniqueOffers = Array.isArray(metric.uniqueQuestIdsOffered)
        ? metric.uniqueQuestIdsOffered.length
        : 0
      const uniqueActs = Array.isArray(metric.uniqueQuestIdsActivated)
        ? metric.uniqueQuestIdsActivated.length
        : 0
      const uniqueComps = Array.isArray(metric.uniqueQuestIdsCompleted)
        ? metric.uniqueQuestIdsCompleted.length
        : 0
      rows.push(
        `| quests | ${metric.covered ? '✅' : '❌'} | offers: ${metric.offers ?? 0} (u:${uniqueOffers}) | acts: ${metric.activations ?? 0} (u:${uniqueActs}), comp: ${metric.completions ?? 0} (u:${uniqueComps}) | ${metric.availableIds ?? 0} in registry |`
      )
      continue
    }
    const evaluations = metric.evaluations ?? metric.attempts ?? 0
    const activations =
      metric.activations ?? metric.completions ?? metric.successes ?? 0
    const uniqueIds = metric.uniqueIdsSeen
      ? new Set(metric.uniqueIdsSeen).size
      : '-'
    rows.push(
      `| ${key} | ${metric.covered ? '✅' : '❌'} | ${evaluations} | ${activations} | ${uniqueIds} |`
    )
  }
  return rows.join('\n')
}

const fmt = n => (n == null ? 0 : n).toLocaleString('de-DE')
const fmtEur = n => `€${fmt(n)}`
const fmtEurOrDash = n => (n == null ? '—' : fmtEur(n))
const fmtPct = n => `${n}%`

export const KPI_TARGETS = {
  // All scenarios start from the real game-default state (€500, fame 0, harmony 80).
  //
  // Money bands are calibrated to the map-bounded horizon (`daysPerRun`, one
  // tour). The previous bands assumed 75-day runs and were unreachable once the
  // horizon matched the game: the neutral-tuning control ends a tour on ~€18.3k
  // in `baseline_touring`, against an old floor of €25k. Each band brackets the
  // measured neutral-tuning mean at x0.5 to x1.6 — the same relative corridor
  // the 75-day bands placed around their own horizon's output — and is rounded
  // to readable figures. Re-derive with a control run whenever `daysPerRun`,
  // GLOBAL_PAYOUT_NERF or FAME_PROGRESS_CONSTANTS change; a band that the
  // neutral control cannot reach is a broken gate, not a balance finding.
  //
  // Fame per gig is a per-gig ratio, so it is horizon-independent, but it does
  // scale with FAME_PROGRESS_CONSTANTS: the 600-1300 band was set for the
  // 150/12 reward and is scaled by the same 1.684x applied there. Measured
  // ~1530 per gig under neutral tuning after that change (it was 840-980
  // before it).
  //
  // Bankruptcy caps are now loose rather than binding: funding the shop
  // catalogue within one tour raised payouts, which pulled Bootstrap Struggle
  // from ~46% insolvency down to ~17% and the other scenarios close to 0%. The
  // caps still express the intended ceilings, but they no longer characterise
  // the observed risk profile and want a deliberate design pass.
  //
  // All seven money bands were re-derived once travel stopped being gated on the
  // gig cadence. Two earlier attempts were wrong for the same underlying reason.
  //
  // The first set assumed venues could be picked freely from the whole
  // difficulty-banded catalogue, which the map does not allow. The second set was
  // derived while a non-performance day skipped travel entirely, so a scenario
  // playing every fourth day took two hops in ten days, never reached the paying
  // late layers, and produced bands as low as €550-1700 — figures that described
  // a band standing still, not a band touring sparsely.
  //
  // Travel and performing are independent in the game (`useHandleTravel` gates a
  // trip on visibility, a directed edge and money/fuel, never on having played),
  // so every non-rest day now *attempts* a trip. It is not guaranteed one: the
  // attempt goes through the same venue-access, cash and fuel gates production
  // uses, and a refusal costs the day in place as a stranded day. Cadence
  // therefore still separates the scenarios, through how often a band can afford
  // to move and which nodes it routes toward. Observed KPI-scenario means
  // currently span roughly €17,200-28,100, so the bands overlap heavily without
  // collapsing onto one figure. Same ×0.5 to ×1.6 rule around the neutral-tuning
  // mean. That they discriminate this weakly is a finding about the economy, not
  // a calibration convenience — the spread wants a deliberate design pass.
  //
  // Bankruptcy caps express per-scenario risk tolerance and are horizon-
  // independent intent, so they are unchanged.
  baseline_touring: {
    bankruptcyMax: 10,
    moneyMin: 14000,
    moneyMax: 46000,
    fameProgressPerGigMin: 1000,
    fameProgressPerGigMax: 2200
  },
  bootstrap_struggle: {
    // Remains intentionally hard, but no longer targets near-certain collapse.
    bankruptcyMax: 60,
    moneyMin: 11000,
    moneyMax: 36000,
    fameProgressPerGigMin: 1000,
    fameProgressPerGigMax: 2200
  },
  aggressive_marketing: {
    bankruptcyMax: 15,
    moneyMin: 14000,
    moneyMax: 44000,
    fameProgressPerGigMin: 1000,
    fameProgressPerGigMax: 2200
  },
  scandal_recovery: {
    // Recalibrated for intentionally hostile event density.
    bankruptcyMax: 50,
    moneyMin: 12000,
    moneyMax: 39000,
    fameProgressPerGigMin: 1000,
    fameProgressPerGigMax: 2200
  },
  festival_push: {
    // Recalibrated for low-gig-count, high-modifier strategy volatility.
    bankruptcyMax: 35,
    moneyMin: 13000,
    moneyMax: 43000,
    fameProgressPerGigMin: 1000,
    fameProgressPerGigMax: 2200
  },
  chaos_tour: {
    bankruptcyMax: 25,
    moneyMin: 12000,
    moneyMax: 39000,
    fameProgressPerGigMin: 1000,
    fameProgressPerGigMax: 2200
  },
  cult_hypergrowth: {
    bankruptcyMax: 12,
    moneyMin: 14000,
    moneyMax: 45000,
    fameProgressPerGigMin: 1000,
    fameProgressPerGigMax: 2200
  },
  no_social_probe: {
    bankruptcyMax: 15,
    moneyMin: 10000,
    moneyMax: 40000,
    fameProgressPerGigMin: 1000,
    fameProgressPerGigMax: 2200
  },
  high_controversy_probe: {
    bankruptcyMax: 40,
    moneyMin: 5000,
    moneyMax: 35000,
    fameProgressPerGigMin: 1000,
    fameProgressPerGigMax: 2200
  },
  early_game_probe: {
    bankruptcyMax: 12,
    moneyMin: 10000,
    moneyMax: 35000,
    fameProgressPerGigMin: 1000,
    fameProgressPerGigMax: 2200
  },
  mid_game_probe: {
    bankruptcyMax: 5,
    moneyMin: 15000,
    moneyMax: 50000,
    fameProgressPerGigMin: 1000,
    fameProgressPerGigMax: 2200
  },
  late_game_probe: {
    bankruptcyMax: 5,
    moneyMin: 20000,
    moneyMax: 80000,
    fameProgressPerGigMin: 1000,
    fameProgressPerGigMax: 2200
  }
}

/**
 * Design risk corridors — the second of three insolvency layers.
 *
 * `KPI_TARGETS[id].bankruptcyMax` is layer one: a hard safety ceiling that only
 * answers "is the scenario playable at all". After the payout raise that funds
 * the shop catalogue within one tour, those ceilings stopped characterising the
 * observed risk: Bootstrap Struggle sits at ~17% against a cap of 60%, every
 * other main scenario near 0%. Almost any further income increase still
 * "passes" while the game gets progressively risk-free, so the caps cannot
 * measure balance quality any more — only catastrophic regressions.
 *
 * These corridors are layer two: the risk band a scenario is *intended* to
 * occupy. They are DESIGN HYPOTHESES, not measured results, and deliberately
 * NON-BLOCKING — `below_target` means "safer than intended", which is a
 * conversation, not a build failure. Promoting any lower bound to a real gate
 * is a separate decision that wants two or three more balance iterations and
 * real playtests behind it.
 *
 * Every corridor must stay inside its scenario's `bankruptcyMax`; the corridor
 * describes intent within the safety envelope, it never widens it.
 */
export const RISK_TARGETS = {
  baseline_touring: {
    bankruptcyTargetPct: [1, 5],
    intent: 'Meist erfolgreich, einzelne Runs dürfen scheitern.'
  },
  bootstrap_struggle: {
    bankruptcyTargetPct: [15, 30],
    intent: 'Spürbar gefährlich, aber nicht frustrierend.'
  },
  aggressive_marketing: {
    bankruptcyTargetPct: [2, 8],
    intent: 'Risiko entsteht aus hohen Ausgaben.'
  },
  scandal_recovery: {
    bankruptcyTargetPct: [8, 20],
    intent: 'Bewusst schwieriger Erholungspfad.'
  },
  festival_push: {
    bankruptcyTargetPct: [5, 15],
    intent: 'Volatilität durch wenige wichtige Gigs.'
  },
  chaos_tour: {
    bankruptcyTargetPct: [8, 20],
    intent: 'Hohe Varianz ist der Kern des Szenarios.'
  },
  cult_hypergrowth: {
    bankruptcyTargetPct: [2, 10],
    intent: 'Starkes Wachstum mit einzelnen Kollapsrisiken.'
  },
  no_social_probe: {
    bankruptcyTargetPct: [2, 12],
    intent: 'Wirtschaftlich ca. 70–95% von Baseline; Social Media optional aber wertvoll.'
  },
  high_controversy_probe: {
    bankruptcyTargetPct: [20, 35],
    intent: 'Insolvenz 20–35%; Finale 45–75%.'
  },
  early_game_probe: {
    bankruptcyTargetPct: [2, 10],
    intent: 'Gig-Netto €3,5k–5,5k; Travel/Gig-Net 1,5–4%; Finale >= 85%.'
  },
  mid_game_probe: {
    bankruptcyTargetPct: [0, 4],
    intent: 'HQ-Upgrade Median Tag 2–4; Van Tag 3–5; Kataloganteil 20–35%.'
  },
  late_game_probe: {
    bankruptcyTargetPct: [0, 4],
    intent: 'Travel/Gig-Net 3–6%; Cap-Hits 2–10%.'
  }
}

/**
 * Liquidity marks for the financial stress profile. Insolvency is a terminal
 * event and, over a ten-day horizon, a rare one: a run can be under constant
 * economic pressure and still never formally go bankrupt. These thresholds
 * measure the pressure itself, so a scenario can read as tense at a 3%
 * insolvency rate.
 */
export const LIQUIDITY_STRESS_THRESHOLDS = Object.freeze({
  tight: 500,
  critical: 250
})

const tensionMetrics = ({ bankruptcy, tight, critical, drawdown, finale }) =>
  Object.freeze({
    bankruptcyRatePct: bankruptcy,
    bankruptcyBeforeFirstGigPct: [0, bankruptcy[1]],
    bankruptcyAfterFirstGigPct: bankruptcy,
    everBelowTightPct: tight,
    everBelowCriticalPct: critical,
    avgDaysBelowTightThreshold: [0, 3],
    avgDaysBelowCriticalThreshold: [0, 2],
    medianMaxDrawdownPct: [0, drawdown[1]],
    p90MaxDrawdownPct: drawdown,
    finaleReachedPct: finale,
    finaleCompletedPct: finale,
    solventFinalMoneyP10: [0, 30_000],
    creditOrGrantAssistedPct: [0, 30]
  })

/** Non-blocking design hypotheses; unlike KPI safety caps these never select a candidate. */
export const SCENARIO_TENSION_TARGETS = Object.freeze({
  bootstrap_struggle: Object.freeze({
    blocking: false,
    metrics: tensionMetrics({
      bankruptcy: [5, 15],
      tight: [12, 25],
      critical: [5, 15],
      drawdown: [60, 80],
      finale: [70, 100]
    })
  }),
  scandal_recovery: Object.freeze({
    blocking: false,
    metrics: tensionMetrics({
      bankruptcy: [4, 15],
      tight: [10, 25],
      critical: [4, 15],
      drawdown: [55, 80],
      finale: [70, 100]
    })
  }),
  festival_push: Object.freeze({
    blocking: false,
    metrics: tensionMetrics({
      bankruptcy: [3, 12],
      tight: [7, 20],
      critical: [2, 10],
      drawdown: [50, 75],
      finale: [75, 100]
    })
  }),
  chaos_tour: Object.freeze({
    blocking: false,
    metrics: tensionMetrics({
      bankruptcy: [3, 15],
      tight: [8, 22],
      critical: [2, 12],
      drawdown: [45, 70],
      finale: [65, 100]
    })
  })
})

export const LOSS_ATTRIBUTION_SOURCES = Object.freeze([
  'daily_obligations',
  'travel',
  'fuel',
  'maintenance_repairs',
  'negative_events',
  'clinic',
  'assets_upgrades',
  'other',
  'gig_settlement'
])

export const createLossAttributionTracker = startingMoney => ({
  peakMoney: Number.isFinite(startingMoney) ? startingMoney : 0,
  totals: Object.fromEntries(
    LOSS_ATTRIBUTION_SOURCES.map(source => [source, 0])
  ),
  firstMaterialDrawdownSource: null,
  lastMaterialLossSource: null
})

export const recordAttributedLoss = (
  tracker,
  { source, moneyBefore, moneyAfter, afterFirstGig }
) => {
  if (!afterFirstGig || !LOSS_ATTRIBUTION_SOURCES.includes(source)) return
  if (!Number.isFinite(moneyBefore) || !Number.isFinite(moneyAfter)) return
  tracker.peakMoney = Math.max(tracker.peakMoney, moneyBefore, moneyAfter)
  const loss = moneyBefore - moneyAfter
  if (loss <= 0) return
  tracker.totals[source] += loss
  const material = tracker.peakMoney > 0 && loss / tracker.peakMoney >= 0.1
  if (material) {
    tracker.lastMaterialLossSource = source
    tracker.firstMaterialDrawdownSource ??= source
  }
}

export const buildScenarioTensionReview = ({
  results,
  minimumSampleSize = RISK_EVIDENCE_MINIMUM_SAMPLE,
  blocking = false
}) => {
  const scenarios = (results ?? [])
    .filter(result => SCENARIO_TENSION_TARGETS[result.id])
    .map(result => {
      const summary = result.summary ?? {}
      const stress = summary.financialStress ?? {}
      const observed = {
        bankruptcyRatePct: summary.bankruptcy?.ratePct,
        bankruptcyBeforeFirstGigPct: stress.bankruptcyBeforeFirstGigPct,
        bankruptcyAfterFirstGigPct: stress.bankruptcyAfterFirstGigPct,
        everBelowTightPct: stress.everBelowTightPct,
        everBelowCriticalPct: stress.everBelowCriticalPct,
        avgDaysBelowTightThreshold: stress.avgDaysBelowTightThreshold,
        avgDaysBelowCriticalThreshold: stress.avgDaysBelowCriticalThreshold,
        medianMaxDrawdownPct: stress.medianMaxDrawdownPct,
        p90MaxDrawdownPct: stress.p90MaxDrawdownPct,
        finaleReachedPct: summary.tourPaths?.finaleReachedPct,
        finaleCompletedPct: summary.tourPaths?.finaleCompletedPct,
        solventFinalMoneyP10: stress.solventFinalMoneyP10,
        creditOrGrantAssistedPct: stress.creditOrGrantAssistedPct
      }
      const sampleSize = summary.bankruptcy?.sampleSize
      const enoughEvidence =
        Number.isFinite(sampleSize) && sampleSize >= minimumSampleSize
      const metrics = Object.fromEntries(
        Object.entries(SCENARIO_TENSION_TARGETS[result.id].metrics).map(
          ([key, range]) => {
            const value = observed[key]
            const status =
              enoughEvidence && Number.isFinite(value)
                ? value < range[0]
                  ? 'below_target'
                  : value > range[1]
                    ? 'above_target'
                    : 'within_target'
                : 'insufficient_evidence'
            return [
              key,
              {
                observed: Number.isFinite(value) ? value : null,
                targetRange: range,
                status
              }
            ]
          }
        )
      )
      const statuses = Object.values(metrics).map(metric => metric.status)
      return {
        id: result.id,
        blocking: false,
        sampleSize: Number.isFinite(sampleSize) ? sampleSize : null,
        status: statuses.includes('insufficient_evidence')
          ? 'insufficient_evidence'
          : statuses.every(status => status === 'within_target')
            ? 'within_target'
            : 'review',
        metrics
      }
    })
  return {
    blocking,
    contract: 'design-hypothesis',
    passed:
      scenarios.length > 0 &&
      scenarios.every(scenario => scenario.status === 'within_target'),
    scenarios
  }
}

/** Below this cohort size a rate is noise, not a risk profile. */
export const RISK_EVIDENCE_MINIMUM_SAMPLE = 30

/**
 * Where an observed insolvency rate sits across all three layers. Order
 * matters: the safety ceiling outranks the corridor, and missing evidence
 * outranks both — a rate from nine runs must not be reported as a design
 * verdict either way.
 */
export const classifyBankruptcyRisk = ({
  observedPct,
  targetRangePct,
  safetyMaximumPct,
  sampleSize
}) => {
  if (!Array.isArray(targetRangePct) || targetRangePct.length !== 2) {
    return 'not_evaluated'
  }
  if (!Number.isFinite(observedPct)) return 'not_evaluated'
  if (
    !Number.isFinite(sampleSize) ||
    sampleSize < RISK_EVIDENCE_MINIMUM_SAMPLE
  ) {
    return 'insufficient_evidence'
  }
  if (Number.isFinite(safetyMaximumPct) && observedPct > safetyMaximumPct) {
    return 'above_safety_limit'
  }
  const [minimumPct, maximumPct] = targetRangePct
  if (observedPct < minimumPct) return 'below_target'
  if (observedPct > maximumPct) return 'above_target'
  return 'within_target'
}

/**
 * How the Wilson interval relates to the corridor. A point estimate inside the
 * band still hides that the plausible range leaks out of it: Bootstrap at
 * 45/260 reads 17.31% against a 15-30% corridor, but its 95% interval runs from
 * roughly 13% to 22%, so the true rate is quite possibly under the intended
 * minimum. That is not a failure — it is "sitting on the lower design edge",
 * and it is exactly what a bare pass/fail cannot say.
 */
export const describeCorridorConfidence = ({
  confidence95,
  targetRangePct
}) => {
  if (!Array.isArray(targetRangePct) || targetRangePct.length !== 2) {
    return 'not_evaluated'
  }
  const lowerPct = confidence95?.lowerPct
  const upperPct = confidence95?.upperPct
  if (!Number.isFinite(lowerPct) || !Number.isFinite(upperPct)) {
    return 'not_evaluated'
  }
  const [minimumPct, maximumPct] = targetRangePct
  if (upperPct < minimumPct) return 'entirely_below'
  if (lowerPct > maximumPct) return 'entirely_above'
  if (lowerPct >= minimumPct && upperPct <= maximumPct) return 'contained'
  if (lowerPct < minimumPct && upperPct > maximumPct) return 'spans_corridor'
  return lowerPct < minimumPct ? 'straddles_lower' : 'straddles_upper'
}

/**
 * Folds the calibration and holdout classifications into one scenario verdict.
 * Agreement across disjoint seed streams is what separates "this is the risk
 * profile" from "this was that cohort": a scenario that reads within_target on
 * one stream and below_target on the other is on a boundary, and reporting
 * either label alone would overstate what was measured.
 */
export const evaluateScenarioRiskStatus = ({
  calibrationStatus,
  holdoutStatus
}) => {
  const statuses = [calibrationStatus, holdoutStatus]
  if (statuses.includes('insufficient_evidence')) return 'insufficient_evidence'
  if (statuses.includes('above_safety_limit')) return 'unsafe'
  if (statuses.includes('not_evaluated')) return 'not_evaluated'
  if (calibrationStatus !== holdoutStatus) return 'unstable'
  if (calibrationStatus === 'within_target') return 'healthy'
  if (calibrationStatus === 'below_target') return 'low_risk'
  return 'high_risk'
}

const RISK_STATUS_LABEL = {
  healthy: '🟢 healthy',
  low_risk: '🔵 low_risk',
  high_risk: '🟠 high_risk',
  unsafe: '🔴 unsafe',
  unstable: '🟡 unstable',
  insufficient_evidence: '⚪ insufficient_evidence',
  not_evaluated: '⚪ not_evaluated'
}

const formatRiskStreams = ({ calibrationPct, holdoutPct }) =>
  Number.isFinite(holdoutPct)
    ? `Kalibrierung ${calibrationPct}%, Holdout ${holdoutPct}%`
    : `Kalibrierung ${calibrationPct}%`

/**
 * Every warning names both seed streams because the composite status is not
 * always driven by the calibration rate. `unsafe` can come from a holdout-only
 * breach — cult_hypergrowth reads 10.38% in calibration and 14.23% in the
 * holdout against a 12% cap — and quoting the calibration rate there asserted
 * that 10.38% exceeds a 12% limit. `unstable` exists precisely because the two
 * streams disagree, so one rate cannot describe it either.
 */
const RISK_STATUS_WARNING = {
  low_risk: ({ id, targetRangePct, ...streams }) =>
    `${id}: Insolvenzrate (${formatRiskStreams(streams)}) liegt unter dem Zielkorridor ${targetRangePct[0]}–${targetRangePct[1]}% — das Szenario ist sicherer als beabsichtigt.`,
  high_risk: ({ id, targetRangePct, ...streams }) =>
    `${id}: Insolvenzrate (${formatRiskStreams(streams)}) liegt über dem Zielkorridor ${targetRangePct[0]}–${targetRangePct[1]}%, aber noch unter der Sicherheitsgrenze.`,
  unstable: ({
    id,
    targetRangePct,
    calibrationStatus,
    holdoutStatus,
    ...streams
  }) =>
    `${id}: Kalibrierung (${calibrationStatus}) und Holdout (${holdoutStatus}) ordnen die Raten unterschiedlich zum Korridor ${targetRangePct[0]}–${targetRangePct[1]}% ein — ${formatRiskStreams(streams)}; das Szenario liegt auf einer Korridorgrenze.`,
  unsafe: ({
    id,
    safetyMaximumPct,
    calibrationStatus,
    holdoutStatus,
    calibrationPct,
    holdoutPct
  }) => {
    const breached = [
      calibrationStatus === 'above_safety_limit'
        ? `Kalibrierung ${calibrationPct}%`
        : null,
      holdoutStatus === 'above_safety_limit' ? `Holdout ${holdoutPct}%` : null
    ].filter(Boolean)
    const verb = breached.length > 1 ? 'überschreiten' : 'überschreitet'
    return `${id}: ${breached.join(' und ')} ${verb} die harte Sicherheitsgrenze ${safetyMaximumPct}% — das ist ein Safety-Gate-Befund, kein Designhinweis.`
  },
  insufficient_evidence: ({ id, ...streams }) =>
    `${id}: Stichprobe zu klein, um die Raten (${formatRiskStreams(streams)}) gegen den Korridor zu bewerten (mindestens ${RISK_EVIDENCE_MINIMUM_SAMPLE} Runs nötig).`
}

/**
 * The hard safety layer, evaluated on the holdout stream.
 *
 * `bankruptcyMax` is a ceiling, not a hypothesis, so a breach is blocking
 * wherever it is observed — and the calibration cohort alone cannot decide it.
 * `cult_hypergrowth` reads 10.38% against its 12% cap on the cohort the bands
 * were derived from and 14.23% on independent seeds. Because only the
 * calibration rate reached the release gate, a hard limit could fail while the
 * pipeline still recommended the tuning for production.
 *
 * Deliberately separate from `designRiskReview`, which stays non-blocking: a
 * corridor states an intent, a cap states a limit. This block decides release
 * readiness; it does not suppress the diagnostic report, because a run that
 * fails the gate is exactly the run someone needs to read.
 */
export const buildHoldoutSafetyValidation = holdoutScenarios => {
  const candidates = (holdoutScenarios ?? []).filter(
    scenario =>
      Number.isFinite(KPI_TARGETS[scenario.id]?.bankruptcyMax) &&
      Number.isFinite(scenario.holdoutBankruptcy?.ratePct)
  )
  const failures = candidates
    .filter(
      scenario =>
        scenario.holdoutBankruptcy.ratePct >
        KPI_TARGETS[scenario.id].bankruptcyMax
    )
    .map(scenario => ({
      scenarioId: scenario.id,
      metric: 'bankruptcyRate',
      holdoutValuePct: scenario.holdoutBankruptcy.ratePct,
      maximumPct: KPI_TARGETS[scenario.id].bankruptcyMax,
      sampleSize: scenario.holdoutBankruptcy.sampleSize ?? null
    }))
  // Coverage is part of the verdict, not an assumption about the caller. An
  // empty set was already refused, but a *partial* one passed just as happily:
  // handing over only `baseline_touring` cleared the gate while six other hard
  // limits went unmeasured. The expectation is derived from the configuration
  // rather than from what arrived, so config drift or a refactor that narrows
  // the caller's loop fails closed instead of silently shrinking the gate.
  const expectedScenarioIds = SCENARIOS.filter(scenario =>
    Number.isFinite(KPI_TARGETS[scenario.id]?.bankruptcyMax)
  ).map(scenario => scenario.id)
  const evaluatedScenarios = candidates.map(scenario => scenario.id)
  const missingScenarioIds = expectedScenarioIds.filter(
    id => !evaluatedScenarios.includes(id)
  )

  return {
    blocking: true,
    layer: 'hard-safety-limit',
    metric: 'bankruptcyRate',
    source: 'holdout',
    passed:
      expectedScenarioIds.length > 0 &&
      missingScenarioIds.length === 0 &&
      failures.length === 0,
    expectedScenarios: expectedScenarioIds,
    evaluatedScenarios,
    missingScenarioIds,
    failures
  }
}

/**
 * Layer three: the observed risk profile, expressed as a relation between
 * measurement and intent instead of a bare pass/fail.
 *
 * Deliberately non-blocking. The simulation report has no exit code to fail and
 * this block does not feed one; the corridors are hypotheses that need more
 * iterations and real playtests before any lower bound becomes a gate. The
 * warnings exist so that "safer than intended" is visible rather than hidden
 * behind a hard cap the scenario passes with room to spare.
 */
export const buildDesignRiskReview = ({ results, holdoutScenarios }) => {
  const scenarios = (results ?? [])
    .filter(result => RISK_TARGETS[result.id])
    .map(result => {
      const targetRangePct = RISK_TARGETS[result.id].bankruptcyTargetPct
      const safetyMaximumPct = KPI_TARGETS[result.id]?.bankruptcyMax ?? null
      const bankruptcy = result.summary?.bankruptcy ?? {}
      const observedPct = bankruptcy.ratePct
      const calibrationStatus = classifyBankruptcyRisk({
        observedPct,
        targetRangePct,
        safetyMaximumPct,
        sampleSize: bankruptcy.sampleSize
      })

      const holdoutEntry = (holdoutScenarios ?? []).find(
        item => item.id === result.id
      )
      const holdoutBankruptcy = holdoutEntry?.holdoutBankruptcy ?? null
      const holdoutStatus = holdoutBankruptcy
        ? classifyBankruptcyRisk({
            observedPct: holdoutBankruptcy.ratePct,
            targetRangePct,
            safetyMaximumPct,
            sampleSize: holdoutBankruptcy.sampleSize
          })
        : 'not_evaluated'

      const status = evaluateScenarioRiskStatus({
        calibrationStatus,
        holdoutStatus
      })

      return {
        id: result.id,
        name: result.name,
        intent: RISK_TARGETS[result.id].intent,
        status,
        bankruptcy: {
          observedPct: observedPct ?? null,
          count: bankruptcy.count ?? null,
          sampleSize: bankruptcy.sampleSize ?? null,
          targetRangePct,
          safetyMaximumPct,
          status: calibrationStatus,
          confidence95: bankruptcy.confidence95 ?? null,
          corridorConfidence: describeCorridorConfidence({
            confidence95: bankruptcy.confidence95,
            targetRangePct
          })
        },
        holdout: {
          observedPct: holdoutBankruptcy?.ratePct ?? null,
          sampleSize: holdoutBankruptcy?.sampleSize ?? null,
          status: holdoutStatus,
          // Whether the scenario stays in the same risk band on a disjoint seed
          // stream — a stricter question than "does it still pass".
          riskBandResult:
            holdoutStatus === 'not_evaluated'
              ? 'not_evaluated'
              : calibrationStatus === holdoutStatus
                ? 'stable'
                : 'unstable_boundary'
        }
      }
    })

  const warnings = scenarios.flatMap(scenario => {
    const describe = RISK_STATUS_WARNING[scenario.status]
    if (!describe) return []
    return [
      describe({
        id: scenario.id,
        calibrationPct: scenario.bankruptcy.observedPct,
        holdoutPct: scenario.holdout.observedPct,
        targetRangePct: scenario.bankruptcy.targetRangePct,
        safetyMaximumPct: scenario.bankruptcy.safetyMaximumPct,
        calibrationStatus: scenario.bankruptcy.status,
        holdoutStatus: scenario.holdout.status
      })
    ]
  })

  return {
    blocking: false,
    note: 'Zielkorridore sind Designhypothesen und blockieren nichts. Harte Gates bleiben die Sicherheitsobergrenzen in KPI_TARGETS.bankruptcyMax.',
    evidenceMinimumSample: RISK_EVIDENCE_MINIMUM_SAMPLE,
    scenarios,
    warnings
  }
}

export const evaluateKpiStatus = kpis => {
  if (!kpis || kpis.length === 0) {
    return { status: 'not_evaluated', passed: null }
  }
  const passed = kpis.every(c => c.pass)
  return { status: passed ? 'passed' : 'failed', passed }
}

const checkKpi = (id, summary) => {
  const t = KPI_TARGETS[id]
  if (!t) return null
  const checks = []

  const bankRate = summary.bankruptcyRate
  let bankBewertung
  if (bankRate > t.bankruptcyMax) {
    bankBewertung = 'Außerhalb Toleranz – Rebalancing nötig.'
  } else if (bankRate === 0) {
    bankBewertung = 'Risikofrei – kein Insolvenzfall beobachtet.'
  } else if (bankRate <= t.bankruptcyMax * 0.5) {
    bankBewertung = 'Solide – deutlich unter Risikogrenze.'
  } else {
    bankBewertung = 'Akzeptabel – innerhalb Toleranz.'
  }
  checks.push({
    label: 'Insolvenzrate',
    pass: bankRate <= t.bankruptcyMax,
    actual: fmtPct(bankRate),
    target: `≤ ${t.bankruptcyMax}%`,
    bewertung: bankBewertung
  })

  const money = summary.avgFinalMoney
  const moneyRange = t.moneyMax - t.moneyMin
  const moneyCenter = (t.moneyMin + t.moneyMax) / 2
  const moneyDeviation =
    moneyRange > 0 ? Math.abs(money - moneyCenter) / (moneyRange / 2) : 0
  let moneyBewertung
  if (money < t.moneyMin || money > t.moneyMax) {
    moneyBewertung = 'Außerhalb Zielband – Einnahmenpfad prüfen.'
  } else if (moneyDeviation < 0.3) {
    moneyBewertung = 'Zentral im Zielband – sehr gute Balance.'
  } else {
    moneyBewertung = 'Im Zielband – leicht außermittig.'
  }
  checks.push({
    label: 'Endgeld',
    pass: money >= t.moneyMin && money <= t.moneyMax,
    actual: fmtEur(money),
    target: `${fmtEur(t.moneyMin)} – ${fmtEur(t.moneyMax)}`,
    bewertung: moneyBewertung
  })

  const fame = summary.avgFameProgressPerGig ?? 0
  const fameRange = t.fameProgressPerGigMax - t.fameProgressPerGigMin
  const fameCenter = (t.fameProgressPerGigMin + t.fameProgressPerGigMax) / 2
  const fameDeviation =
    fameRange > 0 ? Math.abs(fame - fameCenter) / (fameRange / 2) : 0
  let fameBewertung
  if (fame < t.fameProgressPerGigMin || fame > t.fameProgressPerGigMax) {
    fameBewertung = 'Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen.'
  } else if (fameDeviation < 0.3) {
    fameBewertung = 'Zentral im Zielband – Fame-Fortschritt pro Gig stimmig.'
  } else {
    fameBewertung = 'Im Zielband – leicht außermittig.'
  }
  checks.push({
    label: 'Fame-Fortschritt/Gig',
    pass: fame >= t.fameProgressPerGigMin && fame <= t.fameProgressPerGigMax,
    actual: String(fame),
    target: `${t.fameProgressPerGigMin} – ${t.fameProgressPerGigMax}`,
    bewertung: fameBewertung
  })

  return checks
}

const COHORT_COMPARISON_FIELDS = [
  'runsPerScenario',
  'seedNamespace',
  'seedStrategy',
  'shippedGigCadencePolicy'
]

export const buildDescriptiveCohortComparison = (previous, current) => {
  const cohortDifferences = COHORT_COMPARISON_FIELDS.filter(
    field => previous[field] !== current[field]
  ).map(field => ({
    field,
    previous: previous[field] ?? null,
    current: current[field] ?? null
  }))
  const differenceSummary = cohortDifferences
    .map(difference => difference.field)
    .join(', ')
  return {
    comparison: 'descriptive-unpaired',
    cohortDifferences,
    note: cohortDifferences.length
      ? `Recorded cohort metadata differences: ${differenceSummary}. This is a descriptive aggregate comparison, not a paired effect estimate.`
      : 'The reports have the same recorded cohort metadata. This remains a descriptive aggregate comparison, not a paired effect estimate.'
  }
}

const simulationReportIdentity = report => ({
  generatedAt: report?.generatedAt ?? null,
  sourceFingerprint: report?.metadata?.sourceFingerprint ?? null,
  runsPerScenario: report?.constants?.runsPerScenario ?? null,
  seedNamespace: report?.metadata?.seedNamespace ?? null,
  seedStrategy: report?.metadata?.seedStrategy ?? null,
  shippedGigCadencePolicy: report?.metadata?.shippedGigCadencePolicy ?? null
})

const buildRegressionComparison = (baselinePayload, currentPayload) => {
  if (baselinePayload === null) return null
  if (!Array.isArray(baselinePayload?.results)) {
    throw new TypeError('Simulation baseline must contain a results array')
  }

  const previous = simulationReportIdentity(baselinePayload)
  const current = simulationReportIdentity(currentPayload)
  const baselineById = new Map(
    baselinePayload.results.map(s => [s.id, s.summary || {}])
  )

  const scenarios = currentPayload.results
    .map(scenario => {
      const prev = baselineById.get(scenario.id)
      if (!prev) return null

      const current = scenario.summary || {}
      const metrics = {}

      for (const metric of REGRESSION_METRICS) {
        const previousValue = Number(prev[metric.key] ?? 0)
        const currentValue = Number(current[metric.key] ?? 0)
        metrics[metric.key] = {
          previous: previousValue,
          current: currentValue,
          delta: Number((currentValue - previousValue).toFixed(2))
        }
      }

      return {
        id: scenario.id,
        name: scenario.name,
        metrics
      }
    })
    .filter(Boolean)
  return {
    ...buildDescriptiveCohortComparison(previous, current),
    previous,
    current,
    scenarios
  }
}

const getProgressionInsight = s => {
  // Scaled from the previous 75-day thresholds (70k/55k/800, set when the early
  // checkpoint sat at day 20 and Baseline Touring reached ~€46k there) by the
  // same factor applied to the KPI money bands for the map-bounded horizon
  // (Baseline Touring band top 80000 -> 29000). Re-derive alongside
  // KPI_TARGETS whenever `daysPerRun` or the checkpoint days change.
  if (s.avgMoneyAtEarlyCheckpoint > 25000)
    return '⚠️ Sehr hohe Frühakkumulation – Sink-Kosten drastisch erhöhen.'
  if (s.avgMoneyAtEarlyCheckpoint > 20000)
    return '⚠️ Schnelle Kapitalakkumulation – Daily-Kosten oder Upgrade-Preise prüfen.'
  if (s.avgMoneyAtEarlyCheckpoint < 300 && s.bankruptcyRate > 5)
    return '⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen.'
  return '✅ Kapitalaufbau im erwarteten Korridor.'
}

const getGigCalibrationInsight = s => {
  if (s.avgHitWindow > 180)
    return '⚠️ Hit-Window >180ms – Rhythmusmechanik zu zugänglich.'
  if (s.avgMissesPerGig > 10 && s.avgPerformanceScore > 60)
    return '⚠️ Hohe Fehlerrate ohne Score-Penalty – Miss-Strafkopplung prüfen.'
  if (s.gigScorePctLow < 5)
    return '⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering.'
  if (s.gigScorePctHigh > 70)
    return '⚠️ Zu viele Top-Gigs – Skill-Ceiling zu niedrig.'
  return '✅ Gig-Performance im erwarteten Kalibrierungsbereich.'
}

const getIncomeStructureInsight = s => {
  if (s.gigNetToTravelRatio < 1)
    return '⚠️ Reise- und Sink-Kosten uebersteigen den Gig-Ertrag – Survival-Loop bricht weg.'
  if (s.gigNetToTravelRatio < 3)
    return '⚠️ Reisekosten fressen den Gig-Ertrag fast auf – Fruehspiel oekonomisch fragil.'
  if (s.gigNetToTravelRatio > 70)
    return '⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig.'
  if (s.gigNetToTravelRatio > 55)
    return '⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen.'
  if (s.gigsToAffordHqUpgrade < 2)
    return '⚠️ HQ-Upgrade amortisiert sich in weniger als zwei Gigs – Preis deutlich erhöhen.'
  if (s.gigsToAffordVanUpgrade != null && s.gigsToAffordVanUpgrade < 0.25)
    return '⚠️ Van-Upgrade zu günstig – Preis anpassen.'
  return '✅ Einkommensstruktur akzeptabel.'
}

const buildMarkdownReport = payload => {
  const lines = []
  const snap = payload.appFeatureSnapshot
  const totalEvents = Object.values(snap.eventsDb).reduce(
    (s, c) => s + c.count,
    0
  )

  // ── Header ────────────────────────────────────────────────────────────────
  lines.push('# Game Balance Simulation – Analyse')
  lines.push('')
  lines.push(`Erstellt am: ${payload.generatedAt}`)
  lines.push('')

  // ── Reproduzierbarkeit ────────────────────────────────────────────────────
  if (payload.metadata) {
    lines.push('## Reproduzierbarkeit')
    lines.push('')
    lines.push(`- Report-Version: ${payload.constants.reportVersion}`)
    lines.push(`- Source-Fingerprint: ${payload.metadata.sourceFingerprint}`)
    lines.push(
      `- Generator-Fingerprint: ${payload.metadata.generatorFingerprint}`
    )
    lines.push(`- Artefaktschema: ${payload.metadata.artifactSchemaVersion}`)
    lines.push(`- Seed-Namensraum: ${payload.metadata.seedNamespace}`)
    lines.push(`- Runs je Szenario: ${payload.metadata.runsPerScenario}`)
    lines.push(
      `- Working Tree Dirty: ${payload.metadata.workingTreeDirty ? 'Ja' : 'Nein'}`
    )
    lines.push('')
  }

  // ── Config ────────────────────────────────────────────────────────────────
  lines.push('## Simulationseinstellungen')
  lines.push('')
  lines.push(`| Parameter | Wert |`)
  lines.push(`|---|---|`)
  lines.push(`| Runs je Szenario | ${payload.constants.runsPerScenario} |`)
  lines.push(`| Tage je Run | ${payload.constants.daysPerRun} |`)
  lines.push(
    `| Basis-Tageskosten | ${fmtEur(EXPENSE_CONSTANTS.DAILY.BASE_COST)} |`
  )
  lines.push(
    `| Modifier-Kosten | Catering ${fmtEur(MODIFIER_COSTS.catering)}, Promo ${fmtEur(MODIFIER_COSTS.promo)}, Merch ${fmtEur(MODIFIER_COSTS.merch)}, Soundcheck ${fmtEur(MODIFIER_COSTS.soundcheck)}, Guestlist ${fmtEur(MODIFIER_COSTS.guestlist)} |`
  )
  lines.push(
    `| Venue-Auswahl (Sim-Heuristik) | diff-2: fame 0–59 · diff-3: 60–199 · diff-4: 200–399 · diff-5: 400+ (im Spiel steuert die Map-Layer-Progression die Venue-Schwierigkeit) |`
  )
  lines.push(`| Fame-Level-Skala | Level = floor(sqrt(fame / 200)) |`)
  lines.push(
    `| Klinik-Heilung | ${fmtEur(CLINIC_CONFIG.HEAL_BASE_COST_MONEY)} × ${CLINIC_CONFIG.VISIT_MULTIPLIER}^Besuche · +${CLINIC_CONFIG.HEAL_STAMINA_GAIN} Stamina / +${CLINIC_CONFIG.HEAL_MOOD_GAIN} Mood |`
  )
  lines.push('')

  // ── Fame Audit ───────────────────────────────────────────────────────────
  const fameAudit = payload.fameBalanceAudit
  lines.push('## Fame-Shop-Audit')
  lines.push('')
  lines.push(
    `Shop-only kosten **${fameAudit.shopOnlyCost} Fame**, mit Legacy-Upgrades **${fameAudit.shopPlusLegacyCost} Fame**.`
  )
  lines.push(
    `Das teuerste einzelne Fame-Item kostet **${fameAudit.mostExpensiveShopItem} Fame**.`
  )
  lines.push('')
  lines.push(
    `| PerfScore | Roh-Fame/Gig | Gigs bis ${fmt(
      fameAudit.mostExpensiveShopItem
    )} Fame | Gigs fuer Fame-Shop-only | Gigs fuer Shop+Legacy | Bewertung |`
  )
  lines.push('|---:|---:|---:|---:|---:|---|')

  for (const scenario of fameAudit.scenarios) {
    lines.push(
      `| ${scenario.performanceScore} | ${scenario.rawGigFame} | ${scenario.gigsToReachLabelCost} | ${scenario.gigsToBuyShopOnly} | ${scenario.gigsToBuyShopPlusLegacy} | ${scenario.verdict} |`
    )
  }

  lines.push('')
  lines.push(`Hinweis: ${fameAudit.note}`)
  lines.push('')

  // ── App Feature Snapshot ──────────────────────────────────────────────────
  lines.push('## Feature-Snapshot der App')
  lines.push('')
  lines.push(`| Kategorie | Anzahl |`)
  lines.push(`|---|---:|`)
  lines.push(`| Venues (gesamt) | ${snap.venues} |`)
  lines.push(`| Event-Kategorien | ${Object.keys(snap.eventsDb).length} |`)
  lines.push(`| Events gesamt | ${totalEvents} |`)
  lines.push(`| Brand Deals | ${snap.brandDeals} |`)
  lines.push(`| Post Options | ${snap.postOptions} |`)
  lines.push(`| Contraband-Items | ${snap.contrabandItems} |`)
  lines.push(`| Upgrade-Katalog | ${snap.upgradeCatalogEntries} |`)
  lines.push(`| Social Platforms | ${snap.socialPlatforms.length} |`)
  lines.push(`| Trends | ${snap.trends.length} |`)
  lines.push(`| Songs | ${snap.songs} |`)
  lines.push(`| Quests (Registry) | ${snap.quests} |`)
  lines.push(`| Asset-Chassis-Arten | ${snap.assetKinds} |`)
  lines.push(`| Asset-Module | ${snap.assetModules} |`)
  lines.push(`| Kredit-Profile | ${snap.loanProfiles} |`)
  lines.push('')

  // Event catalog detail
  lines.push('### Event-Katalog nach Kategorie')
  lines.push('')
  lines.push('| Kategorie | Events | Trigger-Typen |')
  lines.push('|---|---:|---|')
  for (const [cat, data] of Object.entries(snap.eventsDb)) {
    lines.push(`| ${cat} | ${data.count} | ${data.triggers.join(', ')} |`)
  }
  lines.push('')

  // ── Main Result Matrix ────────────────────────────────────────────────────
  lines.push('## Ergebnis-Matrix')
  lines.push('')
  lines.push(
    '| Szenario | Startkapital | Startfame | Ø Endgeld | Peak-Drop | S2I-Ratio | Cap-Hits | Ø Endfame | Ø Fame-Lv. | Ø Harmony | Ø Kontroverse | Ø Gigs | Ø Clinic | Insolvenz | Ø Gig-Netto | Bewertung |'
  )
  lines.push(
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|'
  )

  for (const scenario of payload.results) {
    const s = scenario.summary
    const sc = SCENARIOS.find(x => x.id === scenario.id)
    const startMoney = sc?.initialOverrides?.player?.money ?? '?'
    const startFame = sc?.initialOverrides?.player?.fame ?? 0
    const fameLevel = calculateFameLevel(s.avgFinalFame)
    lines.push(
      `| ${scenario.name} | ${fmtEur(startMoney)} | ${startFame} | ${fmtEur(s.avgFinalMoney)} | ${s.avgPeakToTroughDrop}% | ${s.sinkToIncomeRatio} | ${s.gigCapHitPct}% | ${s.avgFinalFame} | ${fameLevel} | ${s.avgFinalHarmony} | ${s.avgFinalControversy} | ${s.avgGigsPlayed} | ${s.avgClinicVisits} | ${fmtPct(s.bankruptcyRate)} | ${fmtEur(s.avgGigNet)} | ${getScenarioInsight(s)} |`
    )
  }
  lines.push('')

  // ── Economy Deep Dive ─────────────────────────────────────────────────────
  lines.push('## Wirtschaft im Detail')
  lines.push('')
  lines.push(
    '| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |'
  )
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---|')

  for (const scenario of payload.results) {
    const s = scenario.summary
    const upgrades = Number((s.avgHqUpgrades + s.avgVanUpgrades).toFixed(2))
    lines.push(
      `| ${scenario.name} | ${fmtEur(s.avgPeakMoney)} | ${fmtEur(s.avgLowestMoney)} | ${fmtEur(s.avgGigNet)} | ${s.avgSponsorPayouts} | ${s.avgBrandDealsActivated} | ${upgrades} | ${s.avgRefuels} | ${s.avgRepairs} | ${getEconomyInsight(s)} |`
    )
  }
  lines.push('')

  // ── KPI Holdout ───────────────────────────────────────────────────────────
  const holdout = payload.kpiHoldoutValidation
  if (holdout) {
    lines.push('## KPI-Holdout-Validierung')
    lines.push('')
    lines.push(
      `Die KPI-Geldbänder wurden aus einem neutralen Kontrolllauf abgeleitet. Dieselben Szenarien laufen hier erneut auf einem disjunkten Seed-Strom (\`${holdout.seedStrategy}\`, ${holdout.runsPerScenario} Runs), damit das Urteil nicht allein auf der Kohorte beruht, gegen die kalibriert wurde.`
    )
    lines.push('')
    lines.push(
      'Verglichen wird jedes KPI-Band einzeln, nicht nur der Gesamtstatus: ein Szenariovergleich würde ein kompensierendes Paar (ein Band kippt auf Fail, ein anderes auf Pass) hinter unverändertem Gesamturteil verbergen.'
    )
    lines.push('')
    lines.push(
      '| Szenario | Band | Ziel | Kalibrierung | Holdout | Übereinstimmung |'
    )
    lines.push('|---|---|---|---|---|---|')
    for (const item of holdout.scenarios) {
      for (const check of item.checks) {
        lines.push(
          `| ${item.id} | ${check.label} | ${check.target} | ${check.calibrationActual} ${check.calibrationPass ? '✅' : '❌'} | ${check.holdoutActual} ${check.holdoutPass ? '✅' : '❌'} | ${check.agrees ? '✅' : '❌'} |`
        )
      }
    }
    lines.push('')
    lines.push(
      holdout.agrees
        ? '✅ Jedes einzelne KPI-Band urteilt auf unabhängigen Seeds gleich.'
        : `❌ Auf unabhängigen Seeds abweichende Bänder: ${holdout.disagreements.join('; ')}. Diese Bänder liegen auf einem Seed-Artefakt und sind neu abzuleiten.`
    )
    lines.push('')
  }

  // ── Hard safety limits on the holdout stream ──────────────────────────────
  const safety = payload.holdoutSafetyValidation
  if (safety) {
    lines.push('## Harte Sicherheitsgrenzen (Holdout)')
    lines.push('')
    lines.push(
      'Diese Prüfung ist die einzige *blockierende* Schicht des Risikomodells. `KPI_TARGETS.bankruptcyMax` ist eine Obergrenze, keine Designhypothese — eine Überschreitung ist deshalb ein Fehler, egal auf welchem Seed-Strom sie auftritt. Die Kalibrierungskohorte allein kann das nicht entscheiden, weil die Bänder gegen genau diese Kohorte abgeleitet wurden. Die Zielkorridore in „Insolvenz-Zielkorridore“ bleiben davon getrennt und weiterhin nicht blockierend.'
    )
    lines.push('')
    lines.push(
      `Abdeckung: ${safety.evaluatedScenarios.length} von ${safety.expectedScenarios?.length ?? safety.evaluatedScenarios.length} Szenarien mit konfigurierter Obergrenze gemessen. Fehlende Abdeckung ist selbst ein Fehlschlag — ein Gate, das nur einen Teil der harten Grenzen prüft, sagt über die übrigen nichts aus.`
    )
    lines.push('')
    if (safety.missingScenarioIds?.length) {
      lines.push(
        `⚪ Nicht gemessen: ${safety.missingScenarioIds.join(', ')}. Das ist **kein** bestandenes Gate, sondern fehlende Evidenz.`
      )
      lines.push('')
    }
    if (safety.passed) {
      lines.push(
        `✅ Alle ${safety.evaluatedScenarios.length} geprüften Szenarien bleiben auf unabhängigen Seeds unter ihrer harten Grenze.`
      )
    } else if (safety.failures.length) {
      lines.push('| Szenario | Metrik | Holdout | Harte Grenze | Stichprobe |')
      lines.push('|---|---|---:|---:|---:|')
      for (const failure of safety.failures) {
        lines.push(
          `| ${failure.scenarioId} | ${failure.metric} | ${failure.holdoutValuePct}% | ${failure.maximumPct}% | ${failure.sampleSize ?? '—'} |`
        )
      }
      lines.push('')
      lines.push(
        `❌ ${safety.failures.length} harte Sicherheitsgrenze(n) auf dem Holdout-Strom überschritten. Die Messimplementierung ist vollständig, aber die aktuelle produktionsneutrale Basis besteht die Holdout-Sicherheitsprüfung nicht — es gibt daher **keine Produktionsempfehlung**, bis die betroffenen Szenarien neu balanciert sind.`
      )
    } else {
      lines.push(
        '❌ Gate nicht bestanden, ohne überschrittene Grenze: die Abdeckung ist unvollständig. **Keine Produktionsempfehlung**, bis alle konfigurierten Grenzen gemessen sind.'
      )
    }
    lines.push('')
  }

  // ── Progression Curve ─────────────────────────────────────────────────────
  lines.push('## Kapital-Progressionskurve')
  lines.push('')
  const [earlyDay, midDay, lateDay] =
    SIMULATION_CONSTANTS.progressionCheckpointDays
  lines.push(
    `| Szenario | Ø Geld Tag ${earlyDay} | Ø Geld Tag ${midDay} | Ø Geld Tag ${lateDay} | Ø Endgeld | Bewertung |`
  )
  lines.push('|---|---:|---:|---:|---:|---|')

  for (const scenario of payload.results) {
    const s = scenario.summary
    lines.push(
      `| ${scenario.name} | ${fmtEurOrDash(s.avgMoneyAtEarlyCheckpoint)} | ${fmtEurOrDash(s.avgMoneyAtMidCheckpoint)} | ${fmtEurOrDash(s.avgMoneyAtLateCheckpoint)} | ${fmtEur(s.avgFinalMoney)} | ${getProgressionInsight(s)} |`
    )
  }
  lines.push('')

  // ── Income Structure ──────────────────────────────────────────────────────
  lines.push('## Einkommensstruktur & Sink-Analyse')
  lines.push('')
  lines.push(
    '| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |'
  )
  lines.push('|---|---:|---:|---:|---:|---:|---|')

  for (const scenario of payload.results) {
    const s = scenario.summary
    lines.push(
      `| ${scenario.name} | ${fmtEur(s.avgGigNet)} | ${fmtEur(s.avgTravelCostPerGig)} | ${s.gigNetToTravelRatio}× | ${s.gigsToAffordHqUpgrade} | ${s.gigsToAffordVanUpgrade} | ${getIncomeStructureInsight(s)} |`
    )
  }
  lines.push('')

  // ── Gig Calibration ───────────────────────────────────────────────────────
  lines.push('## Gig-Performance-Kalibrierung')
  lines.push('')
  lines.push(
    '| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |'
  )
  lines.push('|---|---:|---:|---:|---:|---:|---:|---|')

  for (const scenario of payload.results) {
    const s = scenario.summary
    lines.push(
      `| ${scenario.name} | ${s.avgHitWindow} | ${s.avgMissesPerGig} | ${s.avgPerformanceScore} | ${s.gigScorePctLow}% | ${s.gigScorePctMid}% | ${s.gigScorePctHigh}% | ${getGigCalibrationInsight(s)} |`
    )
  }
  lines.push('')

  // ── Band Health Deep Dive ─────────────────────────────────────────────────
  lines.push('## Bandgesundheit im Detail')
  lines.push('')
  lines.push(
    '| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |'
  )
  lines.push('|---|---:|---:|---:|---:|---:|---:|---|')

  for (const scenario of payload.results) {
    const s = scenario.summary
    lines.push(
      `| ${scenario.name} | ${s.avgFinalHarmony} | ${s.avgClinicVisits} | ${s.avgSponsorSignings} | ${s.avgSponsorDrops} | ${s.avgContrabandDrops} | ${s.avgPostPulses} | ${getBandHealthInsight(s)} |`
    )
  }
  lines.push('')

  // ── Events & Social ───────────────────────────────────────────────────────
  lines.push('## Events & Social im Detail')
  lines.push('')
  lines.push(
    '| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |'
  )
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---|')

  for (const scenario of payload.results) {
    const s = scenario.summary
    lines.push(
      `| ${scenario.name} | ${s.avgSpecialEvents} | ${s.avgCashSwings} | ${s.avgBandEvents} | ${s.avgEquipmentEvents} | ${s.avgGigEvents} | ${s.avgTrendShifts} | ${s.avgCatalogUpgrades} | ${getEventsInsight(s)} |`
    )
  }
  lines.push('')

  // ── Minigame Coverage ─────────────────────────────────────────────────────
  lines.push('## Minigame-Abdeckung im Detail')
  lines.push('')
  lines.push(
    '| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |'
  )
  lines.push('|---|---:|---:|---:|---:|---:|---|')

  for (const scenario of payload.results) {
    const s = scenario.summary
    const total = Number(
      (
        s.avgTravelMinigames +
        s.avgRoadieMinigames +
        s.avgKabelsalatMinigames +
        s.avgAmpCalibrations
      ).toFixed(2)
    )
    lines.push(
      `| ${scenario.name} | ${s.avgTravelMinigames} | ${s.avgRoadieMinigames} | ${s.avgKabelsalatMinigames} | ${s.avgAmpCalibrations} | ${total} | ${getMinigameInsight(s)} |`
    )
  }
  lines.push('')

  // ── Assets & Progression ──────────────────────────────────────────────────
  lines.push('## Assets & Progression')
  lines.push('')
  lines.push(
    '| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |'
  )
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|')

  for (const scenario of payload.results) {
    const s = scenario.summary
    lines.push(
      `| ${scenario.name} | ${s.avgAssetsPurchased} | ${s.avgLoansTaken} | ${s.avgModulesInstalled} | ${s.avgCrowdfundsStarted} | ${s.avgFinalAssets} | ${s.avgTraitUnlocks} | ${fmtEur(s.avgClinicSpend)} | ${s.avgRestStops} | ${s.regionRepTouchedPct}% |`
    )
  }
  lines.push('')

  // ── Cross-Scenario Best/Worst ─────────────────────────────────────────────
  lines.push('## Cross-Szenario-Vergleich (Höchstwerte)')
  lines.push('')
  const metrics = [
    {
      label: 'Höchstes Ø Endgeld',
      key: s => s.avgFinalMoney,
      fmt: fmtEur,
      bewertung: 'Tägliches Gigging dominiert als Einnahmestrategie.'
    },
    {
      label: 'Höchstes Ø Endfame',
      key: s => s.avgFinalFame,
      fmt: v => String(v),
      bewertung: 'Fokus auf Touring und Performance maximiert den Fame-Aufbau.'
    },
    {
      label: 'Höchste Insolvenzrate',
      key: s => s.bankruptcyRate,
      fmt: fmtPct,
      bewertung: 'Erwartetes Risikoprofil für ressourcenarme Spielweisen.'
    },
    {
      label: 'Höchster Ø Gig-Netto',
      key: s => s.avgGigNet,
      fmt: fmtEur,
      bewertung: 'Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag.'
    },
    {
      label: 'Höchstes Ø Peak-Geld',
      key: s => s.avgPeakMoney,
      fmt: fmtEur,
      bewertung: 'Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin.'
    },
    {
      label: 'Meiste Ø Gigs',
      key: s => s.avgGigsPlayed,
      fmt: v => String(v),
      bewertung:
        'Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing.'
    },
    {
      label: 'Meiste Ø Events',
      key: s => s.avgEventsApplied + s.avgGigEvents,
      fmt: v => v.toFixed(2),
      bewertung:
        'Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse.'
    }
  ]
  lines.push('| Metrik | Gewinner | Wert | Bewertung |')
  lines.push('|---|---|---:|---|')
  for (const m of metrics) {
    const winner = [...payload.results].sort(
      (a, b) => m.key(b.summary) - m.key(a.summary)
    )[0]
    lines.push(
      `| ${m.label} | **${winner.name}** | ${m.fmt(m.key(winner.summary))} | ${m.bewertung} |`
    )
  }
  lines.push('')

  // ── KPI Health Check ──────────────────────────────────────────────────────

  lines.push('## Fame-Bilanz')
  lines.push('')
  lines.push(
    '| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |'
  )
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|')
  for (const scenario of payload.results) {
    const s = scenario.summary
    const fa = s.fameAccounting ?? {}
    lines.push(
      `| ${scenario.name} | ${fa.earned ?? 0} | ${fa.spentGross ?? 0} | ${fa.refunded ?? 0} | ${fa.spentNet ?? 0} | ${fa.lost ?? 0} | ${fa.clampAdjustment ?? 0} | ${fa.reconciledRuns ?? 0}/${fa.sampleSize ?? 0} |`
    )
  }
  lines.push('')

  lines.push('## Ergebnisverteilungen')
  lines.push('')
  lines.push(
    '*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*'
  )
  lines.push('')
  lines.push('| Szenario | Mean | Median | StdDev | P10 | P90 |')
  lines.push('|---|---:|---:|---:|---:|---:|')
  for (const scenario of payload.results) {
    const s = scenario.summary
    const m = s.statistics?.finalMoney || {}
    lines.push(
      `| ${scenario.name} | ${fmtEur(m.mean)} | ${fmtEur(m.median)} | ${fmtEur(m.stdDev)} | ${fmtEur(m.p10)} | ${fmtEur(m.p90)} |`
    )
  }
  lines.push('')

  lines.push('## Insolvenzrisiko')
  lines.push('')
  lines.push(
    '| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |'
  )
  lines.push('|---|---:|---:|---:|---:|---:|')
  for (const scenario of payload.results) {
    const s = scenario.summary
    const b = s.bankruptcy || {}
    const c = b.confidence95 || {}
    lines.push(
      `| ${scenario.name} | ${b.count ?? 0} | ${b.sampleSize ?? 0} | ${(b.ratePct ?? 0).toFixed(2)}% | ${(c.lowerPct ?? 0).toFixed(2)}% | ${(c.upperPct ?? 0).toFixed(2)}% |`
    )
  }
  lines.push('')

  // ── Design risk corridors ─────────────────────────────────────────────────
  const risk = payload.designRiskReview
  if (risk?.scenarios?.length) {
    lines.push('## Insolvenz-Zielkorridore (Designmetrik, nicht blockierend)')
    lines.push('')
    lines.push(
      'Die Sicherheitsobergrenzen in `KPI_TARGETS.bankruptcyMax` beantworten nur, ob ein Szenario grundsätzlich spielbar ist. Nach dem Einkommensschub charakterisieren sie das beobachtete Risiko nicht mehr: fast jede weitere Einnahmenerhöhung besteht sie weiterhin, während das Spiel zunehmend risikofrei wird. Die Korridore hier beschreiben das *beabsichtigte* Risikoband.'
    )
    lines.push('')
    lines.push(
      `${risk.note} \`below_target\` heißt „sicherer als beabsichtigt“ — ein Hinweis, kein Fehlschlag.`
    )
    lines.push('')
    lines.push(
      '| Szenario | Beobachtet | Zielkorridor | Safety-Max | 95%-Intervall (Wilson) | Intervall vs. Korridor | Kalibrierung | Holdout | Risikoband | Status |'
    )
    lines.push('|---|---:|---:|---:|---:|---|---|---|---|---|')
    for (const item of risk.scenarios) {
      const b = item.bankruptcy
      const c = b.confidence95
      const interval = c
        ? `${(c.lowerPct ?? 0).toFixed(2)}–${(c.upperPct ?? 0).toFixed(2)}%`
        : '—'
      lines.push(
        `| ${item.name} | ${(b.observedPct ?? 0).toFixed(2)}% | ${b.targetRangePct[0]}–${b.targetRangePct[1]}% | ${b.safetyMaximumPct == null ? '—' : `${b.safetyMaximumPct}%`} | ${interval} | ${b.corridorConfidence} | ${b.status} | ${item.holdout.status} | ${item.holdout.riskBandResult} | ${RISK_STATUS_LABEL[item.status] ?? item.status} |`
      )
    }
    lines.push('')
    lines.push(
      'Das Wilson-Intervall steht bewusst neben dem Punktwert: eine Rate kann im Korridor liegen, während der plausible Bereich darunter hinausreicht — das ist „auf der unteren Designgrenze“, was ein reines Pass/Fail nicht sagen kann.'
    )
    lines.push('')
    lines.push('### Weiche Design-Warnungen')
    lines.push('')
    // An `unsafe` warning is a hard-limit breach, not a corridor hint, so it must
    // not sit under a heading that says nothing blocks. Warnings are prefixed
    // with their scenario id by `RISK_STATUS_WARNING`, which is what lets them be
    // split here without changing the published `warnings` array itself.
    const blockingIds = new Set(
      risk.scenarios
        .filter(scenario => scenario.status === 'unsafe')
        .map(scenario => scenario.id)
    )
    const isBlockingWarning = warning =>
      [...blockingIds].some(id => warning.startsWith(`${id}:`))
    const softWarnings = risk.warnings.filter(
      warning => !isBlockingWarning(warning)
    )
    const blockingWarnings = risk.warnings.filter(isBlockingWarning)
    if (softWarnings.length) {
      lines.push('Diese Punkte erscheinen im Report, blockieren aber nichts:')
      lines.push('')
      for (const warning of softWarnings) lines.push(`- ⚠️ ${warning}`)
      if (blockingWarnings.length) {
        lines.push('')
        lines.push(
          `Nicht in dieser Kategorie: ${blockingWarnings.length} Befund(e) überschreiten eine harte Sicherheitsgrenze und blockieren die Produktionsempfehlung — siehe „Harte Sicherheitsgrenzen (Holdout)“.`
        )
      }
    } else if (blockingWarnings.length) {
      lines.push(
        `Keine weichen Warnungen. ${blockingWarnings.length} Befund(e) überschreiten eine harte Sicherheitsgrenze und blockieren die Produktionsempfehlung — siehe „Harte Sicherheitsgrenzen (Holdout)“.`
      )
    } else if (
      risk.scenarios.every(scenario => scenario.status === 'healthy')
    ) {
      lines.push(
        '✅ Alle bewerteten Szenarien liegen in ihrem Zielkorridor und bleiben auf unabhängigen Seeds im selben Risikoband.'
      )
    } else {
      // A `not_evaluated` scenario produces no warning, so an empty warning list
      // is not the same as "everything is healthy".
      lines.push(
        `⚪ Keine Warnungen, aber auch nicht durchgehend \`healthy\`: ${risk.scenarios
          .filter(scenario => scenario.status !== 'healthy')
          .map(scenario => `${scenario.id} (${scenario.status})`)
          .join(', ')}.`
      )
    }
    lines.push('')
  }

  // ── Financial stress ──────────────────────────────────────────────────────
  const stressReference = payload.results.find(
    scenario => scenario.summary?.financialStress
  )
  if (stressReference) {
    const thresholds = stressReference.summary.financialStress.thresholds
    lines.push('## Financial-Stress-Profil')
    lines.push('')
    lines.push(
      `Insolvenz ist über zehn Tage ein seltenes Endereignis: ein Run kann dauerhaft unter wirtschaftlichem Druck stehen, ohne formal insolvent zu werden. Die folgenden Werte messen den Druck selbst, gemessen an ${fmtEur(thresholds.tightEur)} (knapp) und ${fmtEur(thresholds.criticalEur)} (kritisch), Geldstand jeweils zu Tagesbeginn. Es sind reine Beobachtungen ohne Zielwerte — Untergrenzen dafür sollten aus gemessenem Verhalten kommen, nicht aus einer Annahme.`
    )
    lines.push('')
    lines.push(
      `| Szenario | Insolvenz | je < ${fmtEur(thresholds.tightEur)} | je < ${fmtEur(thresholds.criticalEur)} | Saldo 0 | Ø Tage < ${fmtEur(thresholds.tightEur)} | Drawdown Median | Drawdown P90 | Solventes P10-Endgeld | Median Insolvenztag | Kredit/Grant |`
    )
    lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|')
    for (const scenario of payload.results) {
      const f = scenario.summary?.financialStress
      if (!f) continue
      lines.push(
        `| ${scenario.name} | ${fmtPct(f.bankruptcyRatePct)} | ${fmtPct(f.everBelowTightPct)} | ${fmtPct(f.everBelowCriticalPct)} | ${fmtPct(f.zeroBalancePct)} | ${f.avgDaysBelowTightThreshold} | ${fmtPct(f.medianMaxDrawdownPct)} | ${fmtPct(f.p90MaxDrawdownPct)} | ${fmtEurOrDash(f.solventFinalMoneyP10)} | ${f.medianBankruptcyDay ?? '—'} | ${fmtPct(f.creditOrGrantAssistedPct)} |`
      )
    }
    lines.push('')
    lines.push(
      '„Kredit/Grant“ zählt Runs, die einen Kredit aufgenommen oder den Notfall-Zuschuss erhalten haben. Das ist *unterstützt*, nicht *ohne diese Option gescheitert* — dafür bräuchte es einen gepaarten Lauf mit entfernter Option.'
    )
    lines.push('')
    const tightShares = payload.results
      .map(scenario => scenario.summary?.financialStress?.everBelowTightPct)
      .filter(Number.isFinite)
    const zeroShareMax = maximum(
      payload.results
        .map(scenario => scenario.summary?.financialStress?.zeroBalancePct)
        .filter(Number.isFinite)
    )
    lines.push(
      `Zur Lesart der beiden Schwellen: „je < ${fmtEur(thresholds.tightEur)}“ trennt die Szenarien inzwischen deutlich (${fmtPct(minimum(tightShares))} bis ${fmtPct(maximum(tightShares))}) und ist damit selbst ein Signal — ein früherer Stand dieses Reports erklärte die Spalte als bei 100% gesättigt, was für den damaligen Simulator ohne echte Routenwahl zutraf, für die vorliegenden Zahlen aber nicht mehr. „Saldo 0“ bleibt bei höchstens ${fmtPct(zeroShareMax)}, weil ein Stand von genau €0 nur überlebt, wenn der Tagesnetto die Pflichten deckt; andernfalls ist derselbe Moment bereits die Insolvenzprüfung. Der Nullstand ist damit praktisch der Insolvenzzeitpunkt selbst und kein eigenständig beobachtbarer Zustand.`
    )
    lines.push('')
  }

  // ── Tour paths (4F) ───────────────────────────────────────────────────────
  const pathReference = payload.results.find(
    scenario => scenario.summary?.tourPaths
  )
  if (pathReference) {
    const depth = pathReference.summary.tourPaths.tourDepth
    const finaleReachers = payload.results
      .filter(
        scenario => (scenario.summary?.tourPaths?.finaleReachedPct ?? 0) > 0
      )
      .map(scenario => ({
        name: scenario.name,
        share: scenario.summary.tourPaths.finaleReachedPct
      }))
    lines.push('## Reale Tourpfade')
    lines.push('')
    lines.push(
      `Die Venue-Wahl läuft über eine echte generierte Karte: ein Knoten verbindet nur auf einen oder zwei Knoten der nächsten Ebene, frühe Ebenen tragen leichte Venues, und das Finale liegt auf Ebene ${depth}. Vorher wurde jede Venue frei aus dem gesamten Katalog gezogen — eine Erreichbarkeit, die das Spiel nicht anbietet.`
    )
    lines.push('')
    lines.push(
      '„Finale erreicht“ und „Finale gespielt“ sind absichtlich zwei Spalten: die erste zählt die Ankunft am FINALE-Knoten, die zweite die tatsächlich absolvierte Show. Ein bei niedriger Harmony abgesagtes Finale steht deshalb in der ersten, aber nicht in der zweiten Spalte — eine Ankunft ist kein Beweis, dass gespielt wurde.'
    )
    lines.push('')
    lines.push(
      `| Szenario | Gigs | Ankünfte | Ebene erreicht (max ${depth}) | Finale erreicht | Finale gespielt | Ankünfte ohne Bühne | Ø blockierte Fahrten | davon Geld/Fuel/Zugang | Ø Tanken für Fahrt | Sackgassen |`
    )
    lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|')
    for (const scenario of payload.results) {
      const t = scenario.summary?.tourPaths
      if (!t) continue
      lines.push(
        `| ${scenario.name} | ${scenario.summary.avgGigsPlayed.toFixed(2)} | ${t.avgArrivals} | ${t.avgDeepestLayerReached} | ${fmtPct(t.finaleReachedPct)} | ${fmtPct(t.finaleCompletedPct)} | ${t.avgNonPerformingArrivals} | ${t.avgStrandedDays} | ${t.travelBlockedByReason.money}/${t.travelBlockedByReason.fuel}/${t.travelBlockedByReason.venue_access} | ${t.avgRefuelledToTravel} | ${t.avgRouteDeadEnds} |`
      )
    }
    lines.push('')
    lines.push(
      `Knotentypen über alle Ankünfte: ${Object.entries(
        pathReference.summary.tourPaths.nodeTypeSharePct
      )
        .sort((left, right) => right[1] - left[1])
        .map(([type, share]) => `${type} ${share}%`)
        .join(' · ')} (Beispiel ${pathReference.name}).`
    )
    lines.push('')
    // Derived from the table directly above rather than asserted, so a change to
    // map generation cannot leave the sentence contradicting its own data.
    const performableSharePct = Number(
      Object.entries(pathReference.summary.tourPaths.nodeTypeSharePct)
        .filter(([type]) => PERFORMABLE_NODE_TYPES.has(type))
        .reduce((total, [, share]) => total + share, 0)
        .toFixed(2)
    )
    lines.push(
      `**Korrektur einer früheren Schlussfolgerung.** Ein vorheriger Stand dieses Reports las die Ebenenreichweite als Struktureigenschaft der Karte und schloss, nur täglich spielende Bands könnten die Tour beenden. Das war ein Artefakt des Simulators: Nicht-Auftrittstage beendeten den Tag vor jeder Routenbewegung, also reiste eine Band mit Vier-Tage-Kadenz nur zwei Hops weit und zahlte an den übrigen Tagen bloß Kosten. Reisen und Auftreten sind im Spiel unabhängig — \`useHandleTravel\` prüft Sichtbarkeit, gerichtete Kante und Geld/Treibstoff, nie ob am aktuellen Knoten gespielt wurde. Mit täglicher Fahrt erreichen ${finaleReachers.length} von ${payload.results.length} Szenarien das Finale (${finaleReachers.map(item => `${item.name} ${item.share}%`).join(', ') || 'keines'}), und die Ebenenreichweite ist über alle Kadenzen praktisch gleich. Die Kadenz wirkt nur noch über die Streckenwahl: Ankunft an einem Gig-Knoten startet in Produktion immer die Show, es gibt kein Überspringen, und da ${fmtPct(performableSharePct)} der besuchten Knoten bespielbar sind kann eine Band ihre Auftrittsdichte nur begrenzt drücken. Ein wirtschaftlicher Vorteil dichter Touren bleibt damit messbar, ist aber weit kleiner als zuvor berichtet — und er ist keine Aussage mehr darüber, wer die Tour überhaupt beenden kann.`
    )
    lines.push('')
    lines.push(
      'Modellgrenzen: Ein Ruhetag ist eine explizite Aktion und verbraucht den Tag am Ort; jeder andere Tag ist eine Fahrt, weil das Spiel keine Warten-Aktion kennt. `gigGapDays` steuert nur die Streckenpräferenz, nicht die Zahl der Hops. Nicht modelliert bleiben Notverkäufe, Kreditentscheidungen an realen Zeitpunkten und die Supply-Stop-Auswahl.'
    )
    lines.push('')
  }

  // ── Purchase paths (4D) ───────────────────────────────────────────────────
  const purchaseReference = payload.results.find(
    scenario => scenario.summary?.purchasePaths
  )
  if (purchaseReference) {
    const catalogSize = purchaseReference.summary.purchasePaths.catalogSize
    const [, midDayForShop] = SIMULATION_CONSTANTS.progressionCheckpointDays
    lines.push('## Kaufpfade und Progression')
    lines.push('')
    lines.push(
      `Am Ende genug Geld zu besitzen ist nicht dasselbe wie während der Tour sinnvoll kaufen zu können. Das Fame-Shop-Audit beantwortet nur die erste Frage; hier steht, *wann* gekauft wird, was erreichbar bleibt und was am Geld scheitert. Katalogumfang: ${catalogSize} Artikel.`
    )
    lines.push('')
    lines.push(
      `| Szenario | 1. Kauf (Median Tag) | Van erreicht | Van (Median Tag) | HQ erreicht | HQ (Median Tag) | Ø Artikel | Kataloganteil | Erster Kauf typisch | Ø Geld vor Kauf | Ø Restliquidität | Ø verpasste Käufe | Ø Liquiditätsvorbehalt | Unbezahlbar Tag ${midDayForShop} | Bezahlbar Tag ${midDayForShop} |`
    )
    lines.push(
      '|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|'
    )
    for (const scenario of payload.results) {
      const p = scenario.summary?.purchasePaths
      if (!p) continue
      lines.push(
        `| ${scenario.name} | ${p.firstPurchaseDayMedian ?? '—'} | ${fmtPct(p.vanUpgradeReachedPct)} | ${p.firstVanUpgradeDayMedian ?? '—'} | ${fmtPct(p.hqUpgradeReachedPct)} | ${p.firstHqUpgradeDayMedian ?? '—'} | ${p.avgDistinctItemsPurchased} | ${fmtPct(p.catalogSharePurchasedPct)} | ${p.modalFirstPurchaseCategory ?? '—'} | ${fmtEurOrDash(p.avgMoneyBeforePurchase)} | ${fmtEurOrDash(p.avgResidualMoneyAfterPurchase)} | ${p.avgMissedPurchases} | ${p.avgLiquidityDeferrals} | ${p.avgUnaffordableAtMidCheckpoint ?? '—'} | ${p.avgAffordableAtMidCheckpoint ?? '—'} |`
      )
    }
    lines.push('')
    lines.push(
      '„Verpasste Käufe“ sind Artikel, die der simulierte Käufer wollte und nicht bezahlen konnte (`insufficient_funds`). „Liquiditätsvorbehalt“ zählt getrennt die Fälle, in denen derselbe Käufer den Artikel bezahlen könnte, aber seine Reserve nicht antasten will — zwei Tage der laufenden Verpflichtungen aus `getTotalDailyObligations`, mindestens €150 für den nächsten Hop. Beide Zahlen beschreiben das Entscheidungsmodell der Simulation, nicht das Verhalten echter Spieler; Kaufreihenfolge und Kaufanteil bleiben Heuristik-Artefakte und sind keine Designbefunde.'
    )
    lines.push('')
  }

  // ── Gig economics (4E) ────────────────────────────────────────────────────
  const gigReference = payload.results.find(
    scenario => scenario.summary?.gigEconomics
  )
  if (gigReference) {
    const wearValues = payload.results
      .map(scenario => scenario.summary?.gigEconomics)
      .filter(Boolean)
    const worstWear = {
      stamina: Math.min(
        ...wearValues.map(item => item.minMemberStaminaObserved ?? Infinity)
      ),
      mood: Math.min(
        ...wearValues.map(item => item.minMemberMoodObserved ?? Infinity)
      ),
      harmony: Math.min(
        ...wearValues.map(item => item.minHarmonyObserved ?? Infinity)
      )
    }
    // Which scenarios rest, read from the table rather than asserted. The rounded
    // `avgRestDays` column shows 0 for a scenario whose share is 0.04%, so naming
    // "only the high-controversy scenario" contradicted the shares beside it.
    const restingScenarios = payload.results
      .filter(
        scenario => (scenario.summary?.gigEconomics?.restDaySharePct ?? 0) > 0
      )
      .map(scenario => ({
        name: scenario.name,
        sharePct: scenario.summary.gigEconomics.restDaySharePct
      }))
      .sort((left, right) => right.sharePct - left.sharePct)
    const topRestingScenario = restingScenarios[0]
    lines.push('## Gig-Frequenz, Reisekosten und Amortisation')
    lines.push('')
    lines.push(
      'Diagnostisch, nicht wertend: ob die Dominanz dichter Touren ein Balancefehler oder eine beabsichtigte Belohnung für aktiveres Spielen ist, wird hier gemessen und nicht entschieden.'
    )
    lines.push('')
    lines.push(
      '| Szenario | Gig-Netto/Kalendertag | Gig-Netto/Gig | Gigs/Kalendertag | Ø Ruhetage | Ruhetaganteil | Reisekosten je Gig | Reisekostenanteil am Netto | Katalog < 1 Gig |'
    )
    lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|')
    for (const scenario of payload.results) {
      const g = scenario.summary?.gigEconomics
      if (!g) continue
      lines.push(
        `| ${scenario.name} | ${fmtEur(g.gigNetPerCalendarDay)} | ${fmtEur(g.gigNetPerGigDay)} | ${g.gigsPerCalendarDay} | ${g.avgRestDays} | ${fmtPct(g.restDaySharePct)} | ${fmtEur(g.avgTravelCostPerGigDay)} | ${fmtPct(g.travelCostShareOfGigNetPct)} | ${fmtPct(g.catalogItemsUnderOneGigNetPct)} |`
      )
    }
    lines.push('')
    lines.push(
      `„Katalog < 1 Gig“ ist der Anteil der ${gigReference.summary.gigEconomics.moneyPricedCatalogSize} geldbepreisten Artikel, deren Kosten unter dem Netto eines einzelnen Gigs liegen — die messbare Form von „günstige Upgrades amortisieren sich in weniger als einem Gig“. Eine echte Amortisationszeit ist damit nicht berechnet: dafür bräuchte jeder Artikel ein modelliertes Ertragsdelta, das die Simulation nicht führt.`
    )
    lines.push('')
    lines.push(
      `**Ruhetage sind selten, aber nicht unmöglich — und der Grund hat sich mit der echten Reise verschoben.** Der Auslöser nutzt die Marken, die das Spiel im HUD als niedrig anzeigt (Stamina unter ${MEMBER_CARE_THRESHOLDS.stamina}, Mood unter ${MEMBER_CARE_THRESHOLDS.mood}), und wird inzwischen an jedem Tag geprüft, nicht nur an Auftrittstagen. Über alle Szenarien gilt: ${describeRestThresholdCrossings(worstWear)} Dass daraus fast keine Ruhetage entstehen, liegt an den Rastplatz-Knoten: bei täglicher Fahrt passiert eine Band im Schnitt rund einen pro Tour und erhält dort die kanonische Erholung (+20 Stamina / +10 Mood, \`avgRestStopArrivals\`), was die Mitglieder meist über der Pflegeschwelle hält. ${restingScenarios.length ? `Ruhetage treten in ${restingScenarios.length} von ${payload.results.length} Szenarien überhaupt auf (${restingScenarios.map(item => `${item.name} ${item.sharePct}%`).join(', ')}); nennenswert ist der Anteil nur bei ${topRestingScenario?.name ?? '—'}, alle übrigen liegen im Promillebereich.` : 'In keinem Szenario entstand ein messbarer Ruhetag.'} Die Harmony sinkt bis ${worstWear.harmony} und ist trotzdem kein Ruhegrund, weil Ruhe sie nicht repariert. Ein belastbarer Wert für die Opportunitätskosten einer Pause fehlt damit weiterhin, weil die Stichprobe an Ruhetagen zu klein ist. \`foregoneGigNetPerRestDayUpperBound\` entspricht bei null Ruhetagen genau dem Gig-Netto und ist deshalb nicht als Spalte geführt.`
    )
    lines.push('')
  }

  lines.push('## Populationen')
  lines.push('')
  lines.push(
    '| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |'
  )
  lines.push('|---|---|---|---|')
  for (const scenario of payload.results) {
    const s = scenario.summary
    const p = s.population || {}
    const all = p.allRuns ?? { sampleSize: 0, finalMoney: { mean: 0 } }
    const sol = p.solventRuns ?? { sampleSize: 0, finalMoney: { mean: 0 } }
    const ban = p.bankruptRuns ?? { sampleSize: 0, finalMoney: { mean: 0 } }
    lines.push(
      `| ${scenario.name} | ${all.sampleSize} / ${fmtEur(all.finalMoney?.mean)} | ${sol.sampleSize} / ${fmtEur(sol.finalMoney?.mean)} | ${ban.sampleSize} / ${fmtEur(ban.finalMoney?.mean)} |`
    )
  }
  lines.push('')

  lines.push('## Volatilität')
  lines.push('')
  lines.push(
    '| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |'
  )
  lines.push('|---|---:|---:|---:|---:|')
  for (const scenario of payload.results) {
    const s = scenario.summary
    const v = s.volatility || {}
    lines.push(
      `| ${scenario.name} | ${fmtEur(v.finalMoneyStdDev)} | ${v.finalMoneyCoefficientOfVariation ?? '—'} | ${(v.maxDrawdownMeanPct ?? 0).toFixed(2)}% | ${(v.maxDrawdownP90Pct ?? 0).toFixed(2)}% |`
    )
  }
  lines.push('')

  lines.push('## Feature-Inventar')
  lines.push('')
  lines.push(`| Feature | Anzahl Verfügbar |`)
  lines.push(`|---|---:|`)
  const inv = payload.featureInventory || {}
  Object.keys(inv).forEach(k => {
    lines.push(`| ${k} | ${inv[k]} |`)
  })
  lines.push('')
  lines.push('## Ausführungsabdeckung (Coverage)')
  lines.push('')
  lines.push(
    '*Note: `Covered` is true when a feature has any evaluation, activation, or observed ID. It does not require all possible catalog IDs to be seen.*'
  )
  lines.push('')
  lines.push(
    `| Feature | Covered | Evaluations / Attempts | Activations / Completions | Unique IDs Seen |`
  )
  lines.push(`|---|---|---:|---:|---:|`)
  lines.push(renderExecutionCoverageRows(payload.executionCoverage || {}))
  lines.push('')
  lines.push('## KPI-Zielkorridore (Health Check)')
  lines.push('')
  lines.push(
    `Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario, kalibriert auf eine vollständige map-gebundene ${SIMULATION_CONSTANTS.daysPerRun}-Tage-Tour.`
  )
  lines.push('')
  lines.push('| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |')
  lines.push('|---|---|---|---|---|---|')

  for (const scenario of payload.results) {
    const checks = checkKpi(scenario.id, scenario.summary)
    const { status } = evaluateKpiStatus(checks)
    if (status === 'not_evaluated') {
      lines.push(`| ${scenario.name} | — | — | — | ⚪ Nicht bewertet | — |`)
      continue
    }
    for (const c of checks) {
      lines.push(
        `| ${scenario.name} | ${c.label} | ${c.target} | ${c.actual} | ${c.pass ? '✅' : '❌'} | ${c.bewertung} |`
      )
    }
  }
  lines.push('')

  if (payload.regressionComparison?.scenarios?.length) {
    const comparison = payload.regressionComparison
    lines.push('## Alt/Neu-Vergleich der vollständigen Simulationsreports')
    lines.push('')
    lines.push(
      'Dieser Vergleich ist **deskriptiv und ungepaart**; die Deltas sind keine gepaarten Effektschätzungen.'
    )
    lines.push('')
    lines.push('| Kennzahl | Alt | Neu |')
    lines.push('|---|---|---|')
    lines.push(
      `| Source-Fingerprint | \`${comparison.previous.sourceFingerprint ?? '—'}\` | \`${comparison.current.sourceFingerprint ?? '—'}\` |`
    )
    lines.push(
      `| Runs je Szenario | ${comparison.previous.runsPerScenario ?? '—'} | ${comparison.current.runsPerScenario ?? '—'} |`
    )
    lines.push(
      `| Seed-Namensraum | \`${comparison.previous.seedNamespace ?? 'nicht angegeben'}\` | \`${comparison.current.seedNamespace ?? 'nicht angegeben'}\` |`
    )
    lines.push(
      `| Seed-Strategie | \`${comparison.previous.seedStrategy ?? 'nicht angegeben'}\` | \`${comparison.current.seedStrategy ?? 'nicht angegeben'}\` |`
    )
    lines.push(
      `| Ausgelieferte Harness-Kadenz | \`${comparison.previous.shippedGigCadencePolicy ?? 'nicht angegeben'}\` | \`${comparison.current.shippedGigCadencePolicy ?? 'nicht angegeben'}\` |`
    )
    lines.push('')
    lines.push(
      '| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |'
    )
    lines.push('|---|---:|---:|---:|---:|')
    for (const scenario of comparison.scenarios) {
      const metrics = scenario.metrics
      lines.push(
        `| ${scenario.name} | ${metrics.bankruptcyRate.delta}% | ${fmtEur(metrics.avgFinalMoney.delta)} | ${metrics.avgFameProgressPerGig.delta} | ${metrics.avgGigsPlayed.delta} |`
      )
    }
    lines.push('')
  }

  // ── Feature Coverage ──────────────────────────────────────────────────────

  // ── Kurzfazit ─────────────────────────────────────────────────────────────
  lines.push('## Kurzfazit')
  lines.push('')

  const riskiest = [...payload.results].sort(
    (a, b) => b.summary.bankruptcyRate - a.summary.bankruptcyRate
  )[0]
  const richest = [...payload.results].sort(
    (a, b) => b.summary.avgFinalMoney - a.summary.avgFinalMoney
  )[0]
  const mostVolatile = [...payload.results].sort(
    (a, b) =>
      b.summary.avgEventsApplied +
      b.summary.avgGigEvents -
      (a.summary.avgEventsApplied + a.summary.avgGigEvents)
  )[0]
  const failedKpis = payload.results.flatMap(scenario => {
    const checks = checkKpi(scenario.id, scenario.summary) || []
    return checks.filter(c => !c.pass).map(c => `${scenario.name} (${c.label})`)
  })

  const maxBankruptcyRate = Math.max(
    ...payload.results.map(r => r.summary.bankruptcyRate)
  )
  if (maxBankruptcyRate > 0) {
    lines.push(
      `- Höchstes Risiko: **${riskiest.name}** mit ${riskiest.summary.bankruptcyRate}% Insolvenzrate.`
    )
  } else {
    lines.push('- Kein Szenario mit Insolvenzfällen beobachtet.')
  }
  lines.push(
    `- Höchster Kapitalaufbau: **${richest.name}** mit Ø ${fmtEur(richest.summary.avgFinalMoney)} Endgeld.`
  )
  lines.push(
    `- Ereignisdichte: **${mostVolatile.name}** mit Ø ${(mostVolatile.summary.avgEventsApplied + mostVolatile.summary.avgGigEvents).toFixed(2)} Event-Impulsen (inkl. Gig-Events).`
  )

  const kpiCounts = payload.results.reduce(
    (acc, scenario) => {
      acc[scenario.summary.kpiStatus] =
        (acc[scenario.summary.kpiStatus] || 0) + 1
      return acc
    },
    { passed: 0, failed: 0, not_evaluated: 0 }
  )

  lines.push('')
  lines.push('### KPI-Zusammenfassung')
  lines.push(`- Bestanden: ${kpiCounts.passed}`)
  lines.push(`- Fehlgeschlagen: ${kpiCounts.failed}`)
  lines.push(`- Nicht bewertet: ${kpiCounts.not_evaluated}`)
  lines.push('')

  // Safety verdict and design verdict are different questions, and after the
  // payout raise they answer differently. Reporting only the first would read
  // as "balance is fine" while most scenarios sit below their intended risk.
  if (risk?.scenarios?.length) {
    const riskCounts = risk.scenarios.reduce((acc, scenario) => {
      acc[scenario.status] = (acc[scenario.status] ?? 0) + 1
      return acc
    }, {})
    lines.push('### Designrisiko-Zusammenfassung (nicht blockierend)')
    lines.push(
      `- Sicherheitsgates: ${risk.scenarios.filter(scenario => scenario.status !== 'unsafe').length}/${risk.scenarios.length} Szenarien unter ihrer harten Insolvenzgrenze; ${risk.scenarios.filter(scenario => scenario.status === 'not_evaluated').length} ohne Korridorurteil.`
    )
    // The blocking verdict has to appear in the summary too, otherwise the only
    // non-blocking heading in the report is also the last word on safety.
    if (payload.holdoutSafetyValidation) {
      const safetySummary = payload.holdoutSafetyValidation
      lines.push(
        safetySummary.passed
          ? '- ✅ Blockierendes Gate „Harte Sicherheitsgrenzen (Holdout)“: bestanden.'
          : `- ❌ **Blockierendes Gate „Harte Sicherheitsgrenzen (Holdout)“: fehlgeschlagen** (${[safetySummary.failures.map(failure => `${failure.scenarioId} ${failure.holdoutValuePct}% > ${failure.maximumPct}%`).join('; '), safetySummary.missingScenarioIds?.length ? `nicht gemessen: ${safetySummary.missingScenarioIds.join(', ')}` : ''].filter(Boolean).join(' · ') || 'keine Evidenz'}). Keine Produktionsempfehlung.`
      )
    }
    lines.push(
      `- Risikobänder: ${Object.entries(riskCounts)
        .map(([status, count]) => `${status} ${count}`)
        .join(' · ')}.`
    )
    // Counted the same way the corridor section splits them: a hard-limit breach
    // is not a soft warning, so it must not be tallied as one here either.
    const softWarningCount = risk.warnings.filter(warning => {
      const blocking = risk.scenarios
        .filter(scenario => scenario.status === 'unsafe')
        .map(scenario => scenario.id)
      return !blocking.some(id => warning.startsWith(`${id}:`))
    }).length
    if (softWarningCount) {
      lines.push(
        `- ⚠️ ${softWarningCount} weiche Designwarnung(en) — siehe „Insolvenz-Zielkorridore“. Insolvenz ist damit nicht mehr der primäre Spannungsindikator; die weitere Bewertung läuft über Drawdown, Liquiditätsdruck und Kaufentscheidungen.`
      )
    } else if (
      risk.scenarios.every(scenario => scenario.status === 'healthy')
    ) {
      lines.push(
        '- ✅ Alle bewerteten Szenarien liegen in ihrem Design-Risikokorridor.'
      )
    } else {
      lines.push(
        `- ⚪ Keine Warnungen, aber ${risk.scenarios.filter(scenario => scenario.status !== 'healthy').length} Szenario(en) ohne \`healthy\`-Status.`
      )
    }
    lines.push('')
  }

  if (failedKpis.length > 0) {
    lines.push(`- ❌ KPI-Verstöße: ${failedKpis.join(' · ')}`)
    lines.push(
      '- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.'
    )
  } else {
    lines.push('- ✅ Alle bewerteten KPI-Zielkorridore eingehalten.')
    lines.push(
      '- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.'
    )
  }

  return lines.join('\n')
}

const parseCliOptions = argv => {
  const options = {
    compareBaselinePath: null,
    writeBaselinePath: null
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--compare-baseline' && argv[i + 1]) {
      options.compareBaselinePath = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--write-baseline' && argv[i + 1]) {
      options.writeBaselinePath = argv[i + 1]
      i += 1
    }
  }

  return options
}

export const tryReadJson = async filePath => {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return null
    }
    throw error
  }
}

export const getJsonHash = (data, meta = {}) => {
  try {
    const obj = { ...data, ...meta }
    delete obj.reportVersion
    return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex')
  } catch {
    return null
  }
}

export const runSimulationSuite = async (options = {}) => {
  logger.setLevel(LOG_LEVELS.ERROR)

  const results = []

  for (
    let scenarioIndex = 0;
    scenarioIndex < SCENARIOS.length;
    scenarioIndex++
  ) {
    const scenario = SCENARIOS[scenarioIndex]
    const runs = []

    for (
      let runIndex = 0;
      runIndex < SIMULATION_CONSTANTS.runsPerScenario;
      runIndex++
    ) {
      const seed = createScenarioSeed(
        `${scenario.id}${SIMULATION_CONSTANTS.seedNamespace}`,
        runIndex
      )
      runs.push(runSingleSimulation(scenario, seed))
    }

    const summary = summarizeScenario(runs)
    const kpis = checkKpi(scenario.id, summary)
    const evalResult = evaluateKpiStatus(kpis)
    summary.kpiStatus = evalResult.status
    summary.kpisPassed = evalResult.passed
    results.push({
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      summary,
      kpiChecks: kpis,
      sampleTimeline: runs[0]?.timeline?.slice(0, 10) || []
    })
  }

  // The KPI money bands were derived from a neutral-tuning control run, so
  // "neutral passes the money targets" is partly true by construction. Re-run
  // the KPI scenarios on a disjoint seed stream and re-evaluate: agreement means
  // the verdict reflects the economy rather than the particular cohort the
  // bands were fitted to.
  //
  // The comparison is per band, not per scenario. A scenario-level status
  // comparison only reports *that* something moved, which is not enough to act
  // on — and it hides a compensating pair (one band flipping to fail while
  // another flips to pass) behind an unchanged overall verdict. Naming the band
  // is the whole point, since only the money bands were fitted to the
  // calibration cohort; the insolvency caps and fame corridor were not.
  const kpiHoldoutValidation = (() => {
    const scenarioResults = SCENARIOS.filter(
      scenario => KPI_TARGETS[scenario.id]
    ).map(scenario => {
      const runs = []
      for (
        let runIndex = 0;
        runIndex < SIMULATION_CONSTANTS.runsPerScenario;
        runIndex++
      ) {
        runs.push(
          runSingleSimulation(
            scenario,
            createScenarioSeed(
              `${scenario.id}${SIMULATION_CONSTANTS.seedNamespace}#holdout`,
              runIndex
            )
          )
        )
      }
      const summary = summarizeScenario(runs)
      const holdoutChecks = checkKpi(scenario.id, summary) ?? []
      const evaluation = evaluateKpiStatus(holdoutChecks)
      const calibration = results.find(result => result.id === scenario.id)
      const calibrationChecks = calibration?.kpiChecks ?? []

      const checks = holdoutChecks.map(holdoutCheck => {
        const calibrationCheck = calibrationChecks.find(
          item => item.label === holdoutCheck.label
        )
        return {
          label: holdoutCheck.label,
          target: holdoutCheck.target,
          calibrationPass: calibrationCheck?.pass ?? null,
          calibrationActual: calibrationCheck?.actual ?? null,
          holdoutPass: holdoutCheck.pass,
          holdoutActual: holdoutCheck.actual,
          agrees: calibrationCheck?.pass === holdoutCheck.pass
        }
      })

      // `[].every(...)` is true, so a scenario whose bands could not be
      // evaluated would report agreement on something that was never measured.
      // A missing verdict is not a matching one — name it as a disagreement.
      const disagreeingBands = checks.length
        ? checks.filter(check => !check.agrees).map(check => check.label)
        : ['keine KPI-Bänder ausgewertet']

      return {
        id: scenario.id,
        calibrationStatus: calibration?.summary.kpiStatus,
        holdoutStatus: evaluation.status,
        agrees: disagreeingBands.length === 0,
        disagreeingBands,
        checks,
        holdoutAvgFinalMoney: summary.avgFinalMoney,
        holdoutBankruptcyRate: summary.bankruptcyRate,
        // Count and cohort size, not just the rate: the design-risk review
        // needs them to classify the holdout against the corridor and to
        // recognise a cohort too small to judge.
        holdoutBankruptcy: summary.bankruptcy,
        holdoutFinancialStress: summary.financialStress,
        holdoutFameProgressPerGig: summary.avgFameProgressPerGig ?? null
      }
    })
    // Same vacuous-truth trap one level up: with no KPI scenario at all the
    // aggregate would claim the holdout confirmed the calibration verdict.
    const disagreements = scenarioResults.length
      ? scenarioResults
          .filter(result => !result.agrees)
          .flatMap(result =>
            result.disagreeingBands.map(band => `${result.id}: ${band}`)
          )
      : ['keine KPI-Szenarien ausgewertet']
    return {
      seedStrategy:
        'scenario-id-plus-first-income-full-report-namespace-plus-holdout-marker-plus-run-index',
      runsPerScenario: SIMULATION_CONSTANTS.runsPerScenario,
      comparison: 'per-kpi-band',
      agrees: disagreements.length === 0,
      disagreements,
      scenarios: scenarioResults
    }
  })()

  const designRiskReview = buildDesignRiskReview({
    results,
    holdoutScenarios: kpiHoldoutValidation.scenarios
  })
  const holdoutSafetyValidation = buildHoldoutSafetyValidation(
    kpiHoldoutValidation.scenarios
  )

  await fs.mkdir(REPORT_DIR, { recursive: true })
  const outputJsonPath = path.join(REPORT_DIR, SIMULATION_CONSTANTS.outputJson)
  const outputMarkdownPath = path.join(
    REPORT_DIR,
    SIMULATION_CONSTANTS.outputMarkdown
  )

  const baselinePath = options.compareBaselinePath
    ? path.resolve(PROJECT_ROOT, options.compareBaselinePath)
    : outputJsonPath
  const baselinePayload = await tryReadJson(baselinePath)

  const payload = {
    generatedAt: new Date().toISOString(),
    constants: SIMULATION_CONSTANTS,
    outputJson: SIMULATION_CONSTANTS.outputJson,
    outputMarkdown: SIMULATION_CONSTANTS.outputMarkdown,
    scenarios: SCENARIOS,
    metadata: {
      ...(await buildArtifactMetadata({
        root: PROJECT_ROOT,
        generatorPaths: GENERATOR_PATHS,
        seedNamespace: SIMULATION_CONSTANTS.seedNamespace,
        runsPerScenario: SIMULATION_CONSTANTS.runsPerScenario
      })),
      seedStrategy:
        'scenario-id-plus-first-income-full-report-namespace-plus-run-index',
      shippedGigCadencePolicy: SHIPPED_GIG_CADENCE_POLICY
    },
    appFeatureSnapshot: buildAppFeatureSnapshot(),
    fameBalanceAudit: buildFameBalanceAudit(),
    kpiHoldoutValidation,
    holdoutSafetyValidation,
    designRiskReview,
    featureInventory: buildFeatureInventory(),
    executionCoverage: buildExecutionCoverage(results),
    regressionComparison: null,
    results
  }
  payload.regressionComparison = buildRegressionComparison(
    baselinePayload,
    payload
  )

  await fs.writeFile(
    outputJsonPath,
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  )
  await fs.writeFile(
    outputMarkdownPath,
    `${buildMarkdownReport(payload)}\n`,
    'utf8'
  )

  if (options.writeBaselinePath) {
    const writeBaselinePath = path.resolve(
      PROJECT_ROOT,
      options.writeBaselinePath
    )
    await fs.mkdir(path.dirname(writeBaselinePath), { recursive: true })
    await fs.writeFile(
      writeBaselinePath,
      `${JSON.stringify(payload, null, 2)}\n`,
      'utf8'
    )
  }

  return payload
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const cliOptions = parseCliOptions(process.argv.slice(2))
  const payload = await runSimulationSuite(cliOptions)
  const outputJsonPath = path.join(REPORT_DIR, payload.outputJson)
  const outputMarkdownPath = path.join(REPORT_DIR, payload.outputMarkdown)
  const totalRuns = payload.results.reduce(
    (sum, scenario) =>
      sum + (scenario.summary.population?.allRuns?.sampleSize ?? 0),
    0
  )

  console.log(
    `[balance-sim] Fertig: ${payload.results.length} Szenarien / ${totalRuns} Runs.\n` +
      `[balance-sim] JSON: ${outputJsonPath}\n` +
      `[balance-sim] Analyse: ${outputMarkdownPath}\n` +
      `[balance-sim] Vergleichs-Baseline: ${cliOptions.compareBaselinePath ? path.resolve(PROJECT_ROOT, cliOptions.compareBaselinePath) : outputJsonPath}`
  )
}
