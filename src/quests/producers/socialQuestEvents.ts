import type { QuestEvent, SocialPostOption } from '../../types'
import { finiteNumberOr } from '../../utils/gameStateUtils'

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
  success:
    Object.hasOwn(result, 'success') && typeof result.success === 'boolean'
      ? result.success
      : true,
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

export const createSocialLoyaltyChangedQuestEvent = ({
  amount,
  reason
}: {
  amount: number
  reason?: string
}): QuestEvent => ({
  type: 'social.loyaltyChanged',
  amount,
  success: amount >= 0,
  context: { reason },
  tags: [reason].filter((entry): entry is string => typeof entry === 'string')
})

export const createSocialControversyChangedQuestEvent = ({
  amount,
  reason
}: {
  amount: number
  reason?: string
}): QuestEvent => ({
  type: 'social.controversyChanged',
  amount,
  success: amount <= 0,
  context: { reason },
  tags: [reason].filter((entry): entry is string => typeof entry === 'string')
})

export const createSocialTrendMatchedQuestEvent = ({
  trendId,
  platform,
  postCategory
}: {
  trendId: string
  platform?: string
  postCategory?: string
}): QuestEvent => ({
  type: 'social.trendMatched',
  amount: 1,
  success: true,
  context: { trendId, platform, postCategory },
  tags: [trendId, platform, postCategory].filter(
    (entry): entry is string => typeof entry === 'string'
  )
})

export const createSocialPostQuestEvents = (
  option: Pick<SocialPostOption, 'id' | 'platform' | 'category'>,
  result: Record<string, unknown>
): QuestEvent[] => {
  const events = [createSocialPostResolvedQuestEvent(option, result)]
  const followers = Object.hasOwn(result, 'followers')
    ? finiteNumberOr(result.followers, 0)
    : 0
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
