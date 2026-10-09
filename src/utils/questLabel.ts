import { getQuestDefinition } from '../data/questRegistry'
import type { TranslationCallback } from '../types/callbacks'

const UNKNOWN_QUEST_KEY = 'ui:quest.unknown'

const nonEmptyString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined

const readField = (quest: object, field: string): string | undefined =>
  Object.hasOwn(quest, field)
    ? nonEmptyString((quest as Record<string, unknown>)[field])
    : undefined

/**
 * Resolves the untranslated label source for a quest: an explicit `title` or
 * `label`, else the registry label for its id, else the id itself.
 *
 * @param quest - A quest object, or a bare quest id string.
 * @returns The i18n key (or raw text) to translate, or `undefined` when the
 * value carries no usable label or id.
 *
 * @remarks
 * Toasts store this key untranslated so `ToastOverlay` resolves it in the
 * player's current language; UI surfaces translate it via
 * {@link getQuestDisplayLabel}.
 */
export const resolveQuestLabelKey = (quest: unknown): string | undefined => {
  if (typeof quest === 'string') {
    return quest.length > 0
      ? (getQuestDefinition(quest)?.label ?? quest)
      : undefined
  }
  if (!quest || typeof quest !== 'object') return undefined
  const id = readField(quest, 'id')
  return (
    readField(quest, 'title') ??
    readField(quest, 'label') ??
    (id ? getQuestDefinition(id)?.label : undefined) ??
    id
  )
}

/**
 * Translates a quest's display label with one fallback policy for every
 * surface (quest modal, Band HQ stats, event effect text).
 *
 * @param t - Translation callback.
 * @param quest - A quest object, or a bare quest id string.
 * @returns The translated label; a raw (non-key) title/label or the quest id
 * when the key is missing, and the localized "Unknown Quest" for malformed
 * input.
 */
export const getQuestDisplayLabel = (
  t: TranslationCallback,
  quest: unknown
): string => {
  const labelKey = resolveQuestLabelKey(quest)
  if (!labelKey) {
    return t(UNKNOWN_QUEST_KEY, { defaultValue: 'Unknown Quest' })
  }
  let fallback = labelKey
  if (quest && typeof quest === 'object') {
    const rawTitle = readField(quest, 'title')
    const rawLabel = readField(quest, 'label')
    fallback =
      (rawTitle && !rawTitle.includes(':') ? rawTitle : undefined) ??
      (rawLabel && !rawLabel.includes(':') ? rawLabel : undefined) ??
      readField(quest, 'id') ??
      labelKey
  } else if (typeof quest === 'string') {
    fallback = quest
  }
  return t(labelKey, { defaultValue: fallback })
}
