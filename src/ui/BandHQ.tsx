import React, { useMemo, useState, Suspense } from 'react'
import { useTranslation } from 'react-i18next'

import { getUnifiedUpgradeCatalog } from '../data/upgradeCatalog'
import { IMG_PROMPTS, resolveGenImageUrl } from '../utils/imageGen'
import { usePurchaseLogic } from './bandhq/hooks/usePurchaseLogic'
import { useBandHQLogic } from './bandhq/hooks/useBandHQLogic'

import { StatsTab } from './bandhq/StatsTab.tsx'
import { DetailedStatsTab } from './bandhq/DetailedStatsTab.tsx'
import { ShopTab } from './bandhq/ShopTab.tsx'
import { UpgradesTab } from './bandhq/UpgradesTab.tsx'
import { SetlistTab } from './bandhq/SetlistTab.tsx'
import { SettingsTab } from './bandhq/SettingsTab.tsx'
import { LeaderboardTab } from './bandhq/LeaderboardTab.tsx'
import { VoidTraderTab } from './bandhq/VoidTraderTab.tsx'
import { GlossaryTab } from './bandhq/GlossaryTab.tsx'
import { BrandDealsTab } from './bandhq/BrandDealsTab.tsx'
import { Tooltip } from './shared/Tooltip.tsx'
import { useNetworkStatus } from '../hooks/useNetworkStatus'

import { useGameActions, useGameSelector } from '../context/GameState.tsx'
import { useAudioControl } from '../hooks/useAudioControl'

const VOID_TRADER_CONTROVERSY_THRESHOLD = 30

interface HQTabDef {
  id: string
  key: string
  isLocked?: boolean
}

interface HQTabButtonProps {
  tab: HQTabDef
  isActive: boolean
  label: string
  onClick: () => void
}

const HQTabButton = ({ tab, isActive, label, onClick }: HQTabButtonProps) => (
  <button
    type='button'
    role='tab'
    aria-selected={isActive}
    aria-controls={`panel-${tab.id}`}
    id={`tab-${tab.id}`}
    onClick={onClick}
    disabled={tab.isLocked}
    className={`flex-1 w-full min-w-[6.5rem] sm:min-w-[120px] py-2 sm:py-3 px-3 sm:px-4 text-center text-xs sm:text-sm font-bold tracking-[0.1em] uppercase transition-all duration-150 font-mono flex justify-center items-center gap-2 whitespace-normal break-words [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset
      ${tab.isLocked ? 'opacity-50 grayscale' : ''}
      ${
        isActive
          ? 'bg-toxic-green text-void-black focus-visible:ring-void-black'
          : 'bg-void-black text-toxic-green border-r-2 border-l-2 border-transparent hover:border-toxic-green hover:bg-toxic-green hover:text-void-black focus-visible:ring-toxic-green'
      }`}
  >
    {isActive && <span className='text-xs'>▶</span>}
    {label}
  </button>
)

/**
 * BandHQ Component
 * Displays statistics and a shop for purchasing upgrades.
 *
 * @param {object} props
 * @param {Function} props.onClose - Callback to close the HQ modal.
 * @param {string} [props.className] - Optional custom class name.
 */
export interface BandHQProps {
  onClose: (e?: React.MouseEvent | React.KeyboardEvent | Event) => void
  className?: string
}

export const BandHQ = ({ onClose, className = '' }: BandHQProps) => {
  const { t } = useTranslation()
  const isOnline = useNetworkStatus()
  const [activeTab, setActiveTab] = useState('STATS')

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
    setSetlist
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

  const currentTab =
    activeTab === 'VOID' &&
    social.controversyLevel < VOID_TRADER_CONTROVERSY_THRESHOLD
      ? 'STATS'
      : activeTab

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
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 ${className}`}
    >
      {/* Backdrop */}
      <div
        className='fixed inset-0 z-30 bg-void-black/90 backdrop-blur-sm'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Decorative Background Image overlay */}
      <div
        className='fixed inset-0 z-40 bg-cover bg-center opacity-20 pointer-events-none'
        style={{
          backgroundImage: `url("${resolveGenImageUrl(IMG_PROMPTS.BAND_HQ_BG, isOnline)}")`
        }}
      />

      <div
        className='relative z-50 w-full max-w-5xl h-[calc(100svh-1rem)] max-h-[calc(100svh-1rem)] sm:h-[90vh] border-4 border-toxic-green bg-void-black flex flex-col overflow-hidden shadow-[4px_4px_0px_var(--color-toxic-green)] sm:shadow-[8px_8px_0px_var(--color-toxic-green)]'
        role='dialog'
        aria-modal='true'
        aria-labelledby='band-hq-title'
      >
        {/* Header */}
        <div className='flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 p-3 sm:p-6 border-b-4 border-toxic-green bg-void-black'>
          <div className='min-w-0'>
            <h2
              id='band-hq-title'
              className="text-3xl sm:text-4xl text-toxic-green font-['Metal_Mania'] drop-shadow-[0_0_5px_var(--color-toxic-green)]"
            >
              {t('ui:hq.title', { defaultValue: 'BAND HQ' })}
            </h2>
            <p className='text-ash-gray text-xs sm:text-sm font-mono uppercase tracking-widest break-words'>
              {t('venues:stendal_proberaum.name')} |{' '}
              {t('ui:ui.day', { defaultValue: 'Day' })} {player.day}
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2 border-2 border-blood-red text-blood-red font-bold hover:bg-blood-red hover:text-void-black transition-colors duration-200 uppercase font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blood-red focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'
          >
            {t('ui:hq.leave', { defaultValue: 'LEAVE [ESC]' })}
          </button>
        </div>

        {/* Navigation */}
        <div
          role='tablist'
          aria-label={t('ui:hq.sectionsLabel', {
            defaultValue: 'Band HQ Sections'
          })}
          className='flex shrink-0 border-b-4 border-toxic-green overflow-x-auto touch-pan-x scrollbar-hidden'
        >
          {/* Tabs */}
          {[
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
                social.controversyLevel >= VOID_TRADER_CONTROVERSY_THRESHOLD
                  ? 'tabs.voidTrader'
                  : 'tabs.voidTraderLocked',
              isLocked:
                social.controversyLevel < VOID_TRADER_CONTROVERSY_THRESHOLD
            }
          ].map(tab => {
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

        {/* Content Area */}
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
              />
            )}

            {currentTab === 'SHOP' && (
              <ShopTab
                player={player}
                handleBuy={handleBuyWithLock}
                isItemOwned={isItemOwned}
                isItemDisabled={isItemDisabled}
                getAdjustedCost={getAdjustedCost}
                processingItemId={processingItemId ?? undefined}
              />
            )}

            {currentTab === 'UPGRADES' && (
              <UpgradesTab
                player={player}
                upgrades={unifiedUpgradeCatalog}
                handleBuy={handleBuyWithLock}
                isItemOwned={isItemOwned}
                isItemDisabled={isItemDisabled}
                getAdjustedCost={getAdjustedCost}
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
                  handleTrade={handleVoidTrade}
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
      </div>
    </div>
  )
}
