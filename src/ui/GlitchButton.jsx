import React from 'react'

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
  disabled = false
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative px-8 py-4 bg-(--void-black) text-(--toxic-green)
        border-2 border-(--toxic-green)
        font-[Metal_Mania] text-xl font-bold uppercase tracking-widest
        transition-all duration-100
        hover:bg-(--toxic-green) hover:text-(--void-black)
        hover:translate-x-1 hover:-translate-y-1
        hover:shadow-[4px_4px_0px_var(--blood-red)]
        active:translate-x-0 active:translate-y-0
        disabled:opacity-50 disabled:cursor-not-allowed
        group
        ${className}
      `}
    >
      <span className='relative z-10 group-hover:animate-pulse'>
        {children}
      </span>
      {/* Glitch Overlay Effect on Hover */}
      <span className='absolute inset-0 bg-white opacity-0 group-hover:opacity-10 mix-blend-difference pointer-events-none' />
    </button>
  )
}
