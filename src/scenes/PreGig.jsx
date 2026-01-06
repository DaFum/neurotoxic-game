import React from 'react';
import { useGameState } from '../context/GameState';
import { SONGS_DB } from '../data/songs';
import { getGigModifiers } from '../utils/simulationUtils';

export const PreGig = () => {
  const { currentGig, changeScene, setSetlist, setlist, gigModifiers, setGigModifiers, player, updatePlayer, triggerEvent, activeEvent, resolveEvent, setActiveEvent, band, updateBand } = useGameState();
  const currentModifiers = getGigModifiers(band);

  const handleBandMeeting = () => {
      const cost = 50;
      if (player.money < cost) {
          alert("Not enough money for snacks!");
          return;
      }
      if (window.confirm("Hold Band Meeting? (+15 Harmony, -50€)")) {
          updatePlayer({ money: player.money - cost });
          updateBand({ harmony: Math.min(100, band.harmony + 15) });
          alert("Meeting held. Vibes are better.");
      }
  };

  React.useEffect(() => {
      // Chance for a Pre-Gig event (Band or Gig category)
      if (!activeEvent) {
          const bandEvent = triggerEvent('band', 'pre_gig');
          if (!bandEvent) {
              triggerEvent('gig', 'pre_gig');
          }
      }
  }, []);

  const EventModal = () => {
      if (!activeEvent) return null;

      const handleChoice = (choice) => {
          const result = resolveEvent(choice);
          alert(result.outcomeText + (result.description ? `\n\n> ${result.description}` : ''));
          setActiveEvent(null);
      };

      return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg border-4 border-[var(--toxic-green)] bg-black p-6 shadow-[0_0_50px_rgba(0,255,65,0.4)] relative">
                <h2 className="text-3xl font-[Metal_Mania] text-[var(--toxic-green)] mb-4 uppercase animate-pulse">
                    {activeEvent.title}
                </h2>
                <p className="font-mono text-gray-300 mb-8 text-lg leading-relaxed">
                    {activeEvent.text}
                </p>
                
                <div className="space-y-4">
                    {activeEvent.options.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => handleChoice(opt)}
                            className="w-full p-4 border border-[var(--ash-gray)] hover:bg-[var(--toxic-green)] hover:text-black hover:border-transparent transition-all font-bold text-left flex justify-between group"
                        >
                            <span>{opt.label}</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                {opt.skillCheck ? `[${opt.skillCheck.stat.toUpperCase()}]` : '>>>'}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      );
  };

  const toggleSong = (song) => {
    if (setlist.find(s => s.id === song.id)) {
      setSetlist(setlist.filter(s => s.id !== song.id));
    } else {
      if (setlist.length < 3) {
        setSetlist([...setlist, song]);
      }
    }
  };

  const toggleModifier = (key, cost) => {
    const isActive = gigModifiers[key];
    if (!isActive && player.money < cost) {
        alert("Not enough money!");
        return;
    }

    setGigModifiers(prev => ({ ...prev, [key]: !prev[key] }));
    updatePlayer({ money: player.money + (isActive ? cost : -cost) });
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[var(--void-black)] text-white relative">
      <EventModal />
      <h2 className="text-4xl text-[var(--toxic-green)] font-[Metal_Mania] mb-4">PREPARATION</h2>
      <div className="text-xl mb-8 font-mono border-b border-[var(--toxic-green)] pb-2 w-full max-w-2xl text-center">
        VENUE: {currentGig?.name}
      </div>

      <div className="grid grid-cols-2 gap-8 w-full max-w-4xl h-[60vh]">
        
        {/* Actions */}
        <div className="border border-[var(--ash-gray)] p-4 bg-black/50">
          <h3 className="text-xl text-[var(--toxic-green)] mb-4">BUDGET ALLOCATION</h3>
          <div className="flex flex-col gap-4">
            {[
                { key: 'soundcheck', label: 'Soundcheck', cost: 50, desc: 'Notes Easier' },
                { key: 'promo', label: 'Social Promo', cost: 30, desc: '+Crowd Fill' },
                { key: 'merch', label: 'Merch Table', cost: 40, desc: '+Sales' },
                { key: 'energy', label: 'Energy Drinks', cost: 20, desc: '+Stamina' },
                { key: 'guestlist', label: 'Guest List', cost: 60, desc: '+VIP Score' }
            ].map(item => (
                <button 
                    key={item.key}
                    onClick={() => toggleModifier(item.key, item.cost)}
                    className={`flex justify-between items-center p-3 border transition-colors group
                        ${gigModifiers[item.key] 
                            ? 'bg-[var(--toxic-green)] text-black border-[var(--toxic-green)]' 
                            : 'border-[var(--ash-gray)] hover:border-white text-gray-400'
                        }`}
                >
                    <span className="flex flex-col text-left">
                        <span className="font-bold">{item.label}</span>
                        <span className="text-xs">{item.desc}</span>
                    </span>
                    <span className="font-mono group-hover:font-bold">{item.cost}€</span>
                </button>
            ))}
            
            <button 
                onClick={handleBandMeeting}
                className="flex justify-between items-center p-3 border border-[var(--ash-gray)] hover:border-[var(--toxic-green)] hover:text-[var(--toxic-green)] transition-colors group"
            >
                <span className="flex flex-col text-left">
                    <span className="font-bold">Band Meeting</span>
                    <span className="text-xs">Resolve Conflicts (+Harmony)</span>
                </span>
                <span className="font-mono group-hover:font-bold">50€</span>
            </button>
          </div>
          
          {/* Active Modifiers Display */}
          <div className="mt-4 p-3 bg-[var(--toxic-green)]/10 border border-[var(--toxic-green)]">
              <h4 className="text-sm font-bold text-[var(--toxic-green)] mb-2 uppercase">Current Vibe (Modifiers)</h4>
              {currentModifiers.activeEffects.length > 0 ? (
                  <ul className="text-xs space-y-1">
                      {currentModifiers.activeEffects.map((eff, i) => (
                          <li key={i} className="text-gray-300">• {eff}</li>
                      ))}
                  </ul>
              ) : (
                  <div className="text-xs text-gray-500">Neutral Vibe. No active buffs/debuffs.</div>
              )}
          </div>
        </div>

        {/* Setlist */}
        <div className="border border-[var(--ash-gray)] p-4 bg-black/50 flex flex-col">
          <h3 className="text-xl text-[var(--toxic-green)] mb-4">SETLIST ({setlist.length}/3)</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {SONGS_DB.map(song => {
              const isSelected = setlist.find(s => s.id === song.id);
              return (
                <div 
                  key={song.id} 
                  onClick={() => toggleSong(song)}
                  className={`p-3 border cursor-pointer flex justify-between items-center transition-all
                    ${isSelected 
                      ? 'border-[var(--toxic-green)] bg-[var(--toxic-green)]/10 text-[var(--toxic-green)]' 
                      : 'border-[var(--ash-gray)] hover:border-white text-gray-400'
                    }`}
                >
                  <div>
                    <div className="font-bold">{song.name}</div>
                    <div className="text-xs">{song.duration}s | Diff: {song.difficulty}</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex gap-1">
                        {/* Energy Bar */}
                        <div className="text-[10px] text-gray-500 mr-2">NRG</div>
                        <div className="w-16 h-2 bg-gray-800">
                            <div className="h-full bg-red-500" style={{width: `${song.energy.peak}%`}}></div>
                        </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Curve Visualization */}
          <div className="mt-4 h-16 border-t border-gray-700 pt-2 flex items-end justify-between gap-1">
              {setlist.map((s, i) => (
                  <div key={i} className="flex-1 bg-[var(--toxic-green)] opacity-50 hover:opacity-100 transition-opacity relative group" style={{height: `${s.energy.peak}%`}}>
                      <div className="absolute -top-4 left-0 text-[10px] w-full text-center hidden group-hover:block text-white">{s.energy.peak}</div>
                  </div>
              ))}
              {setlist.length === 0 && <div className="text-gray-500 text-xs w-full text-center">Select songs to see energy curve</div>}
          </div>
        </div>

      </div>

      <button 
        className="mt-8 px-12 py-4 bg-[var(--toxic-green)] text-black font-bold text-2xl uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={setlist.length === 0}
        onClick={() => changeScene('GIG')}
      >
        START SHOW
      </button>
    </div>
  );
};
