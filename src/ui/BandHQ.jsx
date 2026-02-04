import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { HQ_ITEMS } from '../data/hqItems'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen'
import { usePurchaseLogic } from '../hooks/usePurchaseLogic'
import { StatBox, ProgressBar } from '../ui/shared'

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
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('STATS') // STATS, SHOP, UPGRADES

  const { handleBuy, isItemOwned, isItemDisabled } = usePurchaseLogic({
    player,
    band,
    updatePlayer,
    updateBand,
    addToast
  })

  const renderItem = item => {
    const owned = isItemOwned(item)
    const disabled = isItemDisabled(item)
    const isConsumable = item.effect.type === 'inventory_add'

    return (
      <div
        key={item.id}
        className={`p-4 border-2 relative flex flex-col justify-between transition-colors
          ${
            owned && !isConsumable
              ? 'border-[var(--toxic-green)] bg-[var(--toxic-green)]/10'
              : 'border-[var(--ash-gray)] bg-[var(--void-black)]/80'
          }`}
      >
        <div>
          <div className='flex items-center gap-2 mb-2'>
            <img
              src={getGenImageUrl(IMG_PROMPTS[item.img] || item.name)}
              alt={item.name}
              className='w-12 h-12 object-contain bg-black rounded border border-[var(--ash-gray)]'
            />
            <h4 className='font-bold text-[var(--toxic-green)] leading-tight font-mono uppercase'>
              {item.name}
            </h4>
          </div>
          <p className='text-xs text-[var(--ash-gray)] mb-2 font-mono'>
            {item.description}
          </p>
        </div>
        <div className='flex justify-between items-center mt-2'>
          <span
            className={`font-mono text-sm font-bold ${
              item.currency === 'fame'
                ? 'text-[var(--warning-yellow)]'
                : 'text-white'
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
                  ? 'border-[var(--ash-gray)] text-[var(--ash-gray)] cursor-default'
                  : disabled
                    ? 'border-gray-800 text-gray-700 bg-gray-900 cursor-not-allowed'
                    : 'border-[var(--toxic-green)] bg-[var(--toxic-green)] text-black hover:invert shadow-[4px_4px_0px_var(--void-black)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
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
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm ${className}`}
    >
      <div
        className='absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none'
        style={{
          backgroundImage: `url("${getGenImageUrl(IMG_PROMPTS.BAND_HQ_BG)}")`
        }}
      />

      <div className='relative w-full max-w-5xl h-[90vh] border-4 border-[var(--toxic-green)] bg-[var(--void-black)] flex flex-col shadow-[0_0_50px_var(--toxic-green)]'>
        {/* Header */}
        <div className='flex justify-between items-center p-6 border-b-2 border-[var(--toxic-green)] bg-black/50'>
          <div>
            <h2 className="text-4xl text-[var(--toxic-green)] font-['Metal_Mania'] drop-shadow-[0_0_5px_var(--toxic-green)]">
              BAND HQ
            </h2>
            <p className='text-[var(--ash-gray)] text-sm font-mono uppercase tracking-widest'>
              Stendal Rehearsal Room | Day {player.day}
            </p>
          </div>
          <button
            onClick={onClose}
            className='px-6 py-2 border-2 border-[var(--blood-red)] text-[var(--blood-red)] font-bold hover:bg-[var(--blood-red)] hover:text-black transition-colors duration-200 uppercase font-mono'
          >
            LEAVE [ESC]
          </button>
        </div>

        {/* Navigation */}
        <div className='flex border-b-2 border-[var(--ash-gray)]'>
          {['STATS', 'SHOP', 'UPGRADES'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-center font-bold text-xl uppercase tracking-wider transition-colors duration-150 font-mono
                ${
                  activeTab === tab
                    ? 'bg-[var(--toxic-green)] text-black'
                    : 'text-[var(--ash-gray)] hover:text-white bg-black/50 hover:bg-black/70'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className='flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[var(--toxic-green)] scrollbar-track-black'>
          {activeTab === 'STATS' && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              {/* Financials & Fame */}
              <div className='space-y-6'>
                <div className='bg-black/40 border-2 border-[var(--ash-gray)] p-4'>
                  <h3 className='text-[var(--toxic-green)] text-lg font-bold mb-4 border-b border-[var(--ash-gray)] pb-2 font-mono'>
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

                <div className='bg-black/40 border-2 border-[var(--ash-gray)] p-4'>
                  <h3 className='text-[var(--toxic-green)] text-lg font-bold mb-4 border-b border-[var(--ash-gray)] pb-2 font-mono'>
                    VAN STATUS
                  </h3>
                  <div className='space-y-2'>
                    <ProgressBar
                      label='Fuel'
                      value={player.van?.fuel}
                      max={100}
                      color='bg-[var(--fuel-yellow)]'
                    />
                    <ProgressBar
                      label='Condition'
                      value={player.van?.condition}
                      max={100}
                      color='bg-[var(--condition-blue)]'
                    />
                    <div className='mt-2 text-xs text-[var(--ash-gray)] font-mono'>
                      Breakdown Chance:{' '}
                      {((player.van?.breakdownChance ?? 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Band Members */}
              <div className='bg-black/40 border-2 border-[var(--ash-gray)] p-4'>
                <h3 className='text-[var(--toxic-green)] text-lg font-bold mb-4 border-b border-[var(--ash-gray)] pb-2 font-mono'>
                  BAND STATUS
                </h3>
                <div className='space-y-6'>
                  {(band.members || []).map(m => (
                    <div key={m.name} className='flex items-center gap-4'>
                      <div className='w-20 font-bold text-white font-mono'>
                        {m.name}
                      </div>
                      <div className='flex-1 space-y-1'>
                        <ProgressBar
                          label='Stamina'
                          value={m.stamina}
                          max={100}
                          color='bg-[var(--stamina-green)]'
                          size='sm'
                        />
                        <ProgressBar
                          label='Mood'
                          value={m.mood}
                          max={100}
                          color='bg-[var(--mood-pink)]'
                          size='sm'
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className='mt-6 pt-4 border-t border-[var(--ash-gray)]'>
                  <div className='flex justify-between items-center mb-2'>
                    <span className='text-[var(--ash-gray)] font-mono text-sm'>
                      Inventory Slots:
                    </span>
                    <span className='text-white font-mono'>
                      {band.inventorySlots}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-[var(--ash-gray)] font-mono text-sm'>
                      Harmony:
                    </span>
                    <span className='text-[var(--toxic-green)] font-mono'>
                      {band.harmony}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SHOP' && (
            <div>
              <div className='mb-4 text-right font-mono text-white'>
                FUNDS:{' '}
                <span className='text-[var(--toxic-green)]'>
                  {player.money}€
                </span>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {[...HQ_ITEMS.gear, ...HQ_ITEMS.instruments].map(renderItem)}
              </div>
            </div>
          )}

          {activeTab === 'UPGRADES' && (
            <div>
              <div className='mb-4 text-right font-mono text-white'>
                FAME:{' '}
                <span className='text-[var(--warning-yellow)]'>
                  {player.fame}★
                </span>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {[...HQ_ITEMS.van, ...HQ_ITEMS.hq].map(renderItem)}
              </div>
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
  className: PropTypes.string
}
