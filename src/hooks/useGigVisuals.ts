import { useMemo } from 'react'
import { IMG_PROMPTS, getGenImageUrl } from '../utils/imageGen'
import type { Venue } from '../types/game'

type UseGigVisualsProps = {
  currentGig: Venue | null
  bandHarmony: number
}

type UseGigVisualsReturn = {
  bgUrl: string
  matzeUrl: string
  mariusUrl: string
  larsUrl: string
}

export const useGigVisuals = ({
  currentGig,
  bandHarmony
}: UseGigVisualsProps): UseGigVisualsReturn => {
    // Determine Background URL
  const bgUrl = useMemo(() => {
    let bgPrompt = IMG_PROMPTS.VENUE_CLUB
    if (currentGig?.name?.includes('Kaminstube'))
      bgPrompt = IMG_PROMPTS.VENUE_KAMINSTUBE
    else if (
      currentGig?.name?.includes('Festival') ||
      currentGig?.name?.includes('Open Air')
    )
      bgPrompt = IMG_PROMPTS.VENUE_FESTIVAL
    else if (typeof currentGig?.diff === 'number' && currentGig.diff <= 2)
      bgPrompt = IMG_PROMPTS.VENUE_DIVE_BAR
    else if (typeof currentGig?.diff === 'number' && currentGig.diff >= 5)
      bgPrompt = IMG_PROMPTS.VENUE_GALACTIC
    else if (currentGig?.difficulty !== undefined && currentGig.difficulty <= 2)
      bgPrompt = IMG_PROMPTS.VENUE_DIVE_BAR
    else if (currentGig?.difficulty !== undefined && currentGig.difficulty >= 5)
      bgPrompt = IMG_PROMPTS.VENUE_GALACTIC

    return getGenImageUrl(bgPrompt)
  }, [currentGig?.name, currentGig?.difficulty, currentGig?.diff])

  // Character Images based on Harmony
  const { matzeUrl, mariusUrl, larsUrl } = useMemo(() => {
    let matzePrompt = IMG_PROMPTS.MATZE_PLAYING
    let mariusPrompt = IMG_PROMPTS.MARIUS_PLAYING
    let larsPrompt = IMG_PROMPTS.LARS_PLAYING

    if (bandHarmony < 30) {
      matzePrompt = IMG_PROMPTS.MATZE_ANGRY
      mariusPrompt = IMG_PROMPTS.MARIUS_DRINKING
      larsPrompt = IMG_PROMPTS.LARS_IDLE
    } else if (bandHarmony < 60) {
      matzePrompt = IMG_PROMPTS.MATZE_ANGRY
      mariusPrompt = IMG_PROMPTS.MARIUS_PLAYING
      larsPrompt = IMG_PROMPTS.LARS_SCREAMING
    }

    return {
      matzeUrl: getGenImageUrl(matzePrompt),
      mariusUrl: getGenImageUrl(mariusPrompt),
      larsUrl: getGenImageUrl(larsPrompt)
    }
  }, [bandHarmony])

  return { bgUrl, matzeUrl, mariusUrl, larsUrl }
}
