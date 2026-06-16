import type { DetailRowProps } from '../types'

export const DetailRow = ({
  label,
  value,
  subtext,
  locked,
  className = ''
}: DetailRowProps) => (
  <div
    className={`flex justify-between items-center py-1 border-b border-ash-gray/20 font-mono text-sm ${locked ? 'opacity-40 grayscale' : ''} ${className}`}
  >
    <span className='text-ash-gray'>{label}</span>
    <div className='text-right'>
      <div
        className={`font-bold ${locked ? 'text-ash-gray' : 'text-star-white'}`}
      >
        {value}
      </div>
      {subtext != null && (
        <div className='text-xs text-ash-gray/60'>{subtext}</div>
      )}
    </div>
  </div>
)
