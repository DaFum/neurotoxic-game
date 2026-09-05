import type { QuestEvent } from '../../types'
const event = (
  type: QuestEvent['type'],
  id: string,
  success = true
): QuestEvent => ({ type, success, amount: 1, context: { id }, tags: [id] })
export const createExpeditionNodeResolvedQuestEvent = (
  nodeId: string
): QuestEvent => event('expedition.nodeResolved', nodeId)
export const createExpeditionExtractionQuestEvent = (
  runId: string
): QuestEvent => event('expedition.extracted', runId)
export const createExpeditionRivalOutcomeQuestEvent = (
  rivalId: string,
  success: boolean
): QuestEvent => event('expedition.rivalOutcome', rivalId, success)
export const createExpeditionFinaleQuestEvent = (
  finaleType: string,
  success: boolean
): QuestEvent => event('expedition.finaleCompleted', finaleType, success)
