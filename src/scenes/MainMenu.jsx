import React from 'react';
import { useGameState } from '../context/GameState';
import { motion } from 'framer-motion';
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen';
import { UPGRADES_DB } from '../data/upgrades'; 
import { GlitchButton } from '../ui/GlitchButton';
import { audioManager } from '../utils/AudioManager';

export const MainMenu = () => {
  const { changeScene, loadGame, player, updatePlayer } = useGameState();
  const [showUpgrades, setShowUpgrades] = React.useState(false);

  React.useEffect(() => {
      audioManager.startAmbient();
  }, []);

  const handleLoad = () => {
    if (loadGame()) {
        changeScene('OVERWORLD');
    } else {
        alert("No save game found!");
    }
  };

  const UpgradeMenu = () => {
      if (!showUpgrades) return null;
      
      const buyUpgrade = (upgrade) => {
          if (player.fame >= upgrade.cost) {
              if (window.confirm(`Buy ${upgrade.name} for ${upgrade.cost} Fame?`)) {
                  updatePlayer({ 
                      fame: player.fame - upgrade.cost,
                      van: { ...player.van, upgrades: [...player.van.upgrades, upgrade.id] } 
                  });
              }
          } else {
              alert("Not enough Fame!");
          }
      };

      return (
        <div className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center p-8">
            <div className="w-full max-w-4xl border-4 border-[var(--toxic-green)] p-8 overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-4xl text-[var(--toxic-green)] font-[Metal_Mania]">BAND HQ (UPGRADES)</h2>
                    <button onClick={() => setShowUpgrades(false)} className="text-red-500 font-bold border border-red-500 px-4 py-2 hover:bg-red-500 hover:text-black">CLOSE</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(UPGRADES_DB).map(([category, upgrades]) => (
                        <div key={category} className="space-y-4">
                            <h3 className="text-2xl text-white uppercase border-b border-gray-700 pb-2">{category}</h3>
                            {upgrades.map(u => {
                                const owned = player.van.upgrades.includes(u.id);
                                return (
                                    <div key={u.id} className={`p-4 border ${owned ? 'border-[var(--toxic-green)] bg-[var(--toxic-green)]/10' : 'border-gray-700'} relative group`}>
                                        <div className="font-bold text-lg mb-1">{u.name}</div>
                                        <div className="text-xs text-gray-400 mb-2">{u.description}</div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[var(--warning-yellow)] font-mono">{u.cost} Fame</span>
                                            <button 
                                                disabled={owned || player.fame < u.cost}
                                                onClick={() => buyUpgrade(u)}
                                                className={`px-3 py-1 text-sm font-bold uppercase
                                                    ${owned ? 'bg-gray-800 text-gray-500' : 
                                                      player.fame < u.cost ? 'bg-gray-900 text-gray-600' :
                                                      'bg-[var(--toxic-green)] text-black hover:bg-white'}
                                                `}
                                            >
                                                {owned ? "OWNED" : "BUY"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-black z-50 relative overflow-hidden">
      {/* Dynamic Background */}
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url("${getGenImageUrl(IMG_PROMPTS.MAIN_MENU_BG)}")` }}
      ></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/0 to-black/90 pointer-events-none"></div>

      <UpgradeMenu />
      
      <div className="relative z-10 flex flex-col items-center">
        <motion.h1 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: "mirror" }}
            className="text-6xl md:text-9xl text-center text-transparent bg-clip-text bg-gradient-to-b from-[var(--toxic-green)] to-[var(--void-black)] font-[Metal_Mania] glitch-text mb-8"
            style={{ WebkitTextStroke: '2px var(--toxic-green)' }}
        >
            NEUROTOXIC
        </motion.h1>
        <h2 className="text-2xl text-[var(--toxic-green)] mb-12 font-[Courier_New] tracking-widest uppercase text-center">
            Grind The Void v3.0
        </h2>

        <div className="flex flex-col gap-4">
            <GlitchButton
                onClick={() => changeScene('OVERWORLD')}
                className="relative z-20"
            >
                Start Tour
            </GlitchButton>
            
            <GlitchButton
                onClick={handleLoad}
                className="relative z-20 border-[var(--blood-red)] text-[var(--blood-red)] hover:bg-[var(--blood-red)] hover:shadow-[4px_4px_0px_var(--toxic-green)]"
            >
                Load Game
            </GlitchButton>

            <GlitchButton
                onClick={() => setShowUpgrades(true)}
                className="relative z-20 border-[var(--warning-yellow)] text-[var(--warning-yellow)] hover:bg-[var(--warning-yellow)] hover:shadow-[4px_4px_0px_var(--toxic-green)]"
            >
                Band HQ
            </GlitchButton>
        </div>
        
        <div className="flex gap-4 mt-8">
             <button onClick={() => changeScene('SETTINGS')} className="text-gray-500 hover:text-[var(--toxic-green)] text-sm">SETTINGS</button>
             <button onClick={() => changeScene('CREDITS')} className="text-gray-500 hover:text-[var(--toxic-green)] text-sm">CREDITS</button>
        </div>

      </div>
      
      <div className="absolute bottom-8 text-[var(--ash-gray)] text-xs font-mono z-10">
        © 2026 NEUROTOXIC // DEATH GRINDCORE FROM STENDAL
      </div>
    </div>
  );
};
