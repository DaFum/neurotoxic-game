import type { QuestState } from '../../../../types'
import type { BasicTProps } from '../types'
import { Panel, ProgressBar } from '../../../shared'

export const ActiveQuestsSection = ({
  activeQuests,
  t
}: { activeQuests: QuestState[] } & BasicTProps) => {
  const getQuestLabel = (quest: QuestState) =>
    t(quest.label ?? quest.id, { defaultValue: quest.id })

  return (
    <Panel
      title={t('ui:stats.active_quests', { defaultValue: 'Active Quests' })}
    >
      {activeQuests.length === 0 ? (
        <div className='text-xs text-ash-gray italic py-4 text-center'>
          {t('ui:detailedStats.noActiveQuests', {
            defaultValue: 'No active quests. Stay toxic to trigger events.'
          })}
        </div>
      ) : (
        <div className='space-y-4'>
          {activeQuests.map(q => {
            const hasValidRequired =
              typeof q.required === 'number' && q.required >= 1
            if (!hasValidRequired) {
              return (
                <div
                  key={q.id}
                  className='space-y-1 border-b border-ash-gray/10 pb-2 last:border-0'
                >
                  <div className='flex justify-between items-center text-xs'>
                    <span className='font-bold text-star-white'>
                      {getQuestLabel(q)}
                    </span>
                    <span className='text-blood-red'>
                      {t('ui:detailedStats.invalidQuestRequirement', {
                        defaultValue: 'Invalid quest requirement'
                      })}
                    </span>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={q.id}
                className='space-y-1 border-b border-ash-gray/10 pb-2 last:border-0'
              >
                <div className='flex justify-between items-center text-xs'>
                  <span className='font-bold text-star-white'>
                    {getQuestLabel(q)}
                  </span>
                  {q.deadline != null ? (
                    <span className='text-ash-gray'>
                      {t('ui:ui.day', { defaultValue: 'Day' })} {q.deadline}
                    </span>
                  ) : null}
                </div>
                <ProgressBar
                  value={q.progress ?? 0}
                  max={q.required ?? 1}
                  color='bg-toxic-green'
                  size='mini'
                  showValue
                />
              </div>
            )
          })}
        </div>
      )}
    </Panel>
  )
}
