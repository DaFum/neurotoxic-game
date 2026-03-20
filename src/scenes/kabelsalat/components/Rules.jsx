// TODO: Extract complex UI sub-components into standalone files for better maintainability
export const Rules = ({ t }) => (
  <div className='mt-6 border border-warning-yellow bg-warning-yellow/10 p-4 text-sm text-warning-yellow max-w-4xl w-full'>
    <h4 className='font-bold tracking-widest mb-2 border-b border-warning-yellow/30 pb-1'>
      == {t('ui:minigames.kabelsalat.rulesTitle')} ==
    </h4>
    <ul className='list-disc pl-4 space-y-1 opacity-80'>
      <li>{t('ui:minigames.kabelsalat.rules.time')}</li>
      <li>
        <strong>{t('ui:minigames.kabelsalat.rules.rule1Label')}:</strong>{' '}
        {t('ui:minigames.kabelsalat.rules.rule1Text')}
      </li>
      <li>
        <strong>{t('ui:minigames.kabelsalat.rules.rule2Label')}:</strong>{' '}
        {t('ui:minigames.kabelsalat.rules.rule2Text')}
      </li>
      <li>{t('ui:minigames.kabelsalat.rules.penalty')}</li>
    </ul>
  </div>
)
