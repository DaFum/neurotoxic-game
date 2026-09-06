import type { QuestEvent } from '../../types'

/**
 * Shared body of every Expedition quest event.
 *
 * @remarks
 * Only the payload, never the `type`: each producer below spells its own event
 * type as a literal so a reader (and the content gate that greps `src/` for
 * emit sites) can see which events this file actually produces.
 */
const body = (id: string, success = true): Omit<QuestEvent, 'type'> => ({
  success,
  amount: 1,
  context: { id },
  tags: [id]
})

/**
 * Creates an `expedition.nodeResolved` quest event for a resolved route node.
 */
export const createExpeditionNodeResolvedQuestEvent = (
  nodeId: string
): QuestEvent => ({ type: 'expedition.nodeResolved', ...body(nodeId) })

/**
 * Creates an `expedition.extracted` quest event for a run left voluntarily.
 */
export const createExpeditionExtractionQuestEvent = (
  runId: string
): QuestEvent => ({ type: 'expedition.extracted', ...body(runId) })

/**
 * Creates an `expedition.rivalOutcome` quest event for a resolved Rival beat.
 */
export const createExpeditionRivalOutcomeQuestEvent = (
  rivalId: string,
  success: boolean
): QuestEvent => ({
  type: 'expedition.rivalOutcome',
  ...body(rivalId, success)
})

/**
 * Creates an `expedition.finaleCompleted` quest event for a finished Finale.
 */
export const createExpeditionFinaleQuestEvent = (
  finaleType: string,
  success: boolean
): QuestEvent => ({
  type: 'expedition.finaleCompleted',
  ...body(finaleType, success)
})
