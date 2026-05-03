export async function enterFullscreen() {
  const element = document.documentElement

  if (!document.fullscreenElement && element.requestFullscreen) {
    try {
      await element.requestFullscreen()
    } catch (err) {
      console.warn('Fullscreen request failed:', err)
    }
  }
}
