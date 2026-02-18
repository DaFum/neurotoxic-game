import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { HQ_ITEMS } from '../data/hqItems'
import { getUnifiedUpgradeCatalog } from '../data/upgradeCatalog'
import { SONGS_DB } from '../data/songs'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen'
import { getPrimaryEffect, usePurchaseLogic } from '../hooks/usePurchaseLogic'
import { StatBox, ProgressBar, SettingsPanel } from '../ui/shared'

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
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('STATS') // STATS, SHOP, UPGRADES, SETLIST, SETTINGS

  const unifiedUpgradeCatalog = useMemo(() => getUnifiedUpgradeCatalog(), [])

  const purchaseLogicParams = {
    player,
    band,
    updatePlayer,
    updateBand,
    addToast
  }

  const { handleBuy, isItemOwned, isItemDisabled } =
    usePurchaseLogic(purchaseLogicParams)

  const toggleSongInSetlist = songId => {
    const currentIndex = setlist.findIndex(
      s => (typeof s === 'string' ? s : s.id) === songId
    )

    let newSetlist
    if (currentIndex >= 0) {
      newSetlist = [...setlist]
      newSetlist.splice(currentIndex, 1)
      addToast('Song removed from setlist', 'info')
    } else {
      // Currently allow 1 active song for MVP flow, or replace logic if desired.
      // Replacing entirely ensures single song selection per instructions/simplicity.
      newSetlist = [{ id: songId }]
      addToast('Song selected for next Gig', 'success')
    }
    setSetlist(newSetlist)
  }

  const isSongSelected = songId => {
    return setlist.some(s => (typeof s === 'string' ? s : s.id) === songId)
  }

  const renderItem = item => {
    const owned = isItemOwned(item)
    const disabled = isItemDisabled(item)
    const primaryEffect = getPrimaryEffect(item)
    const isConsumable = primaryEffect?.type === 'inventory_add'

    return (
      <div
        key={item.id}
        className={`p-4 border-2 relative flex flex-col justify-between transition-colors
          ${
            owned && !isConsumable
              ? 'border-(--toxic-green) bg-(--toxic-green)/10'
              : 'border-(--ash-gray) bg-(--void-black)/80'
          }`}
      >
        <div>
          <div className='flex items-center gap-2 mb-2'>
            <img
              src={getGenImageUrl(IMG_PROMPTS[item.img] || item.name)}
              alt={item.name}
              className='w-12 h-12 object-contain bg-(--void-black) border-2 border-(--ash-gray)'
            />
            <h4 className='font-bold text-(--toxic-green) leading-tight font-mono uppercase'>
              {item.name}
            </h4>
          </div>
          <p className='text-xs text-(--ash-gray) mb-2 font-mono'>
            {item.description}
          </p>
        </div>
        <div className='flex justify-between items-center mt-2'>
          <span
            className={`font-mono text-sm font-bold ${
              item.currency === 'fame'
                ? 'text-(--warning-yellow)'
                : 'text-(--star-white)'
            }`}
          >
            {item.cost} {item.currency === 'fame' ? '★' : '€'}
          </span>
          <button
            onClick={() => handleBuy(item)}
            disabled={disabled}
            className={`px-3 py-1 text-xs font-bold uppercase transition-all duration-200 border-2
              ${
                owned && !isConsumable
                  ? 'border-(--ash-gray) text-(--ash-gray) cursor-default'
                  : disabled
                    ? 'border-(--disabled-border) text-(--disabled-text) bg-(--disabled-bg) cursor-not-allowed'
                    : 'border-(--toxic-green) bg-(--toxic-green) text-(--void-black) hover:invert shadow-[4px_4px_0px_var(--void-black)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
              }`}
          >
            {owned && !isConsumable ? 'OWNED' : 'BUY'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-(--void-black)/90 backdrop-blur-sm ${className}`}
    >
      <div
        className='absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none'
        style={{
          backgroundImage: `url("${getGenImageUrl(IMG_PROMPTS.BAND_HQ_BG)}")`
        }}
      />

      <div className='relative w-full max-w-5xl h-[90vh] border-2 border-(--toxic-green) bg-(--void-black) flex flex-col shadow-[0_0_50px_var(--toxic-green)]'>
        {/* Header */}
        <div className='flex justify-between items-center p-6 border-b-2 border-(--toxic-green) bg-(--void-black)/50'>
          <div>
            <h2 className="text-4xl text-(--toxic-green) font-['Metal_Mania'] drop-shadow-[0_0_5px_var(--toxic-green)]">
              BAND HQ
            </h2>
            <p className='text-(--ash-gray) text-sm font-mono uppercase tracking-widest'>
              Stendal Rehearsal Room | Day {player.day}
            </p>
          </div>
          <button
            onClick={onClose}
            className='px-6 py-2 border-2 border-(--blood-red) text-(--blood-red) font-bold hover:bg-(--blood-red) hover:text-(--void-black) transition-colors duration-200 uppercase font-mono'
          >
            LEAVE [ESC]
          </button>
        </div>

        {/* Navigation */}
        <div className='flex border-b-2 border-(--ash-gray) overflow-x-auto'>
          {['STATS', 'SHOP', 'UPGRADES', 'SETLIST', 'SETTINGS'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[120px] py-4 text-center font-bold text-xl uppercase tracking-wider transition-colors duration-150 font-mono
                ${
                  activeTab === tab
                    ? 'bg-(--toxic-green) text-(--void-black)'
                    : 'text-(--ash-gray) hover:text-(--star-white) bg-(--void-black)/50 hover:bg-(--void-black)/70'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className='flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-(--toxic-green) scrollbar-track-(--void-black)'>
          {activeTab === 'STATS' && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              {/* Financials & Fame */}
              <div className='space-y-6'>
                <div className='bg-(--void-black)/40 border-2 border-(--ash-gray) p-4'>
                  <h3 className='text-(--toxic-green) text-lg font-bold mb-4 border-b border-(--ash-gray) pb-2 font-mono'>
                    CAREER STATUS
                  </h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <StatBox
                      label='Funds'
                      value={`${player.money}€`}
                      icon='€'
                    />
                    <StatBox label='Fame' value={player.fame} icon='★' />
                    <StatBox label='Day' value={player.day} icon='📅' />
                    <StatBox
                      label='Followers'
                      value={social.instagram + social.tiktok}
                      icon='👥'
                    />
                  </div>
                </div>

                <div className='bg-(--void-black)/40 border-2 border-(--ash-gray) p-4'>
                  <h3 className='text-(--toxic-green) text-lg font-bold mb-4 border-b border-(--ash-gray) pb-2 font-mono'>
                    VAN STATUS
                  </h3>
                  <div className='space-y-2'>
                    <ProgressBar
                      label='Fuel'
                      value={player.van?.fuel}
                      max={100}
                      color='bg-(--fuel-yellow)'
                    />
                    <ProgressBar
                      label='Condition'
                      value={player.van?.condition}
                      max={100}
                      color='bg-(--condition-blue)'
                    />
                    <div className='mt-2 text-xs text-(--ash-gray) font-mono'>
                      Breakdown Chance:{' '}
                      {((player.van?.breakdownChance ?? 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Band Members */}
              <div className='bg-(--void-black)/40 border-2 border-(--ash-gray) p-4'>
                <h3 className='text-(--toxic-green) text-lg font-bold mb-4 border-b border-(--ash-gray) pb-2 font-mono'>
                  BAND STATUS
                </h3>
                <div className='space-y-6'>
                  {(band.members || []).map(m => (
                    <div key={m.name} className='flex items-center gap-4'>
                      <div className='w-20 font-bold text-(--star-white) font-mono'>
                        {m.name}
                      </div>
                      <div className='flex-1 space-y-1'>
                        <ProgressBar
                          label='Stamina'
                          value={m.stamina}
                          max={100}
                          color='bg-(--stamina-green)'
                          size='sm'
                        />
                        <ProgressBar
                          label='Mood'
                          value={m.mood}
                          max={100}
                          color='bg-(--mood-pink)'
                          size='sm'
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className='mt-6 pt-4 border-t border-(--ash-gray)'>
                  <div className='flex justify-between items-center mb-2'>
                    <span className='text-(--ash-gray) font-mono text-sm'>
                      Inventory Slots:
                    </span>
                    <span className='text-(--star-white) font-mono'>
                      {band.inventorySlots}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-(--ash-gray) font-mono text-sm'>
                      Harmony:
                    </span>
                    <span className='text-(--toxic-green) font-mono'>
                      {band.harmony}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SHOP' && (
            <div className='max-h-[60vh] overflow-y-auto'>
              <div className='mb-4 text-right font-mono text-(--star-white)'>
                FUNDS:{' '}
                <span className='text-(--toxic-green)'>{player.money}€</span>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4'>
                {[...HQ_ITEMS.gear, ...HQ_ITEMS.instruments].map(renderItem)}
              </div>
            </div>
          )}

          {activeTab === 'UPGRADES' && (
            <div className='max-h-[60vh] overflow-y-auto'>
              <div className='mb-4 flex justify-end gap-4 font-mono text-(--star-white)'>
                <span>
                  FAME:{' '}
                  <span className='text-(--warning-yellow)'>
                    {player.fame}★
                  </span>
                </span>
                <span>
                  MONEY:{' '}
                  <span className='text-(--toxic-green)'>{player.money}€</span>
                </span>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4'>
                {unifiedUpgradeCatalog.map(renderItem)}
              </div>
            </div>
          )}

          {activeTab === 'SETLIST' && (
            <div className='max-h-[60vh] overflow-y-auto'>
              <div className='mb-4 text-right font-mono text-(--star-white)'>
                SELECTED:{' '}
                <span className='text-(--toxic-green)'>{setlist.length}</span>
              </div>
              <div className='space-y-2 pb-4'>
                {SONGS_DB.map(song => {
                  const selected = isSongSelected(song.id)
                  return (
                    <div
                      key={song.id}
                      className={`flex items-center justify-between p-4 border-2 transition-colors
                        ${
                          selected
                            ? 'border-(--toxic-green) bg-(--toxic-green)/20'
                            : 'border-(--ash-gray) bg-(--void-black)/60'
                        }`}
                    >
                      <div className='flex-1'>
                        <h4
                          className={`font-bold font-mono text-lg uppercase ${selected ? 'text-(--toxic-green)' : 'text-(--star-white)'}`}
                        >
                          {song.name}
                        </h4>
                        <div className='flex gap-4 text-xs font-mono text-(--ash-gray) mt-1'>
                          <span>DIFF: {song.difficulty}/7</span>
                          <span>BPM: {song.bpm}</span>
                          <span>
                            DUR: {Math.floor(song.duration / 60)}:
                            {(song.duration % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSongInSetlist(song.id)}
                        className={`px-4 py-2 font-bold uppercase border-2 text-sm transition-all
                          ${
                            selected
                              ? 'border-(--toxic-green) text-(--toxic-green) hover:bg-(--toxic-green) hover:text-(--void-black)'
                              : 'border-(--ash-gray) text-(--ash-gray) hover:border-(--star-white) hover:text-(--star-white)'
                          }`}
                      >
                        {selected ? 'ACTIVE' : 'SELECT'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'SETTINGS' && (
            <div className='max-w-3xl mx-auto'>
              <SettingsPanel
                settings={settings}
                musicVol={audioState.musicVol}
                sfxVol={audioState.sfxVol}
                isMuted={audioState.isMuted}
                onMusicChange={onAudioChange.setMusic}
                onSfxChange={onAudioChange.setSfx}
                onToggleMute={onAudioChange.toggleMute}
                onToggleCRT={() =>
                  updateSettings({ crtEnabled: !settings.crtEnabled })
                }
                onLogLevelChange={level => updateSettings({ logLevel: level })}
                onDeleteSave={deleteSave}
              />
            </div>
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
    tiktok: PropTypes.number
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
  audioState: PropTypes.shape({
    musicVol: PropTypes.number,
    sfxVol: PropTypes.number,
    isMuted: PropTypes.bool
  }).isRequired,
  onAudioChange: PropTypes.shape({
    setMusic: PropTypes.func,
    setSfx: PropTypes.func,
    toggleMute: PropTypes.func
  }).isRequired,
  className: PropTypes.string
}
