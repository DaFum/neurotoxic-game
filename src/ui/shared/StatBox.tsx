/**
 * Shared stat display primitive used across overview and HQ surfaces.
 */

import { memo, type ReactNode } from 'react'

import { FrameCorners } from './FrameCorners'

/**
 * StatBox - Displays a single statistic with an icon
 * @param props - Statistic label, display value, icon, and optional wrapper classes.
 */
interface StatBoxProps {
  label: string
  value: string | number
  icon: ReactNode
  className?: string
}

/**
 * Displays a labeled stat value with optional icon and color styling.
 * @param props - Statistic label, display value, icon, and optional wrapper classes.
 */
export const StatBox = memo(function StatBox({
  label,
  value,
  icon,
  className = ''
}: StatBoxProps) {
  return (
    <div
      className={`relative bg-charcoal-gray p-3 flex flex-col items-center justify-center border border-steel-gray group overflow-hidden ${className}`}
    >
      <FrameCorners className='w-3 h-3 text-steel-gray opacity-30 transition-opacity group-hover:opacity-60' />

      <div className='relative flex flex-col items-center'>
        <div className='text-2xl mb-1 text-toxic-green-bright'>{icon}</div>
        <div className='text-xl font-bold text-star-white font-mono'>
          {value}
        </div>
        <div className='text-xs text-ash-gray uppercase font-mono'>{label}</div>
      </div>
    </div>
  )
})
