import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { HQ_ITEMS } from '../data/hqItems'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen'

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

  /**
   * Handles the purchase of an item.
   * Checks costs, ownership, and applies effects (inventory, stats, unlocks).
   *
   * @param {object} item - The item object from HQ_ITEMS.
   */
  const handleBuy = item => {
    const effect = item.effect
    const payingWithFame = item.currency === 'fame'

    const startingMoney = player.money ?? 0
    const startingFame = player.fame ?? 0
    const currencyValue = payingWithFame ? startingFame : startingMoney

    const isConsumable = effect.type === 'inventory_add'

    const inventoryKey =
      effect.type === 'inventory_set' || effect.type === 'inventory_add'
        ? effect.item
        : null
    const isOwned =
      (player.van?.upgrades ?? []).includes(item.id) ||
      (player.hqUpgrades ?? []).includes(item.id) ||
      (effect.type === 'inventory_set'
        ? band.inventory?.[inventoryKey] === true
        : false)

    if (isOwned && !isConsumable) {
      addToast('Bereits im Besitz!', 'warning')
      return
    }

    if (currencyValue < item.cost) {
      addToast(`Nicht genug ${payingWithFame ? 'Fame' : 'Geld'}!`, 'error')
      return
    }

    const nextPlayerPatch = payingWithFame
      ? { fame: Math.max(0, startingFame - item.cost) }
      : { money: Math.max(0, startingMoney - item.cost) }

    let nextBandPatch = null

    switch (effect.type) {
      case 'inventory_set':
        nextBandPatch = {
          inventory: { ...(band.inventory ?? {}), [effect.item]: effect.value }
        }
        break

      case 'inventory_add':
        nextBandPatch = {
          inventory: {
            ...(band.inventory ?? {}),
            [effect.item]:
              ((band.inventory ?? {})[effect.item] || 0) + effect.value
          }
        }
        break

      case 'stat_modifier': {
        const val = effect.value
        if (effect.target === 'van') {
          nextPlayerPatch.van = {
            ...(player.van ?? {}),
            [effect.stat]: Math.max(
              0,
              ((player.van ?? {})[effect.stat] || 0) + val
            )
          }
        } else if (effect.target === 'player') {
          nextPlayerPatch[effect.stat] = Math.max(
            0,
            (player[effect.stat] || 0) + val
          )
        } else if (effect.target === 'band') {
          nextBandPatch = {
            [effect.stat]: Math.max(0, (band[effect.stat] || 0) + val)
          }
        } else {
          nextBandPatch = {
            performance: {
              ...(band.performance ?? {}),
              [effect.stat]: Math.max(
                0,
                ((band.performance ?? {})[effect.stat] || 0) + val
              )
            }
          }
        }
        break
      }

      case 'unlock_upgrade':
        nextPlayerPatch.van = {
          ...(player.van ?? {}),
          upgrades: [
            ...(player.van?.upgrades ?? []),
            effect.id ? effect.id : item.id
          ]
        }
        break

      case 'unlock_hq': {
        nextPlayerPatch.hqUpgrades = [...(player.hqUpgrades ?? []), item.id]

        if (item.id === 'hq_room_poster_wall') {
          nextPlayerPatch.fame = Math.max(
            0,
            (nextPlayerPatch.fame ?? startingFame) + 10
          )
          addToast('Sieht cool aus. Fame +10', 'success')
        }

        if (item.id === 'hq_room_diy_soundproofing') {
          nextBandPatch = { harmony: Math.min(100, (band.harmony ?? 0) + 5) }
          addToast('Weniger Lärm, mehr Frieden. Harmony +5', 'success')
        }

        if (
          item.id === 'hq_room_coffee' ||
          item.id === 'hq_room_sofa' ||
          item.id === 'hq_room_old_couch' ||
          item.id === 'hq_room_cheap_beer_fridge'
        ) {
          const members = (band.members ?? []).map(m => {
            if (item.id === 'hq_room_coffee')
              return { ...m, mood: Math.min(100, (m.mood ?? 0) + 20) }
            if (item.id === 'hq_room_sofa')
              return { ...m, stamina: Math.min(100, (m.stamina ?? 0) + 30) }
            if (item.id === 'hq_room_old_couch')
              return { ...m, stamina: Math.min(100, (m.stamina ?? 0) + 10) }
            return { ...m, mood: Math.min(100, (m.mood ?? 0) + 5) } // cheap beer fridge
          })
          nextBandPatch = { ...(nextBandPatch ?? {}), members }
        }
        break
      }

      default:
        console.warn('Unknown effect type:', effect.type)
    }

    updatePlayer(nextPlayerPatch)
    if (nextBandPatch) updateBand(nextBandPatch)
    addToast(`${item.name} gekauft!`, 'success')
  }

  const renderItem = item => {
    const isOwned =
      (player.van?.upgrades ?? []).includes(item.id) ||
      (player.hqUpgrades ?? []).includes(item.id) ||
      band.inventory[item.id] === true

    const isConsumable = item.effect.type === 'inventory_add'
    const disabled =
      (isOwned && !isConsumable) ||
      (item.currency === 'fame'
        ? player.fame < item.cost
        : player.money < item.cost)

    return (
      <div
        key={item.id}
        className={`p-4 border-2 relative flex flex-col justify-between transition-colors
          ${
            isOwned && !isConsumable
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
                isOwned && !isConsumable
                  ? 'border-[var(--ash-gray)] text-[var(--ash-gray)] cursor-default'
                  : disabled
                    ? 'border-gray-800 text-gray-700 bg-gray-900 cursor-not-allowed'
                    : 'border-[var(--toxic-green)] bg-[var(--toxic-green)] text-black hover:invert shadow-[4px_4px_0px_var(--void-black)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
              }`}
          >
            {isOwned && !isConsumable ? 'BESITZ' : 'KAUFEN'}
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
              BANDHAUPTQUARTIER
            </h2>
            <p className='text-[var(--ash-gray)] text-sm font-mono uppercase tracking-widest'>
              Stendal Proberaum | Day {player.day}
            </p>
          </div>
          <button
            onClick={onClose}
            className='px-6 py-2 border-2 border-[var(--blood-red)] text-[var(--blood-red)] font-bold hover:bg-[var(--blood-red)] hover:text-black transition-colors duration-200 uppercase font-mono'
          >
            VERLASSEN [ESC]
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
                    KARRIERE STATUS
                  </h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <StatBox
                      label='Guthaben'
                      value={`${player.money}€`}
                      icon='€'
                    />
                    <StatBox label='Fame' value={player.fame} icon='★' />
                    <StatBox label='Tag' value={player.day} icon='📅' />
                    <StatBox
                      label='Follower'
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
                      label='Tank'
                      value={player.van?.fuel}
                      max={100}
                      color='bg-yellow-500' // Keep standard utility classes for internal bars or map to vars if needed
                    />
                    <ProgressBar
                      label='Zustand'
                      value={player.van?.condition}
                      max={100}
                      color='bg-blue-500'
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
                  {band.members.map((m, i) => (
                    <div key={i} className='flex items-center gap-4'>
                      <div className='w-20 font-bold text-white font-mono'>
                        {m.name}
                      </div>
                      <div className='flex-1 space-y-1'>
                        <ProgressBar
                          label='Stamina'
                          value={m.stamina}
                          max={100}
                          color='bg-green-600'
                          size='sm'
                        />
                        <ProgressBar
                          label='Mood'
                          value={m.mood}
                          max={100}
                          color='bg-pink-600'
                          size='sm'
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className='mt-6 pt-4 border-t border-[var(--ash-gray)]'>
                  <div className='flex justify-between items-center mb-2'>
                    <span className='text-[var(--ash-gray)] font-mono text-sm'>
                      Inventar Slots:
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
                GUTHABEN:{' '}
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

// Helper Components
const StatBox = ({ label, value, icon }) => (
  <div className='bg-[var(--void-black)] p-3 flex flex-col items-center justify-center border border-[var(--ash-gray)]'>
    <div className='text-2xl mb-1 text-[var(--toxic-green)]'>{icon}</div>
    <div className='text-xl font-bold text-white font-mono'>{value}</div>
    <div className='text-xs text-[var(--ash-gray)] uppercase font-mono'>
      {label}
    </div>
  </div>
)

StatBox.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.string.isRequired
}

const ProgressBar = ({ label, value = 0, max, color, size = 'md' }) => {
  const safeMax = max > 0 ? max : 1
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0
  const pct = Math.min(100, (safeValue / safeMax) * 100)

  return (
    <div className='w-full'>
      <div className='flex justify-between text-xs mb-1 font-mono'>
        <span className='text-[var(--ash-gray)]'>{label}</span>
        <span className='text-gray-300'>
          {Math.round(safeValue)}/{max}
        </span>
      </div>
      <div
        className={`w-full bg-[var(--void-black)] border border-[var(--ash-gray)] ${size === 'sm' ? 'h-3' : 'h-5'}`}
      >
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

ProgressBar.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number,
  max: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  size: PropTypes.string
}
