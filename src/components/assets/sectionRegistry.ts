import type { ComponentType } from 'react'
import type { AssetKind } from '../../types/assets'
import { TourbusSection } from './sections/TourbusSection'
import { StudioSection } from './sections/StudioSection'
import { BandhausSection } from './sections/BandhausSection'
import { MerchWorkshopSection } from './sections/MerchWorkshopSection'

/**
 * View descriptor for a section-specific asset panel.
 *
 * The `Component` renders the section's main view (vehicle silhouette,
 * floorplan, dollhouse, production line). `accent` is the CSS-variable
 * expression bound to `--section-accent` while this section is active.
 */
export interface SectionView {
  Component: ComponentType
  accent: string
}

/**
 * Section views keyed by asset kind.
 *
 * @remarks
 * Typed as a full `Record<AssetKind, SectionView>`, so adding an `AssetKind`
 * without registering its section fails to compile and `AssetsScene` never has
 * a kind without a view to render.
 */
export const SECTION_VIEWS = {
  tourbus_chassis: {
    Component: TourbusSection,
    accent: 'var(--color-toxic-green)'
  },
  studio_chassis: {
    Component: StudioSection,
    accent: 'var(--color-electric-blue)'
  },
  bandhaus_chassis: {
    Component: BandhausSection,
    accent: 'var(--color-cosmic-purple)'
  },
  merch_workshop_chassis: {
    Component: MerchWorkshopSection,
    accent: 'var(--color-warning-yellow)'
  }
} as const satisfies Record<AssetKind, SectionView>
