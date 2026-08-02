/**
 * Shared four-corner frame ornament used by framed brutalist surfaces.
 */

import { memo } from 'react'

import { UIFrameCorner } from './Icons'

interface FrameCornersProps {
  className?: string
  /**
   * Replaces (not extends) `className` on the top-left corner, so an accent
   * corner must repeat any shared sizing it needs. Merging the two would put
   * conflicting colour/opacity utilities on one element, where the winner is
   * decided by stylesheet order rather than by the caller.
   */
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
