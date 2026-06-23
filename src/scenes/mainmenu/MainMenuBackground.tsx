import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { IMG_PROMPTS, resolveGenImageUrl } from '../../utils/imageGen'

/**
 * Draws the animated, non-interactive main-menu background layer.
 */
export const MainMenuBackground = () => {
  const isOnline = useNetworkStatus()
  return (
    <>
      {/* Dynamic Background */}
      <div
        className='absolute inset-0 z-0 opacity-40 bg-cover bg-center pointer-events-none'
        style={{
          backgroundImage: `url("${resolveGenImageUrl(IMG_PROMPTS.MAIN_MENU_BG, isOnline)}")`
        }}
      />
      <div className='absolute inset-0 z-0 bg-gradient-to-b from-void-black/0 to-void-black/90 pointer-events-none' />
      <div
        className='absolute inset-0 z-0 pointer-events-none mix-blend-overlay opacity-30'
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, var(--color-void-black) 2px, var(--color-void-black) 4px)'
        }}
        aria-hidden='true'
      />

      {/* Atmosphere: slow scanning bar */}
      <div
        aria-hidden='true'
        className='absolute inset-x-0 top-0 h-24 z-0 pointer-events-none animate-scan-bar'
        style={{
          background:
            'linear-gradient(to bottom, transparent, var(--color-toxic-green-10) 45%, var(--color-toxic-green-20) 50%, var(--color-toxic-green-10) 55%, transparent)'
        }}
      />
    </>
  )
}
