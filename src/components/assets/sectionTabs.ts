import type { ComponentType } from 'react'
import { Bus, House, Shirt, SlidersHorizontal } from 'lucide-react'
import type { AssetKind } from '../../types/assets'

/**
 * Defines the expected property structure for SVG icon components rendered within navigation tabs.
 */
type TabIcon = ComponentType<{
  className?: string
  'aria-hidden'?: boolean
}>

/**
 * Represents the configuration metadata for a single category tab in the asset hub navigation.
 */
interface AssetSectionTab {
  key: AssetKind
  shortLabel: 'tourbus' | 'studio' | 'bandhaus' | 'workshop'
  Icon: TabIcon
}

/**
 * Contains the ordered sequence of available category tabs displayed in the asset hub navigation bar.
 */
export const ASSET_SECTION_TABS = [
  { key: 'tourbus_chassis', shortLabel: 'tourbus', Icon: Bus },
  { key: 'studio_chassis', shortLabel: 'studio', Icon: SlidersHorizontal },
  { key: 'bandhaus_chassis', shortLabel: 'bandhaus', Icon: House },
  { key: 'merch_workshop_chassis', shortLabel: 'workshop', Icon: Shirt }
] as const satisfies readonly AssetSectionTab[]

const _ASSET_SECTION_TABS_MAP: Partial<Record<AssetKind, AssetSectionTab>> = {}
for (let i = 0; i < ASSET_SECTION_TABS.length; i++) {
  const tab = ASSET_SECTION_TABS[i]
  if (!tab) continue
  _ASSET_SECTION_TABS_MAP[tab.key] = tab
}

/**
 * Provides an optimized key-value mapping for rapid retrieval of asset tab metadata.
 *
 * @remarks
 * Skips the TypeScript `satisfies` operator directly on the export.
 * TS1360 prevents `as const satisfies` on dynamically mapped outputs from loops without explicit casting.
 */
export const ASSET_SECTION_TABS_MAP: Readonly<
  Record<AssetKind, AssetSectionTab>
> = Object.freeze(_ASSET_SECTION_TABS_MAP as Record<AssetKind, AssetSectionTab>)
