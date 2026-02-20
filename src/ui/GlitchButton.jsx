import PropTypes from 'prop-types'

/**
 * A stylized button component with glitch and hover effects.
 * @param {object} props
 * @param {Function} props.onClick - Click handler.
 * @param {React.ReactNode} props.children - Button content.
 * @param {string} [props.className] - Additional classes.
 * @param {boolean} [props.disabled] - Disabled state.
 */
export const GlitchButton = ({
  onClick,
  children,
  className = '',
  disabled = false,
  variant = 'primary'
}) => {
  const getVariantClasses = () => {
    if (disabled)
      return 'border-2 border-(--ash-gray) text-(--ash-gray) cursor-not-allowed opacity-60'

    switch (variant) {
      case 'danger':
        return `border-2 border-(--blood-red) text-(--star-white)
                hover:bg-(--blood-red) hover:text-(--void-black)
                hover:translate-x-1 hover:-translate-y-1
                hover:shadow-[4px_4px_0px_var(--toxic-green)]
                active:translate-x-0 active:translate-y-0 active:shadow-none`
      case 'primary':
      default:
        return `border-2 border-(--toxic-green) text-(--toxic-green)
                hover:bg-(--toxic-green) hover:text-(--void-black)
                hover:translate-x-1 hover:-translate-y-1
                hover:shadow-[4px_4px_0px_var(--blood-red)]
                active:translate-x-0 active:translate-y-0 active:shadow-none`
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={`
        relative px-8 py-4 bg-(--void-black)
        font-[Metal_Mania] text-xl font-bold uppercase tracking-widest
        transition-all duration-100
        group
        ${getVariantClasses()}
        ${className}
      `}
    >
      <span
        className={`relative z-10 ${disabled ? '' : 'group-hover:animate-pulse'}`}
      >
        {children}
      </span>
      {/* Diagonal stripe overlay when disabled */}
      {disabled && (
        <span
          className='absolute inset-0 pointer-events-none opacity-10'
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 4px, var(--ash-gray) 4px, var(--ash-gray) 6px)'
          }}
        />
      )}
      {/* Glitch Overlay Effect on Hover */}
      {!disabled && (
        <span className='absolute inset-0 bg-(--star-white) opacity-0 group-hover:opacity-10 mix-blend-difference pointer-events-none' />
      )}
    </button>
  )
}

GlitchButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(['primary', 'danger'])
}
