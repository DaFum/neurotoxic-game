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
    if (typeof value === 'number' && value !== 0) {
      lines.push(
        `${t(tKey, { defaultValue })}: ${formatCurrency(value, language, 'always')}`
      )
    }
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
        const moodChanges: number[] = []
        const staminaChanges: number[] = []
        for (let i = 0; i < delta.band.membersDelta.length; i++) {
          const memberDelta = delta.band.membersDelta[i]
          if (typeof memberDelta?.moodChange === 'number') {
            moodChanges.push(memberDelta.moodChange)
          }
          if (typeof memberDelta?.staminaChange === 'number') {
            staminaChanges.push(memberDelta.staminaChange)
          }
        }
        if (moodChanges.length > 0) {
          totalMoodChange = moodChanges.reduce((sum, value) => sum + value, 0)
        }
        if (staminaChanges.length > 0) {
          totalStaminaChange = staminaChanges.reduce(
            (sum, value) => sum + value,
            0
          )
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
    for (const key in delta.band.inventory) {
      if (Object.hasOwn(delta.band.inventory, key)) {
        const qty = delta.band.inventory[key]
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
  }

  // Flags and invisible effects
  if (delta.flags) {
    if (delta.flags.addQuest) {
      const quests = Array.isArray(delta.flags.addQuest)
        ? delta.flags.addQuest
        : [delta.flags.addQuest]
      quests.forEach((q: unknown) => {
        const questLabel =
          typeof q === 'object' && q !== null
            ? ((q as UnknownRecord).title ??
              t(String((q as UnknownRecord).id ?? 'ui:quest.unknown'), {
                defaultValue: String((q as UnknownRecord).label ?? '')
              }))
            : t(String(q), { defaultValue: String(q) })
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
