import React, { useState, useEffect, useRef, useMemo } from 'react'
import { GlitchButton } from '../GlitchButton'
import { Tooltip, KeyboardShortcutsPanel, useKeyboardShortcuts, BandMemberRow, ProgressBar } from '../shared'
import { useTranslation } from 'react-i18next'
import { type BandState, type PlayerState } from '../../types'
import { translateLocation } from '../../utils/locationI18n'
import { useAudioControl } from '../../hooks/useAudioControl'
import { formatCurrency } from '../../utils/numberUtils'
import { finiteNumberOr } from '../../utils/gameState'

/**
 * Player and band state shown in the overworld resource HUD.
 */
export interface OverworldHUDProps {
  player: PlayerState
  band: BandState
}

function useAnimatedNum(value: number, ms = 450) {
  const [cur, setCur] = useState(value)
  const prevRef = useRef(value)
  useEffect(() => {
    const from = prevRef.current,
      to = value
    if (from === to) {
      prevRef.current = to
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
      prevRef.current = next
      if (p < 1) raf = requestAnimationFrame(tick)
      else {
        prevRef.current = to
        setCur(to)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [value, ms])
  return cur
}

/**
 * Displays animated overworld resources, location, audio, and van status.
 * @param props - Player and band state displayed in the overworld HUD.
 */
export const OverworldHUD = React.memo(
  ({ player, band }: OverworldHUDProps) => {
    const { t, i18n } = useTranslation(['ui'])
    const [showSC, setShowSC] = useState(false)
    const { audioState, handleAudioChange } = useAudioControl()
    const isPlaying =
      typeof audioState === 'object' &&
      audioState !== null &&
      (audioState as unknown as Record<string, unknown>).isPlaying === true
    const moneyValue = player.money ?? 0
    const displayMoney = useAnimatedNum(moneyValue)
    const prevMoneyRef = useRef(moneyValue)
    const [moneyAnim, setMoneyAnim] = useState('')
    const vanFuel = player.van?.fuel
    const vanCondition = player.van?.condition
    const fuelLow = vanFuel !== undefined && vanFuel < 20
    const condLow = vanCondition !== undefined && vanCondition < 25
    const totalDistance =
      typeof player.stats?.totalDistance === 'number'
        ? Math.round(player.stats.totalDistance)
        : 0
    const locationName = translateLocation(t, player.location, player.location)
    const shortcutsPanelId = 'overworld-shortcuts-panel'

    // Defer applying the money animation class so it runs as a separate state
    // transition after render, then clear it once the animation window ends.
    useEffect(() => {
      const previousMoney = prevMoneyRef.current
      if (moneyValue === previousMoney) return undefined

      const setupTimer = window.setTimeout(() => {
        setMoneyAnim(
          moneyValue > previousMoney ? 'money-anim-up' : 'money-anim-down'
        )
      }, 0)

      prevMoneyRef.current = moneyValue

      const timer = window.setTimeout(() => {
        setMoneyAnim('')
      }, 450)

      return () => {
        window.clearTimeout(setupTimer)
        window.clearTimeout(timer)
      }
    }, [moneyValue])

    useKeyboardShortcuts(setShowSC)

    return (
      <div className='hud'>
        <div className='hud-left'>
          <div className={`ow-panel ${fuelLow ? 'fuel-warn' : ''}`}>
            <div className='money-row'>
              <span
                className={`money-val ${moneyAnim} ${(player.money ?? 0) < 40 ? 'low' : ''}`}
                style={{ color: 'var(--color-warning-yellow)' }}
              >
                {formatCurrency(displayMoney, i18n.language)}
              </span>
            </div>
            <div className='loc-row'>
              <span style={{ color: 'var(--color-toxic-green)' }}>⬡</span>
              <span>
                {t('ui:ui.day', { defaultValue: 'Day' })} {player.day ?? 1} —{' '}
                {locationName}
              </span>
            </div>
            <div className='van-stats space-y-1.5 pt-2 border-t border-toxic-green/20 mt-2'>
              <Tooltip
                content={t('ui:hud.fuelLevel', { defaultValue: 'Fuel Level' })}
                position='bottom'
              >
                <div className='flex items-center gap-2 pointer-events-auto'>
                  <span className={`text-xs ${fuelLow ? 'text-error-red' : 'text-warning-yellow'}`}>⛽</span>
                  <ProgressBar
                    value={vanFuel ?? 0}
                    max={100}
                    color={fuelLow ? 'bg-error-red' : 'bg-warning-yellow'}
                    warn={fuelLow}
                    size='mini'
                    aria-label={t('ui:hud.fuelLevel', {
                      defaultValue: 'Fuel Level'
                    })}
                  />
                  <span className={`text-xs w-8 text-right tabular-nums ${fuelLow ? 'text-error-red' : 'text-ash-gray'}`}>
                    {vanFuel !== undefined ? Math.floor(vanFuel) : t('ui:overworld.notAvailable', { defaultValue: 'N/A' })}
                  </span>
                </div>
              </Tooltip>
              <Tooltip
                content={t('ui:hud.vanCondition', {
                  defaultValue: 'Van Condition'
                })}
                position='bottom'
              >
                <div className='flex items-center gap-2 pointer-events-auto'>
                  <span className={`text-xs ${condLow ? 'text-error-red' : 'text-condition-blue'}`}>🔧</span>
                  <ProgressBar
                    value={vanCondition ?? 0}
                    max={100}
                    color={condLow ? 'bg-error-red' : 'bg-condition-blue'}
                    warn={condLow}
                    size='mini'
                    aria-label={t('ui:hud.vanCondition', {
                      defaultValue: 'Van Condition'
                    })}
                  />
                  <span className={`text-xs w-8 text-right tabular-nums ${condLow ? 'text-error-red' : 'text-ash-gray'}`}>
                    {vanCondition !== undefined ? Math.floor(vanCondition) : t('ui:overworld.notAvailable', { defaultValue: 'N/A' })}
                  </span>
                </div>
              </Tooltip>
              {fuelLow && (
                <div className='text-[8px] text-error-red uppercase mt-1 tracking-[2px] motion-safe:animate-[blink-conf_0.6s_step-end_infinite]'>
                  <span aria-hidden='true'>⚠ </span>
                  {t('ui:overworld.low_fuel', { defaultValue: 'LOW FUEL' })}
                </div>
              )}
            </div>
            <div
              className='career-stats'
              role='group'
              aria-label={t('ui:overworld.career_status', {
                defaultValue: 'Career status'
              })}
            >
              <div className='career-cell'>
                <span className='career-label'>
                  {t('ui:overworld.career_fame', { defaultValue: 'FAME' })}
                </span>
                <span className='career-value'>
                  {Math.floor(finiteNumberOr(player?.fame, 0))}
                </span>
              </div>
              <div className='career-cell'>
                <span className='career-label'>
                  {t('ui:overworld.career_level', { defaultValue: 'LVL' })}
                </span>
                <span className='career-value'>{player.fameLevel ?? 0}</span>
              </div>
              <div className='career-cell'>
                <span className='career-label'>
                  {t('ui:overworld.career_distance', { defaultValue: 'KM' })}
                </span>
                <span className='career-value'>{totalDistance}</span>
              </div>
            </div>
          </div>
          <div className='hud-btns pointer-events-auto'>
            <Tooltip
              content={t('ui:overworld.shortcuts.help', {
                defaultValue: 'Toggle Help'
              })}
            >
              <GlitchButton
                className='!w-11 !h-11 sm:!w-[30px] sm:!h-[30px] !p-0'
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
            </Tooltip>
          </div>
          <KeyboardShortcutsPanel
            showHelp={showSC}
            panelId={shortcutsPanelId}
            className='shortcuts-panel'
          />
        </div>
        <div className='hud-right'>
          <div className='ow-panel band-panel min-w-56'>
            <div className='text-right border-b border-toxic-green/30 mb-2 pb-1 text-xs tracking-widest text-ash-gray uppercase'>
              {t('ui:overworld.band_status', { defaultValue: 'Band Status' })}
            </div>
            {(band?.members ?? []).map((m, idx) => (
              <BandMemberRow key={m.id} m={m} idx={idx} t={t} />
            ))}
            <div className='mt-2 pt-1.5 border-t border-toxic-green/20 flex items-center justify-between'>
              <span className='text-xs text-ash-gray'>
                {t('ui:overworld.harmony', { defaultValue: 'Harmony' })}
              </span>
              <div className='flex items-center gap-2'>
                <div className='w-20'>
                  <ProgressBar
                    value={band.harmony ?? 0}
                    max={100}
                    color={(band.harmony ?? 0) < 40 ? 'bg-error-red' : 'bg-toxic-green'}
                    size='mini'
                    aria-label={t('ui:hud.bandHarmony', {
                      defaultValue: 'Band Harmony'
                    })}
                  />
                </div>
                <span
                  className={`text-xs tabular-nums ${(band.harmony ?? 0) < 40 ? 'text-error-red' : 'text-toxic-green'}`}
                >
                  {Math.floor(band.harmony ?? 0)}%
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
