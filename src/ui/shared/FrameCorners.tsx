/**
 * Shared four-corner frame ornament used by framed brutalist surfaces.
 */

import { memo } from 'react'

import { UIFrameCorner } from './Icons'

interface FrameCornersProps {
  className?: string
  topLeftClassName?: string
}

/**
 * Renders the four rotated corner markers flush to the parent's edges.
 * @param props - Shared corner classes and an optional top-left override for accent corners.
 */
export const FrameCorners = memo(function FrameCorners({
  className = '',
  topLeftClassName
}: FrameCornersProps) {
  return (
    <>
      <UIFrameCorner
        className={`absolute top-0 left-0 ${topLeftClassName ?? className}`}
      />
      <UIFrameCorner
        className={`absolute top-0 right-0 rotate-90 ${className}`}
      />
      <UIFrameCorner
        className={`absolute bottom-0 right-0 rotate-180 ${className}`}
      />
      <UIFrameCorner
        className={`absolute bottom-0 left-0 -rotate-90 ${className}`}
      />
    </>
  )
})
