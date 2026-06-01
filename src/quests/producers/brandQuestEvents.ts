import type { BrandDeal, QuestEvent } from '../../types'

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
