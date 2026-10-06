import { useTranslation } from 'react-i18next'

/**
 * Player-initiated exit control shared by every pre-gig minigame scene.
 *
 * @remarks
 * Positioned in the top-right corner of the nearest positioned ancestor. Other
 * top-right controls (for example the Roadie controls toggle) must sit below it.
 *
 * @param props - Click handler that forfeits the run and continues.
 * @returns A SKIP button.
 */
export const MinigameSkipButton = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation(['ui'])

  return (
    <button
      type='button'
      onClick={onClick}
      className='absolute top-4 right-4 z-(--z-modal) pointer-events-auto border-2 border-toxic-green/60 bg-void-black/70 px-3 py-1 text-sm text-toxic-green hover:bg-toxic-green/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'
    >
      {t('ui:minigames.skip', { defaultValue: 'SKIP' })}
    </button>
  )
}
