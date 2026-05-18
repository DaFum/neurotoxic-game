import type { FC } from 'react'
import type { TFunction } from 'i18next'

interface RuleItemProps {
  label?: string
  text: string
}

const RuleItem: FC<RuleItemProps> = ({ label, text }) => (
  <li>
    {label ? (
      <>
        <strong>{label}:</strong> {text}
      </>
    ) : (
      text
    )}
  </li>
)
interface RulesProps {
  t: TFunction
}

export const Rules: FC<RulesProps> = ({ t }) => (
  <div className='mt-6 border border-warning-yellow bg-warning-yellow/10 p-4 text-sm text-warning-yellow max-w-4xl w-full'>
    <h4 className='font-bold tracking-widest mb-2 border-b border-warning-yellow/30 pb-1'>
      == {t('ui:minigames.kabelsalat.rulesTitle')} ==
    </h4>
    <ul className='list-disc pl-4 space-y-1 opacity-80'>
      <RuleItem text={t('ui:minigames.kabelsalat.rules.time')} />
      <RuleItem
        label={t('ui:minigames.kabelsalat.rules.rule1Label')}
        text={t('ui:minigames.kabelsalat.rules.rule1Text')}
      />
      <RuleItem
        label={t('ui:minigames.kabelsalat.rules.rule2Label')}
        text={t('ui:minigames.kabelsalat.rules.rule2Text')}
      />
      <RuleItem text={t('ui:minigames.kabelsalat.rules.penalty')} />
    </ul>
  </div>
)
