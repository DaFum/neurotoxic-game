import { memo } from 'react'
import type { ChangeEvent } from 'react'

type SliderSegmentProps = {
  segment: number
  isActive: boolean
  height: string
  onSelect: (segment: number) => void
}

const SliderSegment = memo(function SliderSegment({
  segment,
  isActive,
  height,
  onSelect
}: SliderSegmentProps) {
  return (
    <button
      type='button'
      onClick={() => onSelect(segment)}
      className='flex-1 relative h-full flex items-end group-hover:opacity-100 cursor-pointer'
      tabIndex={-1}
      aria-hidden='true'
    >
      <div
        style={{ height }}
        className={`w-full transition-colors duration-75 border-b-2 border-transparent hover:border-void-black
          ${isActive ? 'bg-toxic-green shadow-[0_0_8px_var(--color-toxic-green)]' : 'bg-toxic-green/20'}`}
      ></div>
    </button>
  )
})

type SegmentedSliderProps = {
  label: string
  inputValue: number
  inputMin: number
  inputMax: number
  inputStep: number
  activeSegments: number
  segmentCount: number
  valueLabel: string
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSegmentSelect: (segment: number) => void
}

/**
 * Renders the Segmented Slider view from label, inputValue, inputMin, inputMax, inputStep, activeSegments, segmentCount, valueLabel, onInputChange, and onSegmentSelect.
 * @param props - Numeric input bounds, segment count, active segment count, display label, and change handlers.
 * @returns The rendered Segmented Slider UI.
 */
export const SegmentedSlider = memo(function SegmentedSlider({
  label,
  inputValue,
  inputMin,
  inputMax,
  inputStep,
  activeSegments,
  segmentCount,
  valueLabel,
  onInputChange,
  onSegmentSelect
}: SegmentedSliderProps) {
  const safeSegmentCount =
    Number.isFinite(segmentCount) && segmentCount > 0
      ? Math.floor(segmentCount)
      : 1
  const segments = Array.from({ length: safeSegmentCount }, (_, i) => i + 1)

  return (
    <div className='w-full max-w-sm flex flex-col gap-2'>
      <div className='flex justify-between items-end'>
        <span
          className='text-xs tracking-widest uppercase opacity-80'
          aria-hidden='true'
        >
          {label}
        </span>
        <span className='text-sm font-bold text-toxic-green'>{valueLabel}</span>
      </div>
      <input
        type='range'
        min={inputMin}
        max={inputMax}
        step={inputStep}
        value={inputValue}
        onChange={onInputChange}
        aria-label={label}
        className='sr-only peer'
      />
      <div
        className='flex gap-1 h-8 items-end cursor-pointer group peer-focus-visible:ring-2 peer-focus-visible:ring-toxic-green peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-void-black -mx-1 px-1'
        role='presentation'
      >
        {segments.map(segment => {
          const isActive = segment <= activeSegments
          const height = `${30 + (segment / safeSegmentCount) * 70}%`
          return (
            <SliderSegment
              key={segment}
              segment={segment}
              isActive={isActive}
              height={height}
              onSelect={onSegmentSelect}
            />
          )
        })}
      </div>
    </div>
  )
})
