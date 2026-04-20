import React from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from './shared/Modal'
import { GlitchButton } from './GlitchButton'
import { useTranslation } from 'react-i18next'

import type { DarkWebLeakConfig } from '../types/game'

export interface DarkWebLeakModalProps {
  config: DarkWebLeakConfig
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
      <div className='flex flex-col gap-4 p-4 border border-toxic-green bg-void-black/90 text-star-white'>
        <p className='text-sm'>
          {t('ui:dark_web_leak.description', {
            defaultValue:
              'Leak unreleased tracks to the dark web to instantly boost your fame and zealotry. But beware, it will spark controversy and damage band harmony.'
          })}
        </p>
        <div className='flex flex-col gap-1 text-sm bg-black/50 p-2 border border-toxic-green/50'>
          <div className='text-blood-red'>
            {t('ui:dark_web_leak.cost', { defaultValue: 'COST:' })} €
            {config.COST}
          </div>
          <div className='text-stamina-green'>
            {t('ui:dark_web_leak.fame', { defaultValue: 'FAME:' })} +
            {config.FAME_GAIN}
          </div>
          <div className='text-warning-yellow'>
            {t('ui:dark_web_leak.zealotry', { defaultValue: 'ZEALOTRY:' })} +
            {config.ZEALOTRY_GAIN}
          </div>
          <div className='text-toxic-green'>
            {t('ui:dark_web_leak.controversy', {
              defaultValue: 'CONTROVERSY:'
            })}{' '}
            +{config.CONTROVERSY_GAIN}
          </div>
          <div className='text-blood-red'>
            {t('ui:dark_web_leak.harmony_cost', {
              defaultValue: 'HARMONY COST:'
            })}{' '}
            -{config.HARMONY_COST}
          </div>
        </div>
        {hasLeakedToday && (
          <p className='text-blood-red text-sm font-bold border border-blood-red p-1 text-center'>
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
