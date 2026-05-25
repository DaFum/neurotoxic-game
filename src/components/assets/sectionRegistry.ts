import type { ComponentType } from 'react'
import type { AssetKind } from '../../types/assets'
import { TourbusSection } from './sections/TourbusSection'

/**
 * View descriptor for a section-specific asset panel.
 *
 * The `Component` renders the section's main view (vehicle silhouette,
 * floorplan, dollhouse, production line). `accent` is the CSS-variable
 * expression bound to `--section-accent` while this section is active.
 *
 * Section plans (2–5) register their entries by importing `SECTION_VIEWS`
 * and assigning at module load time. Foundation leaves the registry empty
 * so `AssetsScene` renders a neutral placeholder until a section ships.
 */
export interface SectionView {
  Component: ComponentType
  accent: string
}

export const SECTION_VIEWS: Partial<Record<AssetKind, SectionView>> = {}

SECTION_VIEWS.tourbus_chassis = {
  Component: TourbusSection,
  accent: 'var(--color-toxic-green)'
}

/**
 * Default accent token used when no section view is registered for the
 * currently-active tab. Mirrors the brutalist baseline so the hub never
 * renders with an unset `--section-accent`.
 */
export const DEFAULT_SECTION_ACCENT = 'var(--color-toxic-green)'
