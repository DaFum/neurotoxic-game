import React from 'react'
import { useGameState } from '../context/GameState'
import { SONGS_DB } from '../data/songs'
import { getGigModifiers } from '../utils/simulationUtils'
import { ChatterOverlay } from '../components/ChatterOverlay'
import { audioManager } from '../utils/AudioManager'
import { getSongId } from '../utils/songUtils'
import { handleError } from '../utils/errorHandler'

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
    addToast
  } = useGameState()
  const currentModifiers = getGigModifiers(band, gigModifiers)

  React.useEffect(() => {
    if (!currentGig) {
      addToast('No gig active! Returning to map.', 'error')
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

    updatePlayer({ money: player.money - cost })
    updateBand({ harmony: Math.min(100, band.harmony + 15) })
    addToast('Meeting held. Vibes are better.', 'success')
  }

  React.useEffect(() => {
    // Chance for a Pre-Gig event (Band or Gig category)
    if (!activeEvent) {
      const bandEvent = triggerEvent('band', 'pre_gig')
      if (!bandEvent) {
        triggerEvent('gig', 'pre_gig')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  /**
   * Toggles a gig modifier (budget item).
   * @param {string} key - The modifier key.
   * @param {number} cost - The estimated cost.
   */
  const toggleModifier = (key, cost) => {
    const isActive = gigModifiers[key]

    if (!isActive) {
      const projectedTotal = calculatedBudget + cost
      if (projectedTotal > player.money) {
        addToast('Not enough money for this upgrade!', 'error')
        return
      }
    }

    setGigModifiers({ [key]: !isActive })
  }

  const calculatedBudget = Object.entries(gigModifiers).reduce(
    (acc, [key, active]) => {
      if (!active) return acc
      const costMap = {
        soundcheck: 50,
        promo: 30,
        merch: 30,
        catering: 20,
        guestlist: 60
      }
      return acc + (costMap[key] || 0)
    },
    0
  )

  return (
    <div className='w-full h-full flex flex-col items-center justify-center p-8 bg-(--void-black) text-(--star-white) relative'>
      <div className='absolute bottom-8 left-8 z-20'>
        <ChatterOverlay staticPosition={true} />
      </div>
      <h2 className="text-4xl text-(--toxic-green) font-['Metal_Mania'] mb-4">
        PREPARATION
      </h2>
      <div className='text-xl mb-2 font-mono border-b border-(--toxic-green) pb-2 w-full max-w-2xl text-center'>
        VENUE: {currentGig?.name}
      </div>
      <div className='mb-6 font-mono text-sm text-(--ash-gray)'>
        ESTIMATED COSTS:{' '}
        <span className='text-(--blood-red)'>-{calculatedBudget}€</span>{' '}
        (Deducted after show)
      </div>

      <div className='grid grid-cols-2 gap-8 w-full max-w-4xl h-[60vh]'>
        {/* Actions */}
        <div className='border border-(--ash-gray) p-4 bg-(--void-black)/50 overflow-y-auto'>
          <h3 className='text-xl text-(--toxic-green) mb-4'>
            BUDGET ALLOCATION
          </h3>
          <div className='flex flex-col gap-4'>
            {[
              {
                key: 'soundcheck',
                label: 'Soundcheck',
                cost: 50,
                desc: 'Notes Easier'
              },
              {
                key: 'promo',
                label: 'Social Promo',
                cost: 30,
                desc: '+Crowd Fill'
              },
              { key: 'merch', label: 'Merch Table', cost: 30, desc: '+Sales' },
              {
                key: 'catering',
                label: 'Catering / Energy',
                cost: 20,
                desc: '+Stamina'
              },
              {
                key: 'guestlist',
                label: 'Guest List',
                cost: 60,
                desc: '+VIP Score'
              }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => toggleModifier(item.key, item.cost)}
                className={`flex justify-between items-center p-3 border transition-colors group
                        ${
                          gigModifiers[item.key]
                            ? 'bg-(--toxic-green) text-black border-(--toxic-green)'
                            : 'border-(--ash-gray) hover:border-(--star-white) text-(--ash-gray)'
                        }`}
              >
                <span className='flex flex-col text-left'>
                  <span className='font-bold'>{item.label}</span>
                  <span className='text-xs'>{item.desc}</span>
                </span>
                <span className='font-mono group-hover:font-bold'>
                  {item.cost}€
                </span>
              </button>
            ))}

            <button
              onClick={handleBandMeeting}
              className='flex justify-between items-center p-3 border border-(--ash-gray) hover:border-(--toxic-green) hover:text-(--toxic-green) transition-colors group'
            >
              <span className='flex flex-col text-left'>
                <span className='font-bold'>Band Meeting</span>
                <span className='text-xs'>Resolve Conflicts (+Harmony)</span>
              </span>
              <span className='font-mono group-hover:font-bold'>50€</span>
            </button>
          </div>

          {/* Active Modifiers Display */}
          <div className='mt-4 p-3 bg-(--toxic-green)/10 border border-(--toxic-green)'>
            <h4 className='text-sm font-bold text-(--toxic-green) mb-2 uppercase'>
              Current Vibe (Modifiers)
            </h4>
            {currentModifiers.activeEffects.length > 0 ? (
              <ul className='text-xs space-y-1'>
                {currentModifiers.activeEffects.map((eff, i) => (
                  <li key={i} className='text-(--star-white)/80'>
                    • {eff}
                  </li>
                ))}
              </ul>
            ) : (
              <div className='text-xs text-(--ash-gray)'>
                Neutral Vibe. No active buffs/debuffs.
              </div>
            )}
          </div>
        </div>

        {/* Setlist */}
        <div className='border border-(--ash-gray) p-4 bg-(--void-black)/50 flex flex-col'>
          <h3 className='text-xl text-(--toxic-green) mb-4'>
            SETLIST ({setlist.length}/3)
          </h3>
          <div className='flex-1 overflow-y-auto pr-2 space-y-2'>
            {SONGS_DB.map(song => {
              const isSelected = setlist.find(s => getSongId(s) === song.id)
              return (
                <div
                  key={song.id}
                  onClick={() => toggleSong(song)}
                  className={`p-3 border cursor-pointer flex justify-between items-center transition-all
                    ${
                      isSelected
                        ? 'border-(--toxic-green) bg-(--toxic-green)/10 text-(--toxic-green)'
                        : 'border-(--ash-gray) hover:border-(--star-white) text-(--ash-gray)'
                    }`}
                >
                  <div>
                    <div className='font-bold'>{song.name}</div>
                    <div className='text-xs'>
                      {song.duration}s | Diff: {song.difficulty}
                    </div>
                  </div>
                  <div className='flex flex-col items-end'>
                    <div className='flex gap-1'>
                      {/* Energy Bar */}
                      <div className='text-[10px] text-(--ash-gray) mr-2'>
                        NRG
                      </div>
                      <div className='w-16 h-2 bg-(--shadow-black)'>
                        <div
                          className='h-full bg-(--blood-red)'
                          style={{ width: `${song.energy.peak}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Curve Visualization */}
          <div className='mt-4 h-16 border-t border-(--ash-gray) pt-2 flex items-end justify-between gap-1'>
            {setlist.map((s, i) => {
              const id = getSongId(s)
              // Resolve full song object for display
              const songData = SONGS_DB.find(dbSong => dbSong.id === id) || {
                energy: { peak: 50 }
              }
              return (
                <div
                  key={i}
                  className='flex-1 bg-(--toxic-green) opacity-50 hover:opacity-100 transition-opacity relative group'
                  style={{ height: `${songData.energy?.peak || 50}%` }}
                >
                  <div className='absolute -top-4 left-0 text-[10px] w-full text-center hidden group-hover:block text-(--star-white)'>
                    {songData.energy?.peak}
                  </div>
                </div>
              )
            })}
            {setlist.length === 0 && (
              <div className='text-(--ash-gray) text-xs w-full text-center'>
                Select songs to see energy curve
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        className='mt-8 px-12 py-4 bg-(--toxic-green) text-black font-bold text-2xl uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed'
        disabled={setlist.length === 0}
        onClick={async () => {
          if (band.harmony < 10) {
            addToast('Band harmony too low to perform!', 'error')
            return
          }
          try {
            await audioManager.ensureAudioContext() // Unlock audio context on user interaction
            changeScene('GIG')
          } catch (err) {
            handleError(err, {
              addToast,
              fallbackMessage: 'Audio initialization failed.'
            })
          }
        }}
      >
        START SHOW
      </button>
    </div>
  )
}
