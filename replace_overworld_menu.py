import sys

with open("src/ui/overworld/OverworldMenu.tsx", "r") as f:
    content = f.read()

new_menu = """import React, { useState } from 'react'
import { GAME_PHASES } from '../../context/gameConstants'
import { EXPENSE_CONSTANTS } from '../../utils/economyEngine'

const MENU_CATS = [
  { id: 'management', label: 'MANAGEMENT', icon: '📋', color: 'var(--green)', items: [
    { label: 'BAND HQ', desc: 'Manage members & gear', icon: '🤘', v: 'p', action: 'openHQ' },
    { label: 'QUESTS',  desc: 'Active objectives', icon: '★', v: 'w', action: 'openQuests' },
    { label: 'STASH',   desc: 'Contraband & inventory', icon: '📦', v: 'd', action: 'openStash' },
  ]},
  { id: 'hustles', label: 'SIDE HUSTLES', icon: '💰', color: 'var(--yellow)', items: [
    { label: 'PIRATE RADIO', desc: 'Boost reputation', icon: '📻', v: 'w', action: 'openPirateRadio' },
    { label: 'MERCH PRESS',  desc: 'Print bootlegs', icon: '👕', v: 'p', action: 'openMerchPress' },
    { label: 'DARK WEB',     desc: 'Leak new tracks', icon: '🕸', v: 'd', action: 'openDarkWebLeak' },
  ]},
  { id: 'logistics', label: 'LOGISTICS', icon: '🚐', color: 'var(--blue)', items: [
    { label: 'REFUEL', desc: 'Gas up the van', icon: '⛽', v: 'w', cond: 'fuel', action: 'handleRefuel' },
    { label: 'REPAIR', desc: 'Fix van damage', icon: '🔧', v: 'p', cond: 'repair', action: 'handleRepair' },
    { label: 'VOID CLINIC', desc: 'Heal members', icon: '🏥', v: 'd', action: 'openBloodBank' },
  ]},
  { id: 'system', label: 'SYSTEM', icon: '⚙', color: 'var(--ash)', items: [
    { label: 'SAVE GAME', desc: 'Record progress', icon: '💾', v: 'p', action: 'handleSaveWithDelay' },
  ]}
];

export const OverworldMenu = React.memo(
  ({
    t,
    isMenuOpen,
    setIsMenuOpen,
    isTraveling,
    vanFuel,
    vanCondition,
    isSaving,
    openStash,
    openQuests,
    openPirateRadio,
    openMerchPress,
    openBloodBank,
    openDarkWebLeak,
    openHQ,
    handleRefuel,
    handleRepair,
    handleSaveWithDelay,
    changeScene
  }: any) => {

  const [activeCat, setActiveCat] = useState<string | null>(null);

  const isDisabled = (item: any) => {
    if (isTraveling) return true;
    if (item.cond === 'fuel'   && vanFuel >= EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL) return true;
    if (item.cond === 'repair' && vanCondition >= 100)  return true;
    if (item.action === 'handleSaveWithDelay' && isSaving) return true;
    return false;
  };

  const actions: Record<string, () => void> = {
    openHQ, openQuests, openStash, openPirateRadio, openMerchPress, openDarkWebLeak, openBloodBank: () => changeScene(GAME_PHASES.CLINIC), handleRefuel, handleRepair, handleSaveWithDelay
  };

  const handleClose = () => { setIsMenuOpen(false); setActiveCat(null); };
  const handleBack  = () => setActiveCat(null);

  const cat = MENU_CATS.find(c => c.id === activeCat);

  return (
    <div className="ow-menu absolute bottom-8 right-8 z-50 pointer-events-auto flex flex-col gap-2 items-end">
      {isMenuOpen && (
        <div className="menu-panel bg-[rgba(8,8,7,0.98)] border-2 border-toxic-green shadow-[0_0_30px_rgba(0,255,65,0.18),-4px_0_20px_rgba(0,0,0,0.6)] w-[300px] mb-1.5 overflow-hidden">
          {/* Header */}
          <div className="menu-panel-hdr flex items-center justify-between px-3.5 py-2.5 border-b border-toxic-green/20 bg-toxic-green/5">
            <div className="menu-panel-title font-[Metal_Mania] text-[15px] text-toxic-green tracking-[2px] drop-shadow-[0_0_8px_var(--color-toxic-green)] flex items-center gap-2">
              {cat ? (
                <>
                  <span style={{color:cat.color}}>{cat.icon}</span>
                  {cat.label}
                  <span className="menu-panel-title-sub text-[8px] text-ash-gray tracking-[3px] font-mono drop-shadow-none ml-2">{cat.items.length} OPTIONS</span>
                </>
              ) : (
                <>◈ ACTIONS</>
              )}
            </div>
          </div>

          {/* Category list */}
          {!activeCat && (
            <div className="menu-cat-list flex flex-col">
              {MENU_CATS.map(c => (
                <button
                  key={c.id}
                  className="menu-cat-btn flex items-center justify-between px-3.5 py-2.5 border-none bg-transparent cursor-pointer transition-colors border-b border-ash-gray/15 w-full hover:bg-toxic-green/5 disabled:opacity-35 disabled:cursor-not-allowed last:border-b-0"
                  disabled={isTraveling}
                  onClick={() => setActiveCat(c.id)}
                >
                  <div className="menu-cat-left flex items-center gap-2.5">
                    <span className="menu-cat-icon text-[16px] w-5 text-center" style={{color:c.color}}>{c.icon}</span>
                    <span className="menu-cat-label font-[Metal_Mania] text-[14px] tracking-[1px]" style={{color:c.color}}>{c.label}</span>
                  </div>
                  <div className="menu-cat-right flex items-center gap-2">
                    <span className="menu-cat-count text-[8px] text-ash-gray font-mono tracking-[1px]">{c.items.length} options</span>
                    <span className="menu-cat-arrow text-[11px] opacity-60" style={{color:c.color}}>›</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Submenu */}
          {activeCat && cat && (
            <div className="menu-sub flex flex-col">
              <button className="menu-back-btn flex items-center gap-2 px-3.5 py-2 bg-ash-gray/10 border-none border-b border-ash-gray/20 cursor-pointer text-ash-gray font-mono text-[10px] tracking-[2px] uppercase transition-all w-full hover:text-toxic-green hover:bg-toxic-green/5" onClick={handleBack}>
                ‹ &nbsp;BACK TO ACTIONS
              </button>
              <div className="menu-sub-items flex flex-col p-1.5">
                {cat.items.map(item => (
                  <button
                    key={item.label}
                    className={`menu-sub-item flex items-center justify-between px-2.5 py-2 mb-1 border border-transparent cursor-pointer transition-all bg-transparent last:mb-0 hover:not-disabled:-translate-x-[2px] disabled:opacity-35 disabled:cursor-not-allowed v-${item.v}`}
                    disabled={isDisabled(item)}
                    onClick={() => { actions[item.action]?.(); handleClose(); }}
                  >
                    <div className="menu-sub-item-left flex items-center gap-2.5">
                      <span className="menu-sub-icon text-[14px] w-[18px] text-center">{item.icon}</span>
                      <div className="text-left">
                        <div className="menu-sub-label font-[Metal_Mania] text-[13px] tracking-[1px]">[{item.label}]</div>
                        <div className="menu-sub-desc text-[8px] opacity-55 font-mono tracking-[0.5px] mt-[1px]">{item.desc}</div>
                      </div>
                    </div>
                    <span className="menu-sub-arrow text-[10px] opacity-50">›</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <button className="gbtn p w-full mt-2" disabled={isTraveling} onClick={() => { setIsMenuOpen(!isMenuOpen); setActiveCat(null); }}>
        <span style={{position:'relative',zIndex:1}}>{isMenuOpen ? '[CLOSE MENU]' : '[OPEN MENU]'}</span>
        <span className="gbtn-g" /><span className="gbtn-s" />
      </button>
    </div>
  );
})

OverworldMenu.displayName = 'OverworldMenu'
"""

with open("src/ui/overworld/OverworldMenu.tsx", "w") as f:
    f.write(new_menu)
