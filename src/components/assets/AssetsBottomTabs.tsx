import { useTranslation } from 'react-i18next'
import type { AssetKind } from '../../types/assets'
import { ASSET_SECTION_TABS } from './sectionTabs'

interface AssetsBottomTabsProps {
  active: AssetKind
  onSelect: (kind: AssetKind) => void
}

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
              className='assets-hub-control flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 border-2 px-1 py-2 text-[0.65rem] uppercase leading-none transition-transform active:scale-[0.98] sm:flex-row sm:text-xs'
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
              <span className='min-w-0 max-w-full whitespace-normal break-words text-center leading-tight'>
                {t(`assets:section.${tab.shortLabel}.title`)}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
