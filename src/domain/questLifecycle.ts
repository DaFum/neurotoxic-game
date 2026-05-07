import {
  handleAddQuest,
  handleAdvanceQuest,
  handleCompleteQuest,
  handleFailQuests
} from '../context/reducers/questReducer'

export const QuestLifecycle = {
  addQuest: handleAddQuest,
  advanceQuest: handleAdvanceQuest,
  completeQuest: handleCompleteQuest,
  checkDeadlines: handleFailQuests
}
