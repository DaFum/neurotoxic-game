import { afterEach, describe, expect, test, vi } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

const changeScene = vi.fn()

vi.mock('../../src/hooks/usePostGigLogic', () => ({
  usePostGigLogic: () => ({
    t: (_k, o) => o?.defaultValue ?? _k,
    phase: 'REPORT',
    financials: null,
    postOptions: [],
    postResult: null,
    brandOffers: [],
    phaseTitleKey: 'ui:postGig.title',
    phaseTitleDefault: 'POST GIG',
    social: {},
    player: {},
    pedalHarmonyPenalty: 0,
    changeScene,
    isProcessingAction: false,
    handlePostSelection: vi.fn(),
    handleAcceptDeal: vi.fn(),
    handleRejectDeals: vi.fn(),
    handleSpinStory: vi.fn(),
    handleContinue: vi.fn(),
    handleNextPhase: vi.fn()
  })
}))

vi.mock('../../src/utils/imageGen', () => ({
  resolveGenImageUrl: () => 'mock-url',
  IMG_PROMPTS: { POST_GIG_BG: 'mock-bg' }
}))

import { PostGig } from '../../src/scenes/PostGig'

afterEach(() => {
  cleanup()
  changeScene.mockClear()
})

describe('PostGig loading fallback', () => {
  test('renders return-to-overworld escape hatch when financials missing', async () => {
    render(<PostGig />)
    const button = screen.getByText('Back to Overworld')
    expect(button).toBeTruthy()
    await userEvent.click(button)
    expect(changeScene).toHaveBeenCalledWith('OVERWORLD')
  })
})
