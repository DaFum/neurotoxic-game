import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../utils/numberUtils'

type GigModifierItem = {
  key: string
  label: string
  desc?: string
  cost: number
}

type GigModifierButtonProps = {
  item: GigModifierItem
  isActive: boolean
  onClick: (key: GigModifierItem['key']) => void
  disabled?: boolean
}

/**
 * Renders a selectable pre-gig modifier with description and localized cost.
 * @param props - Modifier item, active state, click handler, and disabled state.
 */
const GigModifierButton = memo(
  ({ item, isActive, onClick, disabled = false }: GigModifierButtonProps) => {
    const { i18n } = useTranslation()
    const handleClick = () => {
      if (disabled) return
      onClick(item.key)
    }
    return (
      <button
        type='button'
        onClick={handleClick}
        aria-pressed={isActive}
        disabled={disabled}
        className={`flex justify-between items-center p-3 border-2 transition-all group relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black focus-visible:shadow-[0_0_12px_var(--color-toxic-green-20)] disabled:opacity-40 disabled:cursor-not-allowed
        ${
          isActive
            ? 'bg-toxic-green text-void-black border-toxic-green shadow-[0_0_10px_var(--color-toxic-green-20)]'
            : 'border-ash-gray/30 hover:border-star-white/60 text-ash-gray'
        }`}
      >
        <span className='flex flex-col text-left'>
          <span className='font-bold text-sm'>{item.label}</span>
          <span className='text-xs opacity-70'>{item.desc}</span>
        </span>
        <span className='font-mono text-sm font-bold tabular-nums'>
          {formatCurrency(item.cost, i18n.language)}
        </span>
        {!isActive && (
          <div className='absolute inset-0 bg-star-white/5 translate-x-[-100%] motion-safe:group-hover:animate-[shimmer_0.8s_ease-out] skew-x-12 pointer-events-none' />
        )}
      </button>
    )
  }
)

GigModifierButton.displayName = 'GigModifierButton'
export default GigModifierButton
