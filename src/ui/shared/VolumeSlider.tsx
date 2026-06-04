import { memo } from 'react'
import type { ChangeEvent } from 'react'

import { SegmentedSlider } from './SegmentedSlider'

/**
 * Displays one labeled volume slider with percentage output.
 * @param props - Slider label, normalized volume value, and change handler.
 */
export const VolumeSlider = memo(function VolumeSlider({
  label,
  value,
  onChange
}: {
  label: string
  value: number
  onChange: (
    e: ChangeEvent<HTMLInputElement> | { target: { value: number } }
  ) => void
}) {
  const clampedValue = Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : 0
  const max = 10
  const val = Math.round(clampedValue * max)
  const pct = Math.round(clampedValue * 100)

  return (
    <SegmentedSlider
      label={label}
      inputValue={clampedValue}
      inputMin={0}
      inputMax={1}
      inputStep={0.1}
      activeSegments={val}
      segmentCount={max}
      valueLabel={`${pct}%`}
      onInputChange={onChange}
      onSegmentSelect={segment =>
        onChange({ target: { value: segment / max } })
      }
    />
  )
})
