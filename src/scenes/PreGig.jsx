import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useGameState } from '../context/GameState'
import { SONGS_DB } from '../data/songs'
import { getGigModifiers } from '../utils/simulationUtils'
import { MODIFIER_COSTS } from '../utils/economyEngine'
import { audioManager } from '../utils/AudioManager'
import { getSongId } from '../utils/audio/songUtils'
import { handleError } from '../utils/errorHandler'
import GigModifierButton from '../ui/GigModifierButton'
import { RazorPlayIcon } from '../ui/shared/Icons'

const GIG_MODIFIER_OPTIONS = [
  {
    key: 'soundcheck',
    label: 'Soundcheck',
    cost: MODIFIER_COSTS.soundcheck,
    desc: 'Notes Easier'
  },
  {
    key: 'promo',
    label: 'Social Promo',
    cost: MODIFIER_COSTS.promo,
    desc: '+Crowd Fill'
  },
  {
    key: 'merch',
    label: 'Merch Table',
    cost: MODIFIER_COSTS.merch,
    desc: '+Sales'
  },
  {
    key: 'catering',
    label: 'Catering / Energy',
    cost: MODIFIER_COSTS.catering,
    desc: 'Counters Tired Band Penalty'
  },
  {
    key: 'guestlist',
    label: 'Guest List',
    cost: MODIFIER_COSTS.guestlist,
    desc: '+VIP Score'
  }
]

/**
 * Scene for preparing for a gig: managing budget, setlist, and modifiers.
 */
export const PreGig = () => {
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
    startRoadieMinigame
  } = useGameState()
  const [isStarting, setIsStarting] = useState(false)
  const currentModifiers = getGigModifiers(band, gigModifiers)

  useEffect(() => {
    if (!currentGig) {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      addToast('No gig active! Returning to map.', 'error')
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      changeScene('OVERWORLD')
    }
  }, [currentGig, changeScene, addToast])

  /**
   * Triggers a band meeting event to boost harmony.
   */
  const handleBandMeeting = () => {
    const cost = 50
    if (player.money < cost) {
      addToast('Not enough money for snacks!', 'error')
      return
    }

    updatePlayer({ money: Math.max(0, player.money - cost) })
    updateBand({ harmony: Math.min(100, band.harmony + 15) })
    addToast('Meeting held. Vibes are better.', 'success')
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
    if (setlist.find(s => getSongId(s) === song.id)) {
      setSetlist(setlist.filter(s => getSongId(s) !== song.id))
    } else {
      if (setlist.length < 3) {
        // Store only minimal info to save memory/localStorage
        setSetlist([...setlist, { id: song.id }])
      }
    }
  }

  const calculatedBudget = useMemo(() => {
    return Object.entries(gigModifiers).reduce((acc, [key, active]) => {
      if (!active) return acc
      return acc + (MODIFIER_COSTS[key] || 0)
    }, 0)
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
          addToast('Not enough money for this upgrade!', 'error')
          return
        }
      }

      setGigModifiers({ [key]: !isActive })
    },
    [gigModifiers, calculatedBudget, player.money, addToast, setGigModifiers]
  )

  return (
    <div className='w-full h-full flex flex-col items-center justify-center p-8 bg-(--void-black) text-(--star-white) relative'>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center mb-6'
      >
        <h2 className="text-4xl text-(--toxic-green) font-['Metal_Mania'] mb-2">
          PREPARATION
        </h2>
        <div className='w-48 h-[1px] bg-gradient-to-r from-transparent via-(--toxic-green) to-transparent mx-auto mb-3' />
        <div className='text-lg mb-1 font-mono text-(--star-white)/80'>
          {currentGig?.name}
        </div>
        <div className='font-mono text-xs text-(--ash-gray) flex items-center justify-center gap-3'>
          <span>
            BUDGET:{' '}
            <span className='text-(--toxic-green) font-bold tabular-nums'>
              {player.money}€
            </span>
          </span>
          <span className='text-(--ash-gray)/30'>|</span>
          <span>
            COSTS:{' '}
            <span className='text-(--blood-red) font-bold tabular-nums'>
              -{calculatedBudget}€
            </span>
          </span>
        </div>
      </motion.div>

      <div className='grid grid-cols-2 gap-6 w-full max-w-4xl h-[58vh]'>
        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className='border-2 border-(--ash-gray)/40 p-4 bg-(--void-black)/70 backdrop-blur-sm overflow-y-auto'
        >
          <h3 className='text-sm text-(--toxic-green) mb-3 tracking-widest font-mono border-b border-(--toxic-green)/30 pb-2'>
            BUDGET ALLOCATION
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

            <div className='border-t border-(--ash-gray)/20 pt-2.5'>
              <button
                onClick={handleBandMeeting}
                className='w-full flex justify-between items-center p-3 border-2 border-(--warning-yellow)/30 hover:border-(--warning-yellow) text-(--warning-yellow)/70 hover:text-(--warning-yellow) transition-all group'
              >
                <span className='flex flex-col text-left'>
                  <span className='font-bold text-sm'>Band Meeting</span>
                  <span className='text-[10px] opacity-70'>+Harmony</span>
                </span>
                <span className='font-mono text-sm font-bold tabular-nums'>
                  50€
                </span>
              </button>
            </div>
          </div>

          {/* Active Modifiers Display */}
          <div className='mt-3 p-3 bg-(--toxic-green)/5 border border-(--toxic-green)/30'>
            <h4 className='text-[10px] font-bold text-(--toxic-green) mb-2 tracking-widest'>
              ACTIVE MODIFIERS
            </h4>
            {currentModifiers.activeEffects.length > 0 ? (
              <ul className='text-xs space-y-1'>
                {currentModifiers.activeEffects.map(eff => (
                  <li
                    key={eff}
                    className='text-(--star-white)/60 flex items-center gap-1.5'
                  >
                    <span className='w-1 h-1 bg-(--toxic-green) inline-block' />
                    {eff}
                  </li>
                ))}
              </ul>
            ) : (
              <div className='text-[10px] text-(--ash-gray)/50 italic'>
                No active buffs or debuffs
              </div>
            )}
          </div>
        </motion.div>

        {/* Setlist */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className='border-2 border-(--ash-gray)/40 p-4 bg-(--void-black)/70 backdrop-blur-sm flex flex-col'
        >
          <h3 className='text-sm text-(--toxic-green) mb-3 tracking-widest font-mono border-b border-(--toxic-green)/30 pb-2 flex justify-between'>
            <span>SETLIST</span>
            <span className='tabular-nums'>{setlist.length}/3</span>
          </h3>
          <div className='flex-1 overflow-y-auto pr-2 space-y-2'>
            {SONGS_DB.map(song => {
              const isSelected = setlist.find(s => getSongId(s) === song.id)
              const isLocked =
                player?.stats?.proveYourselfMode && song.difficulty > 2

              return (
                <div
                  key={song.id}
                  role='button'
                  tabIndex={isLocked ? -1 : 0}
                  aria-label={`Select song ${song.name}`}
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
                        ? 'border-(--toxic-green) bg-(--toxic-green)/10 text-(--toxic-green) shadow-[0_0_8px_var(--toxic-green-20)]'
                        : isLocked
                          ? 'border-(--blood-red)/30 bg-(--blood-red)/10 text-(--blood-red)/50'
                          : 'border-(--ash-gray)/20 hover:border-(--star-white)/40 text-(--ash-gray)'
                    }`}
                >
                  <div>
                    <div className='font-bold text-sm'>
                      {song.name}{' '}
                      {isLocked && (
                        <span className='text-[10px] text-(--blood-red) ml-2 border border-(--blood-red)/50 px-1'>
                          LOCKED (Prove Yourself)
                        </span>
                      )}
                    </div>
                    <div className='text-[10px] font-mono mt-0.5 flex gap-2'>
                      <span>{song.duration}s</span>
                      <span className='text-(--ash-gray)/40'>|</span>
                      <span>Diff: {'*'.repeat(song.difficulty)}</span>
                    </div>
                  </div>
                  <div className='flex flex-col items-end gap-1'>
                    <div className='flex items-center gap-1.5'>
                      <span className='text-[9px] text-(--ash-gray)/50 uppercase tracking-wider'>
                        NRG
                      </span>
                      <div className='w-14 h-1.5 bg-(--shadow-black) overflow-hidden border border-(--ash-gray)/20'>
                        <div
                          className={`h-full transition-all ${isSelected ? 'bg-(--toxic-green)' : 'bg-(--blood-red)/60'}`}
                          style={{ width: `${song.energy.peak}%` }}
                        />
                      </div>
                    </div>
                    {isSelected && (
                      <span className='text-[9px] text-(--toxic-green) tracking-wider'>
                        SELECTED
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Curve Visualization */}
          <div className='mt-3 h-14 border-t border-(--ash-gray)/20 pt-2 flex items-end justify-between gap-1'>
            {setlist.map((s, i) => {
              const id = getSongId(s)
              const songData = SONGS_DB.find(dbSong => dbSong.id === id) || {
                energy: { peak: 50 }
              }
              return (
                <motion.div
                  key={id}
                  initial={{ height: 0 }}
                  animate={{ height: `${songData.energy?.peak || 50}%` }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className='flex-1 bg-gradient-to-t from-(--toxic-green) to-(--toxic-green)/40 relative group cursor-default'
                >
                  <div className='absolute -top-4 left-0 text-[10px] w-full text-center opacity-0 group-hover:opacity-100 transition-opacity text-(--star-white) tabular-nums'>
                    {songData.energy?.peak}%
                  </div>
                </motion.div>
              )
            })}
            {setlist.length === 0 && (
              <div className='text-(--ash-gray)/30 text-[10px] w-full text-center font-mono'>
                Select songs to preview energy curve
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='mt-6 px-12 py-4 bg-(--toxic-green) text-black font-bold text-2xl uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-[4px_4px_0px_var(--blood-red)] hover:shadow-[6px_6px_0px_var(--blood-red)] flex items-center justify-center gap-4'
        disabled={setlist.length === 0 || isStarting}
        onClick={async () => {
          if (band.harmony < 10) {
            addToast('Band harmony too low to perform!', 'error')
            return
          }
          setIsStarting(true)
          try {
            await audioManager.ensureAudioContext()
            // Safe access for ID
            const gigId = currentGig?.id || `gig_${Date.now()}`
            startRoadieMinigame(gigId)
          } catch (err) {
            setIsStarting(false)
            handleError(err, {
              addToast,
              fallbackMessage: 'Audio initialization failed.'
            })
          }
        }}
      >
        {!isStarting && <RazorPlayIcon className="w-8 h-8 text-(--void-black)" />}
        {isStarting ? 'INITIALIZING...' : 'START SHOW'}
      </motion.button>
    </div>
  )
}
