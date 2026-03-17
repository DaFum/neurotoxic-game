// TODO: Review this file
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { SONGS_DB } from '../data/songs'
import { getGigModifiers } from '../utils/simulationUtils'
import { MODIFIER_COSTS } from '../utils/economyEngine'
import { clampPlayerMoney, clampBandHarmony } from '../utils/gameStateUtils'
import { audioManager } from '../utils/AudioManager'
import { getSongId } from '../utils/audio/songUtils'
import { handleError } from '../utils/errorHandler'
import { secureRandom } from '../utils/crypto.js'
import GigModifierButton from '../ui/GigModifierButton'
import { RazorPlayIcon } from '../ui/shared/Icons'
import { formatNumber } from '../utils/numberUtils'

let lastMinigameFallback = null

// Exported exclusively for test cleanup
export const _resetLastMinigameFallback = () => {
  lastMinigameFallback = null
}

const BAND_MEETING_COST = 50

const SONGS_DICT = Object.create(null)
for (let i = 0; i < SONGS_DB.length; i++) {
  const song = SONGS_DB[i]
  SONGS_DICT[song.id] = song
}

/**
 * Scene for preparing for a gig: managing budget, setlist, and modifiers.
 */
export const PreGig = () => {
  const { t, i18n } = useTranslation(['ui', 'venues'])

  /**
   * Static options for gig modifiers.
   * Memoized to prevent referential instability in child components.
   * Only depends on `t` so it correctly updates when the user changes language.
   * Modifier costs are loaded from the static `MODIFIER_COSTS` object.
   */
  const GIG_MODIFIER_OPTIONS = useMemo(
    () => [
      {
        key: 'soundcheck',
        label: t('ui:pregig.modifiers.soundcheck.label'),
        cost: MODIFIER_COSTS.soundcheck,
        desc: t('ui:pregig.modifiers.soundcheck.desc')
      },
      {
        key: 'promo',
        label: t('ui:pregig.modifiers.promo.label'),
        cost: MODIFIER_COSTS.promo,
        desc: t('ui:pregig.modifiers.promo.desc')
      },
      {
        key: 'merch',
        label: t('ui:pregig.modifiers.merch.label'),
        cost: MODIFIER_COSTS.merch,
        desc: t('ui:pregig.modifiers.merch.desc')
      },
      {
        key: 'catering',
        label: t('ui:pregig.modifiers.catering.label'),
        cost: MODIFIER_COSTS.catering,
        desc: t('ui:pregig.modifiers.catering.desc')
      },
      {
        key: 'guestlist',
        label: t('ui:pregig.modifiers.guestlist.label'),
        cost: MODIFIER_COSTS.guestlist,
        desc: t('ui:pregig.modifiers.guestlist.desc')
      }
    ],
    [t]
  )

  const {
    currentGig,
    changeScene,
    setSetlist,
    setlist,
    gigModifiers,
    setGigModifiers,
    player,
    updatePlayer,
    triggerEvent,
    activeEvent,
    band,
    updateBand,
    addToast,
    startRoadieMinigame,
    startKabelsalatMinigame
  } = useGameState()
  const [isStarting, setIsStarting] = useState(false)
  const currentModifiers = getGigModifiers(band, gigModifiers)

  const selectedSongIds = useMemo(
    () => new Set(setlist.map(s => getSongId(s))),
    [setlist]
  )

  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])

  useEffect(() => {
    if (!currentGig) {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      addToast(tRef.current('ui:pregig.toasts.noGig'), 'error')
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      changeScene(GAME_PHASES.OVERWORLD)
    }
  }, [currentGig, changeScene, addToast])

  /**
   * Triggers a band meeting event to boost harmony.
   */
  const handleBandMeeting = () => {
    const cost = BAND_MEETING_COST
    if (player.money < cost) {
      addToast(t('ui:pregig.toasts.noMoneySnacks'), 'error')
      return
    }

    updatePlayer({ money: clampPlayerMoney(player.money - cost) })
    const prevHarmony = band.harmony || 1
    const newHarmony = clampBandHarmony(prevHarmony + 15)
    const appliedDelta = newHarmony - prevHarmony

    updateBand({ harmony: newHarmony })

    if (appliedDelta > 0) {
      addToast(
        t('ui:pregig.toasts.meetingHeld', { amount: appliedDelta }),
        'success'
      )
    } else {
      addToast(
        t('ui:pregig.toasts.meetingHeldMax', {
          defaultValue: 'Harmony already maxed out.'
        }),
        'info'
      )
    }
  }

  useEffect(() => {
    // Chance for a Pre-Gig event (Band or Gig category)
    if (!activeEvent) {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      const bandEvent = triggerEvent('band', 'pre_gig')
      if (!bandEvent) {
        // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
        triggerEvent('gig', 'pre_gig')
      }
    }
    // Intentionally run once on mount
  }, [])

  /**
   * Toggles a song in the setlist.
   * @param {object} song - The song to toggle.
   */
  const toggleSong = song => {
    if (selectedSongIds.has(song.id)) {
      setSetlist(setlist.filter(s => getSongId(s) !== song.id))
    } else {
      if (setlist.length < 3) {
        // Store only minimal info to save memory/localStorage
        setSetlist([...setlist, { id: song.id }])
      }
    }
  }

  const calculatedBudget = useMemo(() => {
    let acc = 0
    for (const key in gigModifiers) {
      if (Object.hasOwn(gigModifiers, key) && gigModifiers[key]) {
        acc += MODIFIER_COSTS[key] || 0
      }
    }
    return acc
  }, [gigModifiers])

  /**
   * Toggles a gig modifier (budget item).
   * @param {string} key - The modifier key.
   */
  const toggleModifier = useCallback(
    key => {
      const isActive = gigModifiers[key]
      const cost = MODIFIER_COSTS[key] || 0

      if (!isActive) {
        const projectedTotal = calculatedBudget + cost
        if (projectedTotal > player.money) {
          addToast(t('ui:pregig.toasts.noMoneyUpgrade'), 'error')
          return
        }
      }

      setGigModifiers({ [key]: !isActive })
    },
    [gigModifiers, calculatedBudget, player.money, addToast, setGigModifiers, t]
  )

  return (
    <div className='w-full h-full overflow-y-auto flex flex-col items-center justify-start lg:justify-center px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pt-28 sm:pt-32 lg:pt-8 pb-24 lg:pb-8 bg-void-black text-star-white relative'>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center mb-4 sm:mb-6 w-full max-w-4xl'
      >
        <h2 className="text-3xl sm:text-4xl text-toxic-green font-['Metal_Mania'] mb-2">
          {t('ui:pregig.title')}
        </h2>
        <div className='w-48 h-[1px] bg-gradient-to-r from-transparent via-toxic-green to-transparent mx-auto mb-3' />
        <div className='text-lg mb-1 font-mono text-star-white/80'>
          {currentGig?.name ? t(currentGig.name) : ''}
        </div>
        <div className='font-mono text-[11px] sm:text-xs md:text-sm text-ash-gray flex flex-wrap items-center justify-center gap-x-3 gap-y-1'>
          <span>
            {t('ui:pregig.budget')}{' '}
            <span className='text-toxic-green font-bold tabular-nums'>
              {t('ui:currency', {
                value: formatNumber(player.money, i18n?.language)
              })}
            </span>
          </span>
          <span className='text-ash-gray/30'>|</span>
          <span>
            {t('ui:pregig.costs')}{' '}
            <span className='text-blood-red font-bold tabular-nums'>
              {t('ui:currencyNegative', {
                value: formatNumber(calculatedBudget, i18n?.language)
              })}
            </span>
          </span>
        </div>
      </motion.div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full max-w-5xl h-auto lg:h-[58vh] relative z-10'>
        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className='border-2 border-ash-gray/40 p-4 bg-void-black/70 backdrop-blur-sm overflow-y-auto max-h-[38vh] sm:max-h-[42vh] lg:max-h-none'
        >
          <h3 className='text-sm text-toxic-green mb-3 tracking-widest font-mono border-b border-toxic-green/30 pb-2'>
            {t('ui:pregig.allocation')}
          </h3>
          <div className='flex flex-col gap-2.5'>
            {GIG_MODIFIER_OPTIONS.map(item => (
              <GigModifierButton
                key={item.key}
                item={item}
                isActive={!!gigModifiers[item.key]}
                onClick={toggleModifier}
              />
            ))}

            <div className='border-t border-ash-gray/20 pt-2.5'>
              <button
                type='button'
                onClick={handleBandMeeting}
                className='w-full flex justify-between items-center p-3 border-2 border-warning-yellow/30 hover:border-warning-yellow text-warning-yellow/70 hover:text-warning-yellow transition-all group'
              >
                <span className='flex flex-col text-left'>
                  <span className='font-bold text-sm'>
                    {t('ui:pregig.bandMeeting.label')}
                  </span>
                  <span className='text-[10px] opacity-70'>
                    {t('ui:pregig.bandMeeting.desc')}
                  </span>
                </span>
                <span className='font-mono text-sm font-bold tabular-nums'>
                  {t('ui:cost', { cost: BAND_MEETING_COST })}
                </span>
              </button>
            </div>
          </div>

          {/* Active Modifiers Display */}
          <div className='mt-3 p-3 bg-toxic-green/5 border border-toxic-green/30'>
            <h4 className='text-[10px] font-bold text-toxic-green mb-2 tracking-widest'>
              {t('ui:pregig.activeModifiers')}
            </h4>
            {currentModifiers.activeEffects.length > 0 ? (
              <ul className='text-xs space-y-1'>
                {currentModifiers.activeEffects.map(eff => (
                  <li
                    key={typeof eff === 'string' ? eff : eff.key}
                    className='text-star-white/60 flex items-center gap-1.5'
                  >
                    <span className='w-1 h-1 bg-toxic-green inline-block' />
                    {typeof eff === 'string'
                      ? eff
                      : t(eff.key, {
                          ...eff.options,
                          defaultValue: eff.fallback
                        })}
                  </li>
                ))}
              </ul>
            ) : (
              <div className='text-[10px] text-ash-gray/50 italic'>
                {t('ui:pregig.noModifiers')}
              </div>
            )}
          </div>
        </motion.div>

        {/* Setlist */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className='border-2 border-ash-gray/40 p-4 bg-void-black/70 backdrop-blur-sm flex flex-col max-h-[48vh] sm:max-h-[52vh] lg:max-h-none'
        >
          <h3 className='text-sm text-toxic-green mb-3 tracking-widest font-mono border-b border-toxic-green/30 pb-2 flex justify-between'>
            <span>{t('ui:pregig.setlist')}</span>
            <span className='tabular-nums'>{setlist.length}/3</span>
          </h3>
          <div className='flex-1 overflow-y-auto pr-0 sm:pr-2 space-y-2'>
            {SONGS_DB.map(song => {
              const isSelected = selectedSongIds.has(song.id)
              const isLocked =
                player?.stats?.proveYourselfMode && song.difficulty > 2

              return (
                <div
                  key={song.id}
                  role='button'
                  tabIndex={isLocked ? -1 : 0}
                  aria-label={t('ui:pregig.selectSong', { name: song.name })}
                  aria-pressed={!!isSelected}
                  aria-disabled={isLocked}
                  onClick={() => {
                    if (!isLocked) toggleSong(song)
                  }}
                  onKeyDown={e => {
                    if (!isLocked && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      toggleSong(song)
                    }
                  }}
                  className={`p-3 border-2 flex justify-between items-center transition-all ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
                    ${
                      isSelected
                        ? 'border-toxic-green bg-toxic-green/10 text-toxic-green shadow-[0_0_8px_var(--color-toxic-green-20)]'
                        : isLocked
                          ? 'border-blood-red/30 bg-blood-red/10 text-blood-red/50'
                          : 'border-ash-gray/20 hover:border-star-white/40 text-ash-gray'
                    }`}
                >
                  <div>
                    <div className='font-bold text-sm'>
                      {song.name}{' '}
                      {isLocked && (
                        <span className='text-[10px] text-blood-red ml-2 border border-blood-red/50 px-1'>
                          {t('ui:pregig.locked')}
                        </span>
                      )}
                    </div>
                    <div className='text-[10px] font-mono mt-0.5 flex gap-2'>
                      <span>{t('ui:seconds', { count: song.duration })}</span>
                      <span className='text-ash-gray/40'>|</span>
                      <span>
                        {t('ui:pregig.diff')} {'*'.repeat(song.difficulty)}
                      </span>
                    </div>
                  </div>
                  <div className='flex flex-col items-end gap-1'>
                    <div className='flex items-center gap-1.5'>
                      <span className='text-[9px] text-ash-gray/50 uppercase tracking-wider'>
                        {t('ui:pregig.nrg')}
                      </span>
                      <div className='w-14 h-1.5 bg-shadow-black overflow-hidden border border-ash-gray/20'>
                        <div
                          className={`h-full transition-all ${isSelected ? 'bg-toxic-green' : 'bg-blood-red/60'}`}
                          style={{ width: `${song.energy.peak}%` }}
                        />
                      </div>
                    </div>
                    {isSelected && (
                      <span className='text-[9px] text-toxic-green tracking-wider'>
                        {t('ui:pregig.selected')}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Curve Visualization */}
          <div className='mt-3 h-14 border-t border-ash-gray/20 pt-2 flex items-end justify-between gap-1'>
            {setlist.map((s, i) => {
              const id = getSongId(s)
              const songData = SONGS_DICT[id] || {
                energy: { peak: 50 }
              }
              return (
                <motion.div
                  key={id}
                  initial={{ height: 0 }}
                  animate={{ height: `${songData.energy?.peak || 50}%` }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className='flex-1 bg-gradient-to-t from-toxic-green to-toxic-green/40 relative group cursor-default'
                >
                  <div className='absolute -top-4 left-0 text-[10px] w-full text-center opacity-0 group-hover:opacity-100 transition-opacity text-star-white tabular-nums'>
                    {songData.energy?.peak}%
                  </div>
                </motion.div>
              )
            })}
            {setlist.length === 0 && (
              <div className='text-ash-gray/30 text-[10px] w-full text-center font-mono'>
                {t('ui:pregig.selectPreview')}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='relative z-30 mt-4 lg:mt-6 mb-20 lg:mb-12 w-full max-w-[20rem] sm:w-auto px-8 sm:px-12 py-3 sm:py-4 bg-toxic-green text-void-black font-bold text-lg sm:text-2xl uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-[4px_4px_0px_var(--color-blood-red)] hover:shadow-[6px_6px_0px_var(--color-blood-red)] flex items-center justify-center gap-3 sm:gap-4'
        disabled={setlist.length === 0 || isStarting}
        onClick={async () => {
          if (band.harmony < 10) {
            addToast(t('ui:pregig.toasts.harmonyLow'), 'error')
            return
          }
          setIsStarting(true)
          try {
            await audioManager.ensureAudioContext()
            // Safe access for ID
            const gigId = currentGig?.id || `gig_${crypto.randomUUID()}`

            // Simple streak breaker using sessionStorage with fallback
            let lastMinigame = lastMinigameFallback
            try {
              lastMinigame =
                sessionStorage.getItem('neurotoxic_last_minigame') ||
                lastMinigameFallback
            } catch (_storageErr) {
              // Ignore SecurityError or other storage errors
            }

            let roadieChance = 0.5

            if (lastMinigame === 'roadie') {
              roadieChance = 0.25 // Reduce chance if played last
            } else if (lastMinigame === 'kabelsalat') {
              roadieChance = 0.75 // Increase chance if Kabelsalat played last
            }

            let randomVal
            try {
              randomVal = secureRandom()
            } catch (err) {
              handleError(err, { silent: true, severity: 'medium' })
              // Fallback to Math.random()
              randomVal = Math.random()
            }

            const chosenGame = randomVal < roadieChance ? 'roadie' : 'kabelsalat'

            lastMinigameFallback = chosenGame
            try {
              sessionStorage.setItem('neurotoxic_last_minigame', chosenGame)
            } catch (_storageErr) {
              // Ignore storage errors, relying on fallback
            }

            if (chosenGame === 'roadie') {
              startRoadieMinigame(gigId)
            } else {
              startKabelsalatMinigame(gigId)
            }
          } catch (err) {
            setIsStarting(false)
            handleError(err, {
              addToast,
              fallbackMessage: t('ui:pregig.toasts.audioFail')
            })
          }
        }}
      >
        {!isStarting && <RazorPlayIcon className='w-8 h-8 text-void-black' />}
        {isStarting ? t('ui:pregig.initializing') : t('ui:pregig.startShow')}
      </motion.button>
    </div>
  )
}
