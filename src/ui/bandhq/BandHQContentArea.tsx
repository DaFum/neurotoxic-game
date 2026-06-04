import React, { Suspense, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getUnifiedUpgradeCatalog } from '../../data/upgradeCatalog'
import { usePurchaseLogic } from './hooks/usePurchaseLogic'
import { useBandHQLogic } from './hooks/useBandHQLogic'
import { useGameActions, useGameSelector } from '../../context/GameState.tsx'
import { useAudioControl } from '../../hooks/useAudioControl'

import { StatsTab } from './StatsTab.tsx'
import { DetailedStatsTab } from './DetailedStatsTab.tsx'
import { ShopTab } from './ShopTab.tsx'
import { UpgradesTab } from './UpgradesTab.tsx'
import { SetlistTab } from './SetlistTab.tsx'
import { SettingsTab } from './SettingsTab.tsx'
import { LeaderboardTab } from './LeaderboardTab.tsx'
import { VoidTraderTab } from './VoidTraderTab.tsx'
import { GlossaryTab } from './GlossaryTab.tsx'
import { BrandDealsTab } from './BrandDealsTab.tsx'

/**
 * Active tab id and unlock threshold used to choose the Band HQ tab panel.
 */
export interface BandHQContentAreaProps {
  currentTab: string
  VOID_TRADER_CONTROVERSY_THRESHOLD: number
}

/**
 * Selects and renders the active Band HQ tab panel.
 * @param props - Active Band HQ tab and void-trader threshold used to choose the tab panel.
 */
export const BandHQContentArea = ({
  currentTab,
  VOID_TRADER_CONTROVERSY_THRESHOLD
}: BandHQContentAreaProps) => {
  const { t } = useTranslation()

  const player = useGameSelector(state => state.player)
  const band = useGameSelector(state => state.band)
  const social = useGameSelector(state => state.social)
  const settings = useGameSelector(state => state.settings)
  const setlist = useGameSelector(state => state.setlist)
  const activeQuests = useGameSelector(state => state.activeQuests)
  const venueBlacklist = useGameSelector(state => state.venueBlacklist)
  const reputationByRegion = useGameSelector(state => state.reputationByRegion)

  const {
    updatePlayer,
    updateBand,
    tradeVoidItem,
    addToast,
    updateSettings,
    deleteSave,
    setSetlist,
    unblacklistVenue,
    craftItem,
    consumeItem
  } = useGameActions()

  const { audioState, handleAudioChange: onAudioChange } = useAudioControl()

  const unifiedUpgradeCatalog = useMemo(() => getUnifiedUpgradeCatalog(), [])

  const purchaseLogicParams = {
    player,
    band,
    social,
    updatePlayer,
    updateBand,
    addToast
  }

  const { handleBuy, isItemOwned, isItemDisabled, getAdjustedCost } =
    usePurchaseLogic(purchaseLogicParams)

  const {
    processingItemId,
    handleVoidTrade,
    isVoidItemOwned,
    isVoidItemDisabled,
    handleBuyWithLock
  } = useBandHQLogic({
    player,
    band,
    handleBuy,
    tradeVoidItem,
    addToast
  })

  return (
    <div
      role='tabpanel'
      id={`panel-${currentTab}`}
      aria-labelledby={`tab-${currentTab}`}
      tabIndex={0}
      className='flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 custom-scrollbar focus-visible:outline-none touch-pan-y'
    >
      <Suspense
        fallback={
          <div className='flex items-center justify-center h-32 text-toxic-green font-mono animate-pulse uppercase tracking-widest'>
            {t('ui:loading', { defaultValue: 'Loading...' })}
          </div>
        }
      >
        {currentTab === 'STATS' && (
          <StatsTab player={player} band={band} social={social} />
        )}

        {currentTab === 'DETAILS' && (
          <DetailedStatsTab
            player={player}
            band={band}
            social={social}
            activeQuests={activeQuests}
            venueBlacklist={venueBlacklist}
            reputationByRegion={reputationByRegion}
            onMakeAmends={unblacklistVenue}
            onCraft={craftItem}
            onConsumeItem={consumeItem}
          />
        )}

        {currentTab === 'SHOP' && (
          <ShopTab
            player={player}
            handleBuy={(item: import('../../types/components').CatalogItem) => {
              void handleBuyWithLock(item)
            }}
            isItemOwned={
              isItemOwned as unknown as (
                item: import('../../types/components').CatalogItem
              ) => boolean
            }
            isItemDisabled={
              isItemDisabled as unknown as (
                item: import('../../types/components').CatalogItem
              ) => boolean
            }
            getAdjustedCost={
              getAdjustedCost as unknown as (
                item: import('../../types/components').CatalogItem
              ) => number | undefined
            }
            processingItemId={processingItemId ?? undefined}
          />
        )}

        {currentTab === 'UPGRADES' && (
          <UpgradesTab
            player={player}
            upgrades={unifiedUpgradeCatalog}
            handleBuy={(item: import('../../types/components').CatalogItem) => {
              void handleBuyWithLock(item)
            }}
            isItemOwned={
              isItemOwned as unknown as (
                item: import('../../types/components').CatalogItem
              ) => boolean
            }
            isItemDisabled={
              isItemDisabled as unknown as (
                item: import('../../types/components').CatalogItem
              ) => boolean
            }
            getAdjustedCost={
              getAdjustedCost as unknown as (
                item: import('../../types/components').CatalogItem
              ) => number | undefined
            }
            processingItemId={processingItemId ?? undefined}
          />
        )}

        {currentTab === 'SETLIST' && (
          <SetlistTab
            setlist={setlist}
            setSetlist={setSetlist}
            addToast={addToast}
          />
        )}

        {currentTab === 'LEADERBOARD' && <LeaderboardTab />}

        {currentTab === 'VOID' &&
          social.controversyLevel >= VOID_TRADER_CONTROVERSY_THRESHOLD && (
            <VoidTraderTab
              player={player}
              handleTrade={(
                item: import('../../types/components').VoidTraderItem
              ) => {
                void handleVoidTrade(item)
              }}
              isItemOwned={isVoidItemOwned}
              isItemDisabled={isVoidItemDisabled}
              processingItemId={processingItemId ?? undefined}
            />
          )}

        {currentTab === 'GLOSSARY' && <GlossaryTab />}

        {currentTab === 'BRAND_DEALS' && <BrandDealsTab social={social} />}

        {currentTab === 'SETTINGS' && (
          <SettingsTab
            settings={settings}
            audioState={audioState}
            onAudioChange={onAudioChange}
            updateSettings={updateSettings}
            deleteSave={deleteSave}
          />
        )}
      </Suspense>
    </div>
  )
}
