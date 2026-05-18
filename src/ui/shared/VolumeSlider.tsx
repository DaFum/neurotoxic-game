import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ChangeEvent } from 'react'

import { SegmentedSlider } from './SegmentedSlider'

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
  const { t } = useTranslation(['ui'])
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
      getSegmentAriaLabel={segment =>
        t('ui:volume.set', { pct: Math.round((segment / max) * 100) })
      }
    />
  )
})
