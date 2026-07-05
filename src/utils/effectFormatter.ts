import type { TranslationCallback } from '../types/callbacks'
import type { UnknownRecord } from '../types'
import { formatCurrency } from './numberUtils'
import { isFiniteNumber } from './finiteNumber'
import { getQuestDefinition } from '../data/questRegistry'

type EffectDelta = {
  [key: string]: unknown
  player?: UnknownRecord & { van?: UnknownRecord }
  social?: UnknownRecord
  band?: UnknownRecord & {
    membersDelta?: UnknownRecord | UnknownRecord[]
    inventory?: UnknownRecord
  }
  flags?: UnknownRecord & {
    addQuest?: unknown
    queueEvent?: unknown
    addStoryFlag?: unknown
    gameOver?: unknown
  }
  score?: unknown
}

/**
 * Formats an event effect delta into localized summary text.
 *
 * @param rawDelta - Raw effect delta from event resolution.
 * @param t - Translation callback used for labels and i18n keys.
 * @param language - Active language for currency formatting.
 * @returns Localized effect summary, or an empty string when there is no visible effect.
 */
export const generateEffectText = (
  rawDelta: object | null | undefined,
  t: TranslationCallback,
  language = 'en'
) => {
  if (!rawDelta) return ''
  const delta = rawDelta as EffectDelta
  const lines: string[] = []

  const addStatLine = (
    value: unknown,
    tKey: string,
    defaultValue: string,
    unit = ''
  ) => {
    if (isFiniteNumber(value) && value !== 0) {
      lines.push(
        `${t(tKey, { defaultValue })}: ${value > 0 ? '+' : ''}${value}${unit}`
      )
    }
  }

  const addCurrencyLine = (
    value: unknown,
    tKey: string,
    defaultValue: string
  ) => {
    if (isFiniteNumber(value) && value !== 0) {
      lines.push(
        `${t(tKey, { defaultValue })}: ${formatCurrency(value, language, 'always')}`
      )
    }
  }

  const translateMaybeKey = (value: string, fallback: string) =>
    t(value, { defaultValue: fallback })

  const getQuestLabel = (quest: unknown) => {
    if (!quest || typeof quest !== 'object') {
      const raw = String(quest)
      // A bare quest id (e.g. 'quest_region_takeover') has no direct i18n key;
      // resolve its display label from the quest registry (an i18n key like
      // 'ui:quests.regionTakeover.title') so the effect shows a translated name.
      const registryLabel = getQuestDefinition(raw)?.label
      return registryLabel
        ? translateMaybeKey(registryLabel, raw)
        : translateMaybeKey(raw, raw)
    }

    const record = quest as UnknownRecord
    const rawTitle = typeof record.title === 'string' ? record.title : ''
    const rawLabel = typeof record.label === 'string' ? record.label : ''
    const id = typeof record.id === 'string' ? record.id : 'ui:quest.unknown'
    // When the object carries no explicit title/label, fall back to the
    // registry label for its id rather than rendering the raw id.
    const registryLabel =
      !rawTitle && !rawLabel ? getQuestDefinition(id)?.label : undefined
    const labelSource = rawTitle || rawLabel || registryLabel || id
    const fallback =
      rawTitle && !rawTitle.includes(':')
        ? rawTitle
        : rawLabel && !rawLabel.includes(':')
          ? rawLabel
          : id

    return translateMaybeKey(labelSource, fallback)
  }

  // Player
  if (delta.player) {
    addCurrencyLine(delta.player.money, 'ui:stats.money', 'Money')
    addStatLine(delta.player.fame, 'ui:stats.fame', 'Fame')
    addStatLine(delta.player.time, 'ui:stats.time', 'Time', 'h')

    if (delta.player.van) {
      addStatLine(delta.player.van.fuel, 'ui:stats.fuel', 'Fuel')
      addStatLine(
        delta.player.van.condition,
        'ui:stats.van_condition',
        'Van Condition'
      )
    }
  }

  // Social
  if (delta.social) {
    addStatLine(
      delta.social.controversyLevel,
      'ui:stats.controversy',
      'Controversy'
    )
    addStatLine(delta.social.viral, 'ui:stats.viral', 'Viral')
    addStatLine(delta.social.loyalty, 'ui:stats.loyalty', 'Loyalty')
  }

  // Score
  addStatLine(delta.score, 'ui:stats.score', 'Score')

  // Band
  if (delta.band) {
    addStatLine(delta.band.harmony, 'ui:stats.harmony', 'Harmony')
    addStatLine(delta.band.luck, 'ui:stats.luck', 'Luck')
    addStatLine(delta.band.skill, 'ui:stats.skill', 'Skill')

    if (delta.band.membersDelta) {
      let totalMoodChange = 0
      let totalStaminaChange = 0

      if (Array.isArray(delta.band.membersDelta)) {
        for (let i = 0; i < delta.band.membersDelta.length; i++) {
          const memberDelta = delta.band.membersDelta[i]
          if (isFiniteNumber(memberDelta?.moodChange)) {
            totalMoodChange += memberDelta.moodChange
          }
          if (isFiniteNumber(memberDelta?.staminaChange)) {
            totalStaminaChange += memberDelta.staminaChange
          }
        }
      } else {
        if (isFiniteNumber(delta.band.membersDelta.moodChange)) {
          totalMoodChange = delta.band.membersDelta.moodChange
        }
        if (isFiniteNumber(delta.band.membersDelta.staminaChange)) {
          totalStaminaChange = delta.band.membersDelta.staminaChange
        }
      }

      addStatLine(totalMoodChange, 'ui:stats.mood', 'Mood')
      addStatLine(totalStaminaChange, 'ui:stats.stamina', 'Stamina')
    }
  }

  // Inventory/Items
  if (delta.band?.inventory) {
    const inventory = delta.band.inventory
    for (const key of Object.keys(inventory)) {
      if (!Object.hasOwn(inventory, key)) continue
      const qty = inventory[key]
      if (isFiniteNumber(qty) && qty !== 0) {
        lines.push(
          `${t(`items:${key}`, { defaultValue: key })}: ${
            qty > 0 ? '+' : ''
          }${qty}`
        )
      } else if (qty === true) {
        lines.push(`+${t(`items:${key}`, { defaultValue: key })}`)
      } else if (qty === false) {
        lines.push(`-${t(`items:${key}`, { defaultValue: key })}`)
      }
    }
  }

  // Flags and invisible effects
  if (delta.flags) {
    if (delta.flags.addQuest) {
      const quests = Array.isArray(delta.flags.addQuest)
        ? delta.flags.addQuest
        : [delta.flags.addQuest]
      quests.forEach((q: unknown) => {
        const questLabel = getQuestLabel(q)
        lines.push(
          `${t('ui:event.new_quest', { defaultValue: 'New Quest' })}: ${questLabel}`
        )
      })
    }
    if (delta.flags.queueEvent || delta.flags.addStoryFlag) {
      lines.push(t('ui:event.story_updated', { defaultValue: 'Story Updated' }))
    }
    if (delta.flags.gameOver) {
      lines.push(t('ui:event.game_over_effect', { defaultValue: 'Game Over' }))
    }
  }

  if (lines.length > 0) {
    const label = t('ui:event.effects_label', { defaultValue: 'Effects:' })
    return `${label} ${lines.join(', ')}`
  }
  return ''
}
