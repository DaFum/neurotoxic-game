import { SONGS_DB } from '../data/songs'
import { GigModifiersBlock } from '../components/pregig/GigModifiersBlock'
import { SetlistBlock } from '../components/pregig/SetlistBlock'
import { MerchStrategyBlock } from '../components/pregig/MerchStrategyBlock'
import { useState } from 'react'
import { PreGigHeader } from '../components/pregig/PreGigHeader'
import { PreGigStartButton } from '../components/pregig/PreGigStartButton'
import { usePreGigLogic } from '../hooks/usePreGigLogic'

const SONGS_DICT = Object.create(null)
for (let i = 0; i < SONGS_DB.length; i++) {
  const song = SONGS_DB[i]
  SONGS_DICT[song.id] = song
}

/**
 * Scene for preparing for a gig: managing budget, setlist, and modifiers.
 */
export const PreGig = () => {
  const [activeTab, setActiveTab] = useState<'logistics' | 'merch'>('logistics')
  const {
    t,
    i18n,
    currentGig,
    player,
    setlist,
    gigModifiers,
    currentModifiers,
    band,
    handleUpdateMerchPrice,
    handleRestockMerch,
    selectedSongIds,
    calculatedBudget,
    isStarting,
    GIG_MODIFIER_OPTIONS,
    BAND_MEETING_COST,
    assetModifiers,
    handleBandMeeting,
    toggleSong,
    toggleModifier,
    handleStartShow
  } = usePreGigLogic()

  return (
    <div className='w-full h-full overflow-y-auto flex flex-col items-center justify-start lg:justify-center px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pt-28 sm:pt-32 lg:pt-8 pb-10 lg:pb-8 bg-void-black text-star-white relative'>
      <PreGigHeader
        t={t}
        i18n={i18n}
        currentGig={currentGig}
        player={player}
        calculatedBudget={calculatedBudget}
      />

      <div className='w-full max-w-5xl relative z-10'>
        <div className='flex gap-4 border-b border-(--color-concrete-gray) pb-2 mb-4'>
          <button
            type='button'
            className={`font-mono uppercase px-4 py-2 ${activeTab === 'logistics' ? 'bg-(--color-toxic-green) text-(--color-void-black)' : 'text-(--color-ash-gray) hover:text-(--color-toxic-green)'}`}
            aria-pressed={activeTab === 'logistics'}
            onClick={() => setActiveTab('logistics')}
          >
            {t('ui:pregig.tabs.logistics')}
          </button>
          <button
            type='button'
            className={`font-mono uppercase px-4 py-2 ${activeTab === 'merch' ? 'bg-(--color-toxic-green) text-(--color-void-black)' : 'text-(--color-ash-gray) hover:text-(--color-toxic-green)'}`}
            aria-pressed={activeTab === 'merch'}
            onClick={() => setActiveTab('merch')}
          >
            {t('ui:pregig.tabs.merch')}
          </button>
        </div>

        {activeTab === 'logistics' ? (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 h-auto lg:h-[58vh]'>
            <GigModifiersBlock
              t={t}
              gigModifierOptions={GIG_MODIFIER_OPTIONS}
              gigModifiers={gigModifiers}
              toggleModifier={toggleModifier}
              handleBandMeeting={handleBandMeeting}
              bandMeetingCost={BAND_MEETING_COST}
              currentModifiers={currentModifiers}
            />
            <SetlistBlock
              setlist={setlist}
              songsDb={SONGS_DB}
              songsDict={SONGS_DICT}
              selectedSongIds={selectedSongIds}
              player={player}
              toggleSong={toggleSong}
            />
          </div>
        ) : (
          <MerchStrategyBlock
            bandInventory={band.inventory || {}}
            customPrices={band.merchPrices || {}}
            onUpdatePrice={handleUpdateMerchPrice}
            onRestock={handleRestockMerch}
            restockCostMultiplier={assetModifiers.merchCostMultiplier}
          />
        )}
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
