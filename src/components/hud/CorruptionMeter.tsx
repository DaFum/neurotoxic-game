import { memo } from 'react'

import { BlockMeter } from '../../ui/shared'

interface CorruptionMeterProps {
  corruptionLevel: number
  isCorruptionBurstActive: boolean
}

export const CorruptionMeter = memo(function CorruptionMeter({
  corruptionLevel,
  isCorruptionBurstActive
}: CorruptionMeterProps) {
  return (
    <div className='mt-3 w-48 bg-void-black/80 p-2 border border-blood-red/30 backdrop-blur-sm'>
      {isCorruptionBurstActive ? (
        <div className='text-blood-red font-bold text-sm tracking-widest text-center animate-pulse'>
          BURST ARMED
        </div>
      ) : (
        <BlockMeter
          label='DECIBEL CORRUPTION'
          value={Math.min(10, Math.max(0, Math.floor(corruptionLevel / 10)))}
          max={10}
          isDanger={corruptionLevel > 80}
        />
      )}
    </div>
  )
})
