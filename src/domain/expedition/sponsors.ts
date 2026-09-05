import { BRAND_DEALS_BY_ID } from '../../data/brandDeals'
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
export const buildPreparedExpeditionSponsorOffers = (
  state: GameState
): ExpeditionPreparedSponsorOffer[] =>
  generateBrandOffers(state, mulberry32(sponsorSeed(state.runSeed)))
    .slice(0, 3)
    .map(deal => ({
      offerId: hashExpeditionRoute(
        `${state.runSeed}:${deal.id}:${getCanonicalBrandDealTermsHash(deal.id)}`
      ),
      dealId: deal.id,
      runSeed: state.runSeed,
      canonicalTermsHash: getCanonicalBrandDealTermsHash(deal.id) ?? ''
    }))

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
