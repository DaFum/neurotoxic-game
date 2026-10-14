import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// Only the post outcome is pinned; the reducer, quest engine and brand-offer
// generation all run for real so the regression covers the committed state.
vi.mock('../../src/utils/postGig', async importOriginal => ({
  ...(await importOriginal()),
  calculatePostGigStateUpdates: vi.fn()
}))

import { usePostGigLogic } from '../../src/hooks/usePostGigLogic'
import {
  GameStateProvider,
  useGameActions,
  useGameSelector
} from '../../src/context/GameState'
import { StorageProvider } from '../../src/context/StorageContext'
import { InMemoryAdapter } from '../../src/utils/storageAdapter'
import { resetStorageFallback } from '../../src/utils/storage'
import { calculatePostGigStateUpdates } from '../../src/utils/postGig'
import * as brandDealLogic from '../../src/utils/brandDealLogic'
import { createSocialTrendMatchedQuestEvent } from '../../src/quests/producers/socialQuestEvents'
import { QUEST_DAMAGE_CONTROL } from '../../src/data/questsConstants'

const renderPostGig = () => {
  const adapter = new InMemoryAdapter()
  const wrapper = ({ children }) => (
    <StorageProvider adapter={adapter}>
      <GameStateProvider>{children}</GameStateProvider>
    </StorageProvider>
  )
  return renderHook(
    () => ({
      logic: usePostGigLogic(),
      actions: useGameActions(),
      social: useGameSelector(state => state.social),
      activeQuests: useGameSelector(state => state.activeQuests)
    }),
    { wrapper }
  )
}

const damageControl = activeQuests =>
  activeQuests.find(quest => quest.id === QUEST_DAMAGE_CONTROL) ?? null

describe('post-gig brand offers after social-post quest rewards', () => {
  beforeEach(() => {
    resetStorageFallback()
    vi.spyOn(brandDealLogic, 'generateBrandOffers')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('evaluates offers against the controversy committed after a completed quest reward', async () => {
    const { result } = renderPostGig()

    // Hot scandal, then Damage Control one beat from completion.
    act(() => {
      result.current.actions.updateSocial({ controversyLevel: 60 })
    })
    act(() => {
      result.current.actions.addQuest({ id: QUEST_DAMAGE_CONTROL })
    })
    act(() => {
      for (let i = 0; i < 3; i++) {
        result.current.actions.applyQuestEvent(
          createSocialTrendMatchedQuestEvent({
            trendId: 'DRAMA',
            platform: 'instagram',
            postCategory: 'Drama'
          })
        )
      }
    })
    expect(damageControl(result.current.activeQuests)?.progress).toBe(3)

    // The post projects controversy 45. Its controversy drop is the fourth
    // beat, so Damage Control completes and its -10 reward commits 35, under
    // corp_fast_food's maxControversy of 40.
    calculatePostGigStateUpdates.mockReturnValue({
      finalResult: { success: true, platform: 'instagram', followers: 0 },
      newBand: {},
      hasBandUpdates: false,
      appliedHarmonyDelta: 0,
      nextMoney: 500,
      appliedMoneyDelta: 0,
      updatedSocial: { controversyLevel: 45 }
    })

    act(() => {
      result.current.logic.handlePostSelection({
        id: 'regression_post',
        platform: 'instagram',
        category: 'Lifestyle'
      })
    })

    await waitFor(() => {
      expect(['DEALS', 'COMPLETE']).toContain(result.current.logic.phase)
    })
    expect(damageControl(result.current.activeQuests)).toBeNull()
    expect(result.current.social.controversyLevel).toBe(35)

    expect(brandDealLogic.generateBrandOffers).toHaveBeenCalledTimes(1)
    const [offerState] = brandDealLogic.generateBrandOffers.mock.calls[0]
    expect(offerState.social.controversyLevel).toBe(35)
  })
})
