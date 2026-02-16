import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { logger, LOG_LEVELS } from '../utils/logger'

export const DebugLogViewer = ({ className = '' }) => {
  const [visible, setVisible] = useState(false)
  const [logs, setLogs] = useState([])
  const [filterLevel, setFilterLevel] = useState(LOG_LEVELS.DEBUG)
  const bottomRef = useRef(null)

  // Keyboard Toggle
  useEffect(() => {
    if (!import.meta.env.DEV) return

    const handleKey = e => {
      if (e.ctrlKey && e.key === '`') {
        setVisible(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Log Subscription
  useEffect(() => {
    if (!visible) return
    const unsubscribe = logger.subscribe(event => {
      if (event.type === 'add') {
        setLogs(prev => [event.entry, ...prev].slice(0, logger.maxLogs))
      } else if (event.type === 'clear') {
        setLogs([])
      }
    })
    // Initial load
    setLogs([...logger.logs])
    return unsubscribe
  }, [visible])

  const getLevelColor = level => {
    switch (level) {
      case 'DEBUG':
        return 'text-(--ash-gray)'
      case 'INFO':
        return 'text-(--info-blue)'
      case 'WARN':
        return 'text-(--warning-yellow)'
      case 'ERROR':
        return 'text-(--blood-red)'
      default:
        return 'text-(--star-white)'
    }
  }

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] pointer-events-none flex flex-col justify-end ${className}`}
    >
      <div className='pointer-events-auto bg-(--void-black)/90 border-t-2 border-(--toxic-green) h-[40vh] flex flex-col font-mono text-xs'>
        {/* Toolbar */}
        <div className='flex justify-between items-center p-2 bg-(--shadow-black) border-b border-(--ash-gray)'>
          <div className='flex gap-2'>
            <span className='text-(--toxic-green) font-bold'>
              NEUROTOXIC DEBUGGER
            </span>
            <select
              value={filterLevel}
              onChange={e => setFilterLevel(parseInt(e.target.value))}
              className='bg-(--void-black) text-(--star-white) border-2 border-(--ash-gray) px-1'
            >
              <option value={LOG_LEVELS.DEBUG}>DEBUG</option>
              <option value={LOG_LEVELS.INFO}>INFO</option>
              <option value={LOG_LEVELS.WARN}>WARN</option>
              <option value={LOG_LEVELS.ERROR}>ERROR</option>
            </select>
            <button
              onClick={() => logger.clear()}
              className='text-(--ash-gray) hover:text-(--star-white) hover:bg-(--void-black) px-2 border-2 border-(--ash-gray) uppercase shadow-[4px_4px_0px_var(--ash-gray)] transition-all duration-150'
            >
              CLEAR
            </button>
            <button
              onClick={() => console.log(logger.dump())}
              className='text-(--ash-gray) hover:text-(--star-white) hover:bg-(--void-black) px-2 border-2 border-(--ash-gray) uppercase shadow-[4px_4px_0px_var(--ash-gray)] transition-all duration-150'
            >
              DUMP TO CONSOLE
            </button>
          </div>
          <button
            onClick={() => setVisible(false)}
            aria-label='Close log'
            className='border-2 border-(--blood-red) bg-(--void-black) text-(--blood-red) px-2 py-1 shadow-[4px_4px_0px_var(--blood-red)] hover:bg-(--blood-red) hover:text-(--void-black) uppercase font-bold transition-all duration-150'
          >
            CLOSE
          </button>
        </div>

        {/* Log Stream */}
        <div className='flex-1 overflow-y-auto p-2 space-y-1'>
          {logs
            .filter(l => LOG_LEVELS[l.level] >= filterLevel)
            .map(log => (
              <div
                key={log.id}
                className='flex gap-2 hover:bg-(--star-white)/5'
              >
                <span className='text-(--ash-gray) shrink-0'>
                  [{log.timestamp.split('T')[1].slice(0, 8)}]
                </span>
                <span
                  className={`font-bold w-12 shrink-0 ${getLevelColor(log.level)}`}
                >
                  {log.level}
                </span>
                <span
                  className='text-(--toxic-green) w-24 shrink-0 truncate'
                  title={log.channel}
                >
                  [{log.channel}]
                </span>
                <span className='text-(--star-white)/80 break-all'>
                  {log.message}
                  {log.data && (
                    <span className='text-(--ash-gray) ml-2'>
                      {JSON.stringify(log.data)}
                    </span>
                  )}
                </span>
              </div>
            ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}

DebugLogViewer.propTypes = {
  className: PropTypes.string
}
