import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tooltip } from '../shared/Tooltip.tsx'
import { createRovingTabs } from '../shared/rovingTabs.ts'
import { type HQTabDef } from './HQTabButton.tsx'
import { HQTabButton } from './HQTabButton.tsx'

interface BandHQTabsListProps {
  currentTab: string
  setActiveTab: (tab: string) => void
  isVoidTraderUnlocked: boolean
}

/**
 * Displays Band HQ tab buttons with active-tab state and labels.
 * @param props - Active tab state, tab switch callback, and whether the void trader is unlocked.
 */
export const BandHQTabsList = ({
  currentTab,
  setActiveTab,
  isVoidTraderUnlocked
}: BandHQTabsListProps) => {
  const { t } = useTranslation()

  const tabs: HQTabDef[] = [
    { id: 'STATS', key: 'tabs.stats' },
    { id: 'DETAILS', key: 'tabs.details' },
    { id: 'SHOP', key: 'tabs.shop' },
    { id: 'UPGRADES', key: 'tabs.upgrades' },
    { id: 'EXPEDITION', key: 'tabs.expedition' },
    { id: 'SETLIST', key: 'tabs.setlist' },
    { id: 'LEADERBOARD', key: 'tabs.leaderboard' },
    { id: 'BRAND_DEALS', key: 'tabs.brandDeals' },
    { id: 'SETTINGS', key: 'tabs.settings' },
    { id: 'GLOSSARY', key: 'tabs.glossary' },
    {
      id: 'VOID',
      key: isVoidTraderUnlocked ? 'tabs.voidTrader' : 'tabs.voidTraderLocked',
      isLocked: !isVoidTraderUnlocked
    }
  ]

  const { getTabProps } = createRovingTabs({
    ids: tabs.map(tab => tab.id),
    activeId: currentTab,
    onSelect: setActiveTab,
    isLocked: id => tabs.find(tab => tab.id === id)?.isLocked === true
  })

  const stripRef = useRef<HTMLDivElement>(null)
  const [overflow, setOverflow] = useState({ start: false, end: false })

  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return undefined
    const update = () => {
      // 1px slack absorbs sub-pixel scroll positions at either edge.
      const start = strip.scrollLeft > 1
      const end = strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1
      setOverflow(prev =>
        prev.start === start && prev.end === end ? prev : { start, end }
      )
    }
    update()
    strip.addEventListener('scroll', update, { passive: true })
    // Observing the tabs as well catches label-width changes (language
    // switch) that alter scrollWidth without resizing the strip itself.
    const observer =
      typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null
    observer?.observe(strip)
    for (const child of Array.from(strip.children)) observer?.observe(child)
    return () => {
      strip.removeEventListener('scroll', update)
      observer?.disconnect()
    }
    // Unlocking the Void Trader swaps its Tooltip wrapper for a bare tab, so
    // the observed children change.
  }, [isVoidTraderUnlocked])

  const fadeClass =
    'pointer-events-none absolute top-0 bottom-1 w-8 from-void-black to-transparent'

  return (
    <div className='relative shrink-0'>
      <div
        ref={stripRef}
        role='tablist'
        aria-label={t('ui:hq.sectionsLabel', {
          defaultValue: 'Band HQ Sections'
        })}
        /* From `sm` up the strip wraps onto a second row so every tab is
           visible: the tabs need far more min-width than the panel offers, and
           because the scrollbar is hidden the overflowing tabs had no
           affordance hinting they existed. Phones keep the swipeable scroll
           container (no room for rows); there, edge fades on whichever side
           still has tabs make the overflow discoverable. */
        className='flex shrink-0 border-b-4 border-toxic-green overflow-x-auto touch-pan-x scrollbar-hidden sm:flex-wrap sm:overflow-x-visible'
      >
        {tabs.map(tab => {
          const isActive = currentTab === tab.id
          const button = (
            <HQTabButton
              tab={tab}
              isActive={isActive}
              label={t(tab.key)}
              onClick={() => !tab.isLocked && setActiveTab(tab.id)}
              onKeyDown={getTabProps(tab.id).onKeyDown}
            />
          )

          return (
            <React.Fragment key={tab.id}>
              {tab.isLocked ? (
                <Tooltip
                  content={t('ui:hq.voidTraderLockedTooltip')}
                  className='flex-1 flex max-sm:flex-auto max-sm:shrink-0'
                >
                  {button}
                </Tooltip>
              ) : (
                button
              )}
            </React.Fragment>
          )
        })}
      </div>
      {overflow.start && (
        <div
          aria-hidden='true'
          data-overflow-cue='start'
          className={`${fadeClass} left-0 bg-linear-to-r`}
        />
      )}
      {overflow.end && (
        <div
          aria-hidden='true'
          data-overflow-cue='end'
          className={`${fadeClass} right-0 bg-linear-to-l`}
        />
      )}
    </div>
  )
}
