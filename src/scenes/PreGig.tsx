import { SONGS_DB } from '../data/songs'
import { GigModifiersBlock } from '../components/pregig/GigModifiersBlock'
import { SetlistBlock } from '../components/pregig/SetlistBlock'
import { MerchStrategyBlock } from '../components/pregig/MerchStrategyBlock'
import { useState, type KeyboardEvent } from 'react'
import { PreGigHeader } from '../components/pregig/PreGigHeader'
import { PreGigStartButton } from '../components/pregig/PreGigStartButton'
import { usePreGigLogic } from '../hooks/usePreGigLogic'

const SONGS_DICT = Object.create(null)
for (let i = 0; i < SONGS_DB.length; i++) {
  const song = SONGS_DB[i]
  if (!song) continue
  SONGS_DICT[song.id] = song
}

/**
 * Scene for preparing for a gig: managing budget, setlist, and modifiers.
 */
export const PreGig = () => {
  const [activeTab, setActiveTab] = useState<'logistics' | 'merch'>('logistics')

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const tabsList: Array<'logistics' | 'merch'> = ['logistics', 'merch']
    let nextIndex: number

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (index + 1) % tabsList.length
        break
      case 'ArrowLeft':
        nextIndex = (index - 1 + tabsList.length) % tabsList.length
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = tabsList.length - 1
        break
      default:
        return
    }

    const nextTab = tabsList[nextIndex]
    if (!nextTab) return

    event.preventDefault()
    setActiveTab(nextTab)

    const tabListEl = event.currentTarget.closest('[role="tablist"]')
    const nextTabEl =
      tabListEl?.querySelectorAll<HTMLElement>('[role="tab"]')[nextIndex]
    nextTabEl?.focus()
  }
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
    isStartBlocked,
    GIG_MODIFIER_OPTIONS,
    bandMeetingCost,
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
        <div
          role='tablist'
          aria-label={t('ui:pregig.tabs.title', {
            defaultValue: 'Pre-Gig Navigation'
          })}
          className='flex gap-4 border-b border-concrete-gray pb-2 mb-4'
        >
          <button
            type='button'
            role='tab'
            id='tab-logistics'
            aria-selected={activeTab === 'logistics'}
            aria-controls='panel-logistics'
            tabIndex={activeTab === 'logistics' ? 0 : -1}
            className={`font-mono uppercase px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black ${
              activeTab === 'logistics'
                ? 'bg-toxic-green text-void-black font-bold'
                : 'text-ash-gray hover:text-toxic-green'
            }`}
            onClick={() => setActiveTab('logistics')}
            onKeyDown={e => handleTabKeyDown(e, 0)}
          >
            {t('ui:pregig.tabs.logistics')}
          </button>
          <button
            type='button'
            role='tab'
            id='tab-merch'
            aria-selected={activeTab === 'merch'}
            aria-controls='panel-merch'
            tabIndex={activeTab === 'merch' ? 0 : -1}
            className={`font-mono uppercase px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black ${
              activeTab === 'merch'
                ? 'bg-toxic-green text-void-black font-bold'
                : 'text-ash-gray hover:text-toxic-green'
            }`}
            onClick={() => setActiveTab('merch')}
            onKeyDown={e => handleTabKeyDown(e, 1)}
          >
            {t('ui:pregig.tabs.merch')}
          </button>
        </div>

        <div
          role='tabpanel'
          id='panel-logistics'
          aria-labelledby='tab-logistics'
          tabIndex={0}
          hidden={activeTab !== 'logistics'}
          className={`grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 h-auto lg:h-[58svh] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black ${
            activeTab !== 'logistics' ? 'hidden' : ''
          }`}
        >
          <GigModifiersBlock
            t={t}
            gigModifierOptions={GIG_MODIFIER_OPTIONS}
            gigModifiers={gigModifiers}
            toggleModifier={toggleModifier}
            handleBandMeeting={handleBandMeeting}
            bandMeetingCost={bandMeetingCost}
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

        <div
          role='tabpanel'
          id='panel-merch'
          aria-labelledby='tab-merch'
          tabIndex={0}
          hidden={activeTab !== 'merch'}
          className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black ${
            activeTab !== 'merch' ? 'hidden' : ''
          }`}
        >
          <MerchStrategyBlock
            bandInventory={band?.inventory ?? {}}
            customPrices={band?.merchPrices ?? {}}
            onUpdatePrice={handleUpdateMerchPrice}
            onRestock={handleRestockMerch}
            restockCostMultiplier={assetModifiers.merchCostMultiplier}
            merchCapacityBonus={assetModifiers.merchCapacityBonus}
            playerMoney={player.money ?? 0}
          />
        </div>
      </div>

      <PreGigStartButton
        t={t}
        isStarting={isStarting}
        isSetlistEmpty={setlist.length === 0}
        isStartBlocked={isStartBlocked}
        onStartShow={handleStartShow}
      />
    </div>
  )
}
