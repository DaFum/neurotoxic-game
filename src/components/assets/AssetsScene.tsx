import { useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions } from '../../context/GameState'
import { GAME_PHASES } from '../../context/gameConstants'
import type { AssetKind } from '../../types/assets'
import { AssetsBottomTabs } from './AssetsBottomTabs'
import { AssetsStatusStrip } from './AssetsStatusStrip'
import { ASSET_SECTION_TABS, ASSET_SECTION_TABS_MAP } from './sectionTabs'
import { DEFAULT_SECTION_ACCENT, SECTION_VIEWS } from './sectionRegistry'
import './assetsHub.css'

/**
 * Hub scene for the long-term asset system.
 *
 * @remarks
 * Routes section tabs through the `SECTION_VIEWS` registry and exposes the
 * active section accent via `--section-accent` for nested panels and modals.
 */
export const AssetsScene = () => {
  const { t } = useTranslation(['assets'])
  const { changeScene } = useGameActions()
  const [active, setActive] = useState<AssetKind>('tourbus_chassis')

  const activeView = SECTION_VIEWS[active]
  const accent = activeView?.accent ?? DEFAULT_SECTION_ACCENT
  const activeTab = ASSET_SECTION_TABS_MAP[active] ?? ASSET_SECTION_TABS[0]

  // The CSS variable cascades to every descendant via inline style; modals
  // and panels nested under the scene root read it via
  // `var(--section-accent)` without needing prop drilling.
  const wrapperStyle = {
    '--section-accent': accent
  } as CSSProperties

  return (
    <div
      className='assets-hub relative flex h-full w-full flex-col overflow-hidden text-toxic-green'
      style={wrapperStyle}
    >
      <AssetsStatusStrip />

      <div className='assets-hub-topbar flex items-center justify-between gap-2 px-2 py-2 sm:px-4'>
        <p className='assets-hub-control assets-hub-description min-w-0 truncate text-xs uppercase'>
          {t(`assets:section.${activeTab.shortLabel}.description`)}
        </p>
        <button
          type='button'
          onClick={() => changeScene(GAME_PHASES.OVERWORLD)}
          className='assets-hub-control assets-hub-back-button min-h-11 shrink-0 border-2 px-3 py-2 text-xs uppercase'
          style={{
            borderColor: 'var(--section-accent)',
            color: 'var(--section-accent)'
          }}
        >
          {t('assets:scene.back')}
        </button>
      </div>

      <section
        key={active}
        id={`assets-panel-${active}`}
        className='min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2 sm:px-4 sm:pb-4'
        role='tabpanel'
        aria-labelledby={`assets-tab-${active}`}
      >
        {activeView ? (
          <activeView.Component />
        ) : (
          <p className='font-mono text-sm opacity-60'>
            {t('assets:scene.noSectionRegistered')}
          </p>
        )}
      </section>

      <AssetsBottomTabs active={active} onSelect={setActive} />
    </div>
  )
}
