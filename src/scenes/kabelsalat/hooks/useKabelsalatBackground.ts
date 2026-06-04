import { useState, useEffect } from 'react'
import { loadTexture } from '../../../components/stage/stageRenderUtils'
import { logger } from '../../../utils/logger'
import { IMG_PROMPTS, resolveGenImageUrl } from '../../../utils/imageGen'

/**
 * Loads the generated Kabelsalat background texture and falls back to the raw URL on texture failure.
 * @returns Background image URL once resolved, or `null` while pending.
 */
export const useKabelsalatBackground = () => {
  const [bgTextureUrl, setBgTextureUrl] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const fetchTexture = async () => {
      let rawUrl: string | undefined
      try {
        rawUrl = resolveGenImageUrl(IMG_PROMPTS.MINIGAME_KABELSALAT_BG)
        const texture = await loadTexture(rawUrl)
        if (isMounted && texture && texture.source && texture.source.resource) {
          setBgTextureUrl(texture.source.resource.src || rawUrl)
        } else if (isMounted) {
          setBgTextureUrl(rawUrl)
        }
      } catch (err) {
        logger.warn(
          'useKabelsalatBackground',
          'Failed to load Kabelsalat background texture',
          err
        )
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
