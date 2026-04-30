import { useState, useEffect } from 'react'
import { loadTexture } from '../../../components/stage/utils'
import { logger } from '../../../utils/logger'
import {
  getGenImageUrl,
  IMG_PROMPTS,
  isImageGenerationAvailable,
  getGeneratedImageFallbackUrl
} from '../../../utils/imageGen'

export const useKabelsalatBackground = () => {
  const [bgTextureUrl, setBgTextureUrl] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const fetchTexture = async () => {
      let rawUrl: string | undefined
      try {
        rawUrl = isImageGenerationAvailable()
          ? getGenImageUrl(IMG_PROMPTS.MINIGAME_KABELSALAT_BG)
          : getGeneratedImageFallbackUrl()
        const texture = await loadTexture(rawUrl)
        if (isMounted && texture && texture.source && texture.source.resource) {
          setBgTextureUrl(texture.source.resource.src || rawUrl)
        } else if (isMounted) {
          setBgTextureUrl(rawUrl)
        }
      } catch (err) {
        logger.warn('Failed to load Kabelsalat background texture', err)
        if (isMounted && rawUrl) {
          setBgTextureUrl(rawUrl)
        }
      }
    }
    fetchTexture()
    return () => {
      isMounted = false
    }
  }, [])

  return bgTextureUrl
}
