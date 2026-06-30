import { useState, useEffect, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { logger, LOG_LEVELS } from '../utils/logger'
import { Tooltip } from './shared/Tooltip'

type LogLevelName = keyof typeof LOG_LEVELS

const isLogLevelName = (level: string): level is LogLevelName =>
  Object.hasOwn(LOG_LEVELS, level)

const getLevelColor = (level: string) => {
  switch (level) {
    case 'DEBUG':
      return 'text-ash-gray'
    case 'INFO':
      return 'text-info-blue'
    case 'WARN':
      return 'text-warning-yellow'
    case 'ERROR':
      return 'text-blood-red'
    default:
      return 'text-star-white'
  }
}

type LogEntry = (typeof logger.logs)[number]

const LogRow = ({ log }: { log: LogEntry }) => (
  <div className='flex gap-2 hover:bg-star-white/5'>
    <span className='text-ash-gray shrink-0'>
      [{log.timestamp.split('T')[1]?.slice(0, 8) ?? log.timestamp.slice(0, 8)}]
    </span>
    <span className={`font-bold w-12 shrink-0 ${getLevelColor(log.level)}`}>
      {log.level}
    </span>
    <Tooltip content={log.channel}>
      <span className='text-toxic-green w-24 shrink-0 truncate block'>
        [{log.channel}]
      </span>
    </Tooltip>
    <span className='text-star-white/80 break-all'>
      {log.message}
      {log.data !== undefined && log.data !== null && (
        <span className='text-ash-gray ml-2'>{JSON.stringify(log.data)}</span>
      )}
    </span>
  </div>
)

const DebugLogViewerContent = ({
  className,
  onClose,
  filterLevel,
  setFilterLevel
}: {
  className: string
  onClose: () => void
  filterLevel: number
  setFilterLevel: (level: number) => void
}) => {
  const logs = useSyncExternalStore(
    logger.subscribe.bind(logger),
    () => logger.logs
  )
  const { t } = useTranslation()

  return (
    <div
      className={`fixed inset-0 pointer-events-none flex flex-col justify-end ${className}`}
      style={{ zIndex: 'var(--z-debug)' }}
    >
      <div className='pointer-events-auto bg-void-black/90 border-t-2 border-toxic-green h-[40svh] flex flex-col font-mono text-xs'>
        {/* Toolbar */}
        <div className='flex justify-between items-center p-2 bg-shadow-black border-b border-ash-gray'>
          <div className='flex gap-2'>
            <span className='text-toxic-green font-bold'>
              NEUROTOXIC DEBUGGER
            </span>
            <select
              value={filterLevel}
              onChange={e => setFilterLevel(parseInt(e.target.value, 10))}
              className='bg-void-black text-star-white border-2 border-ash-gray px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black transition-colors cursor-pointer'
            >
              <option value={LOG_LEVELS.DEBUG}>DEBUG</option>
              <option value={LOG_LEVELS.INFO}>INFO</option>
              <option value={LOG_LEVELS.WARN}>WARN</option>
              <option value={LOG_LEVELS.ERROR}>ERROR</option>
            </select>
            <Tooltip content={t('ui:debug_log_viewer.dump_console', { defaultValue: 'Dump logs to console' })}>
              <button
                type='button'
                onClick={() => {
                  if (import.meta.env.DEV) {
                    // DEV-only debugging dump
                    console.info(logger.logs)
                  }
                }}
                className='text-ash-gray hover:text-star-white hover:bg-void-black px-2 border-2 border-ash-gray uppercase shadow-[4px_4px_0px_var(--color-ash-gray)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ash-gray focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'
              >
                DUMP TO CONSOLE
              </button>
            </Tooltip>
            <Tooltip content={t('ui:debug_log_viewer.copy_logs', { defaultValue: 'Copy logs to clipboard' })}>
              <button
                type='button'
                onClick={() =>
                  navigator.clipboard
                    .writeText(logger.dump())
                    .catch(e =>
                      logger.error('DebugLogViewer', 'Failed to copy logs', e)
                    )
                }
                className='text-ash-gray hover:text-star-white hover:bg-void-black px-2 border-2 border-ash-gray uppercase shadow-[4px_4px_0px_var(--color-ash-gray)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ash-gray focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'
              >
                COPY LOGS
              </button>
            </Tooltip>
            <Tooltip content={t('ui:debug_log_viewer.clear_logs', { defaultValue: 'Clear all logs' })}>
              <button
                type='button'
                onClick={() => {
                  logger.clear()
                }}
                className='text-ash-gray hover:text-star-white hover:bg-void-black px-2 border-2 border-ash-gray uppercase shadow-[4px_4px_0px_var(--color-ash-gray)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ash-gray focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'
              >
                {t('ui:action_clear')}
              </button>
            </Tooltip>
          </div>
          <button
            type='button'
            onClick={onClose}
            aria-label={t('ui:action_close')}
            className='border-2 border-blood-red bg-void-black text-blood-red px-2 py-1 shadow-[4px_4px_0px_var(--color-blood-red)] hover:bg-blood-red hover:text-void-black uppercase font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blood-red focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'
          >
            CLOSE
          </button>
        </div>

        {/* Log Stream */}
        <div className='flex-1 overflow-y-auto p-2 space-y-1'>
          {logs
            .filter(l =>
              isLogLevelName(l.level)
                ? LOG_LEVELS[l.level] >= filterLevel
                : false
            )
            .map(log => (
              <LogRow key={log.id} log={log} />
            ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Displays filtered debug-log entries and viewer controls.
 * @param props - Display data and visual options for the debug log viewer view.
 */
export const DebugLogViewer = ({ className = '' }: { className?: string }) => {
  const [visible, setVisible] = useState(false)
  const [filterLevel, setFilterLevel] = useState<number>(logger.minLevel)

  // Keyboard Toggle
  useEffect(() => {
    if (!import.meta.env.DEV) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '`') {
        setVisible(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  if (!visible) return null

  return (
    <DebugLogViewerContent
      className={className}
      onClose={() => setVisible(false)}
      filterLevel={filterLevel}
      setFilterLevel={level => {
        setFilterLevel(level)
        logger.setLevel(level)
      }}
    />
  )
}
