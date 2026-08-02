import type {
  QuestPenalty,
  QuestProgressRule,
  QuestProgressSource,
  QuestReward,
  QuestState
} from '../types'
import {
  clampNonNegative,
  finiteNumberOr,
  isFiniteNumber,
  isLooseRecord
} from '../utils/gameState'

/**
 * One-shot upgrade of pre-array quest reward/penalty schemas.
 *
 * @remarks
 * Quests once carried rewards as flat sibling fields (`moneyReward` plus a
 * single `rewardType` discriminator over an untyped `rewardData` bag) and
 * failure penalties as one nested `failurePenalty` record. Both were replaced
 * by the tagged arrays `rewards` and `failurePenalties`, which no shipped quest
 * definition has used the old form of for some time.
 *
 * The old shapes can still arrive from two untrusted boundaries — a save file
 * written by an older build, and an `ADD_QUEST` payload from a caller that has
 * not been updated. Converting them here, once, at those boundaries keeps the
 * domain layer single-schema: `getQuestRewards` and `getQuestPenalties` read
 * `rewards`/`failurePenalties` and nothing else.
 *
 * Do not call this from the reward/penalty appliers. It belongs at the edge.
 */

/**
 * Converts the legacy flat reward fields into tagged rewards.
 *
 * @param quest - Quest carrying legacy `moneyReward`/`rewardType`/`rewardData`.
 * @returns Equivalent tagged rewards, empty when no legacy reward is present.
 */
/**
 * Reads a legacy `rewardData` amount without coercing it.
 *
 * @remarks
 * Deliberately not `Number(value)`. Coercion would accept a string such as
 * `'1000000'` as a real amount, and throws outright on a null-prototype object
 * because it has no `toString`. Both are reachable: `isQuestStateLike` only
 * checks that `rewardData` is a record.
 *
 * @param value - Raw legacy amount from an untrusted reward bag.
 * @returns The amount when it is a finite number, otherwise undefined.
 */
const legacyAmount = (value: unknown): number | undefined =>
  isFiniteNumber(value) ? value : undefined

const rewardsFromLegacyFields = (quest: QuestState): QuestReward[] => {
  const rewards: QuestReward[] = []
  // clampNonNegative on money/fame/harmony preserves what createAddQuestAction
  // used to apply in place before these fields were converted. The
  // controversy_reduction case below is deliberately exempt: its amount is
  // negative by definition.
  if (isFiniteNumber(quest.moneyReward) && quest.moneyReward !== 0) {
    rewards.push({
      type: 'money',
      amount: clampNonNegative(quest.moneyReward)
    })
  }

  if (quest.rewardType === 'item' && quest.rewardData?.item) {
    // typeof guard for the same reason as legacyAmount: String() throws on a
    // null-prototype object.
    const itemId = quest.rewardData.item
    if (typeof itemId === 'string' && itemId.length > 0) {
      rewards.push({ type: 'item.add', itemId })
    }
  } else if (quest.rewardType === 'fame' && quest.rewardData?.fame) {
    const amount = legacyAmount(quest.rewardData.fame)
    if (amount !== undefined) {
      rewards.push({ type: 'fame', amount: clampNonNegative(amount) })
    }
  } else if (quest.rewardType === 'skill_point') {
    const memberIndex = isFiniteNumber(quest.rewardData?.memberIndex)
      ? quest.rewardData.memberIndex
      : undefined
    rewards.push({ type: 'skill_point', memberIndex })
  } else if (quest.rewardType === 'harmony' && quest.rewardData?.harmony) {
    const amount = legacyAmount(quest.rewardData.harmony)
    if (amount !== undefined) {
      rewards.push({ type: 'band.harmony', amount: clampNonNegative(amount) })
    }
  } else if (quest.rewardType === 'fans' && quest.rewardData?.fans) {
    const amount = legacyAmount(quest.rewardData.fans)
    if (amount !== undefined) {
      rewards.push({
        type: 'social.followers',
        platform: 'instagram',
        amount
      })
    }
  } else if (quest.rewardType === 'loyalty' && quest.rewardData?.loyalty) {
    const amount = legacyAmount(quest.rewardData.loyalty)
    if (amount !== undefined) {
      rewards.push({ type: 'social.loyalty', amount })
    }
  } else if (
    quest.rewardType === 'controversy_reduction' &&
    quest.rewardData?.controversy
  ) {
    const amount = legacyAmount(quest.rewardData.controversy)
    if (amount !== undefined) {
      rewards.push({ type: 'social.controversy', amount: -Math.abs(amount) })
    }
  }

  return rewards
}

/**
 * Converts the legacy nested `failurePenalty` record into tagged penalties.
 *
 * @param quest - Quest carrying a legacy `failurePenalty` record.
 * @returns Equivalent tagged penalties, empty when no legacy penalty is present.
 */
const penaltiesFromLegacyFields = (quest: QuestState): QuestPenalty[] => {
  const penalty = isLooseRecord(quest.failurePenalty)
    ? Object.assign(Object.create(null), quest.failurePenalty)
    : undefined
  if (!penalty) return []

  const penalties: QuestPenalty[] = []
  const socialPenalty =
    Object.hasOwn(penalty, 'social') && isLooseRecord(penalty.social)
      ? Object.assign(Object.create(null), penalty.social)
      : undefined
  if (
    socialPenalty &&
    Object.hasOwn(socialPenalty, 'controversyLevel') &&
    socialPenalty.controversyLevel != null
  ) {
    const amount = legacyAmount(socialPenalty.controversyLevel)
    if (amount !== undefined) {
      penalties.push({ type: 'social.controversy', amount })
    }
  }
  if (
    socialPenalty &&
    Object.hasOwn(socialPenalty, 'loyalty') &&
    socialPenalty.loyalty != null
  ) {
    const amount = legacyAmount(socialPenalty.loyalty)
    if (amount !== undefined) {
      penalties.push({ type: 'social.loyalty', amount })
    }
  }

  const bandPenalty =
    Object.hasOwn(penalty, 'band') && isLooseRecord(penalty.band)
      ? Object.assign(Object.create(null), penalty.band)
      : undefined
  if (
    bandPenalty &&
    Object.hasOwn(bandPenalty, 'harmony') &&
    bandPenalty.harmony != null
  ) {
    const amount = legacyAmount(bandPenalty.harmony)
    if (amount !== undefined) {
      penalties.push({ type: 'band.harmony', amount })
    }
  }

  if (Array.isArray(penalty.flags)) {
    for (const flag of penalty.flags) {
      if (typeof flag === 'string' && flag.length > 0) {
        penalties.push({ type: 'flag.add', flag })
      }
    }
  }

  if (Array.isArray(penalty.cooldowns)) {
    for (const cooldown of penalty.cooldowns) {
      if (!isLooseRecord(cooldown)) continue
      const days = finiteNumberOr(cooldown.days, Number.NaN)
      if (Number.isFinite(days)) {
        // Legacy `id` labels are dropped: cooldown matching is keyed by the
        // quest id alone (canAcceptQuest compares cd.questId).
        penalties.push({ type: 'quest.cooldown', days })
      }
    }
  }

  return penalties
}

/**
 * The amount mode the bare `progressSource` scheme carried implicitly, before
 * rules declared it. Counting sources advance by the event's own amount,
 * harmony compares against a threshold, everything else ticks by one.
 */
const legacyProgressAmount = (
  source: QuestProgressSource
): QuestProgressRule['amount'] => {
  switch (source) {
    case 'followers_gained':
    case 'fame_gained':
    case 'money_earned':
      return 'event.amount'
    case 'harmony_recovered':
      return 'threshold'
    default:
      return 'fixed'
  }
}

/**
 * Builds a progress rule list from the two pre-array rule containers.
 *
 * @param quest - Quest carrying `progressRule` or a bare `progressSource`.
 * @returns Synthesized rules, or undefined when neither container is present.
 */
const rulesFromLegacyFields = (
  quest: QuestState
): QuestProgressRule[] | undefined => {
  if (quest.progressRule) return [quest.progressRule]
  if (!quest.progressSource) return undefined
  return [
    {
      event: quest.progressSource,
      amount: legacyProgressAmount(quest.progressSource),
      fixedAmount: 1,
      thresholdField:
        quest.progressSource === 'harmony_recovered'
          ? 'band.harmony'
          : undefined
    }
  ]
}

/**
 * Upgrades a quest from the legacy reward/penalty schema to the tagged arrays.
 *
 * @remarks
 * A populated canonical array always wins: a quest that already declares
 * `rewards` or `failurePenalties` keeps them and its legacy siblings are
 * discarded rather than merged, matching the precedence the old
 * `getQuestRewards`/`getQuestPenalties` fallbacks applied.
 *
 * Generic in the quest type so callers holding a narrower shape (the
 * sanitizer's `ActiveQuestState`) keep it: migration only ever removes
 * optional legacy fields and adds the canonical arrays.
 *
 * @param quest - Quest from a save file or an untrusted `ADD_QUEST` payload.
 * @returns The same quest with canonical arrays and no legacy reward fields.
 */
export const migrateLegacyQuestSchema = <T extends QuestState>(quest: T): T => {
  const hasCanonicalRewards =
    Array.isArray(quest.rewards) && quest.rewards.length > 0
  const hasCanonicalPenalties =
    Array.isArray(quest.failurePenalties) && quest.failurePenalties.length > 0

  const hasLegacyRewardFields =
    quest.moneyReward != null ||
    quest.rewardType != null ||
    quest.rewardData != null
  const hasLegacyPenaltyField = quest.failurePenalty != null

  // progressRules is the canonical container; progressRule (singular) and a
  // bare progressSource are the two older ones. progressSource is NOT removed
  // when consumed: QuestsModal, questHintViewModel and continueHandlerUtils
  // still read it as a display/semantic tag, independent of progress rules.
  // `.length > 0`, not just Array.isArray: normalizeProgressRules used to fall
  // through to progressSource whenever the declared array was empty. Treating
  // [] as authoritative would admit a quest that no event can ever advance.
  // Matches the populated-array precedence the reward and penalty paths use.
  const needsProgressRules =
    !(Array.isArray(quest.progressRules) && quest.progressRules.length > 0) &&
    (quest.progressRule != null || quest.progressSource != null)
  // Stripped even when progressRules already won, so no legacy container
  // survives migration and a later reader cannot pick the wrong one.
  const hasLegacyRuleContainer = quest.progressRule != null

  if (
    !hasLegacyRewardFields &&
    !hasLegacyPenaltyField &&
    !needsProgressRules &&
    !hasLegacyRuleContainer
  ) {
    return quest
  }

  // Widened to QuestState so the legacy fields are known-optional and can be
  // deleted; narrowed back on return, which is sound because every property
  // T adds over QuestState is copied by the spread and never touched here.
  const migrated: QuestState = { ...quest }

  if (hasLegacyRewardFields) {
    if (!hasCanonicalRewards) {
      const rewards = rewardsFromLegacyFields(quest)
      if (rewards.length > 0) migrated.rewards = rewards
    }
    delete migrated.moneyReward
    delete migrated.rewardType
    delete migrated.rewardData
  }

  if (hasLegacyPenaltyField) {
    if (!hasCanonicalPenalties) {
      const penalties = penaltiesFromLegacyFields(quest)
      if (penalties.length > 0) migrated.failurePenalties = penalties
    }
    delete migrated.failurePenalty
  }

  if (needsProgressRules) {
    const rules = rulesFromLegacyFields(quest)
    if (rules) migrated.progressRules = rules
  }
  delete migrated.progressRule

  return migrated as T
}
