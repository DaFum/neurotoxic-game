import React, { useState, useEffect, useRef, useCallback } from 'react'
import { GlitchButton } from '../GlitchButton';

import { useAudioControl } from '../../hooks/useAudioControl';


import { useTranslation } from 'react-i18next';
import { type BandState } from '../../types/game';

export interface OverworldHUDProps {
  player: {
    money?: number;
    day?: number;
    location?: string;
    van?: {
      fuel?: number;
      condition?: number;
    };
  };
  band: BandState;
  harmony?: number;
  muted?: boolean;
  onToggleMute?: () => void;
}


function useAnimatedNum(value: number, ms=450) {
  const [cur, setCur] = useState(value);
  const prev = useRef(value);
  useEffect(()=>{
    const from = prev.current, to = value;
    if (from === to) return;
    const t0 = performance.now();
    let raf: number;
    const tick = (t: number)=>{
      const p = Math.min(1,(t-t0)/ms);
      const e = p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
      setCur(Math.round(from+(to-from)*e));
      if(p<1) raf=requestAnimationFrame(tick);
      else { prev.current=to; setCur(to); }
    };
    raf = requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(raf);
  },[value,ms]);
  return cur;
}

export const OverworldHUD = React.memo(({ player, band, harmony, muted, onToggleMute }: OverworldHUDProps) => {
  const { t } = useTranslation(['ui']);
  const [showSC, setShowSC] = useState(false);
  const { audioState: isPlaying, handleAudioChange } = useAudioControl(
    useCallback((state: unknown) => {
      if (typeof state !== 'object' || state === null) return false;
      const audioState = state as { currentSongId?: unknown; isPlaying?: unknown };
      return audioState.currentSongId === 'ambient' && audioState.isPlaying === true;
    }, []),
    { pollEvenWithSubscribe: true, pollMs: 1000 }
  );

  const isMuted = muted ?? !isPlaying;
  const handleToggleMute = onToggleMute ?? (() => {
    if (isPlaying) {
      handleAudioChange.stopMusic();
    } else {
      void handleAudioChange.resumeMusic();
    }
  });
  const displayMoney = useAnimatedNum(player.money || 0);
  const [moneyAnim, setMoneyAnim] = useState('');
  const prevMoney = useRef(player.money || 0);
  const vanFuel = player.van?.fuel ?? 100;
  const vanCondition = player.van?.condition ?? 100;
  const fuelLow = vanFuel < 20;
  const condLow = vanCondition < 25;

  useEffect(()=>{
    if ((player.money || 0) !== prevMoney.current) {
      setMoneyAnim((player.money || 0) > prevMoney.current ? 'money-anim-up' : 'money-anim-down');
      const t = setTimeout(()=>setMoneyAnim(''), 450);
      prevMoney.current = player.money || 0;
      return ()=>clearTimeout(t);
    }
  },[player.money]);

  const memberStatus = (m: NonNullable<BandState['members']>[number]) => {
    if (m.mood < 30 || m.stamina < 20) return 'crit';
    if (m.mood < 50 || m.stamina < 35) return 'low';
    return 'ok';
  };

  return (
    <div className="hud">
      <div className="hud-left">
        <div className={`panel ${fuelLow ? 'fuel-warn' : ''}`}>
          <div className="money-row">
            <span style={{color:'var(--color-warning-yellow)',fontSize:14}}>$</span>
            <span className={`money-val ${moneyAnim} ${(player.money || 0) < 40 ? 'low' : ''}`}>{displayMoney} €</span>
          </div>
          <div className="loc-row">
            <span style={{color:'var(--color-toxic-green)'}}>⬡</span>
            <span>Day {player.day || 1} — {player.location || t('ui:map.unknown', { defaultValue: 'UNKNOWN' })}</span>
          </div>
          <div className="van-stats">
            <div className="van-row">
              <span className="van-icon" style={{color: fuelLow ? 'var(--color-blood-red)' : 'var(--color-warning-yellow)'}}>⛽</span>
              <div className="mini-track"><div className="mini-fill" style={{width:`${vanFuel}%`,background:fuelLow?'var(--color-blood-red)':'var(--color-warning-yellow)'}}/></div>
              <span className="mini-num" style={{color:fuelLow?'var(--color-blood-red)':undefined}}>{vanFuel}</span>
            </div>
            <div className="van-row">
              <span className="van-icon" style={{color: condLow ? 'var(--color-blood-red)' : 'var(--color-condition-blue)'}}>🔧</span>
              <div className="mini-track"><div className="mini-fill" style={{width:`${vanCondition}%`,background:condLow?'var(--color-blood-red)':'var(--color-condition-blue)'}}/></div>
              <span className="mini-num" style={{color:condLow?'var(--color-blood-red)':undefined}}>{vanCondition}</span>
            </div>
            {fuelLow && <div style={{fontSize:8,color:'var(--color-blood-red)',letterSpacing:'2px',textTransform:'uppercase',marginTop:2,animation:'blink-conf .6s step-end infinite'}}>{t('ui:overworld.low_fuel', { defaultValue: '⚠ LOW FUEL' })}</div>}
          </div>
        </div>
        <div className="hud-btns pointer-events-auto">
          <GlitchButton className={`!w-[30px] !h-[30px] !p-0 ${isMuted ? 'opacity-50' : ''}`} variant="primary" size="sm" onClick={handleToggleMute}>{isMuted ? '🔇' : '🔊'}</GlitchButton>
          <GlitchButton className="!w-[30px] !h-[30px] !p-0" variant={showSC ? "warning" : "primary"} size="sm" onClick={() => setShowSC(s => !s)}>?</GlitchButton>
        </div>
        {showSC && (
          <div className="shortcuts-panel pointer-events-auto">
            <div className="sc-title">{t('ui:overworld.keyboard_shortcuts', { defaultValue: 'Keyboard Shortcuts' })}</div>
            {[['?, h', t('ui:overworld.shortcuts.help', { defaultValue: 'Toggle Help' })], ['M', t('ui:overworld.shortcuts.mute', { defaultValue: 'Mute / Unmute' })], ['1–4', t('ui:overworld.shortcuts.event', { defaultValue: 'Select Event Option' })], ['← ↓ →', t('ui:overworld.shortcuts.hit_notes', { defaultValue: 'Hit Notes (Gig)' })], ['ESC', t('ui:overworld.shortcuts.close', { defaultValue: 'Close Overlays' })]].map(([k,d])=>(
              <div className="sc-row" key={k}><span className="sc-key">{k}</span><span className="sc-desc">{d}</span></div>
            ))}
          </div>
        )}
      </div>
      <div className="hud-right">
        <div className="panel band-panel">
          <div className="band-hdr">{t('ui:overworld.band_status', { defaultValue: 'Band Status' })}</div>
          {Object.values(band?.members || {}).map((m)=>{
            const st = memberStatus(m);
            return (
              <div className="mbr-row" key={m.id}>
                <div style={{display:'flex',alignItems:'center',gap:4}}>
                  <span className="mbr-status-dot" style={{background: st==='crit'?'var(--color-blood-red)':st==='low'?'var(--color-warning-yellow)':'var(--color-toxic-green)'}}/>
                  <span className={`mbr-name ${st==='crit'?'mbr-crit':st==='low'?'mbr-low':''}`}>{m.name}</span>
                </div>
                <div className="mbr-bars">
                  <div className="bar-grp">
                    <div className="bar-track"><div className="bar-fill" style={{width:`${m.mood}%`,background:m.mood<30?'var(--color-blood-red)':m.mood<50?'var(--color-warning-yellow)':'var(--color-mood-pink)'}}/></div>
                    <span className="bar-pct" style={{color:m.mood<30?'var(--color-blood-red)':m.mood<50?'var(--color-warning-yellow)':'var(--color-mood-pink)'}}>{Math.round(m.mood)}%</span>
                  </div>
                  <div className="bar-grp">
                    <div className="bar-track"><div className="bar-fill" style={{width:`${m.stamina}%`,background:m.stamina<20?'var(--color-blood-red)':m.stamina<35?'var(--color-warning-yellow)':'var(--color-toxic-green)'}}/></div>
                    <span className="bar-pct" style={{color:m.stamina<20?'var(--color-blood-red)':m.stamina<35?'var(--color-warning-yellow)':'var(--color-toxic-green)'}}>{Math.round(m.stamina)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="harmony-row">
            <span className="harmony-label">{t('ui:overworld.harmony', { defaultValue: 'Harmony' })}</span>
            <div className="harmony-bar-wrap">
              <div className="h-track"><div className="bar-fill" style={{width:`${harmony || 0}%`,background:(harmony || 0)<40?'var(--color-blood-red)':'var(--color-toxic-green)'}}/></div>
              <span style={{fontSize:10,color:(harmony||0)<40?'var(--color-blood-red)':'var(--color-toxic-green)',width:28,textAlign:'right'}}>{Math.round(harmony || 0)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

OverworldHUD.displayName = 'OverworldHUD';
