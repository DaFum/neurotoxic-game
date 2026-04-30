import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ActionButton } from '../shared/ActionButton'

export const LanguageSettings = memo(function LanguageSettings() {
  const { t, i18n } = useTranslation()

  return (
    <div>
      <h2 className='font-[Metal_Mania] text-4xl uppercase text-toxic-green mb-6 border-b border-ash-gray pb-2'>
        {t('ui:language')}
      </h2>
      <div className='flex gap-4'>
        <ActionButton
          onClick={() => i18n.changeLanguage('en')}
          className={`flex-1 ${i18n.language?.startsWith('en') ? 'bg-toxic-green text-void-black' : 'bg-abyss-black text-ash-gray border border-ash-gray/30 opacity-70'}`}
        >
          {t('ui:language_option_en')}
        </ActionButton>
        <ActionButton
          onClick={() => i18n.changeLanguage('de')}
          className={`flex-1 ${i18n.language?.startsWith('de') ? 'bg-toxic-green text-void-black' : 'bg-abyss-black text-ash-gray border border-ash-gray/30 opacity-70'}`}
        >
          {t('ui:language_option_de')}
        </ActionButton>
      </div>
    </div>
  )
})
