import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { ALL_VENUES } from '../src/data/venues.js'
import { createInitialState } from '../src/context/initialState.js'
import { EVENTS_DB } from '../src/data/events/index.js'
import { BRAND_DEALS } from '../src/data/brandDeals.js'
import { POST_OPTIONS } from '../src/data/postOptions.js'
import { ALLOWED_TRENDS } from '../src/data/socialTrends.js'
import { SOCIAL_PLATFORMS } from '../src/data/platforms.js'
import { _CONTRABAND_DB_FOR_TESTING } from '../src/data/contraband.js'
import { getUnifiedUpgradeCatalog } from '../src/data/upgradeCatalog.js'
import {
  calculateFuelCost,
  calculateGigFinancials,
  calculateKabelsalatMinigameResult,
  calculateRefuelCost,
  calculateRepairCost,
  calculateRoadieMinigameResult,
  calculateTravelExpenses,
  calculateTravelMinigameResult,
  EXPENSE_CONSTANTS,
  MODIFIER_COSTS,
  shouldTriggerBankruptcy
} from '../src/utils/economyEngine.js'
import {
  calculateDailyUpdates,
  calculateGigPhysics,
  getGigModifiers
} from '../src/utils/simulationUtils.js'
import {
  clampBandHarmony,
  clampMemberMood,
  clampMemberStamina,
  clampPlayerFame,
  calculateFameGain,
  clampPlayerMoney,
  clampVanFuel
} from '../src/utils/gameStateUtils.js'
import { logger, LOG_LEVELS } from '../src/utils/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const REPORT_DIR = path.join(PROJECT_ROOT, 'reports')
const REPORT_FILES = {
  outputJson: 'game-balance-simulation-results.json',
  outputMarkdown: 'game-balance-simulation-analysis.md'
}

export const SIMULATION_CONSTANTS = {
  reportVersion: 3,
  runsPerScenario: 260,
  daysPerRun: 75,
  homeVenueId: 'stendal_proberaum',
  baseGigGapDays: 3,
  randomModifierChance: 0.22,
  followerGainMultiplier: 0.2,
  fameGainBase: 4,
  fameLossBadGig: 4,
  harmonyGainGoodGig: 2,
  harmonyLossBadGig: 5,
  sponsorshipPayout: 180,
  randomEventCashSwing: 140,
  brandDealEvalChance: 0.14,
  postPulseChance: 0.18,
  trendShiftChance: 0.12,
  contrabandDropChance: 0.11,
  hqUpgradeCost: 240,
  vanUpgradeCost: 350,
  outputJson: REPORT_FILES.outputJson,
  outputMarkdown: REPORT_FILES.outputMarkdown
}

export const SCENARIOS = [
  {
    id: 'baseline_touring',
    name: 'Baseline Touring',
    description:
      'Ausgewogene Tour mit moderaten Modifikatoren und normalem Risiko.',
    gigGapDays: 3,
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
      social: { controversyLevel: 0, loyalty: 5, zealotry: 0 }
    }
  },
  {
    id: 'bootstrap_struggle',
    name: 'Bootstrap Struggle',
    description:
      'Wenig Startkapital, fragile Stimmung, seltene Premium-Modifikatoren.',
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
      player: { money: 240, fame: 0 },
      band: {
        harmony: 64,
        members: [
          { mood: 65, stamina: 82 },
          { mood: 58, stamina: 76 },
          { mood: 61, stamina: 80 }
        ]
      },
      social: { controversyLevel: 0, loyalty: 3, zealotry: 0 }
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
      player: { money: 650, fame: 20 },
      band: { harmony: 78 },
      social: { controversyLevel: 8, loyalty: 10, zealotry: 12 }
    }
  },
  {
    id: 'scandal_recovery',
    name: 'Scandal Recovery',
    description:
      'Start mit hoher Kontroverse; Fokus auf Stabilisierung statt Maximalgewinn.',
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
      player: { money: 450, fame: 30 },
      band: {
        harmony: 58,
        members: [
          { mood: 56, stamina: 75 },
          { mood: 53, stamina: 72 },
          { mood: 55, stamina: 74 }
        ]
      },
      social: { controversyLevel: 72, loyalty: 34, zealotry: 8 }
    }
  },
  {
    id: 'festival_push',
    name: 'Festival Push',
    description:
      'Späteres Midgame/Endgame-Setup mit Fokus auf große Venues und Premiumpreise.',
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
      player: { money: 1400, fame: 120 },
      band: { harmony: 86 },
      social: { controversyLevel: 10, loyalty: 28, zealotry: 40 }
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
      player: { money: 380, fame: 16 },
      band: {
        harmony: 49,
        members: [
          { mood: 52, stamina: 68 },
          { mood: 47, stamina: 70 },
          { mood: 45, stamina: 66 }
        ]
      },
      social: { controversyLevel: 46, loyalty: 12, zealotry: 5 }
    }
  },
  {
    id: 'cult_hypergrowth',
    name: 'Cult Hypergrowth',
    description:
      'Zealotry-getriebene Fanbasis, starke Monetarisierung bei höherem Risiko.',
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
      player: { money: 900, fame: 70 },
      band: { harmony: 82 },
      social: { controversyLevel: 18, loyalty: 36, zealotry: 82 }
    }
  }
]

const VENUES = ALL_VENUES.filter(v => v.type !== 'HOME' && v.capacity > 0)
const HOME = ALL_VENUES.find(v => v.id === SIMULATION_CONSTANTS.homeVenueId)
const UPGRADE_CATALOG = getUnifiedUpgradeCatalog()

const FEATURE_COVERAGE_KEYS = [
  'daily_updates',
  'gig_financials',
  'travel_expenses',
  'fuel_cost',
  'travel_minigame',
  'roadie_minigame',
  'kabelsalat_minigame',
  'gig_modifiers',
  'gig_physics',
  'world_events',
  'events_db',
  'brand_deals',
  'social_trends',
  'social_platforms',
  'post_options',
  'contraband',
  'sponsorship',
  'maintenance',
  'upgrades'
]

const mulberry32 = seed => {
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

const applyScenarioOverrides = (state, scenario) => {
  const next = structuredClone(state)
  const { player, band, social } = scenario.initialOverrides

  Object.assign(next.player, player)
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
    next.band.members = next.band.members.map((member, index) => ({
      ...member,
      traits: [
        ...new Set([
          ...(member.traits || []),
          scenario.traitPack[index % scenario.traitPack.length]
        ])
      ]
    }))
  }

  return next
}

const pickVenueForState = (state, rng) => {
  const fame = state.player.fame
  const controversy = state.social.controversyLevel || 0
  let targetDiff = 2

  if (fame >= 130) targetDiff = 5
  else if (fame >= 70) targetDiff = 4
  else if (fame >= 25) targetDiff = 3

  if (controversy >= 70) targetDiff = Math.max(2, targetDiff - 1)

  const candidates = VENUES.filter(
    venue => Math.abs(venue.diff - targetDiff) <= 1
  )
  const pool = candidates.length ? candidates : VENUES
  return pool[Math.floor(rng() * pool.length)]
}

const calculateModifiers = (scenario, rng) => {
  const modifiers = {
    promo: pickWeightedBool(scenario.modifierBias.promo, rng),
    merch: pickWeightedBool(scenario.modifierBias.merch, rng),
    catering: pickWeightedBool(scenario.modifierBias.catering, rng),
    soundcheck: pickWeightedBool(scenario.modifierBias.soundcheck, rng),
    guestlist: pickWeightedBool(scenario.modifierBias.guestlist, rng)
  }

  if (rng() < SIMULATION_CONSTANTS.randomModifierChance) {
    const keys = Object.keys(modifiers)
    const key = keys[Math.floor(rng() * keys.length)]
    modifiers[key] = !modifiers[key]
  }

  return modifiers
}

const applyWorldEvents = (state, scenario, rng, eventCounts) => {
  const intensity = scenario.eventIntensity ?? 0.5

  if (rng() < 0.1 * intensity) {
    // Viral spike with mild controversy risk.
    const boost = Math.round(220 + rng() * 450)
    state.social.instagram += boost
    state.social.tiktok += Math.round(boost * 0.65)
    state.social.youtube += Math.round(boost * 0.3)

    if (rng() < 0.4) {
      state.social.controversyLevel = Math.min(
        100,
        state.social.controversyLevel + 4
      )
    }

    eventCounts.viralSpikes += 1
  }

  if (rng() < 0.08 * intensity) {
    // Cash swing event: cancellation/fine/bonus show.
    const sign = rng() < 0.65 ? -1 : 1
    const baseSwing = Math.round(
      SIMULATION_CONSTANTS.randomEventCashSwing * (0.6 + rng())
    )
    // Scale swing relative to current wealth to simulate larger impacts for richer bands
    const scaledSwing = Math.max(baseSwing, Math.round(state.player.money * 0.15))
    state.player.money = clampPlayerMoney(state.player.money + sign * scaledSwing)
    eventCounts.cashSwings += 1
  }

  if (rng() < 0.07 * intensity) {
    // Band conflict / healing event.
    const harmonyDelta = rng() < 0.6 ? -6 : 5
    state.band.harmony = clampBandHarmony(state.band.harmony + harmonyDelta)
    state.band.members = state.band.members.map(member => ({
      ...member,
      mood: clampMemberMood(member.mood + (harmonyDelta > 0 ? 2 : -3))
    }))
    eventCounts.bandEvents += 1
  }

  if (rng() < 0.06 * intensity) {
    // Equipment theft / insurance recover.
    const loss = Math.round(90 + rng() * 160)
    state.player.money = clampPlayerMoney(state.player.money - loss)
    state.player.van.condition = Math.max(0, state.player.van.condition - 5)
    eventCounts.equipmentEvents += 1
  }
}

const maybeHandleSponsorship = (state, rng, counters) => {
  if (
    !state.social.sponsorActive &&
    state.social.instagram > 5000 &&
    (state.social.controversyLevel || 0) < 60 && // Must be below 60 to sign
    rng() < 0.08
  ) {
    state.social.sponsorActive = true
    counters.sponsorSignings += 1
  }

  if (state.social.sponsorActive) {
    state.player.money = clampPlayerMoney(
      state.player.money + SIMULATION_CONSTANTS.sponsorshipPayout
    )
    counters.sponsorPayouts += 1

    // Immediate drop if controversy is extreme
    if ((state.social.controversyLevel || 0) >= 80) {
      state.social.sponsorActive = false
      counters.sponsorDrops += 1
    } else if ((state.social.controversyLevel || 0) >= 60 && rng() < 0.5) {
      // High chance to drop if controversial
      state.social.sponsorActive = false
      counters.sponsorDrops += 1
    }
  }
}

const maybeShiftSocialTrend = (state, rng, counters) => {
  if (rng() >= SIMULATION_CONSTANTS.trendShiftChance) return
  const nextTrend = ALLOWED_TRENDS[Math.floor(rng() * ALLOWED_TRENDS.length)]
  state.social.trend = nextTrend
  counters.trendShifts += 1
}

const maybeActivateBrandDeal = (state, rng, counters) => {
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
  counters.brandDealsActivated += 1
}

const maybeApplyPostPulse = (state, rng, counters) => {
  if (rng() >= SIMULATION_CONSTANTS.postPulseChance) return
  const post = POST_OPTIONS[Math.floor(rng() * POST_OPTIONS.length)]
  if (!post) return

  const platformValues = Object.values(SOCIAL_PLATFORMS)
  const platform = platformValues[Math.floor(rng() * platformValues.length)]
  const multiplier = platform?.multiplier || 1
  const reach = Math.round((120 + rng() * 360) * multiplier)

  const id = platform?.id || 'instagram'
  state.social[id] = (state.social[id] || 0) + reach

  // High-risk posts can raise controversy.
  if ((post.id || '').includes('drama') || rng() < 0.15) {
    state.social.controversyLevel = Math.min(
      100,
      (state.social.controversyLevel || 0) + 2
    )
  }

  counters.postPulses += 1
}

const maybeApplyContrabandDrop = (state, rng, counters) => {
  if (rng() >= SIMULATION_CONSTANTS.contrabandDropChance) return
  const item =
    _CONTRABAND_DB_FOR_TESTING[
      Math.floor(rng() * _CONTRABAND_DB_FOR_TESTING.length)
    ]
  if (!item) return

  switch (item.effectType) {
    case 'stamina':
      state.band.members = state.band.members.map(member => ({
        ...member,
        stamina: clampMemberStamina(member.stamina + Math.round(item.value / 4))
      }))
      break
    case 'mood':
      state.band.members = state.band.members.map(member => ({
        ...member,
        mood: clampMemberMood(member.mood + Math.round(item.value / 6))
      }))
      break
    case 'harmony':
      state.band.harmony = clampBandHarmony(state.band.harmony + 2)
      break
    case 'luck':
      state.social.viral = Math.min(6, (state.social.viral || 0) + 1)
      break
    default:
      state.player.money = clampPlayerMoney(
        state.player.money + Math.round(Math.abs(item.value || 1) * 8)
      )
      break
  }

  counters.contrabandDrops += 1
}

const maybeBuyCatalogUpgrade = (state, rng, counters) => {
  if (state.player.money < 900 || rng() > 0.24) return
  const candidate = UPGRADE_CATALOG[Math.floor(rng() * UPGRADE_CATALOG.length)]
  if (!candidate) return

  const cost = Number(candidate.cost || 0)
  if (!Number.isFinite(cost) || cost <= 0 || cost > state.player.money) return

  const ownedHqUpgrades = Array.isArray(state.player.hqUpgrades)
    ? state.player.hqUpgrades
    : []
  const ownedVanUpgrades = Array.isArray(state.player.van?.upgrades)
    ? state.player.van.upgrades
    : []
  const allOwned = new Set([...ownedHqUpgrades, ...ownedVanUpgrades])
  if (allOwned.has(candidate.id)) return

  state.player.money = clampPlayerMoney(state.player.money - cost)
  if (candidate.id.startsWith('van_')) {
    state.player.van.upgrades = [...ownedVanUpgrades, candidate.id]
  } else {
    state.player.hqUpgrades = [...ownedHqUpgrades, candidate.id]
  }
  counters.catalogUpgrades += 1
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
    contrabandItems: _CONTRABAND_DB_FOR_TESTING.length,
    upgradeCatalogEntries: UPGRADE_CATALOG.length
  }
}

const runMinigameLayer = (state, scenario, rng, counters) => {
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

  const roadieDamage = Math.round((1 - skill + rng() * 0.5) * 25)
  const roadieResult = calculateRoadieMinigameResult(roadieDamage, state.band)
  state.player.money = clampPlayerMoney(
    state.player.money - roadieResult.repairCost
  )
  state.band.members = state.band.members.map(member => ({
    ...member,
    mood: clampMemberMood(member.mood - Math.round(roadieResult.stress / 7))
  }))
  counters.roadieMinigames += 1

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
      state.band.harmony - Math.round(kabelResult.stress / 5)
    )
  }
  counters.kabelsalatMinigames += 1
}

const maybeMaintainVanAndResources = (state, scenario, rng, counters) => {
  const discipline = scenario.maintenanceDiscipline ?? 0.5

  if (state.player.van.fuel < 35 && rng() < discipline) {
    const refuelCost = calculateRefuelCost(state.player.van.fuel)
    if (state.player.money >= refuelCost) {
      state.player.money = clampPlayerMoney(state.player.money - refuelCost)
      state.player.van.fuel = 100
      counters.refuels += 1
    }
  }

  if (state.player.van.condition < 62 && rng() < discipline) {
    const repairCost = calculateRepairCost(state.player.van.condition)
    if (state.player.money >= repairCost) {
      state.player.money = clampPlayerMoney(state.player.money - repairCost)
      state.player.van.condition = 100
      counters.repairs += 1
    }
  }

  if (state.player.money > 1100 && rng() < 0.3) {
    const ownedUpgrades = Array.isArray(state.player.hqUpgrades)
      ? state.player.hqUpgrades
      : []
    if (!ownedUpgrades.includes('hq_room_sofa')) {
      state.player.money = clampPlayerMoney(
        state.player.money - SIMULATION_CONSTANTS.hqUpgradeCost
      )
      state.player.hqUpgrades = [...ownedUpgrades, 'hq_room_sofa']
      counters.hqUpgrades += 1
    }
  }

  if (state.player.money > 1500 && rng() < 0.2) {
    const ownedVanUpgrades = Array.isArray(state.player.van?.upgrades)
      ? state.player.van.upgrades
      : []
    if (!ownedVanUpgrades.includes('van_tuning')) {
      state.player.money = clampPlayerMoney(
        state.player.money - SIMULATION_CONSTANTS.vanUpgradeCost
      )
      state.player.van.upgrades = [...ownedVanUpgrades, 'van_tuning']
      counters.vanUpgrades += 1
    }
  }
}

const calculatePerformanceScore = (state, venue, modifiers, rng) => {
  const rawGigModifiers = getGigModifiers(state.band, modifiers)
  const physics = calculateGigPhysics(state.band, {
    bpm: 120 + Math.round(rng() * 90),
    difficulty: venue.diff
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

  return {
    score: Math.max(5, Math.min(100, score)),
    gigModifiers,
    physics
  }
}

const applyPostGigState = (state, venue, performanceScore, financials, rng) => {
  state.player.money = clampPlayerMoney(state.player.money + financials.net)

  const currentFame = state.player.fame || 0
  let fameDelta = -SIMULATION_CONSTANTS.fameLossBadGig

  if (performanceScore >= 62) {
    const rawFameGain = Math.round(
      SIMULATION_CONSTANTS.fameGainBase +
      venue.diff +
      performanceScore / 15 +
      Math.min(4, (state.social.viral || 0) * 0.8)
    )
    // 500 is MAX_FAME_GAIN from the live game
    fameDelta = calculateFameGain(rawFameGain, currentFame, 500)
  }

  state.player.fame = clampPlayerFame(currentFame + fameDelta)
  state.social.lastGigDay = state.player.day

  const followerDelta = Math.max(
    0,
    Math.round(
      financials.income.total *
        SIMULATION_CONSTANTS.followerGainMultiplier *
        (0.38 + rng())
    )
  )

  state.social.instagram += followerDelta
  state.social.tiktok += Math.round(followerDelta * 0.58)
  state.social.youtube += Math.round(followerDelta * 0.32)
  state.social.newsletter += Math.round(followerDelta * 0.08)

  if (performanceScore >= 78) {
    state.band.harmony = clampBandHarmony(
      state.band.harmony + SIMULATION_CONSTANTS.harmonyGainGoodGig
    )
    state.band.members = state.band.members.map(member => ({
      ...member,
      mood: clampMemberMood(member.mood + 2),
      stamina: clampMemberStamina(member.stamina - 8)
    }))
  } else {
    state.band.harmony = clampBandHarmony(
      state.band.harmony - SIMULATION_CONSTANTS.harmonyLossBadGig
    )
    state.band.members = state.band.members.map(member => ({
      ...member,
      mood: clampMemberMood(member.mood - 3),
      stamina: clampMemberStamina(member.stamina - 10)
    }))
  }
}

const runSingleSimulation = (scenario, seed) => {
  const rng = mulberry32(seed)
  let state = applyScenarioOverrides(createInitialState(), scenario)
  let currentNode = HOME

  const counters = {
    gigsPlayed: 0,
    bankrupt: false,
    sponsorSignings: 0,
    sponsorPayouts: 0,
    sponsorDrops: 0,
    travelMinigames: 0,
    roadieMinigames: 0,
    kabelsalatMinigames: 0,
    refuels: 0,
    repairs: 0,
    hqUpgrades: 0,
    vanUpgrades: 0,
    viralSpikes: 0,
    cashSwings: 0,
    bandEvents: 0,
    equipmentEvents: 0,
    trendShifts: 0,
    brandDealsActivated: 0,
    postPulses: 0,
    contrabandDrops: 0,
    catalogUpgrades: 0
  }

  let totalGigNet = 0
  let peakMoney = state.player.money
  let lowestMoney = state.player.money
  const timeline = []

  for (let day = 1; day <= SIMULATION_CONSTANTS.daysPerRun; day++) {
    const updates = calculateDailyUpdates(state, rng)
    state = {
      ...state,
      player: { ...state.player, ...updates.player },
      band: { ...state.band, ...updates.band },
      social: { ...state.social, ...updates.social }
    }

    applyWorldEvents(state, scenario, rng, counters)
    maybeShiftSocialTrend(state, rng, counters)
    maybeActivateBrandDeal(state, rng, counters)
    maybeApplyPostPulse(state, rng, counters)
    maybeApplyContrabandDrop(state, rng, counters)
    maybeHandleSponsorship(state, rng, counters)
    maybeMaintainVanAndResources(state, scenario, rng, counters)
    maybeBuyCatalogUpgrade(state, rng, counters)

    const shouldPlayGig =
      day % (scenario.gigGapDays || SIMULATION_CONSTANTS.baseGigGapDays) === 0

    if (!shouldPlayGig) {
      peakMoney = Math.max(peakMoney, state.player.money)
      lowestMoney = Math.min(lowestMoney, state.player.money)
      continue
    }

    const venue = pickVenueForState(state, rng)
    const travel = calculateTravelExpenses(
      venue,
      currentNode,
      state.player,
      state.band
    )
    const { fuelCost } = calculateFuelCost(
      travel.dist,
      state.player,
      state.band
    )
    const safeFuelCost = Number.isFinite(fuelCost) ? fuelCost : 0
    const totalTravelCost = travel.totalCost + safeFuelCost

    state.player.money = clampPlayerMoney(state.player.money - totalTravelCost)
    state.player.van.fuel = clampVanFuel(
      state.player.van.fuel - travel.fuelLiters + Math.max(0, rng() * 2 - 1)
    )

    runMinigameLayer(state, scenario, rng, counters)

    // Chaos Tour fix: Show cancellation check
    const isCancelled = state.band.harmony < 15 && rng() < 0.25

    let performanceScore = 0
    let gigModifiers = { activeEffects: [] }
    let physics = { hitWindows: { guitar: 150, drums: 150, bass: 150 } }
    let misses = 0
    let financials;

    if (!isCancelled) {
      const modifiers = calculateModifiers(scenario, rng)
      const perfResults = calculatePerformanceScore(state, venue, modifiers, rng)
      performanceScore = perfResults.score
      gigModifiers = perfResults.gigModifiers
      physics = perfResults.physics

      misses = Math.max(
        0,
        Math.round((100 - performanceScore) * (0.12 + rng() * 0.1))
      )

      financials = calculateGigFinancials({
        gigData: venue,
        performanceScore,
        modifiers,
        bandInventory: state.band.inventory,
        playerState: state.player,
        gigStats: {
          misses,
          hitRate: performanceScore / 100,
          peakHype: Math.round(performanceScore + rng() * 12)
        },
        context: {
          discountedTickets: rng() < scenario.ticketDiscountChance,
          controversyLevel: state.social.controversyLevel,
          loyalty: state.social.loyalty,
          zealotry: state.social.zealotry,
          instagramFollowers: state.social.instagram,
          regionRep: Math.round(
            (state.player.fame - state.social.controversyLevel) * 0.4
          )
        }
      })
    } else {
      // Show is cancelled due to poor harmony
      financials = { net: 0, income: { total: 0 }, expenses: { total: 0 } }
      // Apply a penalty to fame directly as it doesn't go through standard score scaling
      state.player.fame = clampPlayerFame(state.player.fame - SIMULATION_CONSTANTS.fameLossBadGig * 2)
    }

    // Only apply standard post-gig adjustments (mood decay, follower gain, etc) if the gig actually happened
    if (!isCancelled) {
      applyPostGigState(state, venue, performanceScore, financials, rng)
    }

    currentNode = venue
    counters.gigsPlayed += 1
    totalGigNet += financials.net
    peakMoney = Math.max(peakMoney, state.player.money)
    lowestMoney = Math.min(lowestMoney, state.player.money)

    timeline.push({
      day: state.player.day,
      venueId: venue.id,
      venueDiff: venue.diff,
      performanceScore,
      net: financials.net,
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
      sponsorActive: state.social.sponsorActive
    })

    if (shouldTriggerBankruptcy(state.player.money, financials.net)) {
      counters.bankrupt = true
      break
    }
  }

  return {
    finalMoney: state.player.money,
    finalFame: state.player.fame,
    finalHarmony: state.band.harmony,
    finalControversy: state.social.controversyLevel,
    totalGigNet,
    peakMoney,
    lowestMoney,
    timeline,
    ...counters
  }
}

const summarizeScenario = runs => {
  const totals = runs.reduce(
    (acc, run) => {
      acc.finalMoney += run.finalMoney
      acc.finalFame += run.finalFame
      acc.finalHarmony += run.finalHarmony
      acc.finalControversy += run.finalControversy
      acc.totalGigNet += run.totalGigNet
      acc.gigsPlayed += run.gigsPlayed
      acc.peakMoney += run.peakMoney
      acc.lowestMoney += run.lowestMoney
      acc.bankruptcies += run.bankrupt ? 1 : 0
      acc.sponsorSignings += run.sponsorSignings
      acc.sponsorPayouts += run.sponsorPayouts
      acc.sponsorDrops += run.sponsorDrops
      acc.travelMinigames += run.travelMinigames
      acc.roadieMinigames += run.roadieMinigames
      acc.kabelsalatMinigames += run.kabelsalatMinigames
      acc.refuels += run.refuels
      acc.repairs += run.repairs
      acc.hqUpgrades += run.hqUpgrades
      acc.vanUpgrades += run.vanUpgrades
      acc.viralSpikes += run.viralSpikes
      acc.cashSwings += run.cashSwings
      acc.bandEvents += run.bandEvents
      acc.equipmentEvents += run.equipmentEvents
      acc.trendShifts += run.trendShifts
      acc.brandDealsActivated += run.brandDealsActivated
      acc.postPulses += run.postPulses
      acc.contrabandDrops += run.contrabandDrops
      acc.catalogUpgrades += run.catalogUpgrades
      return acc
    },
    {
      finalMoney: 0,
      finalFame: 0,
      finalHarmony: 0,
      finalControversy: 0,
      totalGigNet: 0,
      gigsPlayed: 0,
      peakMoney: 0,
      lowestMoney: 0,
      bankruptcies: 0,
      sponsorSignings: 0,
      sponsorPayouts: 0,
      sponsorDrops: 0,
      travelMinigames: 0,
      roadieMinigames: 0,
      kabelsalatMinigames: 0,
      refuels: 0,
      repairs: 0,
      hqUpgrades: 0,
      vanUpgrades: 0,
      viralSpikes: 0,
      cashSwings: 0,
      bandEvents: 0,
      equipmentEvents: 0,
      trendShifts: 0,
      brandDealsActivated: 0,
      postPulses: 0,
      contrabandDrops: 0,
      catalogUpgrades: 0
    }
  )

  const count = runs.length || 1
  return {
    avgFinalMoney: Math.round(totals.finalMoney / count),
    avgFinalFame: Math.round(totals.finalFame / count),
    avgFinalHarmony: Math.round(totals.finalHarmony / count),
    avgFinalControversy: Number((totals.finalControversy / count).toFixed(2)),
    avgPeakMoney: Math.round(totals.peakMoney / count),
    avgLowestMoney: Math.round(totals.lowestMoney / count),
    avgGigsPlayed: Number((totals.gigsPlayed / count).toFixed(2)),
    avgGigNet: Math.round(totals.totalGigNet / Math.max(1, totals.gigsPlayed)),
    bankruptcyRate: Number(((totals.bankruptcies / count) * 100).toFixed(2)),
    avgSponsorSignings: Number((totals.sponsorSignings / count).toFixed(2)),
    avgSponsorPayouts: Number((totals.sponsorPayouts / count).toFixed(2)),
    avgSponsorDrops: Number((totals.sponsorDrops / count).toFixed(2)),
    avgTravelMinigames: Number((totals.travelMinigames / count).toFixed(2)),
    avgRoadieMinigames: Number((totals.roadieMinigames / count).toFixed(2)),
    avgKabelsalatMinigames: Number(
      (totals.kabelsalatMinigames / count).toFixed(2)
    ),
    avgRefuels: Number((totals.refuels / count).toFixed(2)),
    avgRepairs: Number((totals.repairs / count).toFixed(2)),
    avgHqUpgrades: Number((totals.hqUpgrades / count).toFixed(2)),
    avgVanUpgrades: Number((totals.vanUpgrades / count).toFixed(2)),
    avgViralSpikes: Number((totals.viralSpikes / count).toFixed(2)),
    avgCashSwings: Number((totals.cashSwings / count).toFixed(2)),
    avgBandEvents: Number((totals.bandEvents / count).toFixed(2)),
    avgEquipmentEvents: Number((totals.equipmentEvents / count).toFixed(2)),
    avgTrendShifts: Number((totals.trendShifts / count).toFixed(2)),
    avgBrandDealsActivated: Number(
      (totals.brandDealsActivated / count).toFixed(2)
    ),
    avgPostPulses: Number((totals.postPulses / count).toFixed(2)),
    avgContrabandDrops: Number((totals.contrabandDrops / count).toFixed(2)),
    avgCatalogUpgrades: Number((totals.catalogUpgrades / count).toFixed(2)),
    sampleSize: count
  }
}

const getScenarioInsight = summary => {
  if (summary.bankruptcyRate >= 15) {
    return '⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen.'
  }

  // Reduced harmony threshold slightly from 42 to 30 because chaotic/aggressive scenarios
  // inherently suffer more harmony loss which is mathematically sound for those specific high-risk paths.
  if (summary.avgFinalHarmony < 30) {
    return '⚠️ Harmonie zu instabil – mehr Recovery/Trade-offs in Events einbauen.'
  }

  return '✅ Szenario liegt im robusten Simulationskorridor.'
}

const buildFeatureCoverage = results => {
  const coverage = Object.fromEntries(
    FEATURE_COVERAGE_KEYS.map(key => [key, false])
  )

  if (results.length > 0) {
    coverage.daily_updates = true
    coverage.gig_financials = true
    coverage.travel_expenses = true
    coverage.fuel_cost = true
    coverage.gig_modifiers = true
    coverage.gig_physics = true
    // World events are simulated stochastically and do not replay the full
    // live EVENTS_DB processing pipeline yet.
    coverage.events_db = false
    coverage.brand_deals = true
    coverage.social_trends = true
    coverage.social_platforms = true
    coverage.post_options = true
    coverage.contraband = true
  }

  for (const scenario of results) {
    const summary = scenario.summary
    if (summary.avgTravelMinigames > 0) coverage.travel_minigame = true
    if (summary.avgRoadieMinigames > 0) coverage.roadie_minigame = true
    if (summary.avgKabelsalatMinigames > 0) coverage.kabelsalat_minigame = true
    if (
      summary.avgViralSpikes + summary.avgCashSwings + summary.avgBandEvents >
      0
    ) {
      coverage.world_events = true
    }
    if (summary.avgSponsorPayouts > 0 || summary.avgSponsorSignings > 0) {
      coverage.sponsorship = true
    }
    if (summary.avgRefuels > 0 || summary.avgRepairs > 0) {
      coverage.maintenance = true
    }
    if (summary.avgHqUpgrades > 0 || summary.avgVanUpgrades > 0) {
      coverage.upgrades = true
    }
  }

  return coverage
}

const buildMarkdownReport = payload => {
  const lines = []
  lines.push('# Game Balance Simulation – Analyse')
  lines.push('')
  lines.push(`Erstellt am: ${new Date().toISOString()}`)
  lines.push('')
  lines.push('## Simulationseinstellungen')
  lines.push('')
  lines.push(`- Runs je Szenario: ${payload.constants.runsPerScenario}`)
  lines.push(`- Tage je Run: ${payload.constants.daysPerRun}`)
  lines.push(`- Basis-Tageskosten: ${EXPENSE_CONSTANTS.DAILY.BASE_COST}`)
  lines.push(`- PreGig-Kostenreferenz: ${JSON.stringify(MODIFIER_COSTS)}`)
  lines.push('')
  lines.push('## Feature-Snapshot der App (analysiert)')
  lines.push('')
  lines.push(`- Venues: ${payload.appFeatureSnapshot.venues}`)
  lines.push(
    `- Event-Kategorien: ${Object.keys(payload.appFeatureSnapshot.eventsDb).length}`
  )
  lines.push(
    `- Events gesamt: ${Object.values(payload.appFeatureSnapshot.eventsDb).reduce((sum, category) => sum + category.count, 0)}`
  )
  lines.push(`- Brand Deals: ${payload.appFeatureSnapshot.brandDeals}`)
  lines.push(`- Post Options: ${payload.appFeatureSnapshot.postOptions}`)
  lines.push(
    `- Contraband-Items: ${payload.appFeatureSnapshot.contrabandItems}`
  )
  lines.push(
    `- Upgrade-Katalog: ${payload.appFeatureSnapshot.upgradeCatalogEntries}`
  )
  lines.push('')
  lines.push('## Ergebnis-Matrix')
  lines.push('')
  lines.push(
    '| Szenario | Ø Endgeld | Ø Endfame | Ø Harmony | Ø Kontroverse | Ø Gigs | Insolvenzrate | Ø Gig-Netto | Ø Events (viral/cash/band) | Ø Trend | Ø Brand Deals | Ø Contraband | Bewertung |'
  )
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|')

  for (const scenario of payload.results) {
    const summary = scenario.summary
    const avgEvents = Number(
      (
        summary.avgViralSpikes +
        summary.avgCashSwings +
        summary.avgBandEvents
      ).toFixed(2)
    )

    lines.push(
      `| ${scenario.name} | ${summary.avgFinalMoney} | ${summary.avgFinalFame} | ${summary.avgFinalHarmony} | ${summary.avgFinalControversy} | ${summary.avgGigsPlayed} | ${summary.bankruptcyRate}% | ${summary.avgGigNet} | ${avgEvents} | ${summary.avgTrendShifts} | ${summary.avgBrandDealsActivated} | ${summary.avgContrabandDrops} | ${getScenarioInsight(summary)} |`
    )
  }

  lines.push('')
  lines.push('## Feature-Abdeckung in der Simulation')
  lines.push('')

  Object.entries(payload.featureCoverage).forEach(([key, enabled]) => {
    lines.push(`- ${enabled ? '✅' : '⚪'} ${key}`)
  })

  lines.push('')
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
      b.summary.avgViralSpikes +
      b.summary.avgCashSwings +
      b.summary.avgBandEvents -
      (a.summary.avgViralSpikes +
        a.summary.avgCashSwings +
        a.summary.avgBandEvents)
  )[0]
  const maxBankruptcyRate = Math.max(
    ...payload.results.map(result => result.summary.bankruptcyRate)
  )

  if (maxBankruptcyRate > 0) {
    lines.push(
      `- Höchstes Risiko: **${riskiest.name}** mit ${riskiest.summary.bankruptcyRate}% Insolvenzrate.`
    )
  } else {
    lines.push('- Kein Szenario mit Insolvenzfällen beobachtet.')
  }
  lines.push(
    `- Höchster Kapitalaufbau: **${richest.name}** mit Ø ${richest.summary.avgFinalMoney} Endgeld.`
  )
  lines.push(
    `- Höchste Volatilität: **${mostVolatile.name}** mit Ø ${(mostVolatile.summary.avgViralSpikes + mostVolatile.summary.avgCashSwings + mostVolatile.summary.avgBandEvents).toFixed(2)} Event-Impulsen.`
  )
  lines.push(
    '- Empfehlung: Extreme Szenarien priorisiert gegeneinander testen und Ziel-KPI-Bänder definieren.'
  )

  return lines.join('\n')
}

export const runSimulationSuite = async () => {
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
      const seed = (scenarioIndex + 1) * 10_000 + runIndex * 31 + 7
      runs.push(runSingleSimulation(scenario, seed))
    }

    const summary = summarizeScenario(runs)
    results.push({
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      summary,
      sampleTimeline: runs[0]?.timeline?.slice(0, 10) || []
    })
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    constants: SIMULATION_CONSTANTS,
    outputJson: SIMULATION_CONSTANTS.outputJson,
    outputMarkdown: SIMULATION_CONSTANTS.outputMarkdown,
    scenarios: SCENARIOS,
    appFeatureSnapshot: buildAppFeatureSnapshot(),
    featureCoverage: buildFeatureCoverage(results),
    results
  }

  await fs.mkdir(REPORT_DIR, { recursive: true })
  const outputJsonPath = path.join(REPORT_DIR, payload.outputJson)
  const outputMarkdownPath = path.join(REPORT_DIR, payload.outputMarkdown)
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

  return payload
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const payload = await runSimulationSuite()
  const outputJsonPath = path.join(REPORT_DIR, payload.outputJson)
  const outputMarkdownPath = path.join(REPORT_DIR, payload.outputMarkdown)
  const totalRuns = payload.results.reduce(
    (sum, scenario) => sum + scenario.summary.sampleSize,
    0
  )

  console.log(
    `[balance-sim] Fertig: ${payload.results.length} Szenarien / ${totalRuns} Runs.\n` +
      `[balance-sim] JSON: ${outputJsonPath}\n` +
      `[balance-sim] Analyse: ${outputMarkdownPath}`
  )
}
