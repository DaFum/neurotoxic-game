import React, { useState } from 'react'
import { useGameState } from '../context/GameState'
import { HQ_ITEMS } from '../data/hqItems'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen'

export const BandHQ = ({ onClose }) => {
  const { player, band, social, updatePlayer, updateBand, addToast } =
    useGameState()

  const [activeTab, setActiveTab] = useState('STATS') // STATS, SHOP, UPGRADES

  const handleBuy = item => {
    // 1. Cost Check
    const currencyValue = item.currency === 'fame' ? player.fame : player.money

    // Check if already owned (for unique items)
    const isOwned =
      player.van.upgrades.includes(item.id) ||
      player.hqUpgrades?.includes(item.id) ||
      band.inventory[item.id] === true // Unique inventory items like cables

    // Consumables (inventory_add) can be bought multiple times
    const isConsumable = item.effect.type === 'inventory_add'

    if (isOwned && !isConsumable) {
      addToast('Bereits im Besitz!', 'warning')
      return
    }

    if (currencyValue < item.cost) {
      addToast(
        `Nicht genug ${item.currency === 'fame' ? 'Fame' : 'Geld'}!`,
        'error'
      )
      return
    }

    // 2. Deduct Cost
    if (item.currency === 'fame') {
      updatePlayer({ fame: player.fame - item.cost })
    } else {
      updatePlayer({ money: player.money - item.cost })
    }

    // 3. Apply Effect
    const effect = item.effect

    switch (effect.type) {
      case 'inventory_set':
        updateBand({
          inventory: {
            ...band.inventory,
            [effect.item]: effect.value
          }
        })
        break

      case 'inventory_add':
        updateBand({
          inventory: {
            ...band.inventory,
            [effect.item]: (band.inventory[effect.item] || 0) + effect.value
          }
        })
        break

      case 'stat_modifier': {
        const val = effect.value
        // Target resolution
        if (effect.target === 'van') {
          updatePlayer({
            van: {
              ...player.van,
              [effect.stat]: (player.van[effect.stat] || 0) + val
            }
          })
        } else if (effect.target === 'player') {
          updatePlayer({
            [effect.stat]: (player[effect.stat] || 0) + val
          })
        } else if (effect.target === 'band') {
          updateBand({
            [effect.stat]: (band[effect.stat] || 0) + val
          })
        } else {
          // Default: Performance Stats (Band)
          updateBand({
            performance: {
              ...band.performance,
              [effect.stat]: (band.performance[effect.stat] || 0) + val
            }
          })
        }
        break
      }

      case 'unlock_upgrade':
        updatePlayer({
          van: {
            ...player.van,
            upgrades: [...player.van.upgrades, effect.id]
          }
        })
        break

      case 'unlock_hq':
        updatePlayer({
          hqUpgrades: [...(player.hqUpgrades || []), effect.id]
        })
        // Apply immediate effects if any (e.g. coffee)
        if (item.id === 'hq_coffee') {
          const newMembers = band.members.map(m => ({
            ...m,
            mood: Math.min(100, m.mood + 20)
          }))
          updateBand({ members: newMembers })
          addToast('Kaffee getrunken! Mood +20', 'success')
        }
        if (item.id === 'hq_sofa') {
          const newMembers = band.members.map(m => ({
            ...m,
            stamina: Math.min(100, m.stamina + 30)
          }))
          updateBand({ members: newMembers })
          addToast('Ausgeruht! Stamina +30', 'success')
        }
        if (item.id === 'hq_old_couch') {
          const newMembers = band.members.map(m => ({
            ...m,
            stamina: Math.min(100, m.stamina + 10)
          }))
          updateBand({ members: newMembers })
          addToast('Abgehangen. Stamina +10', 'success')
        }
        if (item.id === 'hq_poster_wall') {
          updatePlayer({ fame: player.fame + 10 })
          addToast('Sieht cool aus. Fame +10', 'success')
        }
        if (item.id === 'hq_cheap_beer_fridge') {
          const newMembers = band.members.map(m => ({
            ...m,
            mood: Math.min(100, m.mood + 5)
          }))
          updateBand({ members: newMembers })
          addToast('Prost! Mood +5', 'success')
        }
        if (item.id === 'hq_diy_soundproofing') {
          updateBand({ harmony: Math.min(100, band.harmony + 5) })
          addToast('Weniger Lärm, mehr Frieden. Harmony +5', 'success')
        }
        break

      default:
        console.warn('Unknown effect type:', effect.type)
    }

    addToast(`${item.name} gekauft!`, 'success')
  }

  const renderItem = item => {
    const isOwned =
      player.van.upgrades.includes(item.id) ||
      player.hqUpgrades?.includes(item.id) ||
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
        className={`p-4 border ${isOwned && !isConsumable ? 'border-[var(--toxic-green)] bg-[var(--toxic-green)]/10' : 'border-gray-700 bg-black/60'} relative flex flex-col justify-between`}
      >
        <div>
          <h4 className='font-bold text-[var(--toxic-green)] mb-1'>
            {item.name}
          </h4>
          <p className='text-xs text-gray-400 mb-2'>{item.description}</p>
        </div>
        <div className='flex justify-between items-center mt-2'>
          <span
            className={`font-mono text-sm ${item.currency === 'fame' ? 'text-yellow-400' : 'text-white'}`}
          >
            {item.cost} {item.currency === 'fame' ? '★' : '€'}
          </span>
          <button
            onClick={() => handleBuy(item)}
            disabled={disabled}
            className={`px-3 py-1 text-xs font-bold uppercase transition-colors
              ${
                isOwned && !isConsumable
                  ? 'bg-gray-800 text-gray-500 cursor-default'
                  : disabled
                    ? 'bg-gray-900 text-gray-700 cursor-not-allowed'
                    : 'bg-[var(--toxic-green)] text-black hover:bg-white hover:text-black'
              }`}
          >
            {isOwned && !isConsumable ? 'BESITZ' : 'KAUFEN'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm'>
      <div
        className='absolute inset-0 bg-cover bg-center opacity-20'
        style={{
          backgroundImage: `url("${getGenImageUrl(IMG_PROMPTS.BAND_HQ_BG)}")`
        }}
      />

      <div className='relative w-full max-w-5xl h-[90vh] border-4 border-[var(--toxic-green)] bg-black/80 flex flex-col shadow-[0_0_50px_var(--toxic-green)]'>
        {/* Header */}
        <div className='flex justify-between items-center p-6 border-b border-[var(--toxic-green)] bg-black/50'>
          <div>
            <h2 className="text-4xl text-[var(--toxic-green)] font-['Metal_Mania'] drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]">
              BANDHAUPTQUARTIER
            </h2>
            <p className='text-gray-400 text-sm font-mono uppercase tracking-widest'>
              Stendal Proberaum | Day {player.day}
            </p>
          </div>
          <button
            onClick={onClose}
            className='px-6 py-2 border border-[var(--blood-red)] text-[var(--blood-red)] font-bold hover:bg-[var(--blood-red)] hover:text-black transition-colors'
          >
            VERLASSEN [ESC]
          </button>
        </div>

        {/* Navigation */}
        <div className='flex border-b border-gray-700'>
          {['STATS', 'SHOP', 'UPGRADES'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-center font-bold text-xl uppercase tracking-wider transition-colors
                ${
                  activeTab === tab
                    ? 'bg-[var(--toxic-green)] text-black'
                    : 'text-gray-500 hover:text-white bg-black/50'
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
                <div className='bg-black/40 border border-gray-700 p-4'>
                  <h3 className='text-[var(--toxic-green)] text-lg font-bold mb-4 border-b border-gray-800 pb-2'>
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

                <div className='bg-black/40 border border-gray-700 p-4'>
                  <h3 className='text-[var(--toxic-green)] text-lg font-bold mb-4 border-b border-gray-800 pb-2'>
                    VAN STATUS
                  </h3>
                  <div className='space-y-2'>
                    <ProgressBar
                      label='Tank'
                      value={player.van.fuel}
                      max={100}
                      color='bg-yellow-500'
                    />
                    <ProgressBar
                      label='Zustand'
                      value={player.van.condition}
                      max={100}
                      color='bg-blue-500'
                    />
                    <div className='mt-2 text-xs text-gray-400'>
                      Breakdown Chance:{' '}
                      {(player.van.breakdownChance * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Band Members */}
              <div className='bg-black/40 border border-gray-700 p-4'>
                <h3 className='text-[var(--toxic-green)] text-lg font-bold mb-4 border-b border-gray-800 pb-2'>
                  BAND STATUS
                </h3>
                <div className='space-y-6'>
                  {band.members.map((m, i) => (
                    <div key={i} className='flex items-center gap-4'>
                      <div className='w-20 font-bold text-white'>{m.name}</div>
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
                <div className='mt-6 pt-4 border-t border-gray-800'>
                  <div className='flex justify-between items-center mb-2'>
                    <span className='text-gray-400'>Inventar Slots:</span>
                    <span className='text-white font-mono'>
                      {band.inventorySlots}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-400'>Harmony:</span>
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
                FAME: <span className='text-yellow-400'>{player.fame}★</span>
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

// Helper Components
const StatBox = ({ label, value, icon }) => (
  <div className='bg-gray-900 p-3 flex flex-col items-center justify-center border border-gray-800'>
    <div className='text-2xl mb-1'>{icon}</div>
    <div className='text-xl font-bold text-white font-mono'>{value}</div>
    <div className='text-xs text-gray-500 uppercase'>{label}</div>
  </div>
)

const ProgressBar = ({ label, value, max, color, size = 'md' }) => (
  <div className='w-full'>
    <div className='flex justify-between text-xs mb-1'>
      <span className='text-gray-400'>{label}</span>
      <span className='text-gray-300'>
        {Math.round(value)}/{max}
      </span>
    </div>
    <div className={`w-full bg-gray-900 ${size === 'sm' ? 'h-2' : 'h-4'}`}>
      <div
        className={`h-full ${color} transition-all duration-500`}
        style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
      />
    </div>
  </div>
)
