import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { DeadmanButton } from '../shared/BrutalistUI'

type DataManagementProps = {
  onDeleteSave: () => void
}

/**
 * Renders the Data Management view.
 * @param props - Save-deletion callback for the data management controls.
 */
export const DataManagement = memo(function DataManagement({
  onDeleteSave
}: DataManagementProps) {
  const { t } = useTranslation()

  return (
    <div>
      <h2 className='font-display text-4xl uppercase text-blood-red mb-6 border-b border-ash-gray pb-2'>
        {t('ui:data_purge')}
      </h2>
      <div className='flex justify-between items-center gap-8'>
        <p className='font-ui text-sm text-ash-gray max-w-xs'>
          {t('ui:delete_warning')}
        </p>
        <div className='flex-1 max-w-sm'>
          <DeadmanButton label={t('ui:delete_save')} onConfirm={onDeleteSave} />
        </div>
      </div>
    </div>
  )
})
