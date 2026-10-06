import React from 'react'
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

  return (
    <div
      role='tablist'
      aria-label={t('ui:hq.sectionsLabel', {
        defaultValue: 'Band HQ Sections'
      })}
      /* From `sm` up the strip wraps onto a second row so every tab is
         visible: the ten tabs need 1280px of min-width inside an 888px panel,
         and because the scrollbar is hidden the overflowing tabs (Settings,
         Glossary, Void Trader) had no affordance hinting they existed. Mobile
         keeps the swipeable scroll container, where there is no room for rows
         and touch-pan is the discoverable convention. */
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
                className='flex-1 flex'
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
  )
}
