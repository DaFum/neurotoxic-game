export interface QuestState extends UnknownRecord {
  id: string
  label?: string
  deadline?: number | null
  progress?: number
  required?: number
  rewardType?: string
  rewardData?: UnknownRecord
  rewardFlag?: string
  moneyReward?: number
  failurePenalty?: UnknownRecord
}
