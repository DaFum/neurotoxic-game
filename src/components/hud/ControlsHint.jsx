import { memo } from 'react'

const LANE_NAMES = ['Guitar', 'Drums', 'Bass']
const LANE_KEYS = ['←', '↓', '→']

export const ControlsHint = memo(function ControlsHint() {
  return (
    <div className='absolute bottom-3 w-full flex justify-center gap-8 z-10 pointer-events-none'>
      {LANE_NAMES.map((name, i) => (
        <div
          key={name}
          className='flex items-center gap-1.5 text-(--ash-gray)/60 font-mono text-xs'
        >
          <span className='border border-(--ash-gray)/30 px-1.5 py-0.5 text-[10px]'>
            {LANE_KEYS[i]}
          </span>
          <span className='uppercase tracking-wider'>{name}</span>
        </div>
      ))}
    </div>
  )
})
