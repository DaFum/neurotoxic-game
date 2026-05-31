import i18n from '../i18n'
import { formatCurrency } from '../utils/numberUtils'
import type { BandMember, GameState, QuestState, ToastPayload } from '../types'
import {
  clampPlayerFame,
  clampBandHarmony,
  clampPlayerMoney,
  calculateFameLevel,
  clampControversyLevel,
  clampLoyalty,
  finiteNumberOr,
  isLooseRecord
} from '../utils/gameStateUtils'
import { QUEST_PROVE_YOURSELF } from '../data/questsConstants'
import { getQuestDefinition } from '../data/questRegistry'
import { hasActiveQuest } from '../utils/questUtils'

export const QuestLifecycle = {
  addQuest: (state: GameState, quest: QuestState): GameState => {
    if (hasActiveQuest(state.activeQuests, quest.id)) return state

    // Merge static registry defaults under the provided payload so callers can
    // dispatch `{ id }` and inherit label/deadline/penalty config, while inline
    // overrides still win.
    const definition = getQuestDefinition(quest.id)
    const merged: QuestState = definition
      ? { ...(definition as Partial<QuestState>), ...quest }
      : { ...quest }

    // Repeat-policy gating: refuse to re-add quests that their policy forbids.
    const repeatPolicy = merged.repeatPolicy
    if (repeatPolicy === 'never') {
      if (state.completedQuestIds?.includes(quest.id)) return state
      const activeFlags = state.activeStoryFlags ?? []
      const completionFlags = [
        ...(merged.completionFlags ?? []),
        ...(merged.rewardFlag ? [merged.rewardFlag] : [])
      ]
      if (completionFlags.some(flag => activeFlags.includes(flag))) {
        return state
      }
    } else if (repeatPolicy === 'cooldown') {
      const currentDay = finiteNumberOr(state.player?.day, 0)
      const onCooldown = (state.questCooldowns ?? []).some(
        cd => cd.questId === quest.id && cd.expiresOnDay > currentDay
      )
      if (onCooldown) return state
    } else if (repeatPolicy === 'perVenue' || repeatPolicy === 'perRegion') {
      // Stamp the current venue/region as scopeKey so completion tracks "this
      // quest, this place". Add is refused if the same (id, scopeKey) is
      // already completed; other scopes remain open.
      const scopeKey =
        quest.scopeKey ??
        (repeatPolicy === 'perVenue'
          ? state.currentGig?.id
          : state.player?.location)
      if (typeof scopeKey !== 'string' || scopeKey.length === 0) {
        // Without a scope we cannot uniquely track completion — refuse rather
        // than silently turn this into a global-once quest.
        return state
      }
      const alreadyDone = (state.completedQuestScopes ?? []).some(
        c => c.questId === quest.id && c.scopeKey === scopeKey
      )
      if (alreadyDone) return state
      merged.scopeKey = scopeKey
    }

    // Compute an absolute deadline from a relative offset when one was not
    // already supplied (event-triggered quests pre-compute it in eventResolver).
    if (merged.deadline == null && merged.deadlineOffset != null) {
      const offset = finiteNumberOr(merged.deadlineOffset, Number.NaN)
      if (Number.isFinite(offset)) {
        const currentDay = finiteNumberOr(state.player?.day, 0)
        merged.deadline = currentDay + offset
      }
    }
    delete merged.deadlineOffset

    // Registry-managed quests start at progress 0; ad-hoc quests are left as-is.
    if (definition && merged.progress == null) merged.progress = 0

    return {
      ...state,
      activeQuests: [...(state.activeQuests || []), merged]
    }
  },

  completeQuest: (
    state: GameState,
    { questId, randomIdx }: { questId: string; randomIdx?: number }
  ): GameState => {
    if (!state.activeQuests) return state
    const questIndex = state.activeQuests.findIndex(q => q.id === questId)
    if (questIndex === -1) return state

    const quest = state.activeQuests[questIndex] as QuestState | undefined
    if (!quest) return state
    const nextState = { ...state }

    // Remove from activeQuests
    nextState.activeQuests = state.activeQuests
      .slice(0, questIndex)
      .concat(state.activeQuests.slice(questIndex + 1))

    // Apply generic quest rewards
    const generatedToasts: ToastPayload[] = []

    if (typeof quest.moneyReward === 'number' && quest.moneyReward !== 0) {
      const previousMoney = nextState.player?.money ?? 0
      const newMoney = clampPlayerMoney(previousMoney + quest.moneyReward)
      const appliedDelta = newMoney - previousMoney
      nextState.player = {
        ...(nextState.player ?? {}),
        money: newMoney
      }
      if (appliedDelta !== 0) {
        generatedToasts.push({
          id: `${questId}-money`,
          messageKey: 'ui:toast.quest_complete_money',
          options: {
            name: quest.label,
            amount: formatCurrency(appliedDelta, i18n.language, 'always')
          },
          type: 'success'
        })
      }
    }

    if (quest.rewardType === 'item' && quest.rewardData?.item) {
      const itemKey = String(quest.rewardData.item)
      nextState.band = {
        ...nextState.band,
        inventory: {
          ...(nextState.band?.inventory ?? {}),
          [itemKey]: true
        }
      }
      generatedToasts.push({
        id: `${questId}-item`,
        messageKey: 'ui:toast.quest_complete_item',
        options: { name: quest.label },
        type: 'success'
      })
    } else if (quest.rewardType === 'fame' && quest.rewardData?.fame) {
      const rawFameReward = Number(quest.rewardData.fame) || 0
      const previousFame = nextState.player?.fame ?? 0
      const newFame = clampPlayerFame(previousFame + rawFameReward)
      const appliedDelta = newFame - previousFame
      nextState.player = {
        ...nextState.player,
        fame: newFame,
        fameLevel: calculateFameLevel(newFame)
      }
      if (appliedDelta !== 0) {
        generatedToasts.push({
          id: `${questId}-fame`,
          messageKey: 'ui:toast.quest_complete_fame',
          options: { name: quest.label, amount: appliedDelta },
          type: 'success'
        })
      }
    } else if (quest.rewardType === 'skill_point') {
      const originalMembers = nextState.band?.members ?? []
      if (originalMembers.length > 0) {
        const memberIdx =
          typeof quest.rewardData?.memberIndex === 'number'
            ? Math.max(
                0,
                Math.min(
                  originalMembers.length - 1,
                  quest.rewardData.memberIndex
                )
              )
            : typeof randomIdx === 'number'
              ? Math.max(0, Math.min(originalMembers.length - 1, randomIdx))
              : 0

        const members = originalMembers.map((m: BandMember, idx: number) => {
          if (idx === memberIdx) {
            const baseStats = (m.baseStats ?? {}) as Record<string, unknown>
            const currentSkill = m.baseStats
              ? Number((m.baseStats as Record<string, unknown>).skill)
              : Number(m.skill)
            const skillValue = Number.isFinite(currentSkill) ? currentSkill : 0
            return {
              ...m,
              baseStats: {
                ...baseStats,
                skill: skillValue + 1
              }
            }
          }
          return m
        })

        nextState.band = { ...nextState.band, members }
        const rewardedMember = members[memberIdx]
        generatedToasts.push({
          id: `${questId}-skill`,
          messageKey: 'ui:toast.quest_complete_skill',
          options: { name: quest.label, member: rewardedMember?.name },
          type: 'success'
        })
      }
    } else if (quest.rewardType === 'harmony' && quest.rewardData?.harmony) {
      const rawHarmonyReward = Number(quest.rewardData.harmony) || 0
      const previousHarmony = nextState.band?.harmony ?? 1
      const newHarmony = clampBandHarmony(previousHarmony + rawHarmonyReward)
      const appliedDelta = newHarmony - previousHarmony
      nextState.band = {
        ...nextState.band,
        harmony: newHarmony
      }
      if (appliedDelta !== 0) {
        generatedToasts.push({
          id: `${questId}-harmony`,
          messageKey: 'ui:toast.quest_complete_harmony',
          options: { name: quest.label, amount: appliedDelta },
          type: 'success'
        })
      }
    }

    if (generatedToasts.length === 0) {
      generatedToasts.push({
        id: `${questId}-generic`,
        messageKey: 'ui:toast.quest_complete',
        options: { name: quest.label },
        type: 'success'
      })
    }

    // Add reward flag
    if (quest.rewardFlag) {
      nextState.activeStoryFlags = [
        ...(nextState.activeStoryFlags || []),
        quest.rewardFlag
      ]
    }

    // Toast
    nextState.toasts = [...(nextState.toasts ?? []), ...generatedToasts]

    // Track completion so repeatPolicy:'never' quests can be blocked later.
    if (!nextState.completedQuestIds?.includes(quest.id)) {
      nextState.completedQuestIds = [
        ...(nextState.completedQuestIds ?? []),
        quest.id
      ]
    }

    // Scope-policy quests record (id, scopeKey) so other scopes stay open.
    if (typeof quest.scopeKey === 'string' && quest.scopeKey.length > 0) {
      const exists = (nextState.completedQuestScopes ?? []).some(
        c => c.questId === quest.id && c.scopeKey === quest.scopeKey
      )
      if (!exists) {
        nextState.completedQuestScopes = [
          ...(nextState.completedQuestScopes ?? []),
          { questId: quest.id, scopeKey: quest.scopeKey }
        ]
      }
    }

    // Clear transient story flags tied to this quest being active.
    if (Array.isArray(quest.clearFlagsOnComplete)) {
      const toClear = new Set(quest.clearFlagsOnComplete)
      nextState.activeStoryFlags = (nextState.activeStoryFlags ?? []).filter(
        f => !toClear.has(f)
      )
    }

    // Cooldown-policy quests start a re-add cooldown on completion.
    const definition = getQuestDefinition(quest.id) as
      | Partial<QuestState>
      | undefined
    const repeatPolicy = quest.repeatPolicy ?? definition?.repeatPolicy
    const cooldownDays = finiteNumberOr(
      quest.cooldownDays ?? definition?.cooldownDays,
      0
    )
    if (repeatPolicy === 'cooldown' && cooldownDays > 0) {
      const currentDay = finiteNumberOr(nextState.player?.day, 0)
      nextState.questCooldowns = [
        ...(nextState.questCooldowns ?? []),
        { questId: quest.id, expiresOnDay: currentDay + cooldownDays }
      ]
    }

    // Hardcoded old quest logic
    if (quest.id === QUEST_PROVE_YOURSELF) {
      nextState.venueBlacklist = (nextState.venueBlacklist || []).slice(2) // clear 2
      nextState.player = {
        ...nextState.player,
        stats: { ...nextState.player.stats, proveYourselfMode: false }
      }
    }

    // Story arcs may branch into a follow-up quest declared either inline or in
    // the registry definition. We addQuest through the same gating path so
    // repeat-policy and scope checks still apply to the follow-up.
    const followupId = quest.followupQuestId ?? definition?.followupQuestId
    if (typeof followupId === 'string' && followupId.length > 0) {
      return QuestLifecycle.addQuest(nextState, { id: followupId })
    }

    return nextState
  },

  advanceQuest: (
    state: GameState,
    {
      questId,
      amount = 1,
      randomIdx
    }: { questId: string; amount?: number; randomIdx?: number }
  ): GameState => {
    const nextState = { ...state }
    let questCompleted = false
    if (!nextState.activeQuests) return state

    nextState.activeQuests = nextState.activeQuests.map(q => {
      if (q.id === questId) {
        const required = q.required
        const progress = q.progress ?? 0
        if (typeof required !== 'number') {
          return q
        }
        const newProgress = Math.min(required, progress + (amount ?? 1))
        if (newProgress >= required) {
          questCompleted = true
        }
        return { ...q, progress: newProgress }
      }
      return q
    })

    if (questCompleted) {
      return QuestLifecycle.completeQuest(nextState, { questId, randomIdx })
    }
    return nextState
  },

  checkDeadlines: (state: GameState): GameState => {
    const nextState = { ...state }
    if (!nextState.activeQuests) return state

    let hasExpired = false
    const newActiveQuests: QuestState[] = []
    const newToasts: ToastPayload[] = []
    const flagsToAdd: string[] = []
    const flagsToRemove = new Set<string>()
    const cooldownsToAdd: GameState['questCooldowns'] = []
    const currentDay = finiteNumberOr(nextState.player?.day, 0)

    for (let i = 0; i < nextState.activeQuests.length; i++) {
      const quest = nextState.activeQuests[i]
      if (!quest) continue
      const penalty = isLooseRecord(quest.failurePenalty)
        ? Object.assign(Object.create(null), quest.failurePenalty)
        : undefined

      if (
        typeof quest.deadline === 'number' &&
        nextState.player.day > quest.deadline
      ) {
        hasExpired = true
        if (penalty) {
          const socialPenalty =
            Object.hasOwn(penalty, 'social') && isLooseRecord(penalty.social)
              ? Object.assign(Object.create(null), penalty.social)
              : undefined
          if (
            socialPenalty &&
            Object.hasOwn(socialPenalty, 'controversyLevel') &&
            socialPenalty.controversyLevel != null
          ) {
            // Deep clone before mutating
            nextState.social = { ...nextState.social }
            const controversyDelta = Number(socialPenalty.controversyLevel)
            const validPenalty = Number.isFinite(controversyDelta)
              ? controversyDelta
              : 0
            nextState.social.controversyLevel = clampControversyLevel(
              (nextState.social.controversyLevel ?? 0) + validPenalty
            )
          }
          if (
            socialPenalty &&
            Object.hasOwn(socialPenalty, 'loyalty') &&
            socialPenalty.loyalty != null
          ) {
            nextState.social = { ...nextState.social }
            const loyaltyDelta = Number(socialPenalty.loyalty)
            nextState.social.loyalty = clampLoyalty(
              (nextState.social.loyalty ?? 0) +
                (Number.isFinite(loyaltyDelta) ? loyaltyDelta : 0)
            )
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
            // Deep clone before mutating
            nextState.band = { ...nextState.band }
            const harmonyDelta = Number(bandPenalty.harmony)
            nextState.band.harmony = clampBandHarmony(
              (nextState.band.harmony ?? 1) +
                (Number.isFinite(harmonyDelta) ? harmonyDelta : 0)
            )
          }

          // Failure story flags (existing schema: failurePenalty.flags).
          if (Array.isArray(penalty.flags)) {
            for (const flag of penalty.flags) {
              if (typeof flag === 'string' && flag.length > 0) {
                flagsToAdd.push(flag)
              }
            }
          }

          // Re-add cooldown: gate re-adding this quest by quest id so the
          // repeatPolicy:'cooldown' check honors a post-failure window.
          if (Array.isArray(penalty.cooldowns)) {
            for (const cd of penalty.cooldowns) {
              if (!isLooseRecord(cd)) continue
              const days = finiteNumberOr(cd.days, Number.NaN)
              if (Number.isFinite(days)) {
                cooldownsToAdd.push({
                  questId: quest.id,
                  expiresOnDay: currentDay + days
                })
              }
            }
          }
        }

        // Clear story flags that should not persist past failure.
        if (Array.isArray(quest.clearFlagsOnFail)) {
          for (const flag of quest.clearFlagsOnFail) {
            if (typeof flag === 'string') flagsToRemove.add(flag)
          }
        }

        newToasts.push({
          id: `${quest.id}-fail`,
          messageKey: 'ui:toast.quest_failed',
          options: { name: quest.label },
          type: 'error'
        })
      } else {
        newActiveQuests.push(quest)
      }
    }

    if (!hasExpired) return state

    nextState.activeQuests = newActiveQuests
    if (newToasts.length > 0) {
      nextState.toasts = [...(nextState.toasts ?? []), ...newToasts]
    }

    if (flagsToAdd.length > 0 || flagsToRemove.size > 0) {
      const baseFlags = (nextState.activeStoryFlags ?? []).filter(
        f => !flagsToRemove.has(f)
      )
      for (const flag of flagsToAdd) {
        if (!baseFlags.includes(flag)) baseFlags.push(flag)
      }
      nextState.activeStoryFlags = baseFlags
    }

    if (cooldownsToAdd.length > 0) {
      nextState.questCooldowns = [
        ...(nextState.questCooldowns ?? []),
        ...cooldownsToAdd
      ]
    }

    return nextState
  }
}
