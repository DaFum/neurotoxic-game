// @ts-nocheck
import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { ActionButton } from '../../ui/shared'
import { SideEffectsPreview } from './SideEffectsPreview'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen'

const CATEGORY_PROMPTS = {
  Drama: IMG_PROMPTS.SOCIAL_POST_DRAMA,
  Performance: IMG_PROMPTS.SOCIAL_POST_MUSIC,
  Commercial: IMG_PROMPTS.SOCIAL_POST_COMMERCIAL,
  Lifestyle: IMG_PROMPTS.SOCIAL_POST_LIFESTYLE
}

const getImagePromptForCategory = (category, badges) => {
  if (badges?.includes('🔥')) return IMG_PROMPTS.SOCIAL_POST_VIRAL
  return CATEGORY_PROMPTS[category] || IMG_PROMPTS.SOCIAL_POST_TECH
}

export const SocialOptionButton = memo(({ opt, index, onSelect }) => {
  const { t } = useTranslation()
  const handleClick = useCallback(() => onSelect(opt), [onSelect, opt])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.15 }}
      className='h-full'
    >
      <ActionButton
        onClick={handleClick}
        className='flex flex-col h-full items-start justify-start p-4 min-h-[180px] text-left relative overflow-hidden w-full group'
      >
        {/* Background Image Watermark */}
        <div
          className='absolute inset-0 opacity-80 group-hover:opacity-20 transition-opacity bg-cover bg-center pointer-events-none'
          style={{
            backgroundImage: `url("${getGenImageUrl(getImagePromptForCategory(opt.category, opt.badges))}")`
          }}
        />

        <div className='flex justify-between items-start mb-2 w-full z-10 relative bg-void-black/80 p-1.5 rounded'>
          <div className='font-bold text-lg leading-tight pr-2 transition-colors text-star-white drop-shadow-md'>
            {t(`ui:postOptions.${opt.id}.name`, { defaultValue: opt.name })}
          </div>
          <div className='flex gap-1 text-sm px-1 rounded backdrop-blur-sm'>
            {opt.badges?.map(b => (
              <span key={b}>{b}</span>
            ))}
          </div>
        </div>
        <div className='text-xs text-star-white font-mono space-y-1 mb-2 w-full z-10 relative bg-void-black/80 p-1.5 rounded'>
          <div className='flex justify-between border-b border-ash-gray/20 pb-1'>
            <span className='text-ash-gray drop-shadow-md'>
              {t('economy:social.platform', { defaultValue: 'Platform' })}
            </span>
            <span className='text-star-white drop-shadow-md'>
              {opt.platform}
            </span>
          </div>
          <div className='flex justify-between pt-1'>
            <span className='text-ash-gray drop-shadow-md'>
              {t('economy:social.category', { defaultValue: 'Category' })}
            </span>
            <span className='text-star-white drop-shadow-md'>
              {opt.category
                ? t(`economy:social.categories.${opt.category}`, {
                    defaultValue: opt.category
                  })
                : ''}
            </span>
          </div>
        </div>

        {/* Side Effects Preview */}
        <SideEffectsPreview badges={opt.badges} />
      </ActionButton>
    </motion.div>
  )
})

SocialOptionButton.displayName = 'SocialOptionButton'
SocialOptionButton.propTypes = {
  opt: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    platform: PropTypes.string.isRequired,
    category: PropTypes.string,
    badges: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  index: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired
}
