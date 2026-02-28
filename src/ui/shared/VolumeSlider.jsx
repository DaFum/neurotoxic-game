import { useId } from 'react'
import PropTypes from 'prop-types'

export const VolumeSlider = ({ label, value, onChange }) => {
  const clampedValue = Math.min(1, Math.max(0, value))
  const max = 10
  const val = Math.round(clampedValue * max)
  const segments = Array.from({ length: max }, (_, i) => i + 1)
  const pct = Math.round(clampedValue * 100)

  return (
    <div className="w-full max-w-sm flex flex-col gap-2">
      <div className="flex justify-between items-end">
        <span className="text-xs tracking-widest uppercase opacity-80" aria-hidden="true">{label}</span>
        <span className="text-sm font-bold text-(--toxic-green)">{pct}%</span>
      </div>
      {/* Expose actual input for accessibility and standard event handling while visually hiding it */}
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={clampedValue}
        onChange={onChange}
        aria-label={label}
        className="sr-only"
      />
      <div
        className="flex gap-1 h-8 items-end cursor-pointer group"
        onMouseLeave={() => {}}
        role="presentation"
      >
        {segments.map(segment => {
          const isActive = segment <= val
          const height = `${30 + (segment / max) * 70}%`
          const segmentPct = Math.round((segment / max) * 100)
          return (
            <button
              type="button"
              key={segment}
              onClick={() => onChange({ target: { value: segment / max } })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  if (e.key === ' ') e.preventDefault()
                  onChange({ target: { value: segment / max } })
                }
              }}
              className="flex-1 relative h-full flex items-end group-hover:opacity-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--toxic-green)"
              aria-label={`Set volume to ${segmentPct}%`}
              aria-pressed={isActive}
            >
              <div
                style={{ height }}
                className={`w-full transition-colors duration-75 border-b-2 border-transparent hover:border-[color:var(--void-black)]
                  ${isActive ? 'bg-(--toxic-green) shadow-[0_0_8px_var(--toxic-green)]' : 'bg-(--toxic-green)/20'}`}
              ></div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

VolumeSlider.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired
}
