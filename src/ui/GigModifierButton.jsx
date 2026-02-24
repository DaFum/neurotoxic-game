import { memo } from 'react'
import PropTypes from 'prop-types'

const GigModifierButton = memo(({ item, isActive, onClick }) => {
  return (
    <button
      onClick={() => onClick(item.key)}
      className={`flex justify-between items-center p-3 border-2 transition-all group relative overflow-hidden
        ${
          isActive
            ? 'bg-(--toxic-green) text-black border-(--toxic-green) shadow-[0_0_10px_var(--toxic-green-20)]'
            : 'border-(--ash-gray)/30 hover:border-(--star-white)/60 text-(--ash-gray)'
        }`}
    >
      <span className='flex flex-col text-left'>
        <span className='font-bold text-sm'>{item.label}</span>
        <span className='text-[10px] opacity-70'>{item.desc}</span>
      </span>
      <span className='font-mono text-sm font-bold tabular-nums'>
        {item.cost}€
      </span>
      {!isActive && (
        <div className='absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:animate-[shimmer_0.8s_ease-out] skew-x-12 pointer-events-none' />
      )}
    </button>
  )
})

GigModifierButton.displayName = 'GigModifierButton'

GigModifierButton.propTypes = {
  item: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    desc: PropTypes.string,
    cost: PropTypes.number.isRequired
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
}

export default GigModifierButton
