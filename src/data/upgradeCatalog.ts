import { HQ_ITEMS } from './hqItems'
import { normalizeCatalogEffect } from '../utils/catalogEffectUtils'
import type { CatalogInputItem, CatalogItem } from '../types/components'

/**
 * Legacy fame-based upgrades, previously in upgrades.js, that have no
 * canonical HQ item. Legacy aliases of canonical HQ items survive only as the
 * id map below, which migrates old saves onto the canonical ids.
 */
const LEGACY_UPGRADES = [
  {
    id: 'social_bot',
    name: 'items:social_bot.name',
    category: 'PROMO',
    cost: 330,
    currency: 'fame',
    description: 'items:social_bot.description',
    requirements: {},
    effects: [{ type: 'passive', key: 'passive_followers', value: 5 }],
    oneTime: true
  },
  {
    id: 'label_contact',
    name: 'items:label_contact.name',
    category: 'PROMO',
    // Deliberately excluded from the catalogue-wide price rescale: this entry is
    // priced against its own +1000 Fame grant, not against earned Fame. Scaling
    // the cost without scaling the grant left it costing 1100 for 1000 back,
    // i.e. very nearly free.
    cost: 2000,
    currency: 'fame',
    description: 'items:label_contact.description',
    requirements: {},
    effects: [
      {
        type: 'stat_modifier',
        target: 'player',
        stat: 'fame',
        value: 1000
      }
    ],
    oneTime: true
  }
]

const HQ_DUPLICATE_LEGACY_IDS = {
  van_suspension: 'hq_van_suspension',
  van_sound_system: 'hq_van_sound_system',
  van_storage: 'hq_van_storage',
  guitar_custom: 'hq_inst_guitar_custom',
  drum_trigger: 'hq_inst_drum_trigger',
  bass_sansamp: 'hq_inst_bass_sansamp'
} as const

/**
 * Replaces legacy duplicate upgrade IDs with their canonical HQ IDs.
 *
 * @param ids - Sanitized upgrade IDs loaded from a save.
 * @returns Deduplicated IDs with unrelated entries preserved.
 */
export const migrateLegacyHqUpgradeIds = (ids: readonly string[]): string[] => {
  const migrated = ids.map(id =>
    Object.hasOwn(HQ_DUPLICATE_LEGACY_IDS, id)
      ? HQ_DUPLICATE_LEGACY_IDS[id as keyof typeof HQ_DUPLICATE_LEGACY_IDS]
      : id
  )
  return Array.from(new Set(migrated))
}

const normalizeUpgradeShape = (item: CatalogInputItem): CatalogItem => {
  const { effect, effects: rawEffects, ...rest } = item
  const normalizedEffect =
    effect != null ? normalizeCatalogEffect(effect, item.id) : undefined
  const effects = Array.isArray(rawEffects)
    ? rawEffects.map(rawEffect => normalizeCatalogEffect(rawEffect, item.id))
    : rawEffects != null
      ? [normalizeCatalogEffect(rawEffects, item.id)]
      : normalizedEffect != null
        ? [normalizedEffect]
        : []

  return {
    ...rest,
    ...(normalizedEffect != null ? { effect: normalizedEffect } : {}),
    effects
  }
}

/**
 * Returns the active purchase catalog for the BandHQ upgrades tab.
 * Shop-only gear and instruments remain in the SHOP tab; this selector merges
 * canonical van/HQ upgrades with the unique legacy upgrades.
 *
 * @returns Unified list of upgrade/shop entries.
 */
export const getUnifiedUpgradeCatalog = (): CatalogItem[] =>
  [...HQ_ITEMS.van, ...HQ_ITEMS.hq, ...LEGACY_UPGRADES].map(
    normalizeUpgradeShape
  )
