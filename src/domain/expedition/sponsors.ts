import { BRAND_DEALS_BY_ID } from '../../data/brandDeals'
import { getExpeditionStaticRoutePressureProfile } from './routeProfile'
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
 * Staged Sponsor offers a prepared run may commit.
 *
 * @param state - Current game state.
 * @returns The deterministic offers, already narrowed by Rival interference.
 *
 * @remarks
 * Nemesis tier 3 is Sponsor interference: a Rival the Career has history with
 * takes one staged offer off the table before the next tour can commit to it,
 * which is what makes the tier a real rule change rather than a number. The
 * cut is safe to derive here because a Nemesis tier only advances during an
 * *active* run, so the offers a prepared run stages cannot shift underneath
 * the load-time re-derivation that validates them.
 */
export const buildPreparedExpeditionSponsorOffers = (
  state: GameState
): ExpeditionPreparedSponsorOffer[] => {
  const rivalRecord = state.rivalBand
    ? state.career?.rivalsById?.[state.rivalBand.id]
    : undefined
  // The run-stable half of the route profile, never the live one: these
  // offers are committed at PREPARE and re-derived on load, so a Fame or
  // Nemesis change mid-run must not silently produce a different set.
  const route = getExpeditionStaticRoutePressureProfile(
    state.expedition?.loadout?.regionId,
    state.expedition?.loadout?.tourTypeId
  )
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
  return generateBrandOffers(state, mulberry32(sponsorSeed(state.runSeed)))
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
  const canonical = buildPreparedExpeditionSponsorOffers(state)
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
