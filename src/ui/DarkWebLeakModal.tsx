import React from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from './shared/Modal'
import { GlitchButton } from './GlitchButton'

interface DarkWebLeakModalProps {
  config: {
    COST: number;
    FAME_GAIN: number;
    ZEALOTRY_GAIN: number;
    CONTROVERSY_GAIN: number;
    HARMONY_COST: number;
  };
  canLeak: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  hasLeakedToday: boolean;
}

export const DarkWebLeakModal = ({
  config,
  canLeak,
  onConfirm,
  onCancel,
  hasLeakedToday
}: DarkWebLeakModalProps) => {
  const { t } = useTranslation('ui')
  return (
    <Modal title={t('darkWebLeak.title', 'Dark Web Data Leak')} onClose={onCancel}>
      <div className='flex flex-col gap-4 p-4 border border-white/20 bg-black/90 text-white'>
        <p className='text-sm'>{t('darkWebLeak.description', 'Leak unreleased tracks to the dark web to instantly boost your fame and zealotry. But beware, it will spark controversy and damage band harmony.')}</p>
        <div className='flex flex-col gap-1 text-sm bg-black/50 p-2 border border-white/10'>
          <div className='text-toxic-red'>{t('darkWebLeak.cost', 'COST:')} ${config.COST}</div>
          <div className='text-toxic-green'>{t('darkWebLeak.fame', 'FAME:')} +{config.FAME_GAIN}</div>
          <div className='text-toxic-yellow'>{t('darkWebLeak.zealotry', 'ZEALOTRY:')} +{config.ZEALOTRY_GAIN}
          </div>
          <div className='text-purple-500'>{t('darkWebLeak.controversy', 'CONTROVERSY:')} +{config.CONTROVERSY_GAIN}
          </div>
          <div className='text-orange-500'>{t('darkWebLeak.harmonyCost', 'HARMONY COST:')} -{config.HARMONY_COST}
          </div>
        </div>
        {hasLeakedToday && (
          <p className='text-toxic-red text-sm font-bold border border-toxic-red p-1 text-center'>{t('darkWebLeak.alreadyLeaked', 'Data leaked for today.')}</p>
        )}
        <div className='flex justify-end gap-2 mt-4'>
          <GlitchButton variant='secondary' onClick={onCancel}>
            {t('shared.cancel', 'CANCEL')}
          </GlitchButton>
          <GlitchButton
            variant='danger'
            onClick={onConfirm}
            disabled={!canLeak || hasLeakedToday}
          >{t('darkWebLeak.execute', 'EXECUTE LEAK')}</GlitchButton>
        </div>
      </div>
    </Modal>
  )
}
