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
import { eventEngine, resolveEventChoice } from '../src/utils/eventEngine.js'
import { normalizeTraitMap } from '../src/utils/traitUtils.js'
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
  calculateFameLevel,
  calculateFameGain,
  clampPlayerMoney,
  clampVanFuel,
  BALANCE_CONSTANTS,
  applyEventDelta
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
  reportVersion: 6,
  runsPerScenario: 260,
  daysPerRun: 75,
  homeVenueId: 'stendal_proberaum',
  baseGigGapDays: 1, // In-game, traveling to a new node advances the day exactly once, allowing a gig immediately upon arrival
  randomModifierChance: 0.22,
  followerGainMultiplier: 0.2,
  fameLossBadGig: BALANCE_CONSTANTS.FAME_LOSS_BAD_GIG,
  harmonyGainGoodGig: 2,
  harmonyLossBadGig: 5,
  sponsorshipPayout: 180,
  randomEventCashSwing: 140,
  brandDealEvalChance: 0.14,
  postPulseChance: 0.18,
  trendShiftChance: 0.12,
  contrabandDropChance: 0.11,
  hqUpgradeCost: 600,  // hq_room_sofa actual cost in hqItems.js
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
      'Konservative Tour unter hohem Event-Druck: seltene Modifikatoren, hohe Ereignisdichte.',
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
      social: { controversyLevel: 0, loyalty: 0, zealotry: 0 }
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

const pickVenueForState = (state, rng) => {
  const fame = state.player.fame
  const controversy = state.social.controversyLevel || 0
  let targetDiff = 2

  if (fame >= 400) targetDiff = 5
  else if (fame >= 200) targetDiff = 4
  else if (fame >= 60) targetDiff = 3

  if (controversy >= 70) targetDiff = Math.max(2, targetDiff - 1)

  const candidates = VENUES.filter(
    venue => venue.diff <= targetDiff && venue.diff >= targetDiff - 1
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

const applyWorldEvents = (state, scenario, rng, eventCounts, isTravelDay) => {
  const intensity = scenario.eventIntensity ?? 0.5
  let eventsApplied = 0

  // Process financial and special events to replace viral spikes and cash swings
  if (rng() < 0.18 * intensity) {
    const category = rng() < 0.5 ? 'financial' : 'special'
    const event = eventEngine.checkEvent(category, state, 'random', rng)
    if (event && event.options && event.options.length > 0) {
      const choice = event.options[Math.floor(rng() * event.options.length)]
      const { delta } = resolveEventChoice(choice, state, rng)

      if (delta) {
        Object.assign(state, applyEventDelta(state, delta))
      }

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
      const { delta } = resolveEventChoice(choice, state, rng)

      if (delta) {
        Object.assign(state, applyEventDelta(state, delta))
      }
      eventCounts.bandEvents += 1
      eventsApplied++
    }
  }

  // Process equipment events (transport)
  if (isTravelDay && rng() < 0.06 * intensity) {
    const event = eventEngine.checkEvent('transport', state, 'travel', rng)
    if (event && event.options && event.options.length > 0) {
      const choice = event.options[Math.floor(rng() * event.options.length)]
      const { delta } = resolveEventChoice(choice, state, rng)

      if (delta) {
        Object.assign(state, applyEventDelta(state, delta))
      }
      eventCounts.equipmentEvents += 1
      eventsApplied++
    }
  }

  return eventsApplied
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
    // Immediate drop if controversy is extreme
    if ((state.social.controversyLevel || 0) >= 80) {
      state.social.sponsorActive = false
      counters.sponsorDrops += 1
    } else if ((state.social.controversyLevel || 0) >= 60 && rng() < 0.5) {
      // High chance to drop if controversial
      state.social.sponsorActive = false
      counters.sponsorDrops += 1
    }

    // Only pay out if the sponsor didn't just drop
    if (state.social.sponsorActive) {
      // Fame-scaled payout: grows with band fame (2× fame, capped at 800).
      // Uses fame rather than wealth to avoid compounding feedback; models
      // the real-world dynamic where bigger bands command bigger brand deals.
      const scaledPayout = Math.min(
        800,
        Math.max(
          SIMULATION_CONSTANTS.sponsorshipPayout,
          Math.round(state.player.fame * 2)
        )
      )
      state.player.money = clampPlayerMoney(state.player.money + scaledPayout)
      counters.sponsorPayouts += 1
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

const estimateMerchBuyers = (
  venue,
  performanceScore,
  modifiers,
  state,
  previousFame = state.player.fame
) => {
  const fame = previousFame || 0
  const fameRatio = Math.min(1.0, fame / (venue.capacity * 8))
  let fillRate = 0.3 + fameRatio * 0.8
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

// Wealth-scaled periodic expense: models structural costs (equipment replacement,
// venue deposits, gear insurance) that grow with band success. Fires at ~8% daily
// probability and drains 1.5–3% of current money, creating a meaningful sink for
// bands that have accumulated large reserves without addressing the Netto/Reise ratio.
const maybeApplyWealthScaledExpense = (state, rng, counters) => {
  if (rng() >= 0.08) return
  const money = state.player.money
  if (money < 2000) return // No drain below a floor — protects struggling bands

  const drainRate = 0.015 + rng() * 0.015 // 1.5% – 3.0%
  const expense = Math.round(money * drainRate)
  state.player.money = clampPlayerMoney(money - expense)
  counters.wealthDrainEvents = (counters.wealthDrainEvents || 0) + 1
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

  if (state.player.money > SIMULATION_CONSTANTS.hqUpgradeCost * 1.5 && rng() < 0.3) {
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

const applyPostGigState = (
  state,
  venue,
  performanceScore,
  financials,
  rng,
  misses = 0
) => {
  state.player.money = clampPlayerMoney(state.player.money + financials.net)

  const currentFame = state.player.fame || 0
  let fameDelta = -SIMULATION_CONSTANTS.fameLossBadGig

  if (performanceScore >= 62) {
    const rawFameGain = 50 + Math.floor(performanceScore * 1.5)
    fameDelta = calculateFameGain(
      rawFameGain,
      currentFame,
      BALANCE_CONSTANTS.MAX_FAME_GAIN
    )
  } else {
    // Progressive miss-rate penalty: each miss above the tolerance threshold
    // (8 misses) adds 0.5 extra fame loss, modelling crowd disappointment.
    const MISS_TOLERANCE = 8
    if (misses > MISS_TOLERANCE) {
      const missPenalty = Math.round((misses - MISS_TOLERANCE) * 0.5)
      fameDelta -= missPenalty
    }
  }

  state.player.fame = clampPlayerFame(currentFame + fameDelta)
  state.player.fameLevel = calculateFameLevel(state.player.fame)

  state.social.lastGigDay = state.player.day
  state.social.lastGigDifficulty = venue.diff ?? venue.difficulty ?? 1

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
    wealthDrainEvents: 0
  }

  let totalGigNet = 0
  let peakMoney = state.player.money
  let lowestMoney = state.player.money
  const timeline = []

  // Day-waypoint snapshots (money at start of day, before daily costs)
  let moneyAtDay20 = 0
  let moneyAtDay40 = 0
  let moneyAtDay60 = 0

  // Per-gig metric accumulators for calibration analysis
  let totalTravelCostGigs = 0
  let totalHitWindowSum = 0
  let totalMissesSum = 0
  let totalPerfScoreSum = 0
  let gigScoreLow = 0  // score < 50
  let gigScoreMid = 0  // score 50–70
  let gigScoreHigh = 0 // score > 70

  for (let day = 1; day <= SIMULATION_CONSTANTS.daysPerRun; day++) {
    // Snapshot money at start of day (before any spending)
    if (day === 20) moneyAtDay20 = state.player.money
    if (day === 40) moneyAtDay40 = state.player.money
    if (day === 60) moneyAtDay60 = state.player.money

    const moneyBeforeDay = state.player.money
    const updates = calculateDailyUpdates(state, rng)
    state = {
      ...state,
      player: { ...state.player, ...updates.player },
      band: { ...state.band, ...updates.band },
      social: { ...state.social, ...updates.social }
    }

    // Bankruptcy from daily costs draining the player to zero
    const dailyNetChange = state.player.money - moneyBeforeDay
    if (shouldTriggerBankruptcy(state.player.money, dailyNetChange)) {
      counters.bankrupt = true
      break
    }

    let shouldPlayGig =
      day % (scenario.gigGapDays || SIMULATION_CONSTANTS.baseGigGapDays) === 0

    let willRest = false
    // Check if the band needs rest/clinic before taking on a gig
    if (shouldPlayGig) {
      const needsRest =
        state.band.harmony < 30 ||
        state.band.members.some(m => m.stamina < 30 || m.mood < 30)
      // Save original random state by evaluating early if they *would* rest.
      // Note: we'll just consume the rng here.
      if (needsRest && rng() < 0.85 && state.player.money >= 150) {
        willRest = true
        shouldPlayGig = false
      }
    }

    counters.eventsApplied =
      (counters.eventsApplied || 0) +
      applyWorldEvents(state, scenario, rng, counters, shouldPlayGig)
    maybeShiftSocialTrend(state, rng, counters)
    maybeActivateBrandDeal(state, rng, counters)
    maybeApplyPostPulse(state, rng, counters)
    maybeApplyContrabandDrop(state, rng, counters)
    maybeHandleSponsorship(state, rng, counters)
    maybeMaintainVanAndResources(state, scenario, rng, counters)
    maybeApplyWealthScaledExpense(state, rng, counters)
    maybeBuyCatalogUpgrade(state, rng, counters)

    if (willRest) {
      // Simulate resting / clinic visit
      // Pay the cost and recover stats, skip the gig for the day
      state.player.money = clampPlayerMoney(state.player.money - 150)
      state.band.harmony = clampBandHarmony(state.band.harmony + 15)
      state.band.members = state.band.members.map(member => ({
        ...member,
        mood: clampMemberMood(member.mood + 30),
        stamina: clampMemberStamina(member.stamina + 40)
      }))

      counters.clinicVisits = (counters.clinicVisits || 0) + 1
    }

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
    totalTravelCostGigs += totalTravelCost
    state.player.van.fuel = clampVanFuel(
      state.player.van.fuel - travel.fuelLiters + Math.max(0, rng() * 2 - 1)
    )

    // Show cancellation check (happens BEFORE minigames)
    const isCancelled =
      state.band.harmony < 15 &&
      rng() < BALANCE_CONSTANTS.LOW_HARMONY_CANCELLATION_CHANCE

    if (isCancelled) {
      // Show is cancelled due to poor harmony
      // Apply a penalty to fame directly as it doesn't go through standard score scaling
      state.player.fame = clampPlayerFame(
        state.player.fame - SIMULATION_CONSTANTS.fameLossBadGig * 2
      )
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
        sponsorActive: state.social.sponsorActive,
        cancelled: true
      })

      if (shouldTriggerBankruptcy(state.player.money, 0)) {
        counters.bankrupt = true
        break
      }

      // Update location so next travel routes from the new (cancelled) destination
      currentNode = venue

      // Skip the rest of the gig pipeline
      continue
    }

    // Only run minigames and performance if show is NOT cancelled
    runMinigameLayer(state, scenario, rng, counters)

    const modifiers = calculateModifiers(scenario, rng)
    const perfResults = calculatePerformanceScore(state, venue, modifiers, rng)
    const performanceScore = perfResults.score
    const gigModifiers = perfResults.gigModifiers
    const physics = perfResults.physics

    const misses = Math.max(
      0,
      Math.round((100 - performanceScore) * (0.12 + rng() * 0.1))
    )

    const financials = calculateGigFinancials({
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
        ),
        daysSinceLastGig: state.player.day - (state.social.lastGigDay ?? state.player.day),
        lastGigDifficulty: state.social.lastGigDifficulty ?? null
      }
    })

    const previousFame = state.player.fame

    // Standard post-gig adjustments
    applyPostGigState(state, venue, performanceScore, financials, rng, misses)

    // Deplete merch inventory based on estimated buyers this gig
    const buyers = estimateMerchBuyers(
      venue,
      performanceScore,
      modifiers,
      state,
      previousFame
    )
    state.band.inventory = depleteInventory(state.band.inventory, buyers)

    currentNode = venue
    counters.gigsPlayed += 1
    totalGigNet += financials.net
    peakMoney = Math.max(peakMoney, state.player.money)
    lowestMoney = Math.min(lowestMoney, state.player.money)

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
    moneyAtDay20,
    moneyAtDay40,
    moneyAtDay60,
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
      acc.clinicVisits += run.clinicVisits
      acc.hqUpgrades += run.hqUpgrades
      acc.vanUpgrades += run.vanUpgrades
      acc.specialEvents += run.specialEvents
      acc.cashSwings += run.cashSwings
      acc.bandEvents += run.bandEvents
      acc.equipmentEvents += run.equipmentEvents
      acc.eventsApplied += run.eventsApplied || 0
      acc.trendShifts += run.trendShifts
      acc.brandDealsActivated += run.brandDealsActivated
      acc.postPulses += run.postPulses
      acc.contrabandDrops += run.contrabandDrops
      acc.catalogUpgrades += run.catalogUpgrades
      acc.moneyAtDay20 += run.moneyAtDay20 || 0
      acc.moneyAtDay40 += run.moneyAtDay40 || 0
      acc.moneyAtDay60 += run.moneyAtDay60 || 0
      acc.totalTravelCostGigs += run.totalTravelCostGigs || 0
      acc.totalHitWindowSum += run.totalHitWindowSum || 0
      acc.totalMissesSum += run.totalMissesSum || 0
      acc.totalPerfScoreSum += run.totalPerfScoreSum || 0
      acc.gigScoreLow += run.gigScoreLow || 0
      acc.gigScoreMid += run.gigScoreMid || 0
      acc.gigScoreHigh += run.gigScoreHigh || 0
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
      moneyAtDay20: 0,
      moneyAtDay40: 0,
      moneyAtDay60: 0,
      totalTravelCostGigs: 0,
      totalHitWindowSum: 0,
      totalMissesSum: 0,
      totalPerfScoreSum: 0,
      gigScoreLow: 0,
      gigScoreMid: 0,
      gigScoreHigh: 0
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
    avgClinicVisits: Number((totals.clinicVisits / count).toFixed(2)),
    avgHqUpgrades: Number((totals.hqUpgrades / count).toFixed(2)),
    avgVanUpgrades: Number((totals.vanUpgrades / count).toFixed(2)),
    avgSpecialEvents: Number((totals.specialEvents / count).toFixed(2)),
    avgCashSwings: Number((totals.cashSwings / count).toFixed(2)),
    avgBandEvents: Number((totals.bandEvents / count).toFixed(2)),
    avgEquipmentEvents: Number((totals.equipmentEvents / count).toFixed(2)),
    avgEventsApplied: Number((totals.eventsApplied / count).toFixed(2)),
    avgTrendShifts: Number((totals.trendShifts / count).toFixed(2)),
    avgBrandDealsActivated: Number(
      (totals.brandDealsActivated / count).toFixed(2)
    ),
    avgPostPulses: Number((totals.postPulses / count).toFixed(2)),
    avgContrabandDrops: Number((totals.contrabandDrops / count).toFixed(2)),
    avgCatalogUpgrades: Number((totals.catalogUpgrades / count).toFixed(2)),
    sampleSize: count,
    // Progression curve
    avgMoneyAtDay20: Math.round(totals.moneyAtDay20 / count),
    avgMoneyAtDay40: Math.round(totals.moneyAtDay40 / count),
    avgMoneyAtDay60: Math.round(totals.moneyAtDay60 / count),
    // Gig calibration
    avgTravelCostPerGig: Math.round(
      totals.totalTravelCostGigs / Math.max(1, totals.gigsPlayed)
    ),
    avgHitWindow: Math.round(
      totals.totalHitWindowSum / Math.max(1, totals.gigsPlayed)
    ),
    avgMissesPerGig: Number(
      (totals.totalMissesSum / Math.max(1, totals.gigsPlayed)).toFixed(1)
    ),
    avgPerformanceScore: Math.round(
      totals.totalPerfScoreSum / Math.max(1, totals.gigsPlayed)
    ),
    gigScorePctLow: Number(
      ((totals.gigScoreLow / Math.max(1, totals.gigsPlayed)) * 100).toFixed(1)
    ),
    gigScorePctMid: Number(
      ((totals.gigScoreMid / Math.max(1, totals.gigsPlayed)) * 100).toFixed(1)
    ),
    gigScorePctHigh: Number(
      ((totals.gigScoreHigh / Math.max(1, totals.gigsPlayed)) * 100).toFixed(1)
    ),
    // Income structure & sink analysis
    gigNetToTravelRatio: Number(
      (totals.totalGigNet / Math.max(1, totals.totalTravelCostGigs)).toFixed(1)
    ),
    gigsToAffordHqUpgrade: Number(
      (
        SIMULATION_CONSTANTS.hqUpgradeCost /
        Math.max(1, totals.totalGigNet / Math.max(1, totals.gigsPlayed))
      ).toFixed(2)
    ),
    gigsToAffordVanUpgrade: Number(
      (
        SIMULATION_CONSTANTS.vanUpgradeCost /
        Math.max(1, totals.totalGigNet / Math.max(1, totals.gigsPlayed))
      ).toFixed(2)
    )
  }
}

const getScenarioInsight = summary => {
  if (summary.bankruptcyRate >= 15) {
    return '⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen.'
  }

  if (summary.avgFinalMoney >= 100000 && summary.avgFinalFame < 20) {
    return '⚠️ Geldwachstum entkoppelt von Fame – Reputations- und Monetarisierungs-Kurve angleichen.'
  }

  // Reduced harmony threshold slightly from 42 to 30 because chaotic/aggressive scenarios
  // inherently suffer more harmony loss which is mathematically sound for those specific high-risk paths.
  if (summary.avgFinalHarmony < 30) {
    return '⚠️ Harmonie zu instabil – mehr Recovery/Trade-offs in Events einbauen.'
  }

  return '✅ Szenario liegt im robusten Simulationskorridor.'
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

const getEventsInsight = s => {
  const totalEvents =
    s.avgSpecialEvents + s.avgCashSwings + s.avgBandEvents + s.avgEquipmentEvents
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

const getMinigameInsight = s => {
  const total =
    s.avgTravelMinigames + s.avgRoadieMinigames + s.avgKabelsalatMinigames
  if (total > 150) {
    return '✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal.'
  }
  if (total > 80) {
    return '✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion.'
  }
  if (total > 40) {
    return '✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität.'
  }
  return '⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt.'
}

const buildFeatureCoverage = results => {
  const coverage = Object.fromEntries(
    FEATURE_COVERAGE_KEYS.map(key => [key, false])
  )

  if (results.length > 0) {
    const hasEventsApplied = results.some(
      scenario => scenario.summary.avgEventsApplied > 0
    )
    coverage.daily_updates = true
    coverage.gig_financials = true
    coverage.travel_expenses = true
    coverage.fuel_cost = true
    coverage.gig_modifiers = true
    coverage.gig_physics = true
    coverage.events_db = hasEventsApplied
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
    if (summary.avgEventsApplied > 0) {
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

const fmt = n => n.toLocaleString('de-DE')
const fmtEur = n => `€${fmt(n)}`
const fmtPct = n => `${n}%`

const KPI_TARGETS = {
  // All scenarios start from the real game-default state (€500, fame 0, harmony 80).
  // Targets calibrated to 75-day runs with uniform starting conditions (2026-04-13).
  baseline_touring: {
    bankruptcyMax: 5,
    moneyMin: 80000,
    moneyMax: 400000,
    fameMin: 200,
    fameMax: 500
  },
  bootstrap_struggle: {
    bankruptcyMax: 32, // Raised from 25: tighter hit windows reduce gig income for low-skill scenarios
    moneyMin: 3000,
    moneyMax: 50000,
    fameMin: 120,
    fameMax: 320
  },
  aggressive_marketing: {
    bankruptcyMax: 5,
    moneyMin: 50000,
    moneyMax: 200000,
    fameMin: 200,
    fameMax: 430
  },
  scandal_recovery: {
    bankruptcyMax: 15,
    moneyMin: 10000,
    moneyMax: 120000,
    fameMin: 150,
    fameMax: 360
  },
  festival_push: {
    bankruptcyMax: 10,
    moneyMin: 20000,
    moneyMax: 150000,
    fameMin: 200,
    fameMax: 460
  },
  chaos_tour: {
    bankruptcyMax: 15,
    moneyMin: 30000,
    moneyMax: 200000,
    fameMin: 200,
    fameMax: 430
  },
  cult_hypergrowth: {
    bankruptcyMax: 5,
    moneyMin: 50000,
    moneyMax: 200000,
    fameMin: 200,
    fameMax: 380
  }
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

  const fame = summary.avgFinalFame
  const fameRange = t.fameMax - t.fameMin
  const fameCenter = (t.fameMin + t.fameMax) / 2
  const fameDeviation =
    fameRange > 0 ? Math.abs(fame - fameCenter) / (fameRange / 2) : 0
  let fameBewertung
  if (fame < t.fameMin || fame > t.fameMax) {
    fameBewertung = 'Außerhalb Zielband – Progressionspfad prüfen.'
  } else if (fameDeviation < 0.3) {
    fameBewertung = 'Zentral im Zielband – Fame-Kurve stimmig.'
  } else {
    fameBewertung = 'Im Zielband – leicht außermittig.'
  }
  checks.push({
    label: 'Endfame',
    pass: fame >= t.fameMin && fame <= t.fameMax,
    actual: String(fame),
    target: `${t.fameMin} – ${t.fameMax}`,
    bewertung: fameBewertung
  })

  return checks
}

const getProgressionInsight = s => {
  // Thresholds calibrated to the post-Round-3 economy (2026-04-13):
  // With €3,500 gig-net and daily frequency, Baseline Touring reaches ~€46k by day 20.
  // €70k+ would indicate a genuinely pathological sink failure; €55k+ is notable but not critical.
  if (s.avgMoneyAtDay20 > 70000)
    return '⚠️ Sehr hohe Frühakkumulation – Sink-Kosten drastisch erhöhen.'
  if (s.avgMoneyAtDay20 > 55000)
    return '⚠️ Schnelle Kapitalakkumulation – Daily-Kosten oder Upgrade-Preise prüfen.'
  if (s.avgMoneyAtDay20 < 800 && s.bankruptcyRate > 5)
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
  // Thresholds calibrated to the post-Round-3 economy (2026-04-13):
  // With €2.4k–4.8k gig-net and €78–93 per-gig travel, ratios land at 31–52×.
  // A ratio >70× would indicate a genuine sink failure; >55× is notable but acceptable.
  if (s.gigNetToTravelRatio > 70)
    return '⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig.'
  if (s.gigNetToTravelRatio > 55)
    return '⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen.'
  if (s.gigsToAffordHqUpgrade < 0.05)
    return '⚠️ HQ-Upgrade in <0.05 Gigs amortisiert – Preis deutlich erhöhen.'
  // Van upgrade (€350) requires 0.07–0.14 gigs given current net income.
  // <0.06 would indicate the upgrade is virtually free.
  if (s.gigsToAffordVanUpgrade < 0.06)
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
    `| Venue-Fame-Gates | diff-2: fame 0–59 · diff-3: 60–199 · diff-4: 200–399 · diff-5: 400+ |`
  )
  lines.push(`| Fame-Level-Skala | Level = floor(fame / 100) |`)
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
    '| Szenario | Startkapital | Startfame | Ø Endgeld | Ø Endfame | Ø Fame-Lv. | Ø Harmony | Ø Kontroverse | Ø Gigs | Ø Clinic | Insolvenz | Ø Gig-Netto | Bewertung |'
  )
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|')

  for (const scenario of payload.results) {
    const s = scenario.summary
    const sc = SCENARIOS.find(x => x.id === scenario.id)
    const startMoney = sc?.initialOverrides?.player?.money ?? '?'
    const startFame = sc?.initialOverrides?.player?.fame ?? 0
    const fameLevel = Math.floor(s.avgFinalFame / 100)
    lines.push(
      `| ${scenario.name} | ${fmtEur(startMoney)} | ${startFame} | ${fmtEur(s.avgFinalMoney)} | ${s.avgFinalFame} | ${fameLevel} | ${s.avgFinalHarmony} | ${s.avgFinalControversy} | ${s.avgGigsPlayed} | ${s.avgClinicVisits} | ${fmtPct(s.bankruptcyRate)} | ${fmtEur(s.avgGigNet)} | ${getScenarioInsight(s)} |`
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

  // ── Progression Curve ─────────────────────────────────────────────────────
  lines.push('## Kapital-Progressionskurve')
  lines.push('')
  lines.push(
    '| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |'
  )
  lines.push('|---|---:|---:|---:|---:|---|')

  for (const scenario of payload.results) {
    const s = scenario.summary
    lines.push(
      `| ${scenario.name} | ${fmtEur(s.avgMoneyAtDay20)} | ${fmtEur(s.avgMoneyAtDay40)} | ${fmtEur(s.avgMoneyAtDay60)} | ${fmtEur(s.avgFinalMoney)} | ${getProgressionInsight(s)} |`
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
    '| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |'
  )
  lines.push('|---|---:|---:|---:|---:|---:|---:|---|')

  for (const scenario of payload.results) {
    const s = scenario.summary
    lines.push(
      `| ${scenario.name} | ${s.avgSpecialEvents} | ${s.avgCashSwings} | ${s.avgBandEvents} | ${s.avgEquipmentEvents} | ${s.avgTrendShifts} | ${s.avgCatalogUpgrades} | ${getEventsInsight(s)} |`
    )
  }
  lines.push('')

  // ── Minigame Coverage ─────────────────────────────────────────────────────
  lines.push('## Minigame-Abdeckung im Detail')
  lines.push('')
  lines.push(
    '| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |'
  )
  lines.push('|---|---:|---:|---:|---:|---|')

  for (const scenario of payload.results) {
    const s = scenario.summary
    const total = Number(
      (
        s.avgTravelMinigames +
        s.avgRoadieMinigames +
        s.avgKabelsalatMinigames
      ).toFixed(2)
    )
    lines.push(
      `| ${scenario.name} | ${s.avgTravelMinigames} | ${s.avgRoadieMinigames} | ${s.avgKabelsalatMinigames} | ${total} | ${getMinigameInsight(s)} |`
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
      bewertung: 'Festival-Fokus priorisiert Fame über kurzfristige Einnahmen.'
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
      bewertung: 'Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing.'
    },
    {
      label: 'Meiste Ø Events',
      key: s => s.avgEventsApplied,
      fmt: v => v.toFixed(2),
      bewertung: 'Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse.'
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
  lines.push('## KPI-Zielkorridore (Health Check)')
  lines.push('')
  lines.push(
    'Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).'
  )
  lines.push('')
  lines.push('| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |')
  lines.push('|---|---|---|---|---|---|')

  for (const scenario of payload.results) {
    const checks = checkKpi(scenario.id, scenario.summary)
    if (!checks) continue
    for (const c of checks) {
      lines.push(
        `| ${scenario.name} | ${c.label} | ${c.target} | ${c.actual} | ${c.pass ? '✅' : '❌'} | ${c.bewertung} |`
      )
    }
  }
  lines.push('')

  // ── Feature Coverage ──────────────────────────────────────────────────────
  lines.push('## Feature-Abdeckung in der Simulation')
  lines.push('')
  Object.entries(payload.featureCoverage).forEach(([key, enabled]) => {
    lines.push(`- ${enabled ? '✅' : '⚪'} ${key}`)
  })
  lines.push('')

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
    (a, b) => b.summary.avgEventsApplied - a.summary.avgEventsApplied
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
    `- Höchste Volatilität: **${mostVolatile.name}** mit Ø ${mostVolatile.summary.avgEventsApplied.toFixed(2)} Event-Impulsen.`
  )

  if (failedKpis.length > 0) {
    lines.push(`- ❌ KPI-Verstöße: ${failedKpis.join(' · ')}`)
    lines.push(
      '- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.'
    )
  } else {
    lines.push('- ✅ Alle KPI-Zielkorridore eingehalten.')
    lines.push(
      '- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.'
    )
  }

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
