// TODO: Implement this
import { memo } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

export const GameOverOverlay = memo(function GameOverOverlay({ isGameOver }) {
  const { t } = useTranslation()
  if (!isGameOver) return null
  return (
    <div className='absolute inset-0 z-50 bg-void-black/90 flex flex-col items-center justify-center pointer-events-none'>
      <h1 className='text-7xl text-blood-red font-[Metal_Mania] animate-doom-zoom'>
        {t('ui:game-over.booed-off-stage', { defaultValue: 'BOOED OFF STAGE' })}
      </h1>
      <div className='mt-4 text-ash-gray font-mono text-sm animate-pulse tracking-widest'>
        {t('ui:game-over.crowd-spoken', {
          defaultValue: 'THE CROWD HAS SPOKEN'
        })}
      </div>
    </div>
  )
})

GameOverOverlay.propTypes = {
  isGameOver: PropTypes.bool
}
