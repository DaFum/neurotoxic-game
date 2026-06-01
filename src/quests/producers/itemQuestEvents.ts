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
