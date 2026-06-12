import React, { useState, useEffect, useRef, useMemo } from 'react'
import { GlitchButton } from '../GlitchButton'
import { Tooltip } from '../shared'
import { useTranslation } from 'react-i18next'
import { type BandState, type PlayerState } from '../../types'
import { translateLocation } from '../../utils/locationI18n'
import { useAudioControl } from '../../hooks/useAudioControl'
import { formatCurrency } from '../../utils/numberUtils'

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

interface VanStatRowProps {
  value: number | undefined
  isLow: boolean
  icon: string
  lowColor: string
  normalColor: string
  notAvailableLabel: string
}

const VanStatRow = ({
  value,
  isLow,
  icon,
  lowColor,
  normalColor,
  notAvailableLabel
}: VanStatRowProps) => {
  const activeColor = isLow ? lowColor : normalColor
  return (
    <div className='van-row'>
      <span className='van-icon' style={{ color: activeColor }}>
        {icon}
      </span>
      <div className='mini-track'>
        <div
          className='mini-fill'
          style={{
            width: value !== undefined ? `${value}%` : '0%',
            background: activeColor
          }}
        />
      </div>
      <span
        className='mini-num'
        style={{ color: isLow ? lowColor : undefined }}
      >
        {value !== undefined ? Math.round(value) : notAvailableLabel}
      </span>
    </div>
  )
}

type Member = NonNullable<BandState['members']>[number]
type MemberStatus = 'crit' | 'low' | 'ok'

const getMemberStatus = (m: Member): MemberStatus => {
  if (m.mood < 30 || m.stamina < 20) return 'crit'
  if (m.mood < 50 || m.stamina < 35) return 'low'
  return 'ok'
}

const STATUS_DOT_COLOR = {
  crit: 'var(--color-error-red)',
  low: 'var(--color-warning-yellow)',
  ok: 'var(--color-toxic-green)'
} as const satisfies Record<MemberStatus, string>

const getMoodColor = (mood: number) => {
  if (mood < 30) return 'var(--color-error-red)'
  if (mood < 50) return 'var(--color-warning-yellow)'
  return 'var(--color-mood-pink)'
}

const getStaminaColor = (stamina: number) => {
  if (stamina < 20) return 'var(--color-error-red)'
  if (stamina < 35) return 'var(--color-warning-yellow)'
  return 'var(--color-toxic-green)'
}

const StatBar = ({ value, color }: { value: number; color: string }) => (
  <div className='bar-grp'>
    <div className='bar-track'>
      <div
        className='bar-fill'
        style={{ width: `${value}%`, background: color }}
      />
    </div>
    <span className='bar-pct' style={{ color }}>
      {Math.round(value)}%
    </span>
  </div>
)

const BandMemberRow = ({
  m,
  t
}: {
  m: Member
  t: ReturnType<typeof useTranslation>['t']
}) => {
  const status = getMemberStatus(m)
  const nameClass =
    status === 'crit' ? 'mbr-crit' : status === 'low' ? 'mbr-low' : ''
  const displayName =
    m.name?.trim() || t('ui:hud.unnamedMember', { defaultValue: 'Member' })
  return (
    <div className='mbr-row'>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span
          className='mbr-status-dot'
          style={{ background: STATUS_DOT_COLOR[status] }}
        />
        <span className={`mbr-name ${nameClass}`}>{displayName}</span>
      </div>
      <div className='mbr-bars'>
        <StatBar value={m.mood} color={getMoodColor(m.mood)} />
        <StatBar value={m.stamina} color={getStaminaColor(m.stamina)} />
      </div>
    </div>
  )
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
    const shortcuts = useMemo<[string, string][]>(
      () => [
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
      ],
      [t]
    )

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
            <div className='van-stats'>
              <VanStatRow
                value={vanFuel}
                isLow={fuelLow}
                icon='⛽'
                lowColor='var(--color-error-red)'
                normalColor='var(--color-warning-yellow)'
                notAvailableLabel={t('ui:overworld.notAvailable', {
                  defaultValue: 'N/A'
                })}
              />
              <VanStatRow
                value={vanCondition}
                isLow={condLow}
                icon='🔧'
                lowColor='var(--color-error-red)'
                normalColor='var(--color-condition-blue)'
                notAvailableLabel={t('ui:overworld.notAvailable', {
                  defaultValue: 'N/A'
                })}
              />
              {fuelLow && (
                <div className='text-[8px] text-error-red uppercase mt-[2px] tracking-[2px] motion-safe:animate-[blink-conf_0.6s_step-end_infinite]'>
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
                  {Math.round(player.fame ?? 0)}
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
          {showSC && (
            <section
              id={shortcutsPanelId}
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
              {shortcuts.map(([k, d]) => (
                <div className='sc-row' key={k}>
                  <span className='sc-key'>{k}</span>
                  <span className='sc-desc'>{d}</span>
                </div>
              ))}
            </section>
          )}
        </div>
        <div className='hud-right'>
          <div className='ow-panel band-panel'>
            <div className='band-hdr'>
              {t('ui:overworld.band_status', { defaultValue: 'Band Status' })}
            </div>
            {(band?.members ?? []).map(m => (
              <BandMemberRow key={m.id} m={m} t={t} />
            ))}
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
                          ? 'var(--color-error-red)'
                          : 'var(--color-toxic-green)'
                    }}
                  />
                </div>
                <span
                  className={`text-xs w-7 text-right ${(band.harmony ?? 0) < 40 ? 'text-error-red' : 'text-toxic-green'}`}
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
