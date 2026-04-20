import React from 'react'
import { Modal } from './shared/Modal'
import { GlitchButton } from './GlitchButton'
import { useTranslation } from 'react-i18next'

export interface DarkWebLeakModalProps {
  config: typeof import('../hooks/useDarkWebLeak').DARK_WEB_LEAK_CONFIG
  canLeak: boolean
  onConfirm: () => void
  onCancel: () => void
  hasLeakedToday: boolean
}

export const DarkWebLeakModal = ({
  config,
  canLeak,
  onConfirm,
  onCancel,
  hasLeakedToday
}: DarkWebLeakModalProps) => {
  const { t } = useTranslation(['ui'])
  return (
    <Modal
      title={t('ui:dark_web_leak.title', {
        defaultValue: 'Dark Web Data Leak'
      })}
      onClose={onCancel}
      isOpen={true}
    >
      <div className='flex flex-col gap-4 p-4 border border-zinc-700 bg-zinc-900/90 text-zinc-100'>
        <p className='text-sm'>
          {t('ui:dark_web_leak.description', {
            defaultValue:
              'Leak unreleased tracks to the dark web to instantly boost your fame and zealotry. But beware, it will spark controversy and damage band harmony.'
          })}
        </p>
        <div className='flex flex-col gap-1 text-sm bg-black/50 p-2 border border-zinc-800'>
          <div className='text-red-400'>
            {t('ui:dark_web_leak.cost', { defaultValue: 'COST:' })} $
            {config.COST}
          </div>
          <div className='text-green-400'>
            {t('ui:dark_web_leak.fame', { defaultValue: 'FAME:' })} +
            {config.FAME_GAIN}
          </div>
          <div className='text-yellow-400'>
            {t('ui:dark_web_leak.zealotry', { defaultValue: 'ZEALOTRY:' })} +
            {config.ZEALOTRY_GAIN}
          </div>
          <div className='text-purple-400'>
            {t('ui:dark_web_leak.controversy', {
              defaultValue: 'CONTROVERSY:'
            })}{' '}
            +{config.CONTROVERSY_GAIN}
          </div>
          <div className='text-orange-400'>
            {t('ui:dark_web_leak.harmony_cost', {
              defaultValue: 'HARMONY COST:'
            })}{' '}
            -{config.HARMONY_COST}
          </div>
        </div>
        {hasLeakedToday && (
          <p className='text-red-500 text-sm font-bold border border-red-500 p-1 text-center'>
            {t('ui:dark_web_leak.leaked_today', {
              defaultValue: 'Data leaked for today.'
            })}
          </p>
        )}
        <div className='flex justify-end gap-2 mt-4'>
          <GlitchButton variant='secondary' onClick={onCancel}>
            {t('ui:dark_web_leak.cancel', { defaultValue: 'CANCEL' })}
          </GlitchButton>
          <GlitchButton
            variant='danger'
            onClick={onConfirm}
            disabled={!canLeak || hasLeakedToday}
          >
            {t('ui:dark_web_leak.execute', { defaultValue: 'EXECUTE LEAK' })}
          </GlitchButton>
        </div>
      </div>
    </Modal>
  )
}
