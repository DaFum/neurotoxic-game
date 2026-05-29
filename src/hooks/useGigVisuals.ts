import { useMemo } from 'react'
import { IMG_PROMPTS, resolveGenImageUrl } from '../utils/imageGen'
import type { Venue } from '../types'

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

import { useNetworkStatus } from './useNetworkStatus'

export const useGigVisuals = ({
  currentGig,
  bandHarmony
}: UseGigVisualsProps): UseGigVisualsReturn => {
  const isOnline = useNetworkStatus()

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
      typeof currentGig?.difficulty === 'number' &&
      currentGig.difficulty <= 2
    )
      bgPrompt = IMG_PROMPTS.VENUE_DIVE_BAR
    else if (
      typeof currentGig?.difficulty === 'number' &&
      currentGig.difficulty >= 5
    )
      bgPrompt = IMG_PROMPTS.VENUE_GALACTIC

    return resolveGenImageUrl(bgPrompt, isOnline)
  }, [currentGig?.name, currentGig?.difficulty, isOnline])

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
      matzeUrl: resolveGenImageUrl(matzePrompt, isOnline),
      mariusUrl: resolveGenImageUrl(mariusPrompt, isOnline),
      larsUrl: resolveGenImageUrl(larsPrompt, isOnline)
    }
  }, [bandHarmony, isOnline])

  return { bgUrl, matzeUrl, mariusUrl, larsUrl }
}
