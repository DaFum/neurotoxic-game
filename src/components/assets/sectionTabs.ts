import type { ComponentType } from 'react'
import { Bus, House, Shirt, SlidersHorizontal } from 'lucide-react'
import type { AssetKind } from '../../types/assets'

type TabIcon = ComponentType<{
  className?: string
  'aria-hidden'?: boolean
}>

/**
 * Asset section tab metadata rendered by the assets navigation.
 */
export interface AssetSectionTab {
  key: AssetKind
  shortLabel: 'tourbus' | 'studio' | 'bandhaus' | 'workshop'
  Icon: TabIcon
}

/**
 * Navigation tab definitions for the asset hub sections.
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
  _ASSET_SECTION_TABS_MAP[tab.key] = tab
}

/**
 * Optimized record lookup for active asset tab resolution.
 */
export const ASSET_SECTION_TABS_MAP: Readonly<
  Record<AssetKind, AssetSectionTab>
> = Object.freeze(_ASSET_SECTION_TABS_MAP as Record<AssetKind, AssetSectionTab>)
