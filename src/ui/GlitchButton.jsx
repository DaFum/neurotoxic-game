import React from 'react'

export const GlitchButton = ({ onClick, children, className = '', disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative px-8 py-4 bg-black text-[var(--toxic-green)]
        border-2 border-[var(--toxic-green)]
        font-[Metal_Mania] text-xl font-bold uppercase tracking-widest
        transition-all duration-100
        hover:bg-[var(--toxic-green)] hover:text-black
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
