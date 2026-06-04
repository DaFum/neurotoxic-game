import { useTranslation } from 'react-i18next'
import { GlitchButton } from '../../../ui/GlitchButton'

type AutoplayOverlayProps = {
  onPlay: () => void
}

/**
 * Renders the Autoplay Overlay scene from onPlay.
 * @param props - Playback callback for starting the intro video with sound.
 * @returns The rendered Autoplay Overlay UI.
 */
export const AutoplayOverlay = ({ onPlay }: AutoplayOverlayProps) => {
  const { t } = useTranslation()

  return (
    <div className='absolute inset-0 z-(--z-overlay) flex items-center justify-center bg-overlay'>
      <GlitchButton onClick={onPlay} className='scale-150'>
        {t('ui:intro_play')}
      </GlitchButton>
    </div>
  )
}
