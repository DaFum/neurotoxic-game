import type { BrandDeal, QuestEvent } from '../../types'

/**
 * Creates a `brand.offerAccepted` quest event for accepting a brand offer.
 */
export const createBrandOfferAcceptedQuestEvent = (
  deal: Pick<BrandDeal, 'id' | 'type' | 'alignment'>
): QuestEvent => ({
  type: 'brand.offerAccepted',
  amount: 1,
  success: true,
  context: {
    dealId: deal.id,
    dealType: deal.type,
    brandAlignment: deal.alignment
  },
  tags: [deal.type, deal.alignment]
})

/**
 * Creates a `brand.dealCompleted` quest event for completing an active deal.
 */
export const createBrandDealCompletedQuestEvent = (
  deal: Pick<BrandDeal, 'id' | 'type' | 'alignment'>
): QuestEvent => ({
  type: 'brand.dealCompleted',
  amount: 1,
  success: true,
  context: {
    dealId: deal.id,
    dealType: deal.type,
    brandAlignment: deal.alignment
  },
  tags: [deal.type, deal.alignment]
})

/**
 * Creates a `brand.dealFailed` quest event for a failed brand deal.
 */
export const createBrandDealFailedQuestEvent = ({
  dealId,
  reason
}: {
  dealId: string
  reason: string
}): QuestEvent => ({
  type: 'brand.dealFailed',
  amount: 1,
  success: false,
  context: { dealId, reason },
  tags: [reason]
})

/**
 * Creates a `brand.trustChanged` quest event for brand reputation changes.
 */
export const createBrandTrustChangedQuestEvent = ({
  brandId,
  amount
}: {
  brandId: string
  amount: number
}): QuestEvent => ({
  type: 'brand.trustChanged',
  amount,
  success: amount >= 0,
  context: { brandId },
  tags: [brandId]
})
