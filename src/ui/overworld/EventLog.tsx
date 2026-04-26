import React, { useRef, useEffect, useState } from 'react'
import { ALL_VENUES } from '../../data/venues'
import { translateLocation } from '../../utils/locationI18n'

export interface EventLogProps {
  t: import('../../types/callbacks').TranslationCallback
  day: number
  locationId: string
}

type EventLogEntryType = 'system' | 'travel'

interface EventLogEntry {
  id: number
  day: number
  kind: 'init' | 'tour_active' | 'location_secured'
  payload: {
    count?: number
    date?: string
    location?: string
  }
}

export const EventLog = React.memo(
  ({ t, day, locationId }: EventLogProps) => {
    const bodyRef = useRef<HTMLDivElement | null>(null)
    const entryIdRef = useRef(0)
    const [entries, setEntries] = useState<EventLogEntry[]>(() => [
      {
        id: ++entryIdRef.current,
        day,
        kind: 'init',
        payload: { count: ALL_VENUES.length }
      }
    ])
    const previousRef = useRef<{ day: number; locationId: string } | null>(
      null
    )

    useEffect(() => {
      const previous = previousRef.current
      const added: EventLogEntry[] = []

      if (!previous || previous.day !== day) {
        added.push({
          id: ++entryIdRef.current,
          day,
          kind: 'tour_active',
          payload: {}
        })
      }

      if (!previous || previous.locationId !== locationId) {
        added.push({
          id: ++entryIdRef.current,
          day,
          kind: 'location_secured',
          payload: { location: locationId }
        })
      }

      if (added.length > 0) {
        setEntries(prev => [...prev, ...added].slice(-20))
      }

      previousRef.current = { day, locationId }
    }, [day, locationId])

    useEffect(() => {
      if (bodyRef.current)
        bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }, [entries])

    const getEntryMessage = (entry: EventLogEntry) => {
      if (entry.kind === 'init') {
        return t('ui:overworld.locations_loaded', {
          count: entry.payload.count ?? 0,
          defaultValue: `Tour initialized. ${entry.payload.count ?? 0} locations loaded.`
        })
      }

      if (entry.kind === 'tour_active') {
        const label = t('ui:overworld.day_format', {
          day: entry.day,
          defaultValue: `Day ${entry.day}`
        })
        return t('ui:overworld.tour_active', {
          label,
          defaultValue: `${label}: Tour active.`
        })
      }

      const rawLocation = entry.payload.location ?? locationId
      const location = translateLocation(t, rawLocation, rawLocation)
      return t('ui:overworld.location_secured', {
        location,
        defaultValue: `${location} secured.`
      })
    }

    const getEntryType = (entry: EventLogEntry): EventLogEntryType =>
      entry.kind === 'location_secured' ? 'travel' : 'system'

    return (
      <div className='event-log absolute bottom-8 left-8 z-20 pointer-events-none'>
        <div className='el-header'>
          <span className='el-title'>
            {'// '}
            {t('ui:overworld.event_log', { defaultValue: 'EVENT LOG' })}
          </span>
          <span className='el-count'>
            {entries.length}{' '}
            {t('ui:overworld.event_log_entries', {
              count: entries.length,
              defaultValue: 'entries'
            })}
          </span>
        </div>
        <div className='el-body' ref={bodyRef}>
          {entries.map(entry => (
            <div className='el-entry' key={entry.id}>
              <span className='el-day'>
                [{String(entry.day).padStart(2, '0')}]
              </span>
              <span className={`el-msg t-${getEntryType(entry)}`}>
                &gt; {getEntryMessage(entry)}
              </span>
            </div>
          ))}
          <div className='el-entry'>
            <span className='el-day'></span>
            <span className='el-cursor'>▌</span>
          </div>
        </div>
      </div>
    )
  }
)

EventLog.displayName = 'EventLog'
