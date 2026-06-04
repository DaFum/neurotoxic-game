import { logger } from './logger'

/**
 * Requests browser fullscreen mode for the document element when available.
 */
export async function enterFullscreen() {
  const element = document.documentElement

  if (!document.fullscreenElement && element.requestFullscreen) {
    try {
      await element.requestFullscreen()
    } catch (err) {
      logger.warn('Fullscreen', 'Fullscreen request failed', err)
    }
  }
}
