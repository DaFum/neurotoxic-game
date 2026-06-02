import { lazy, Suspense } from 'react'
import type { RhythmGameRefState } from '../../../types/rhythmGame'
import type { PixiStageProps } from '../../../types/components'
import { BandMembersLayer } from './BandMembersLayer'
import { PauseOverlay } from './PauseOverlay'
import { GigHUD } from '../../GigHUD'
import { createPixiStageController } from '../../PixiStageController'

const PixiStage = lazy(async () => {
  const { PixiStage: LoadedPixiStage } = await import('../../PixiStage')
  const RhythmPixiStage = (props: PixiStageProps<RhythmGameRefState>) => (
    <LoadedPixiStage<RhythmGameRefState> {...props} />
  )
  return { default: RhythmPixiStage }
})

export type GigViewProps = {
  chaosContainerRef: React.RefObject<HTMLDivElement | null>
  chaosStyle: React.CSSProperties
  isToxicMode: boolean
  bgUrl: string
  matzeUrl: string
  mariusUrl: string
  larsUrl: string
  setBandMemberRef: (index: number) => (el: HTMLElement | null) => void
  t: import('i18next').TFunction<'translation', undefined>
  gameStateRef: React.MutableRefObject<RhythmGameRefState>
  update: (delta: number) => void
  stats: import('../../../hooks/rhythmGame/useRhythmGameState').RhythmUiState
  handleLaneInput: (laneIndex: number, isDown: boolean) => void
  handleTogglePause: () => void
  isPaused: boolean
  handleQuitGig: () => Promise<void>
}

export const GigView = ({
  chaosContainerRef,
  chaosStyle,
  isToxicMode,
  bgUrl,
  matzeUrl,
  mariusUrl,
  larsUrl,
  setBandMemberRef,
  t,
  gameStateRef,
  update,
  stats,
  handleLaneInput,
  handleTogglePause,
  isPaused,
  handleQuitGig
}: GigViewProps) => {
  return (
    <div
      ref={chaosContainerRef}
      className={`w-full h-full relative bg-void-black flex flex-col overflow-hidden ${isToxicMode ? 'border-4 border-toxic-green' : ''}`}
      style={chaosStyle}
    >
      {/* Layer 0: Background */}
      <div
        className='absolute inset-0 z-0 bg-cover bg-center opacity-50'
        style={{ backgroundImage: `url("${bgUrl}")` }}
      />

      {/* Layer 1: Band Members (DOM) */}
      <BandMembersLayer
        matzeUrl={matzeUrl}
        mariusUrl={mariusUrl}
        larsUrl={larsUrl}
        setBandMemberRef={setBandMemberRef}
      />

      {/* Layer 2: Pixi Canvas (Notes) */}
      <Suspense
        fallback={
          <div className='w-full h-full flex items-center justify-center bg-void-black text-ash-gray text-xl'>
            {t('ui:loading_stage', { defaultValue: 'Loading Stage...' })}
          </div>
        }
      >
        <PixiStage
          gameStateRef={gameStateRef}
          update={update}
          controllerFactory={createPixiStageController}
        />
      </Suspense>

      {/* Layer 3 & 4: HUD & Inputs */}
      <GigHUD
        stats={stats}
        gameStateRef={gameStateRef}
        onLaneInput={handleLaneInput}
        onTogglePause={handleTogglePause}
      />

      {/* Pause Overlay */}
      <PauseOverlay
        isPaused={isPaused}
        onResume={handleTogglePause}
        onQuit={handleQuitGig}
      />
    </div>
  )
}
