import React from 'react'
import { UPGRADES_DB } from '../data/upgrades'
import { useGameState } from '../context/GameState'

export const UpgradeMenu = ({ onClose }) => {
  const { player, updatePlayer, band, updateBand, addToast } = useGameState()

    const buyUpgrade = (upgrade) => {
      // The dispatch function would need to be retrieved from useGameState()
      // For now, we'll assume a new function `applyUpgrade` exists in the context
      // which internally dispatches a single action.
    
      if (player.fame >= upgrade.cost) {
        // Instead of multiple state calls, dispatch a single action
        // with the upgrade details. The reducer will handle the logic.
        // This is a conceptual change; assuming an `applyUpgrade` function is added to the context:
        // applyUpgrade(upgrade); 
    
        // For a minimal change without a new reducer action, we can still improve it:
        const playerUpdates = {
          fame: player.fame - upgrade.cost,
          van: { ...player.van, upgrades: [...player.van.upgrades, upgrade.id] }
        };
        const bandUpdates = {};
    
        if (upgrade.effect) {
          const eff = upgrade.effect;
          if (eff.type === 'stat_modifier') {
            if (eff.stat === 'breakdown_chance') {
              playerUpdates.van.breakdownChance = (player.van.breakdownChance || 0.05) + eff.value;
            } else if (eff.stat === 'inventory_slots') {
              bandUpdates.inventorySlots = (band.inventorySlots || 0) + eff.value;
            } else if (eff.stat === 'guitar_difficulty') {
              bandUpdates.performance = { ...band.performance, guitarDifficulty: (band.performance?.guitarDifficulty || 1.0) + eff.value };
            } else if (eff.stat === 'drum_score_multiplier') {
              bandUpdates.performance = { ...band.performance, drumMultiplier: (band.performance?.drumMultiplier || 1.0) + eff.value };
            } else if (eff.stat === 'crowd_decay') {
              bandUpdates.performance = { ...band.performance, crowdDecay: (band.performance?.crowdDecay || 1.0) + eff.value };
            }
          } else if (eff.type === 'start_bonus' && eff.stat === 'fame') {
            playerUpdates.fame += eff.value;
          } else if (eff.type === 'passive') {
            if (eff.effect === 'harmony_regen_travel') {
              bandUpdates.harmonyRegenTravel = true;
            } else if (eff.effect === 'passive_followers') {
              playerUpdates.passiveFollowers = (player.passiveFollowers || 0) + 5;
            }
          }
        }
    
        updatePlayer(playerUpdates);
        if (Object.keys(bandUpdates).length > 0) {
          updateBand(bandUpdates);
        }
    
        addToast(`Purchased ${upgrade.name}!`, 'success');
      } else {
        addToast('Not enough Fame!', 'error');
      }
  }

  return (
    <div className='absolute inset-0 bg-black/95 z-50 flex items-center justify-center p-8'>
      <div className='w-full max-w-4xl border-4 border-[var(--toxic-green)] p-8 overflow-y-auto max-h-[90vh]'>
        <div className='flex justify-between items-center mb-8'>
          <h2 className="text-4xl text-[var(--toxic-green)] font-['Metal_Mania']">BAND HQ (UPGRADES)</h2>
          <button onClick={onClose} className='text-red-500 font-bold border border-red-500 px-4 py-2 hover:bg-red-500 hover:text-black'>CLOSE</button>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {Object.entries(UPGRADES_DB).map(([category, upgrades]) => (
            <div key={category} className='space-y-4'>
              <h3 className='text-2xl text-white uppercase border-b border-gray-700 pb-2'>{category}</h3>
              {upgrades.map(u => {
                const owned = player.van.upgrades.includes(u.id)
                return (
                  <div key={u.id} className={`p-4 border ${owned ? 'border-[var(--toxic-green)] bg-[var(--toxic-green)]/10' : 'border-gray-700'} relative group`}>
                    <div className='font-bold text-lg mb-1'>{u.name}</div>
                    <div className='text-xs text-gray-400 mb-2'>{u.description}</div>
                    <div className='flex justify-between items-center'>
                      <span className='text-[var(--warning-yellow)] font-mono'>{u.cost} Fame</span>
                      <button
                        disabled={owned || player.fame < u.cost}
                        onClick={() => buyUpgrade(u)}
                        className={`px-3 py-1 text-sm font-bold uppercase
                                                  ${owned
? 'bg-gray-800 text-gray-500'
                                                    : player.fame < u.cost
? 'bg-gray-900 text-gray-600'
                                                    : 'bg-[var(--toxic-green)] text-black hover:bg-white'}
                                              `}
                      >
                        {owned ? 'OWNED' : 'BUY'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
