import type { TranslationCallback } from '../types/callbacks'
import type { UnknownRecord } from '../types'
import { formatCurrency } from './numberUtils'

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
    if (typeof value === 'number' && value !== 0) {
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
    if (typeof value === 'number' && Number.isFinite(value) && value !== 0) {
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
      return translateMaybeKey(raw, raw)
    }

    const record = quest as UnknownRecord
    const rawTitle = typeof record.title === 'string' ? record.title : ''
    const rawLabel = typeof record.label === 'string' ? record.label : ''
    const id = typeof record.id === 'string' ? record.id : 'ui:quest.unknown'
    const labelSource = rawTitle || rawLabel || id
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
          if (typeof memberDelta?.moodChange === 'number') {
            totalMoodChange += memberDelta.moodChange
          }
          if (typeof memberDelta?.staminaChange === 'number') {
            totalStaminaChange += memberDelta.staminaChange
          }
        }
      } else {
        if (typeof delta.band.membersDelta.moodChange === 'number') {
          totalMoodChange = delta.band.membersDelta.moodChange
        }
        if (typeof delta.band.membersDelta.staminaChange === 'number') {
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
      const qty = inventory[key]
      if (typeof qty === 'number' && qty !== 0) {
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
