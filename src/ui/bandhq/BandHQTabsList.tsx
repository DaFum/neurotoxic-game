import React from 'react'
import { useTranslation } from 'react-i18next'
import { Tooltip } from '../shared/Tooltip.tsx'
import { type HQTabDef } from './HQTabButton.tsx'
import { HQTabButton } from './HQTabButton.tsx'

interface BandHQTabsListProps {
  currentTab: string
  setActiveTab: (tab: string) => void
  controversyLevel: number
  VOID_TRADER_CONTROVERSY_THRESHOLD: number
}

/**
 * Renders the Band HQ Tabs List view from currentTab, setActiveTab, controversyLevel, and VOID_TRADER_CONTROVERSY_THRESHOLD.
 * @param props - Active tab state, tab switch callback, controversy level, and void-trader unlock threshold.
 * @returns The rendered Band HQ Tabs List UI.
 */
export const BandHQTabsList = ({
  currentTab,
  setActiveTab,
  controversyLevel,
  VOID_TRADER_CONTROVERSY_THRESHOLD
}: BandHQTabsListProps) => {
  const { t } = useTranslation()

  const tabs: HQTabDef[] = [
    { id: 'STATS', key: 'tabs.stats' },
    { id: 'DETAILS', key: 'tabs.details' },
    { id: 'SHOP', key: 'tabs.shop' },
    { id: 'UPGRADES', key: 'tabs.upgrades' },
    { id: 'SETLIST', key: 'tabs.setlist' },
    { id: 'LEADERBOARD', key: 'tabs.leaderboard' },
    { id: 'BRAND_DEALS', key: 'tabs.brandDeals' },
    { id: 'SETTINGS', key: 'tabs.settings' },
    { id: 'GLOSSARY', key: 'tabs.glossary' },
    {
      id: 'VOID',
      key:
        controversyLevel >= VOID_TRADER_CONTROVERSY_THRESHOLD
          ? 'tabs.voidTrader'
          : 'tabs.voidTraderLocked',
      isLocked: controversyLevel < VOID_TRADER_CONTROVERSY_THRESHOLD
    }
  ]

  return (
    <div
      role='tablist'
      aria-label={t('ui:hq.sectionsLabel', {
        defaultValue: 'Band HQ Sections'
      })}
      className='flex shrink-0 border-b-4 border-toxic-green overflow-x-auto touch-pan-x scrollbar-hidden'
    >
      {tabs.map(tab => {
        const isActive = currentTab === tab.id
        const button = (
          <HQTabButton
            tab={tab}
            isActive={isActive}
            label={t(tab.key)}
            onClick={() => !tab.isLocked && setActiveTab(tab.id)}
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
