/*
 * (#1) Actual Updates: Refactored Overlays component to use sub-components.


 */
import PropTypes from 'prop-types'
import type { FC } from 'react'
import type { TFunction } from 'i18next'
import { ShockOverlay } from './overlays/ShockOverlay.tsx'
import { GameOverOverlay } from './overlays/GameOverOverlay.tsx'
import { PoweredOnOverlay } from './overlays/PoweredOnOverlay.tsx'

interface OverlaysProps {
  t: TFunction
  isShocked: boolean
  isGameOver: boolean
  isPoweredOn: boolean
  faultReason: string | null
  onAdvance: (isPowered: boolean) => void
}

export const Overlays: FC<OverlaysProps> = ({
  t,
  isShocked,
  isGameOver,
  isPoweredOn,
  faultReason,
  onAdvance
}) => {
  return (
    <>
      {isShocked && <ShockOverlay t={t} faultReason={faultReason ?? ''} />}
      {isGameOver && !isShocked && (
        <GameOverOverlay t={t} onAdvance={() => onAdvance(false)} />
      )}
      {isPoweredOn && <PoweredOnOverlay t={t} onAdvance={() => onAdvance(true)} />}
    </>
  )
}

Overlays.propTypes = {
  t: PropTypes.func.isRequired,
  isShocked: PropTypes.bool.isRequired,
  isGameOver: PropTypes.bool.isRequired,
  isPoweredOn: PropTypes.bool.isRequired,
  faultReason: PropTypes.string,
  onAdvance: PropTypes.func.isRequired
}
