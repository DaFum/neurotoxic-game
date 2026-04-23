import { SONGS_DB } from '../data/songs'
import { GigModifiersBlock } from '../components/pregig/GigModifiersBlock'
import { SetlistBlock } from '../components/pregig/SetlistBlock'
import { PreGigHeader } from '../components/pregig/PreGigHeader'
import { PreGigStartButton } from '../components/pregig/PreGigStartButton'
import { usePreGigLogic } from '../hooks/usePreGigLogic'

export { _resetLastMinigameFallback } from '../hooks/usePreGigLogic'

const SONGS_DICT = Object.create(null)
for (let i = 0; i < SONGS_DB.length; i++) {
  const song = SONGS_DB[i]
  SONGS_DICT[song.id] = song
}

/**
 * Scene for preparing for a gig: managing budget, setlist, and modifiers.
 */
export const PreGig = () => {
  const {
    t,
    i18n,
    currentGig,
    player,
    setlist,
    gigModifiers,
    currentModifiers,
    selectedSongIds,
    calculatedBudget,
    isStarting,
    GIG_MODIFIER_OPTIONS,
    BAND_MEETING_COST,
    handleBandMeeting,
    toggleSong,
    toggleModifier,
    handleStartShow
  } = usePreGigLogic()

  return (
    <div className='w-full h-full overflow-y-auto flex flex-col items-center justify-start lg:justify-center px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pt-28 sm:pt-32 lg:pt-8 pb-24 lg:pb-8 bg-void-black text-star-white relative'>
      <PreGigHeader
        t={t}
        i18n={i18n}
        currentGig={currentGig}
        player={player}
        calculatedBudget={calculatedBudget}
      />

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full max-w-5xl h-auto lg:h-[58vh] relative z-10'>
        {/* Actions */}
        <GigModifiersBlock
          t={t}
          gigModifierOptions={GIG_MODIFIER_OPTIONS}
          gigModifiers={gigModifiers}
          toggleModifier={toggleModifier}
          handleBandMeeting={handleBandMeeting}
          bandMeetingCost={BAND_MEETING_COST}
          currentModifiers={currentModifiers}
        />

        {/* Setlist */}
        <SetlistBlock
          setlist={setlist}
          songsDb={SONGS_DB}
          songsDict={SONGS_DICT}
          selectedSongIds={selectedSongIds}
          player={player}
          toggleSong={toggleSong}
        />
      </div>

      <PreGigStartButton
        t={t}
        isStarting={isStarting}
        isSetlistEmpty={setlist.length === 0}
        onStartShow={handleStartShow}
      />
    </div>
  )
}

export default PreGig
