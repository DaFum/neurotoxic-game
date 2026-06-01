import type { BrandDeal, QuestEvent } from '../../types'

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
