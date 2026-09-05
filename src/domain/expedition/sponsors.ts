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
import type { ExpeditionPreparedSponsorOffer } from '../../types/expedition'
import type { QuestEvent } from '../../types/quest'
import { createBrandOfferAcceptedQuestEvent } from '../../quests/producers/brandQuestEvents'
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

export interface BrandDealAcceptanceResult {
  dealId: string
  nextPlayer: GameState['player']
  nextBand: GameState['band']
  nextSocial: GameState['social']
  appliedMoneyDelta: number
  questEvents: QuestEvent[]
}
export const resolveBrandDealAcceptance = (
  state: GameState,
  dealId: string
): BrandDealAcceptanceResult | null => {
  const deal = BRAND_DEALS_BY_ID.get(dealId)
  if (!deal || state.social.activeDeals.length > 0) return null
  const { nextMoney, appliedMoneyDelta } = getAcceptDealMoneyUpdate({
    deal,
    player: state.player
  })
  const nextBand = {
    ...state.band,
    ...getAcceptDealBandUpdateFactory(deal)(state.band)
  }
  const nextSocial = {
    ...state.social,
    ...getAcceptDealSocialUpdateFactory(deal)(state.social)
  }
  const questEvents: QuestEvent[] = [createBrandOfferAcceptedQuestEvent(deal)]
  if (appliedMoneyDelta > 0)
    questEvents.push(
      createMoneyEarnedQuestEvent({
        amount: appliedMoneyDelta,
        reason: 'brand_deal'
      })
    )
  return {
    dealId,
    nextPlayer: { ...state.player, money: nextMoney },
    nextBand,
    nextSocial,
    appliedMoneyDelta,
    questEvents
  }
}
