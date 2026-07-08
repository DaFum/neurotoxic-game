import { Loader2 } from 'lucide-react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { useFormStatus } from 'react-dom'

type GlitchButtonVariant = 'primary' | 'danger' | 'owned' | 'warning'
type GlitchButtonSize = 'sm' | 'lg'

type GlitchButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'size'> & {
  children: ReactNode
  variant?: GlitchButtonVariant
  size?: GlitchButtonSize
  isLoading?: boolean
}

/**
 * A stylized button component with glitch and hover effects.
 * Uses React 19 useFormStatus for implicit loading state during form actions.
 */
export const GlitchButton = ({
  children,
  className = '',
  disabled = false,
  variant = 'primary',
  size = 'lg',
  isLoading = false,
  ...props
}: GlitchButtonProps) => {
  const { pending } = useFormStatus()
  const effectiveLoading = isLoading || pending

  const isIntervention = disabled || effectiveLoading || variant === 'owned'

  const getVariantClasses = () => {
    if (variant === 'owned') {
      return 'border-2 border-ash-gray text-ash-gray cursor-default opacity-100'
    }

    if (isIntervention)
      return 'border-2 border-ash-gray text-ash-gray cursor-not-allowed opacity-60'

    switch (variant) {
      case 'danger':
        return `border-2 border-blood-red text-star-white
                hover:bg-blood-red hover:text-void-black
                hover:scale-[1.02]
                hover:shadow-[4px_4px_0px_var(--color-toxic-green)]
                active:scale-[0.98] active:shadow-none`
      case 'warning':
        return `border-2 border-warning-yellow text-warning-yellow
                hover:bg-warning-yellow hover:text-void-black
                hover:scale-[1.02]
                hover:shadow-[4px_4px_0px_var(--color-toxic-green)]
                active:scale-[0.98] active:shadow-none`
      case 'primary':
      default:
        return `border-2 border-toxic-green text-toxic-green
                hover:bg-toxic-green hover:text-void-black
                hover:scale-[1.02]
                hover:shadow-[4px_4px_0px_var(--color-blood-red)]
                active:scale-[0.98] active:shadow-none`
    }
  }

  const sizeClasses: Record<GlitchButtonSize, string> = {
    sm: 'px-4 py-2 text-sm',
    lg: 'px-8 py-4 text-xl'
  }

  return (
    <button
      disabled={isIntervention}
      aria-disabled={isIntervention}
      aria-busy={effectiveLoading}
      className={`
        relative ${sizeClasses[size]} min-w-11 min-h-11 bg-void-black
        font-display font-bold uppercase tracking-widest
        touch-manipulation text-center leading-tight max-w-full whitespace-normal wrap-break-word
        transition-all duration-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-toxic-green-20
        group
        ${getVariantClasses()}
        ${className}
      `}
      {...props}
    >
      <span
        className={`relative z-(--z-hud) flex min-w-0 max-w-full items-center justify-center gap-2 whitespace-normal wrap-break-word ${
          isIntervention ? '' : 'motion-safe:group-hover:animate-pulse'
        } ${effectiveLoading ? 'opacity-0' : 'opacity-100'}`}
      >
        {children}
      </span>

      {effectiveLoading && (
        <span
          className='absolute inset-0 flex items-center justify-center z-(--z-hud)'
          aria-hidden='true'
        >
          <Loader2 className='animate-spin w-5 h-5' aria-hidden='true' />
        </span>
      )}

      {isIntervention && variant !== 'owned' && (
        <span
          className='absolute inset-0 pointer-events-none opacity-10'
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 4px, var(--color-ash-gray) 4px, var(--color-ash-gray) 6px)'
          }}
        />
      )}
      {!isIntervention && (
        <>
          <span className='absolute inset-0 bg-star-white opacity-0 group-hover:opacity-10 mix-blend-difference pointer-events-none' />
          <span
            className='absolute inset-0 overflow-hidden pointer-events-none'
            aria-hidden='true'
          >
            <span className='absolute top-0 left-0 h-full w-1/3 -translate-x-full bg-linear-to-r from-transparent via-star-white/20 to-transparent -skew-x-12 motion-safe:group-hover:animate-[shimmer_700ms_ease-out]' />
          </span>
          <span
            aria-hidden='true'
            className='absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current opacity-60 pointer-events-none'
          />
          <span
            aria-hidden='true'
            className='absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current opacity-60 pointer-events-none'
          />
        </>
      )}
    </button>
  )
}
