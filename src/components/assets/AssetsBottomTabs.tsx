import { useTranslation } from 'react-i18next'
import type { AssetKind } from '../../types/assets'
import { ASSET_SECTION_TABS } from './sectionTabs'

/**
 * Defines the configuration properties for the AssetsBottomTabs component.
 */
interface AssetsBottomTabsProps {
  /** The currently active asset category section. */
  active: AssetKind
  /** The callback invoked when a tab is selected to change the active section. */
  onSelect: (kind: AssetKind) => void
}

/**
 * Renders the sticky navigation tab bar for mobile viewports to switch between asset sections.
 *
 * @remarks
 * This component maps over the central `ASSET_SECTION_TABS` definition to dynamically render
 * the available categories. It manages ARIA roles for accessibility and applies dynamic
 * theming based on the active state.
 *
 * @param props - Active asset section and tab selection callback.
 * @returns The rendered tab navigation block.
 */
export const AssetsBottomTabs = ({
  active,
  onSelect
}: AssetsBottomTabsProps) => {
  const { t } = useTranslation(['assets'])

  return (
    <nav className='assets-bottom-tabs sticky bottom-0 z-20 px-2 pt-2'>
      <div
        role='tablist'
        aria-label={t('assets:hub.accessibility.sectionTabs')}
        className='grid grid-cols-4 gap-1'
      >
        {ASSET_SECTION_TABS.map(tab => {
          const isActive = tab.key === active
          const Icon = tab.Icon
          return (
            <button
              key={tab.key}
              id={`assets-tab-${tab.key}`}
              type='button'
              role='tab'
              aria-selected={isActive}
              aria-controls={`assets-panel-${tab.key}`}
              onClick={() => onSelect(tab.key)}
              className='focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--section-accent,var(--color-toxic-green))] focus-visible:ring-offset-2 focus-visible:ring-offset-void-black assets-hub-control assets-bottom-tab flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 border-2 px-1 py-2 text-xs uppercase leading-none transition-transform active:scale-[0.98] sm:flex-row sm:text-xs'
              style={{
                borderColor: isActive
                  ? 'var(--section-accent)'
                  : 'rgb(var(--color-ash-gray-rgb) / 45%)',
                background: isActive
                  ? 'var(--section-accent)'
                  : 'rgb(var(--color-void-black-rgb) / 72%)',
                color: isActive ? 'var(--color-void-black)' : 'inherit'
              }}
            >
              <Icon aria-hidden className='h-4 w-4 shrink-0' />
              <span className='min-w-0 max-w-full whitespace-normal wrap-break-word text-center leading-tight'>
                {t(`assets:section.${tab.shortLabel}.title`)}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
