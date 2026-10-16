import { memo, useCallback } from 'react'
import type { ChangeEvent } from 'react'

import { SegmentedSlider } from './SegmentedSlider'
import { clampUnit } from '../../utils/numberUtils'

/**
 * Displays one labeled volume slider with percentage output.
 * @param props - Slider label, normalized volume value, numeric change handler, and optional ARIA description ID.
 */
export const VolumeSlider = memo(function VolumeSlider({
  label,
  value,
  onChange,
  ariaDescribedBy
}: {
  label: string
  value: number
  /** Receives the new volume, always finite and clamped to `0..1`. */
  onChange: (value: number) => void
  ariaDescribedBy?: string
}) {
  const clampedValue = Number.isFinite(value) ? clampUnit(value) : 0
  const max = 10
  const val = Math.round(clampedValue * max)
  const pct = Math.round(clampedValue * 100)

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const parsed = parseFloat(e.target.value)
      if (!Number.isFinite(parsed)) return
      onChange(clampUnit(parsed))
    },
    [onChange]
  )

  const handleSegmentSelect = useCallback(
    (segment: number) => onChange(clampUnit(segment / max)),
    [onChange]
  )

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
      ariaDescribedBy={ariaDescribedBy}
      onInputChange={handleInputChange}
      onSegmentSelect={handleSegmentSelect}
    />
  )
})
