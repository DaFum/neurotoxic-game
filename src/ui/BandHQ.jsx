import { useMemo, useState } from 'react'
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
import { AudioStatePropType, OnAudioChangePropType } from './shared/propTypes'

/**
 * BandHQ Component
 * Displays statistics and a shop for purchasing upgrades.
 *
 * @param {object} props
 * @param {object} props.player - The player state.
 * @param {object} props.band - The band state.
 * @param {object} props.social - The social stats.
 * @param {Function} props.onClose - Callback to close the HQ modal.
 * @param {Function} props.updatePlayer - Callback to update player state.
 * @param {Function} props.updateBand - Callback to update band state.
 * @param {Function} props.addToast - Callback to show notifications.
 * @param {object} props.settings - Global settings.
 * @param {Function} props.updateSettings - Update settings callback.
 * @param {Function} props.deleteSave - Delete save callback.
 * @param {Array} props.setlist - Current setlist.
 * @param {Function} props.setSetlist - Update setlist callback.
 * @param {object} props.audioState - Current audio state (musicVol, sfxVol, isMuted).
 * @param {Function} props.onAudioChange - Callback for audio changes.
 * @param {string} [props.className] - Optional custom class name.
 */
export const BandHQ = ({
  player,
  band,
  social,
  onClose,
  updatePlayer,
  updateBand,
  addToast,
  settings,
  updateSettings,
  deleteSave,
  setlist,
  setSetlist,
  audioState,
  onAudioChange,
  activeQuests,
  venueBlacklist,
  reputationByRegion,
  className = ''
}) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('STATS')
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
        handleError(new GameError('Purchase failed', { context: err }), {
          addToast
        })
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
        className='absolute inset-0 z-0 bg-(--void-black)/90 backdrop-blur-sm'
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Decorative Background Image overlay */}
      <div
        className='absolute inset-0 z-0 bg-cover bg-center opacity-20 pointer-events-none'
        style={{
          backgroundImage: `url("${getGenImageUrl(IMG_PROMPTS.BAND_HQ_BG)}")`
        }}
      />

      <div className='relative z-10 w-full max-w-5xl h-[90vh] border-2 border-(--toxic-green) bg-(--void-black) flex flex-col shadow-[0_0_50px_var(--toxic-green)]'>
        {/* Header */}
        <div className='flex justify-between items-center p-6 border-b-2 border-(--toxic-green) bg-(--void-black)/50'>
          <div>
            <h2 className="text-4xl text-(--toxic-green) font-['Metal_Mania'] drop-shadow-[0_0_5px_var(--toxic-green)]">
              {t('ui:hq.title', { defaultValue: 'BAND HQ' })}
            </h2>
            <p className='text-(--ash-gray) text-sm font-mono uppercase tracking-widest'>
              {t('venues:stendal_proberaum.name')} |{' '}
              {t('ui:ui.day', { defaultValue: 'Day' })} {player.day}
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='px-6 py-2 border-2 border-(--blood-red) text-(--blood-red) font-bold hover:bg-(--blood-red) hover:text-(--void-black) transition-colors duration-200 uppercase font-mono'
          >
            {t('ui:hq.leave', { defaultValue: 'LEAVE [ESC]' })}
          </button>
        </div>

        {/* Navigation */}
        <div
          role='tablist'
          aria-label='Band HQ Sections'
          className='flex border-b-2 border-(--toxic-green) overflow-x-auto relative z-20'
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
                      ? 'bg-(--toxic-green) text-(--void-black) shadow-[0_-2px_10px_var(--toxic-green)]'
                      : 'bg-(--void-black) text-(--toxic-green) hover:bg-(--toxic-green)/10'
                  }`}
              >
                {isActive && <span className="text-xs">▶</span>}
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
          className='flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-(--toxic-green) scrollbar-track-(--void-black) focus-visible:outline-none'
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

          {activeTab === 'LEADERBOARD' && <LeaderboardTab setlist={setlist} />}

          {activeTab === 'SETTINGS' && (
            <SettingsTab
              settings={settings}
              audioState={audioState}
              onAudioChange={onAudioChange}
              updateSettings={updateSettings}
              deleteSave={deleteSave}
            />
          )}
        </div>
      </div>
    </div>
  )
}

BandHQ.propTypes = {
  player: PropTypes.shape({
    money: PropTypes.number,
    fame: PropTypes.number,
    day: PropTypes.number,
    hqUpgrades: PropTypes.arrayOf(PropTypes.string),
    van: PropTypes.shape({
      fuel: PropTypes.number,
      condition: PropTypes.number,
      breakdownChance: PropTypes.number,
      upgrades: PropTypes.arrayOf(PropTypes.string)
    })
  }).isRequired,
  band: PropTypes.shape({
    inventory: PropTypes.object,
    inventorySlots: PropTypes.number,
    harmony: PropTypes.number,
    performance: PropTypes.object,
    members: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        stamina: PropTypes.number,
        mood: PropTypes.number
      })
    )
  }).isRequired,
  social: PropTypes.shape({
    instagram: PropTypes.number,
    tiktok: PropTypes.number,
    youtube: PropTypes.number,
    newsletter: PropTypes.number
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  updatePlayer: PropTypes.func.isRequired,
  updateBand: PropTypes.func.isRequired,
  addToast: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired,
  updateSettings: PropTypes.func.isRequired,
  deleteSave: PropTypes.func.isRequired,
  setlist: PropTypes.array.isRequired,
  setSetlist: PropTypes.func.isRequired,
  audioState: AudioStatePropType.isRequired,
  onAudioChange: OnAudioChangePropType.isRequired,
  activeQuests: PropTypes.array,
  venueBlacklist: PropTypes.array,
  reputationByRegion: PropTypes.object,
  className: PropTypes.string
}
