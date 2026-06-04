import { memo } from 'react'
import { useTranslation } from 'react-i18next'

type SideEffectsPreviewProps = { badges?: string[] }

/**
 * Renders the Side Effects Preview component from badges.
 * @param props - Preview badges for social-post side effects.
 * @returns The rendered Side Effects Preview.
 */
export const SideEffectsPreview = memo(
  ({ badges }: SideEffectsPreviewProps) => {
    const { t } = useTranslation()

    if (!badges || badges.length === 0) return null

    const hasHighVariance = badges.includes('⚠️')
    const hasConsistentGrowth = badges.includes('🛡️')

    if (!hasHighVariance && !hasConsistentGrowth) return null

    return (
      <div className='mt-auto pt-2 text-xs uppercase font-mono tracking-wider w-full z-10 relative'>
        <div className='flex flex-wrap gap-2'>
          {hasHighVariance && (
            <span className='text-blood-red'>
              {t('economy:social.highVariance', {
                defaultValue: 'High Variance Risk'
              })}
            </span>
          )}
          {hasConsistentGrowth && (
            <span className='text-toxic-green'>
              {t('economy:social.consistentGrowth', {
                defaultValue: 'Consistent Growth'
              })}
            </span>
          )}
        </div>
      </div>
    )
  }
)

SideEffectsPreview.displayName = 'SideEffectsPreview'
