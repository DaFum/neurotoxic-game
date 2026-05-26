import { useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions } from '../../context/GameState'
import { GAME_PHASES } from '../../context/gameConstants'
import type { AssetKind } from '../../types/assets'
import { AssetsStatusStrip } from './AssetsStatusStrip'
import { DEFAULT_SECTION_ACCENT, SECTION_VIEWS } from './sectionRegistry'

/**
 * Hub scene for the long-term asset system.
 *
 * Routes between four section tabs (Tourbus, Studio, Bandhaus, Workshop)
 * via the SECTION_VIEWS registry. Each section sets the active accent CSS
 * variable through `--section-accent` so child components (modals, panels)
 * pick up the section-specific brutalist border colour automatically.
 *
 * Section views are registered lazily by section plans 2-5. When a tab's
 * view isn't yet registered, the hub renders a neutral placeholder so the
 * foundation phase remains playable.
 */

interface TabDef {
  key: AssetKind
  /** i18n key under `assets:section.<id>.title`. */
  shortLabel: string
  /** Emoji prefix kept on the tab itself; matches the spec layout sketch. */
  icon: string
}

const TABS = [
  { key: 'tourbus_chassis', shortLabel: 'tourbus', icon: '🚐' },
  { key: 'studio_chassis', shortLabel: 'studio', icon: '🎚' },
  { key: 'bandhaus_chassis', shortLabel: 'bandhaus', icon: '🏠' },
  { key: 'merch_workshop_chassis', shortLabel: 'workshop', icon: '👕' }
] as const satisfies readonly TabDef[]

export const AssetsScene = () => {
  const { t } = useTranslation(['assets'])
  const { changeScene } = useGameActions()
  const [active, setActive] = useState<AssetKind>('tourbus_chassis')

  const activeView = SECTION_VIEWS[active]
  const accent = activeView?.accent ?? DEFAULT_SECTION_ACCENT
  const activeTab = TABS.find(tab => tab.key === active) ?? TABS[0]

  // The CSS variable cascades to every descendant via inline style; modals
  // and panels nested under the scene root read it via
  // `var(--section-accent)` without needing prop drilling.
  const wrapperStyle = {
    '--section-accent': accent
  } as CSSProperties

  return (
    <div
      className='relative flex h-full w-full flex-col bg-void-black text-toxic-green'
      style={wrapperStyle}
    >
      <AssetsStatusStrip />

      <div
        className='flex items-stretch border-b-2'
        role='tablist'
        aria-label={t('assets:scene.title')}
        style={{
          borderColor: 'var(--section-accent)',
          background: 'var(--color-void)'
        }}
      >
        <div className='scrollbar-hidden flex flex-1 gap-2 overflow-x-auto px-3 py-2'>
          {TABS.map(tab => {
            const isActive = tab.key === active
            return (
              <button
                key={tab.key}
                id={`assets-tab-${tab.key}`}
                type='button'
                role='tab'
                aria-selected={isActive}
                aria-controls={`assets-panel-${tab.key}`}
                onClick={() => setActive(tab.key)}
                className='shrink-0 border-2 px-3 py-1 font-mono text-xs uppercase tracking-wider sm:text-sm'
                style={{
                  borderColor: isActive
                    ? 'var(--section-accent)'
                    : 'transparent',
                  background: isActive
                    ? 'var(--section-accent)'
                    : 'transparent',
                  color: isActive ? 'var(--color-void)' : 'inherit'
                }}
              >
                <span aria-hidden className='mr-1 text-base'>
                  {tab.icon}
                </span>
                <span className='hidden sm:inline'>
                  {t(`assets:section.${tab.shortLabel}.title`)}
                </span>
              </button>
            )
          })}
        </div>

        <button
          type='button'
          onClick={() => changeScene(GAME_PHASES.OVERWORLD)}
          className='shrink-0 self-center border-l-2 border-toxic-green px-3 py-3 font-mono text-xs uppercase'
          style={{ borderLeftColor: 'var(--color-toxic-green)' }}
        >
          {t('assets:scene.back', { defaultValue: '← Back' })}
        </button>
      </div>

      <section
        id={`assets-panel-${active}`}
        className='min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4'
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
    </div>
  )
}
