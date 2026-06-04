import React from 'react'
import { GlitchButton } from '../../ui/GlitchButton'
import { CreditEntry } from './CreditEntry'
import { CreditFooter } from './CreditFooter'
import { CreditHeader } from './CreditHeader'

interface CreditsViewProps {
  credits: {
    role: string
    name: string
  }[]
  onReturn: () => void
  returnText: string
}

/**
 * Renders the Credits View scene from credits, onReturn, and returnText.
 * @param props - Credit rows, return callback, and return button text.
 * @returns The rendered Credits View UI.
 */
export const CreditsView = React.memo(
  ({ credits, onReturn, returnText }: CreditsViewProps) => {
    return (
      <div className='flex flex-col items-center h-full w-full bg-void-black z-(--z-overlay) text-center overflow-hidden relative'>
        {/* Gradient fade at top and bottom */}
        <div className='absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-void-black to-transparent z-(--z-crt) pointer-events-none' />
        <div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-void-black to-transparent z-(--z-crt) pointer-events-none' />

        {/* Subtle vignette + descending scan bar for cinematic feel */}
        <div
          aria-hidden='true'
          className='absolute inset-0 pointer-events-none z-(--z-base)'
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 55%, var(--color-void-black) 100%)'
          }}
        />
        <div
          aria-hidden='true'
          className='absolute inset-x-0 top-0 h-40 pointer-events-none animate-scan-bar z-(--z-base)'
          style={{
            background:
              'linear-gradient(to bottom, transparent, var(--color-toxic-green-10) 50%, transparent)'
          }}
        />

        {/* Scrolling credits */}
        <div className='flex-1 flex items-center justify-center w-full overflow-hidden'>
          <div className='animate-credits-scroll space-y-12 py-16'>
            <CreditHeader />

            {credits.map((c, i) => (
              <CreditEntry
                // Static, never-reordered credits list with no unique id; the
                // index disambiguates duplicate role+name entries.
                // eslint-disable-next-line @eslint-react/no-array-index-key
                key={`${c.role}-${c.name}-${i}`}
                role={c.role}
                name={c.name}
                delay={0.3 + i * 0.3}
              />
            ))}

            <CreditFooter />
          </div>
        </div>

        <div className='absolute bottom-8 z-(--z-hud)'>
          <GlitchButton onClick={onReturn}>{returnText}</GlitchButton>
        </div>
      </div>
    )
  }
)
CreditsView.displayName = 'CreditsView'
