import { BRAND_DEALS_BY_ID } from '../../data/brandDeals'
import { getExpeditionStaticRoutePressureProfile } from './routeProfile'
import { getExpeditionFameProfile } from './fame'
import { generateBrandOffers } from '../../utils/brandDealLogic'
import {
  getAcceptDealBandUpdateFactory,
  getAcceptDealMoneyUpdate,
  getAcceptDealSocialUpdateFactory
} from '../../utils/postGig'
import { mulberry32 } from '../../utils/seededRng'
import { hashExpeditionRoute } from './map'
import type { GameState } from '../../types'
import type { BrandDeal } from '../../types/social'
import type { ExpeditionPreparedSponsorOffer } from '../../types/expedition'
import type { QuestEvent } from '../../types/quest'
import {
  createBrandDealCompletedQuestEvent,
  createBrandOfferAcceptedQuestEvent,
  createBrandTrustChangedQuestEvent
} from '../../quests/producers/brandQuestEvents'
import { createMoneyEarnedQuestEvent } from '../../quests/producers/economyQuestEvents'
import { isExpeditionCapabilityUnlocked } from '../../data/expedition/unlockSets'
import { getExpeditionStarterPerk } from '../../data/expedition/starterPerks'

/**
 * The most genuine matches any combination may promote into the staged pool.
 *
 * @remarks
 * Fame tops out at 2, and the perk and the unlock set add one each. Without
 * this cap a Career could guarantee every staged offer is a real match, which
 * removes the choice the staging exists to create.
 */
const MAX_EXPEDITION_SPONSOR_QUALITY_BIAS = 3

const sponsorSeed = (seed: number): number =>
  Number.parseInt(
    hashExpeditionRoute(`${seed}:expedition-sponsor-offers`),
    16
  ) >>> 0
export const getCanonicalBrandDealTermsHash = (
  dealId: string
): string | null => {
  const deal = BRAND_DEALS_BY_ID.get(dealId)
  if (!deal) return null
  return hashExpeditionRoute(
    JSON.stringify({
      id: deal.id,
      type: deal.type,
      alignment: deal.alignment,
      offer: deal.offer,
      penalty: deal.penalty ?? null,
      benefit: deal.benefit ?? null
    })
  )
}
/**
 * The Sponsor offers a run on this Region and Tour may commit.
 *
 * @param state - Current game state.
 * @param regionId - Region the offers are staged for.
 * @param tourTypeId - Tour Type the offers are staged for.
 * @returns The deterministic offers, already narrowed by Rival interference.
 *
 * @remarks
 * The Region and Tour arrive as arguments rather than being read off
 * `state.expedition.loadout`, because every caller needs them *before* that
 * loadout exists: PREPARE runs on scene entry, before the player has chosen
 * either, and START validates a candidate that is not committed yet. Reading
 * the loadout meant this always resolved the baseline profile in production,
 * so the route-specific offer count never applied to a real run.
 *
 * Nemesis tier 3 is Sponsor interference: a Rival the Career has history with
 * takes one staged offer off the table before the next tour can commit to it,
 * which is what makes the tier a real rule change rather than a number. The
 * cut is safe to derive here because a Nemesis tier only advances during an
 * *active* run, so the offers a prepared run sees cannot shift underneath the
 * derivation that validates them.
 */
export const buildPreparedExpeditionSponsorOffers = (
  state: GameState,
  regionId: unknown,
  tourTypeId: unknown
): ExpeditionPreparedSponsorOffer[] => {
  const rivalRecord = state.rivalBand
    ? state.career?.rivalsById?.[state.rivalBand.id]
    : undefined
  // The run-stable half of the route profile, never the live one: this set is
  // derived at commit time and again on load, so a Fame or Nemesis change
  // mid-run must not silently produce a different one.
  const route = getExpeditionStaticRoutePressureProfile(regionId, tourTypeId)
  // A Region or Tour that runs on Contracts stages one more offer to choose
  // from; one that keeps its distance from brands stages one fewer.
  const routeStagedOffers =
    route.sponsorContractEventWeightMultiplier >= 1.25
      ? 1
      : route.sponsorContractEventWeightMultiplier <= 0.9
        ? -1
        : 0
  const stagedOfferCount = Math.max(
    1,
    ((rivalRecord?.history.nemesisLevel ?? 0) >= 3 ? 2 : 3) + routeStagedOffers
  )
  // Fame biases pool *quality*, never the count: the Region and Tour decide how
  // many offers are staged, and Fame decides how many of them are genuine
  // matches rather than stretched ones. The bias value is the guarantee - a
  // `touring` band is owed two real matches if the pool has them - so nothing
  // here invents a threshold the Fame table does not already state.
  const generated = generateBrandOffers(
    state,
    mulberry32(sponsorSeed(state.runSeed))
  )
  const genuine = generated.filter(offer => !offer.flavor.isStretched)
  // Quality, never count. The Fame band sets the baseline guarantee, and both
  // `premium_sponsor_pool` and the `press_pass` perk add one more genuine
  // match on top - capped, so stacking them cannot promote more real matches
  // than the design allows. The staged offer count is untouched either way, so
  // neither buys extra offers or extra payout.
  const promoted = genuine.slice(
    0,
    Math.min(
      MAX_EXPEDITION_SPONSOR_QUALITY_BIAS,
      getExpeditionFameProfile(state).sponsorQualityBias +
        (isExpeditionCapabilityUnlocked(
          state.career?.unlockedSetIds,
          'premium_sponsor_pool'
        )
          ? 1
          : 0) +
        Math.max(
          0,
          getExpeditionStarterPerk(state.expedition?.loadout?.starterPerkId)
            ?.sponsorQualityBias ?? 0
        )
    )
  )
  const promotedIds = new Set(promoted.map(offer => offer.id))
  return [...promoted, ...generated.filter(offer => !promotedIds.has(offer.id))]
    .slice(0, stagedOfferCount)
    .map(deal => ({
      offerId: hashExpeditionRoute(
        `${state.runSeed}:${deal.id}:${getCanonicalBrandDealTermsHash(deal.id)}`
      ),
      dealId: deal.id,
      runSeed: state.runSeed,
      canonicalTermsHash: getCanonicalBrandDealTermsHash(deal.id) ?? ''
    }))
}

export const validatePreparedExpeditionSponsorOffers = (
  state: GameState,
  persisted: readonly ExpeditionPreparedSponsorOffer[]
): ExpeditionPreparedSponsorOffer[] => {
  const canonical = buildPreparedExpeditionSponsorOffers(
    state,
    state.expedition?.loadout?.regionId,
    state.expedition?.loadout?.tourTypeId
  )
  if (JSON.stringify(canonical) !== JSON.stringify(persisted)) return []
  return canonical
}

export interface BrandDealAcceptanceResult {
  dealId: string
  nextPlayer: GameState['player']
  nextBand: GameState['band']
  nextSocial: GameState['social']
  appliedMoneyDelta: number
  questEvents: QuestEvent[]
  bandUpdate: (band: GameState['band']) => Partial<GameState['band']>
  socialUpdate: (social: GameState['social']) => Partial<GameState['social']>
}
export const resolveBrandDealAcceptance = (
  state: Pick<GameState, 'player' | 'band' | 'social'>,
  dealInput: string | BrandDeal
): BrandDealAcceptanceResult | null => {
  const deal =
    typeof dealInput === 'string' ? BRAND_DEALS_BY_ID.get(dealInput) : dealInput
  if (
    !deal ||
    (Array.isArray(state.social.activeDeals) &&
      state.social.activeDeals.length > 0)
  )
    return null
  const { nextMoney, appliedMoneyDelta } = getAcceptDealMoneyUpdate({
    deal,
    player: state.player
  })
  const bandUpdate = getAcceptDealBandUpdateFactory(deal)
  const socialUpdate = getAcceptDealSocialUpdateFactory(deal)
  const nextBand = {
    ...state.band,
    ...bandUpdate(state.band)
  }
  const nextSocial = {
    ...state.social,
    ...socialUpdate(state.social)
  }
  const questEvents: QuestEvent[] = [
    createBrandOfferAcceptedQuestEvent(deal),
    createBrandDealCompletedQuestEvent(deal)
  ]
  const currentRep = state.social.brandReputation?.[deal.alignment] ?? 0
  const trustDelta = Math.min(100, currentRep + 5) - currentRep
  if (trustDelta !== 0)
    questEvents.push(
      createBrandTrustChangedQuestEvent({
        brandId: deal.alignment,
        amount: trustDelta
      })
    )
  if (appliedMoneyDelta > 0)
    questEvents.push(
      createMoneyEarnedQuestEvent({
        amount: appliedMoneyDelta,
        reason: 'brand_deal'
      })
    )
  return {
    dealId: deal.id,
    nextPlayer: { ...state.player, money: nextMoney },
    nextBand,
    nextSocial,
    appliedMoneyDelta,
    questEvents,
    bandUpdate,
    socialUpdate
  }
}
