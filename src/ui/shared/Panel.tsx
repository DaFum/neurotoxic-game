/**
 * Shared framed panel shell used across brutalist UI surfaces.
 */

import { memo, type ReactNode } from 'react'

import { UIFrameCorner } from './Icons'

interface PanelProps {
  title?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

/**
 * Provides the shared framed panel shell with optional title and content layout classes.
 * @param props - Display data and visual options for the panel view.
 */
export const Panel = memo(function Panel({
  title,
  children,
  className = '',
  contentClassName = 'space-y-1'
}: PanelProps) {
  return (
    <div
      className={`relative bg-abyss-black border-4 border-steel-gray p-4 group overflow-hidden shadow-[4px_4px_0px_var(--color-steel-gray)] ${className}`}
    >
      {/* Brutalist Frame Corners */}
      <UIFrameCorner className='absolute top-0 left-0 w-6 h-6 text-steel-gray opacity-30 transition-opacity group-hover:opacity-60' />
      <UIFrameCorner className='absolute top-0 right-0 w-6 h-6 text-steel-gray rotate-90 opacity-30 transition-opacity group-hover:opacity-60' />
      <UIFrameCorner className='absolute bottom-0 right-0 w-6 h-6 text-steel-gray rotate-180 opacity-30 transition-opacity group-hover:opacity-60' />
      <UIFrameCorner className='absolute bottom-0 left-0 w-6 h-6 text-steel-gray -rotate-90 opacity-30 transition-opacity group-hover:opacity-60' />

      <div className='relative flex-1 min-h-0 flex flex-col'>
        {title && (
          <h3 className='text-toxic-green text-sm font-bold mb-3 border-b border-ash-gray/40 pb-1 font-mono uppercase tracking-wider'>
            {title}
          </h3>
        )}
        <div className={`flex-1 min-h-0 flex flex-col ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  )
})
