import { logger } from './logger'

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
