import { useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions } from '../../context/GameState'
import { GAME_PHASES } from '../../context/gameConstants'
import type { AssetKind } from '../../types/assets'
import { AssetsTopBar } from './AssetsTopBar'
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

const TABS: readonly TabDef[] = [
  { key: 'tourbus_chassis', shortLabel: 'tourbus', icon: '🚐' },
  { key: 'studio_chassis', shortLabel: 'studio', icon: '🎚' },
  { key: 'bandhaus_chassis', shortLabel: 'bandhaus', icon: '🏠' },
  { key: 'merch_workshop_chassis', shortLabel: 'workshop', icon: '👕' }
]

export const AssetsScene = () => {
  const { t } = useTranslation(['assets'])
  const { changeScene } = useGameActions()
  const [active, setActive] = useState<AssetKind>('tourbus_chassis')

  const activeView = SECTION_VIEWS[active]
  const accent = activeView?.accent ?? DEFAULT_SECTION_ACCENT

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
      <AssetsTopBar />

      <nav
        className='flex flex-wrap gap-2 border-b-2 px-4 py-2'
        role='tablist'
        aria-label={t('assets:scene.title')}
        style={{
          borderColor: 'var(--section-accent)',
          background: 'var(--color-void)'
        }}
      >
        {TABS.map(tab => {
          const isActive = tab.key === active
          return (
            <button
              key={tab.key}
              type='button'
              role='tab'
              aria-selected={isActive}
              onClick={() => setActive(tab.key)}
              className='border-2 px-3 py-1 font-mono text-sm uppercase tracking-wider'
              style={{
                borderColor: isActive ? 'var(--section-accent)' : 'transparent',
                background: isActive ? 'var(--section-accent)' : 'transparent',
                color: isActive ? 'var(--color-void)' : 'inherit'
              }}
            >
              <span aria-hidden className='mr-1'>
                {tab.icon}
              </span>
              {t(`assets:section.${tab.shortLabel}.title`)}
            </button>
          )
        })}

        <button
          type='button'
          onClick={() => changeScene(GAME_PHASES.OVERWORLD)}
          className='ml-auto border-2 border-toxic-green px-3 py-1 font-mono text-xs uppercase'
        >
          {t('assets:scene.back', { defaultValue: '← Back' })}
        </button>
      </nav>

      <section
        className='flex-1 overflow-y-auto p-4'
        role='tabpanel'
        aria-label={t(`assets:section.${active.replace('_chassis', '')}.title`)}
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
