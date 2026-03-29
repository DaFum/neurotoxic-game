import { useMemo, useState, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { getUnifiedUpgradeCatalog } from '../data/upgradeCatalog'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen.js'
import { usePurchaseLogic } from '../hooks/usePurchaseLogic'
import { handleError, GameError, StateError } from '../utils/errorHandler'
import { StatsTab } from './bandhq/StatsTab'
import { DetailedStatsTab } from './bandhq/DetailedStatsTab'
import { ShopTab } from './bandhq/ShopTab'
import { UpgradesTab } from './bandhq/UpgradesTab'
import { SetlistTab } from './bandhq/SetlistTab'
import { SettingsTab } from './bandhq/SettingsTab'
import { LeaderboardTab } from './bandhq/LeaderboardTab'
import { useGameState } from '../context/GameState.jsx'
import { useAudioControl } from '../hooks/useAudioControl.js'

/**
 * BandHQ Component
 * Displays statistics and a shop for purchasing upgrades.
 *
 * @param {object} props
 * @param {Function} props.onClose - Callback to close the HQ modal.
 * @param {string} [props.className] - Optional custom class name.
 */
export const BandHQ = ({ onClose, className = '' }) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('STATS')

  const {
    player,
    band,
    social,
    updatePlayer,
    updateBand,
    addToast,
    settings,
    updateSettings,
    deleteSave,
    setlist,
    setSetlist,
    activeQuests,
    venueBlacklist,
    reputationByRegion
  } = useGameState()

  const { audioState, handleAudioChange: onAudioChange } = useAudioControl()
  const [processingItemId, setProcessingItemId] = useState(null)

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

  const handleBuyWithLock = async item => {
    if (processingItemId) return
    setProcessingItemId(item.id)
    try {
      // Artificial delay for UX lifted from ShopItem
      await new Promise(resolve => setTimeout(resolve, 500))
      await handleBuy(item)
    } catch (err) {
      if (err instanceof GameError || err instanceof StateError) {
        handleError(err, { addToast })
      } else {
        handleError(
          new GameError('Purchase failed', {
            context: {
              originalError: err?.message,
              stack: err?.stack
            }
          }),
          { addToast }
        )
      }
    } finally {
      setProcessingItemId(null)
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}
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
          backgroundImage: `url("${getGenImageUrl(IMG_PROMPTS.BAND_HQ_BG)}")`
        }}
      />

      <div className='relative z-50 w-full max-w-5xl h-[90vh] border-2 border-toxic-green bg-void-black flex flex-col shadow-[0_0_50px_var(--color-toxic-green)]'>
        {/* Header */}
        <div className='flex justify-between items-center p-6 border-b-2 border-toxic-green bg-void-black/50'>
          <div>
            <h2 className="text-4xl text-toxic-green font-['Metal_Mania'] drop-shadow-[0_0_5px_var(--color-toxic-green)]">
              {t('ui:hq.title', { defaultValue: 'BAND HQ' })}
            </h2>
            <p className='text-ash-gray text-sm font-mono uppercase tracking-widest'>
              {t('venues:stendal_proberaum.name')} |{' '}
              {t('ui:ui.day', { defaultValue: 'Day' })} {player.day}
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='px-6 py-2 border-2 border-blood-red text-blood-red font-bold hover:bg-blood-red hover:text-void-black transition-colors duration-200 uppercase font-mono'
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
          className='flex border-b-2 border-toxic-green overflow-x-auto touch-pan-x'
        >
          {/* Tabs */}
          {[
            { id: 'STATS', key: 'tabs.stats' },
            { id: 'DETAILS', key: 'tabs.details' },
            { id: 'SHOP', key: 'tabs.shop' },
            { id: 'UPGRADES', key: 'tabs.upgrades' },
            { id: 'SETLIST', key: 'tabs.setlist' },
            { id: 'LEADERBOARD', key: 'tabs.leaderboard' },
            { id: 'SETTINGS', key: 'tabs.settings' }
          ].map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                type='button'
                role='tab'
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[120px] py-3 px-4 text-center text-sm font-bold tracking-[0.1em] uppercase transition-all duration-150 font-mono flex justify-center items-center gap-2
                  ${
                    isActive
                      ? 'bg-toxic-green text-void-black shadow-[0_-2px_10px_var(--color-toxic-green)]'
                      : 'bg-void-black text-toxic-green hover:bg-toxic-green/10'
                  }`}
              >
                {isActive && <span className='text-xs'>▶</span>}
                {t(tab.key)}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div
          role='tabpanel'
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          tabIndex={0}
          className='flex-1 min-h-0 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-toxic-green scrollbar-track-void-black focus-visible:outline-none touch-pan-y'
        >
          <Suspense
            fallback={
              <div className='flex items-center justify-center h-32 text-toxic-green font-mono animate-pulse uppercase tracking-widest'>
                {t('ui:loading', { defaultValue: 'Loading...' })}
              </div>
            }
          >
            {activeTab === 'STATS' && (
              <StatsTab player={player} band={band} social={social} />
            )}

            {activeTab === 'DETAILS' && (
              <DetailedStatsTab
                player={player}
                band={band}
                social={social}
                activeQuests={activeQuests}
                venueBlacklist={venueBlacklist}
                reputationByRegion={reputationByRegion}
              />
            )}

            {activeTab === 'SHOP' && (
              <ShopTab
                player={player}
                handleBuy={handleBuyWithLock}
                isItemOwned={isItemOwned}
                isItemDisabled={isItemDisabled}
                getAdjustedCost={getAdjustedCost}
                processingItemId={processingItemId}
              />
            )}

            {activeTab === 'UPGRADES' && (
              <UpgradesTab
                player={player}
                upgrades={unifiedUpgradeCatalog}
                handleBuy={handleBuyWithLock}
                isItemOwned={isItemOwned}
                isItemDisabled={isItemDisabled}
                getAdjustedCost={getAdjustedCost}
                processingItemId={processingItemId}
              />
            )}

            {activeTab === 'SETLIST' && (
              <SetlistTab
                setlist={setlist}
                setSetlist={setSetlist}
                addToast={addToast}
              />
            )}

            {activeTab === 'LEADERBOARD' && <LeaderboardTab />}

            {activeTab === 'SETTINGS' && (
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

BandHQ.propTypes = {
  onClose: PropTypes.func.isRequired,
  className: PropTypes.string
}
