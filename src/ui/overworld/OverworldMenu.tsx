import React, { useState, useMemo } from 'react'
import { GAME_PHASES } from '../../context/gameConstants'
import { EXPENSE_CONSTANTS } from '../../utils/economyEngine'
import { GlitchButton } from '../../ui/GlitchButton'


interface OverworldMenuProps {
  t: import("../../types/callbacks").TranslationCallback;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  isTraveling: boolean;
  vanFuel: number;
  vanCondition: number;
  isSaving: boolean;
  openStash: () => void;
  openQuests: () => void;
  openPirateRadio: () => void;
  openMerchPress: () => void;
  openBloodBank: () => void;
  openDarkWebLeak: () => void;
  openHQ: () => void;
  handleRefuel: () => void;
  handleRepair: () => void;
  handleSaveWithDelay: () => void;
  changeScene: (scene: string) => void;
}

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
  }: OverworldMenuProps) => {

  const MENU_CATS = useMemo(() => [
    { id: 'management', label: t('ui:menu.management', { defaultValue: 'MANAGEMENT' }), icon: '📋', color: 'var(--color-toxic-green)', items: [
      { label: t('ui:overworld.band_hq_button', { defaultValue: 'BAND HQ' }), desc: t('ui:menu.hq_desc', { defaultValue: 'Manage members & gear' }), icon: '🤘', v: 'p', action: 'openHQ' },
      { label: t('ui:quests.button', { defaultValue: 'QUESTS' }),  desc: t('ui:menu.quests_desc', { defaultValue: 'Active objectives' }), icon: '★', v: 'w', action: 'openQuests' },
      { label: t('ui:contraband.button', { defaultValue: 'STASH' }),   desc: t('ui:menu.stash_desc', { defaultValue: 'Contraband & inventory' }), icon: '📦', v: 'd', action: 'openStash' },
    ]},
    { id: 'hustles', label: t('ui:menu.side_hustles', { defaultValue: 'SIDE HUSTLES' }), icon: '💰', color: 'var(--color-warning-yellow)', items: [
      { label: t('ui:pirate_radio.button', { defaultValue: 'PIRATE RADIO' }), desc: t('ui:menu.radio_desc', { defaultValue: 'Boost reputation' }), icon: '📻', v: 'w', action: 'openPirateRadio' },
      { label: t('ui:merch_press.button', { defaultValue: 'MERCH PRESS' }),  desc: t('ui:menu.merch_desc', { defaultValue: 'Print bootlegs' }), icon: '👕', v: 'p', action: 'openMerchPress' },
      { label: t('ui:dark_web_leak.button', { defaultValue: 'DARK WEB' }),     desc: t('ui:menu.darkweb_desc', { defaultValue: 'Leak new tracks' }), icon: '🕸', v: 'd', action: 'openDarkWebLeak' },
    ]},
    { id: 'logistics', label: t('ui:menu.logistics', { defaultValue: 'LOGISTICS' }), icon: '🚐', color: 'var(--color-condition-blue)', items: [
      { label: t('ui:overworld.refuel', { defaultValue: 'REFUEL' }), desc: t('ui:menu.refuel_desc', { defaultValue: 'Gas up the van' }), icon: '⛽', v: 'w', cond: 'fuel', action: 'handleRefuel' },
      { label: t('ui:overworld.repair', { defaultValue: 'REPAIR' }), desc: t('ui:menu.repair_desc', { defaultValue: 'Fix van damage' }), icon: '🔧', v: 'p', cond: 'repair', action: 'handleRepair' },
      { label: t('ui:overworld.void_clinic_button', { defaultValue: 'VOID CLINIC' }), desc: t('ui:menu.clinic_desc', { defaultValue: 'Heal members' }), icon: '🏥', v: 'd', action: 'openBloodBank' },
    ]},
    { id: 'system', label: t('ui:menu.system', { defaultValue: 'SYSTEM' }), icon: '⚙', color: 'var(--color-ash-gray)', items: [
      { label: t('ui:overworld.save_game', { defaultValue: 'SAVE GAME' }), desc: t('ui:menu.save_desc', { defaultValue: 'Record progress' }), icon: '💾', v: 'p', action: 'handleSaveWithDelay' },
    ]}
  ], [t]);

  const [activeCat, setActiveCat] = useState<string | null>(null);

  const isDisabled = (item: any) => {
    if (isTraveling) return true;
    if (item.cond === 'fuel'   && vanFuel >= EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL) return true;
    if (item.cond === 'repair' && vanCondition >= 100)  return true;
    if (item.action === 'handleSaveWithDelay' && isSaving) return true;
    return false;
  };

  const actions: Record<string, () => void> = {
    openHQ, openQuests, openStash, openPirateRadio, openMerchPress, openDarkWebLeak, openBloodBank, handleRefuel, handleRepair, handleSaveWithDelay
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
                  <span className="menu-panel-title-sub text-[8px] text-ash-gray tracking-[3px] font-mono drop-shadow-none ml-2">{cat.items.length} {t('ui:menu.options_count_upper', { defaultValue: 'OPTIONS' })}</span>
                </>
              ) : (
                <>◈ {t('ui:menu.actions', { defaultValue: 'ACTIONS' })}</>
              )}
            </div>
          </div>

          {/* Category list */}
          {!activeCat && (
            <div className="menu-cat-list flex flex-col p-1.5">
              {MENU_CATS.map(c => (
                <GlitchButton
                  key={c.id}
                  className="menu-cat-btn !border-none !bg-transparent w-full !mb-0 border-b border-ash-gray/15 hover:!bg-toxic-green/5 !px-3.5 !py-2.5"
                  disabled={isTraveling}
                  onClick={() => setActiveCat(c.id)}
                  size="sm"
                >
                  <div className="flex w-full justify-between items-center text-left">
                    <div className="menu-cat-left flex items-center gap-2.5">
                      <span className="menu-cat-icon text-[16px] w-5 text-center" style={{color:c.color}}>{c.icon}</span>
                      <span className="menu-cat-label font-[Metal_Mania] text-[14px] tracking-[1px]" style={{color:c.color}}>{c.label}</span>
                    </div>
                    <div className="menu-cat-right flex items-center gap-2">
                      <span className="menu-cat-count text-[8px] text-ash-gray font-mono tracking-[1px]">{c.items.length} {t('ui:menu.options_count_lower', { defaultValue: 'options' })}</span>
                      <span className="menu-cat-arrow text-[11px] opacity-60" style={{color:c.color}}>›</span>
                    </div>
                  </div>
                </GlitchButton>
              ))}
            </div>
          )}

          {/* Submenu */}
          {activeCat && cat && (
            <div className="menu-sub flex flex-col">
              <GlitchButton className="menu-back-btn !w-full !border-none !bg-ash-gray/10 !border-b !border-ash-gray/20 !px-3.5 !py-2 !text-[10px] !text-left" size="sm" variant="primary" onClick={handleBack}>‹ &nbsp;{t('ui:menu.back_to_actions', { defaultValue: 'BACK TO ACTIONS' })}</GlitchButton>
              <div className="menu-sub-items flex flex-col p-1.5">
                {cat.items.map(item => (
                  <GlitchButton
                    key={item.label}
                    className={`menu-sub-item !border-transparent !bg-transparent !mb-1 !p-2 !w-full hover:enabled:-translate-x-[2px] v-${item.v}`}
                    disabled={isDisabled(item)}
                    onClick={() => { actions[item.action]?.(); handleClose(); }}
                    size="sm"
                  >
                    <div className="flex w-full justify-between items-center text-left">
                      <div className="menu-sub-item-left flex items-center gap-2.5">
                        <span className="menu-sub-icon text-[14px] w-[18px] text-center">{item.icon}</span>
                        <div className="text-left">
                          <div className="menu-sub-label font-[Metal_Mania] text-[13px] tracking-[1px]">[{item.label}]</div>
                          <div className="menu-sub-desc text-[8px] opacity-55 font-mono tracking-[0.5px] mt-[1px]">{item.desc}</div>
                        </div>
                      </div>
                      <span className="menu-sub-arrow text-[10px] opacity-50">›</span>
                    </div>
                  </GlitchButton>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <GlitchButton
        className="w-full mt-2"
        disabled={isTraveling}
        onClick={() => { setIsMenuOpen(!isMenuOpen); setActiveCat(null); }}
        variant="primary"
        size="sm"
      >
        {isMenuOpen ? `[${t('ui:menu.close', { defaultValue: 'CLOSE MENU' })}]` : `[${t('ui:menu.open', { defaultValue: 'OPEN MENU' })}]`}
      </GlitchButton>
    </div>
  );
})

OverworldMenu.displayName = 'OverworldMenu'
