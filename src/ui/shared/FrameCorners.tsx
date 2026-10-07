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
  /**
   * Shifts the corners 4px past the parent's padding box so they sit on the
   * outer edge of a `border-4` frame instead of inside it.
   */
  outset?: boolean
}

/**
 * Renders the four rotated corner markers flush to the parent's edges.
 * @param props - Shared corner classes, an optional top-left override for accent corners, and an outset flag for bordered frames.
 */
export const FrameCorners = memo(function FrameCorners({
  className = '',
  topLeftClassName,
  outset = false
}: FrameCornersProps) {
  return (
    <>
      <UIFrameCorner
        className={`absolute ${outset ? '-top-1 -left-1' : 'top-0 left-0'} ${topLeftClassName ?? className}`}
      />
      <UIFrameCorner
        className={`absolute ${outset ? '-top-1 -right-1' : 'top-0 right-0'} rotate-90 ${className}`}
      />
      <UIFrameCorner
        className={`absolute ${outset ? '-bottom-1 -right-1' : 'bottom-0 right-0'} rotate-180 ${className}`}
      />
      <UIFrameCorner
        className={`absolute ${outset ? '-bottom-1 -left-1' : 'bottom-0 left-0'} -rotate-90 ${className}`}
      />
    </>
  )
})
