import type { QuestEvent } from '../../types'

export const createItemCollectedQuestEvent = ({
  itemId
}: {
  itemId: string
}): QuestEvent => ({
  type: 'item.collected',
  amount: 1,
  success: true,
  context: { itemId },
  tags: [itemId]
})

export const createItemUsedQuestEvent = ({
  itemId
}: {
  itemId: string
}): QuestEvent => ({
  type: 'item.used',
  amount: 1,
  success: true,
  context: { itemId },
  tags: [itemId]
})

export const createItemCraftedQuestEvent = ({
  itemId,
  recipeId
}: {
  itemId: string
  recipeId: string
}): QuestEvent => ({
  type: 'item.crafted',
  amount: 1,
  success: true,
  context: { itemId, recipeId },
  tags: [itemId, recipeId]
})

export const createItemDeliveredQuestEvent = ({
  itemId,
  amount
}: {
  itemId: string
  amount: number
}): QuestEvent => ({
  type: 'item.delivered',
  amount,
  success: true,
  context: { itemId },
  tags: [itemId]
})
