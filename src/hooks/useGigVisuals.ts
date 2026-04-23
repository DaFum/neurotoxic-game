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
    else if (
      currentGig?.difficulty !== undefined &&
      currentGig.difficulty <= 2
    )
      bgPrompt = IMG_PROMPTS.VENUE_DIVE_BAR
    else if (
      currentGig?.difficulty !== undefined &&
      currentGig.difficulty >= 5
    )
      bgPrompt = IMG_PROMPTS.VENUE_GALACTIC
    // Note: the original code checked currentGig?.diff, but the interface says difficulty.
    // However we'll support both in case diff is an untyped alias
    else if (
      (currentGig as any)?.diff !== undefined &&
      (currentGig as any).diff <= 2
    )
      bgPrompt = IMG_PROMPTS.VENUE_DIVE_BAR
    else if (
      (currentGig as any)?.diff !== undefined &&
      (currentGig as any).diff >= 5
    )
      bgPrompt = IMG_PROMPTS.VENUE_GALACTIC

    return getGenImageUrl(bgPrompt)
  }, [
    currentGig?.name,
    currentGig?.difficulty,
    (currentGig as any)?.diff
  ])

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
