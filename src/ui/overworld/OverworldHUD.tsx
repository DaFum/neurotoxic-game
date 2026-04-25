import React, { useState, useEffect, useRef } from 'react'
import { GlitchButton } from '../GlitchButton'
import { useTranslation } from 'react-i18next'
import { type BandState, type PlayerState } from '../../types/game'
import { translateLocation } from '../../utils/locationI18n'
import { useAudioControl } from '../../hooks/useAudioControl'

export interface OverworldHUDProps {
  player: PlayerState
  band: BandState
}

function useAnimatedNum(value: number, ms = 450) {
  const [cur, setCur] = useState(value)
  const prev = useRef(value)
  useEffect(() => {
    const from = prev.current,
      to = value
    if (from === to) {
      setCur(to)
      prev.current = to
      return
    }
    const t0 = performance.now()
    let raf: number
    let cancelled = false
    const tick = (t: number) => {
      if (cancelled) return
      const p = Math.min(1, (t - t0) / ms)
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
      const next = Math.round(from + (to - from) * e)
      setCur(next)
      prev.current = next
      if (p < 1) raf = requestAnimationFrame(tick)
      else {
        prev.current = to
        setCur(to)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      prev.current = to
    }
  }, [value, ms])
  return cur
}

export const OverworldHUD = React.memo(
  ({ player, band }: OverworldHUDProps) => {
    const { t } = useTranslation(['ui'])
    const [showSC, setShowSC] = useState(false)
    const { audioState: isPlaying, handleAudioChange } = useAudioControl()
    const displayMoney = useAnimatedNum(player.money ?? 0)
    const [moneyAnim, setMoneyAnim] = useState('')
    const prevMoney = useRef(player.money ?? 0)
    const vanFuel = player.van?.fuel ?? 100
    const vanCondition = player.van?.condition ?? 100
    const fuelLow = vanFuel < 20
    const condLow = vanCondition < 25
    const locationName = translateLocation(t, player.location, player.location)
    const shortcutsPanelId = 'overworld-shortcuts-panel'

    useEffect(() => {
      if ((player.money ?? 0) !== prevMoney.current) {
        setMoneyAnim(
          (player.money ?? 0) > prevMoney.current
            ? 'money-anim-up'
            : 'money-anim-down'
        )
        const timer = setTimeout(() => setMoneyAnim(''), 450)
        prevMoney.current = player.money ?? 0
        return () => clearTimeout(timer)
      }
    }, [player.money])

    useEffect(() => {
      const isInputTarget = (target: EventTarget | null) => {
        const element = target as HTMLElement | null
        if (!element) return false
        return (
          element.tagName === 'INPUT' ||
          element.tagName === 'TEXTAREA' ||
          element.tagName === 'SELECT' ||
          element.isContentEditable
        )
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        if (isInputTarget(event.target)) return

        if (
          event.key === '?' ||
          (event.key === 'h' && !event.ctrlKey && !event.metaKey)
        ) {
          setShowSC(prev => !prev)
          return
        }

        if (event.key === 'm' && !event.ctrlKey && !event.metaKey) {
          if (isPlaying) {
            handleAudioChange.stopMusic()
          } else {
            void handleAudioChange.resumeMusic()
          }
          return
        }

        if (event.key === 'Escape') {
          setShowSC(false)
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleAudioChange, isPlaying])

    const memberStatus = (m: NonNullable<BandState['members']>[number]) => {
      if (m.mood < 30 || m.stamina < 20) return 'crit'
      if (m.mood < 50 || m.stamina < 35) return 'low'
      return 'ok'
    }

    return (
      <div className='hud'>
        <div className='hud-left'>
          <div className={`ow-panel ${fuelLow ? 'fuel-warn' : ''}`}>
            <div className='money-row'>
              <span
                style={{ color: 'var(--color-warning-yellow)', fontSize: 14 }}
              >
                €
              </span>
              <span
                className={`money-val ${moneyAnim} ${(player.money ?? 0) < 40 ? 'low' : ''}`}
              >
                {displayMoney}
              </span>
            </div>
            <div className='loc-row'>
              <span style={{ color: 'var(--color-toxic-green)' }}>⬡</span>
              <span>
                {t('ui:ui.day', { defaultValue: 'Day' })} {player.day ?? 1} —{' '}
                {locationName}
              </span>
            </div>
            <div className='van-stats'>
              <div className='van-row'>
                <span
                  className='van-icon'
                  style={{
                    color: fuelLow
                      ? 'var(--color-blood-red)'
                      : 'var(--color-warning-yellow)'
                  }}
                >
                  ⛽
                </span>
                <div className='mini-track'>
                  <div
                    className='mini-fill'
                    style={{
                      width: `${vanFuel}%`,
                      background: fuelLow
                        ? 'var(--color-blood-red)'
                        : 'var(--color-warning-yellow)'
                    }}
                  />
                </div>
                <span
                  className='mini-num'
                  style={{
                    color: fuelLow ? 'var(--color-blood-red)' : undefined
                  }}
                >
                  {vanFuel}
                </span>
              </div>
              <div className='van-row'>
                <span
                  className='van-icon'
                  style={{
                    color: condLow
                      ? 'var(--color-blood-red)'
                      : 'var(--color-condition-blue)'
                  }}
                >
                  🔧
                </span>
                <div className='mini-track'>
                  <div
                    className='mini-fill'
                    style={{
                      width: `${vanCondition}%`,
                      background: condLow
                        ? 'var(--color-blood-red)'
                        : 'var(--color-condition-blue)'
                    }}
                  />
                </div>
                <span
                  className='mini-num'
                  style={{
                    color: condLow ? 'var(--color-blood-red)' : undefined
                  }}
                >
                  {vanCondition}
                </span>
              </div>
              {fuelLow && (
                <div
                  style={{
                    fontSize: 8,
                    color: 'var(--color-blood-red)',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    marginTop: 2,
                    animation: 'blink-conf .6s step-end infinite'
                  }}
                >
                  <span aria-hidden='true'>⚠ </span>
                  {t('ui:overworld.low_fuel', { defaultValue: 'LOW FUEL' })}
                </div>
              )}
            </div>
          </div>
          <div className='hud-btns pointer-events-auto'>
            <GlitchButton
              className='!w-[30px] !h-[30px] !p-0'
              variant={showSC ? 'warning' : 'primary'}
              size='sm'
              onClick={() => setShowSC(s => !s)}
              aria-label={t('ui:overworld.shortcuts.help', {
                defaultValue: 'Toggle Help'
              })}
              aria-pressed={showSC}
              aria-controls={shortcutsPanelId}
            >
              ?
            </GlitchButton>
          </div>
          {showSC && (
            <div
              id={shortcutsPanelId}
              role='region'
              aria-label={t('ui:overworld.keyboard_shortcuts', {
                defaultValue: 'Keyboard Shortcuts'
              })}
              className='shortcuts-panel pointer-events-auto'
            >
              <div className='sc-title'>
                {t('ui:overworld.keyboard_shortcuts', {
                  defaultValue: 'Keyboard Shortcuts'
                })}
              </div>
              {((): [string, string][] => [
                [
                  '?, h',
                  t('ui:overworld.shortcuts.help', {
                    defaultValue: 'Toggle Help'
                  })
                ],
                [
                  'M',
                  t('ui:overworld.shortcuts.mute', {
                    defaultValue: 'Mute / Unmute'
                  })
                ],
                [
                  '1–4',
                  t('ui:overworld.shortcuts.event', {
                    defaultValue: 'Select Event Option'
                  })
                ],
                [
                  '← ↓ →',
                  t('ui:overworld.shortcuts.hit_notes', {
                    defaultValue: 'Hit Notes (Gig)'
                  })
                ],
                [
                  'ESC',
                  t('ui:overworld.shortcuts.close', {
                    defaultValue: 'Close Overlays'
                  })
                ]
              ])().map(([k, d]) => (
                <div className='sc-row' key={k}>
                  <span className='sc-key'>{k}</span>
                  <span className='sc-desc'>{d}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className='hud-right'>
          <div className='ow-panel band-panel'>
            <div className='band-hdr'>
              {t('ui:overworld.band_status', { defaultValue: 'Band Status' })}
            </div>
            {(band?.members ?? []).map(m => {
              const st = memberStatus(m)
              return (
                <div className='mbr-row' key={m.id}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <span
                      className='mbr-status-dot'
                      style={{
                        background:
                          st === 'crit'
                            ? 'var(--color-blood-red)'
                            : st === 'low'
                              ? 'var(--color-warning-yellow)'
                              : 'var(--color-toxic-green)'
                      }}
                    />
                    <span
                      className={`mbr-name ${st === 'crit' ? 'mbr-crit' : st === 'low' ? 'mbr-low' : ''}`}
                    >
                      {m.name}
                    </span>
                  </div>
                  <div className='mbr-bars'>
                    <div className='bar-grp'>
                      <div className='bar-track'>
                        <div
                          className='bar-fill'
                          style={{
                            width: `${m.mood}%`,
                            background:
                              m.mood < 30
                                ? 'var(--color-blood-red)'
                                : m.mood < 50
                                  ? 'var(--color-warning-yellow)'
                                  : 'var(--color-mood-pink)'
                          }}
                        />
                      </div>
                      <span
                        className='bar-pct'
                        style={{
                          color:
                            m.mood < 30
                              ? 'var(--color-blood-red)'
                              : m.mood < 50
                                ? 'var(--color-warning-yellow)'
                                : 'var(--color-mood-pink)'
                        }}
                      >
                        {Math.round(m.mood)}%
                      </span>
                    </div>
                    <div className='bar-grp'>
                      <div className='bar-track'>
                        <div
                          className='bar-fill'
                          style={{
                            width: `${m.stamina}%`,
                            background:
                              m.stamina < 20
                                ? 'var(--color-blood-red)'
                                : m.stamina < 35
                                  ? 'var(--color-warning-yellow)'
                                  : 'var(--color-toxic-green)'
                          }}
                        />
                      </div>
                      <span
                        className='bar-pct'
                        style={{
                          color:
                            m.stamina < 20
                              ? 'var(--color-blood-red)'
                              : m.stamina < 35
                                ? 'var(--color-warning-yellow)'
                                : 'var(--color-toxic-green)'
                        }}
                      >
                        {Math.round(m.stamina)}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            <div className='harmony-row'>
              <span className='harmony-label'>
                {t('ui:overworld.harmony', { defaultValue: 'Harmony' })}
              </span>
              <div className='harmony-bar-wrap'>
                <div className='h-track'>
                  <div
                    className='bar-fill'
                    style={{
                      width: `${band.harmony ?? 0}%`,
                      background:
                        (band.harmony ?? 0) < 40
                          ? 'var(--color-blood-red)'
                          : 'var(--color-toxic-green)'
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color:
                      (band.harmony ?? 0) < 40
                        ? 'var(--color-blood-red)'
                        : 'var(--color-toxic-green)',
                    width: 28,
                    textAlign: 'right'
                  }}
                >
                  {Math.round(band.harmony ?? 0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

OverworldHUD.displayName = 'OverworldHUD'
