import type { QuestEvent, SocialPostOption } from '../../types'

const finiteNumberOrZero = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0

const getSocialContext = (
  option: Pick<SocialPostOption, 'id' | 'platform' | 'category'>
): NonNullable<QuestEvent['context']> => ({
  platform: option.platform,
  postId: option.id,
  postCategory: option.category
})

const getTags = (
  option: Pick<SocialPostOption, 'platform' | 'category'>
): string[] =>
  [option.platform, option.category].filter(
    (entry): entry is string => typeof entry === 'string'
  )

export const createSocialPostResolvedQuestEvent = (
  option: Pick<SocialPostOption, 'id' | 'platform' | 'category'>,
  result: Record<string, unknown>
): QuestEvent => ({
  type: 'social.postResolved',
  amount: 1,
  success: typeof result.success === 'boolean' ? result.success : true,
  context: getSocialContext(option),
  tags: getTags(option)
})

export const createFollowersGainedQuestEvent = ({
  amount,
  platform,
  postCategory,
  postId
}: {
  amount: number
  platform?: string
  postCategory?: string
  postId?: string
}): QuestEvent => ({
  type: 'social.followersGained',
  amount,
  success: true,
  context: {
    platform,
    postCategory,
    postId
  },
  tags: [platform, postCategory].filter(
    (entry): entry is string => typeof entry === 'string'
  )
})

export const createSocialPostQuestEvents = (
  option: Pick<SocialPostOption, 'id' | 'platform' | 'category'>,
  result: Record<string, unknown>
): QuestEvent[] => {
  const events = [createSocialPostResolvedQuestEvent(option, result)]
  const followers = finiteNumberOrZero(result.followers)
  if (followers > 0) {
    events.push(
      createFollowersGainedQuestEvent({
        amount: followers,
        platform: option.platform,
        postCategory: option.category,
        postId: option.id
      })
    )
  }
  return events
}
