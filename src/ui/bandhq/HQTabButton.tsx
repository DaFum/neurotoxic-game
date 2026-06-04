import React from 'react'

/**
 * Type contract for HQTab Def.
 */
export interface HQTabDef {
  id: string
  key: string
  isLocked?: boolean
}

interface HQTabButtonProps {
  tab: HQTabDef
  isActive: boolean
  label: string
  onClick: () => void
}

/**
 * Renders the HQ Tab Button view.
 * @param props - Tab id, active state, label, and tab selection callback.
 */
export const HQTabButton = ({
  tab,
  isActive,
  label,
  onClick
}: HQTabButtonProps) => (
  <button
    type='button'
    role='tab'
    aria-selected={isActive}
    aria-controls={`panel-${tab.id}`}
    id={`tab-${tab.id}`}
    onClick={onClick}
    disabled={tab.isLocked}
    className={`flex-1 w-full min-w-[6.5rem] sm:min-w-32 py-2 sm:py-3 px-3 sm:px-4 text-center text-xs sm:text-sm font-bold tracking-[0.1em] uppercase transition-all duration-150 font-mono flex justify-center items-center gap-2 whitespace-normal break-words [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset
      ${tab.isLocked ? 'opacity-50 grayscale' : ''}
      ${
        isActive
          ? 'bg-toxic-green text-void-black focus-visible:ring-void-black'
          : 'bg-void-black text-toxic-green border-r-2 border-l-2 border-transparent hover:border-toxic-green hover:bg-toxic-green hover:text-void-black focus-visible:ring-toxic-green'
      }`}
  >
    {isActive && <span className='text-xs'>▶</span>}
    {label}
  </button>
)
