import { useState, useEffect } from 'react'
import { logger } from '../../../utils/logger'
import { IMG_PROMPTS, resolveGenImageUrl } from '../../../utils/imageGen'

/** A stalled preload releases the URL after this delay, so the scene never stays hidden. */
const PRELOAD_TIMEOUT_MS = 10000

/**
 * Resolves the generated Kabelsalat background URL and preloads it with a browser `Image`,
 * so the CSS background is ready before the scene fades in.
 * @returns The resolved background URL once it loaded, failed, or stalled; `null` while
 * pending or when the URL cannot be resolved.
 */
export const useKabelsalatBackground = (): string | null => {
  const [bgUrl, setBgUrl] = useState<string | null>(null)

  useEffect(() => {
    let url: string
    try {
      url = resolveGenImageUrl(IMG_PROMPTS.MINIGAME_KABELSALAT_BG)
    } catch (err) {
      logger.warn(
        'useKabelsalatBackground',
        'Failed to resolve Kabelsalat background URL',
        err
      )
      return
    }

    const img = new Image()
    const detach = () => {
      clearTimeout(timer)
      img.onload = null
      img.onerror = null
    }
    const settle = () => {
      detach()
      setBgUrl(url)
    }
    img.onload = settle
    img.onerror = () => {
      logger.warn(
        'useKabelsalatBackground',
        `Failed to preload Kabelsalat background: ${url}`
      )
      settle()
    }
    const timer = setTimeout(() => {
      logger.warn(
        'useKabelsalatBackground',
        `Kabelsalat background preload timed out: ${url}`
      )
      settle()
    }, PRELOAD_TIMEOUT_MS)
    img.src = url

    return detach
  }, [])

  return bgUrl
}
