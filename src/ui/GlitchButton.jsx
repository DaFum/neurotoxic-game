import PropTypes from 'prop-types'
import { Loader2 } from 'lucide-react'

/**
 * A stylized button component with glitch and hover effects.
 * @param {object} props
 * @param {Function} props.onClick - Click handler.
 * @param {React.ReactNode} props.children - Button content.
 * @param {string} [props.className] - Additional classes.
 * @param {boolean} [props.disabled] - Disabled state.
 * @param {string} [props.size] - Button size ('sm' | 'lg').
 * @param {boolean} [props.isLoading] - Loading state.
 */
export const GlitchButton = ({
  onClick,
  children,
  className = '',
  disabled = false,
  variant = 'primary',
  size = 'lg',
  isLoading = false
}) => {
  // If loading, treat as disabled for interactions
  const isIntervention = disabled || isLoading

  const getVariantClasses = () => {
    // Owned variant takes precedence over generic disabled state to maintain visibility
    if (variant === 'owned') {
      return 'border-2 border-(--ash-gray) text-(--ash-gray) cursor-default opacity-100'
    }

    if (isIntervention)
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

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    lg: 'px-8 py-4 text-xl'
  }

  return (
    <button
      onClick={onClick}
      disabled={isIntervention}
      aria-disabled={isIntervention}
      aria-busy={isLoading}
      className={`
        relative ${sizeClasses[size] || sizeClasses.lg} bg-(--void-black)
        font-[Metal_Mania] font-bold uppercase tracking-widest
        transition-all duration-100
        group
        ${getVariantClasses()}
        ${className}
      `}
    >
      <span
        className={`relative z-10 flex items-center justify-center gap-2 ${
          isIntervention && variant !== 'owned' ? '' : 'group-hover:animate-pulse'
        } ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      >
        {children}
      </span>

      {isLoading && (
        <span className='absolute inset-0 flex items-center justify-center z-20'>
          <Loader2 className='animate-spin w-5 h-5' />
        </span>
      )}

      {/* Diagonal stripe overlay when disabled (but not for owned items which are just static) */}
      {isIntervention && variant !== 'owned' && (
        <span
          className='absolute inset-0 pointer-events-none opacity-10'
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 4px, var(--ash-gray) 4px, var(--ash-gray) 6px)'
          }}
        />
      )}
      {/* Glitch Overlay Effect on Hover */}
      {!isIntervention && (
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
  variant: PropTypes.oneOf(['primary', 'danger', 'owned']),
  size: PropTypes.oneOf(['sm', 'lg']),
  isLoading: PropTypes.bool
}
