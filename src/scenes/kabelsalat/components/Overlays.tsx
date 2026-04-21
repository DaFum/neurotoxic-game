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
}

export const Overlays: FC<OverlaysProps> = ({
  t,
  isShocked,
  isGameOver,
  isPoweredOn,
  faultReason
}) => {
  return (
    <>
      {isShocked && <ShockOverlay t={t} faultReason={faultReason ?? ''} />}
      {isGameOver && !isShocked && <GameOverOverlay t={t} />}
      {isPoweredOn && <PoweredOnOverlay t={t} />}
    </>
  )
}

Overlays.propTypes = {
  t: PropTypes.func.isRequired,
  isShocked: PropTypes.bool.isRequired,
  isGameOver: PropTypes.bool.isRequired,
  isPoweredOn: PropTypes.bool.isRequired,
  faultReason: PropTypes.string
}
