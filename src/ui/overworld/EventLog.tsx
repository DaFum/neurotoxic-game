import React, { useRef, useEffect } from 'react'
import { ALL_VENUES } from '../../data/venues'

export interface EventLogProps {
  t: import("../../types/callbacks").TranslationCallback;
  day: number;
  locationName: string;
}

export const EventLog = React.memo(({ t, day, locationName }: EventLogProps) => {
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const entries = [
    { day: 1, type: 'system', msg: t('ui:overworld.locations_loaded', { count: ALL_VENUES.length, defaultValue: `Tour initialized. ${ALL_VENUES.length} locations loaded.` }) },
    { day: day, type: 'system', msg: t('ui:overworld.tour_active', { date: `Day ${day}`, defaultValue: `Day ${day}: Tour active.` }) },
    { day: day, type: 'travel', msg: t('ui:overworld.location_secured', { location: locationName, defaultValue: `${locationName} secured.` }) }
  ];

  useEffect(()=>{
    if(bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [day, locationName]);

  return (
    <div className="event-log absolute bottom-8 left-8 z-20 pointer-events-none">
      <div className="el-header">
        <span className="el-title">// {t('ui:overworld.event_log', { defaultValue: 'EVENT LOG' })}</span>
        <span className="el-count">{entries.length} {t('ui:overworld.event_log_entries', { defaultValue: 'entries' })}</span>
      </div>
      <div className="el-body" ref={bodyRef}>
        {entries.map((e,i)=>(
          <div className="el-entry" key={i}>
            <span className="el-day">[{String(e.day).padStart(2,'0')}]</span>
            <span className={`el-msg t-${e.type}`}>&gt; {e.msg}</span>
          </div>
        ))}
        <div className="el-entry"><span className="el-day"></span><span className="el-cursor">▌</span></div>
      </div>
    </div>
  )
})

EventLog.displayName = 'EventLog'
