import { memo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { LOG_LEVELS } from '../../utils/logger'
import type { ChangeEvent } from 'react'

type LogSettingsProps = {
  logLevel: number
  onLogLevelChange: (level: number) => void
}

export const LogSettings = memo(function LogSettings({
  logLevel,
  onLogLevelChange
}: LogSettingsProps) {
  const { t } = useTranslation()

  const handleLogLevelSelect = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) =>
      onLogLevelChange(parseInt(e.target.value, 10)),
    [onLogLevelChange]
  )

  return (
    <div>
      <h2 className='font-[Metal_Mania] text-4xl uppercase text-toxic-green mb-6 border-b border-ash-gray pb-2'>
        {t('ui:log_protocols')}
      </h2>
      <div className='flex items-center justify-between'>
        <label
          htmlFor='logLevelSelect'
          className='font-[Courier_New] text-sm uppercase tracking-wide text-ash-gray'
        >
          {t('ui:min_log_level')}
        </label>
        <select
          id='logLevelSelect'
          value={logLevel ?? LOG_LEVELS.DEBUG}
          onChange={handleLogLevelSelect}
          className='bg-void-black text-toxic-green border-2 border-toxic-green p-1 font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green transition-colors cursor-pointer'
        >
          {Object.entries(LOG_LEVELS).map(([key, value]) => (
            <option key={key} value={value}>
              {key}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
})

LogSettings.propTypes = {
  logLevel: PropTypes.number.isRequired,
  onLogLevelChange: PropTypes.func.isRequired
}
