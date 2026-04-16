// @ts-nocheck
import React from 'react'
import { ALL_VENUES } from '../../data/venues'

export const EventLog = React.memo(({ t, day, locationName }) => {
  return (
    <div className='absolute bottom-8 left-8 p-4 border border-ash-gray bg-void-black/90 max-w-sm z-20 pointer-events-none'>
      <h3 className='text-toxic-green font-bold mb-2'>
        {t('ui:overworld.event_log', { defaultValue: 'EVENT LOG:' })}
      </h3>
      <p className='text-xs text-ash-gray font-mono'>
        &gt;{' '}
        {t('ui:overworld.locations_loaded', {
          count: ALL_VENUES.length,
          defaultValue: `Locations loaded: ${ALL_VENUES.length}`
        })}
        <br />
        &gt;{' '}
        {t('ui:overworld.tour_active', {
          date: `${String(day).padStart(2, '0')}.01.2026`,
          defaultValue: `${String(day).padStart(2, '0')}.01.2026: Tour active.`
        })}
        <br />
        &gt;{' '}
        {t('ui:overworld.location_secured', {
          location: locationName,
          defaultValue: `${locationName} secured.`
        })}
      </p>
    </div>
  )
})

EventLog.displayName = 'EventLog'
