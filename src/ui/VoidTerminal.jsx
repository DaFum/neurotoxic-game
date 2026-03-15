import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameState } from '../context/GameState'

export function VoidTerminal() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([
    'NEUROTOXIC // VOID TERMINAL v3.0',
    'TYPE "help" FOR COMMANDS.',
    '========================='
  ])
  const inputRef = useRef(null)
  const scrollRef = useRef(null)
  const { dispatch, state } = useGameState()

  // Toggle terminal visibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in another input (unless it's our terminal input)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.target !== inputRef.current) return
      }

      // Toggle on backtick or backslash
      if (e.key === '`' || e.key === '\\') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }

      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100)
    }
  }, [isOpen])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history, isOpen])

  const print = useCallback((msg) => {
    setHistory((prev) => [...prev, msg])
  }, [])

  const executeCommand = useCallback((cmdStr) => {
    const args = cmdStr.trim().split(/\s+/)
    const command = args[0].toLowerCase()

    print(`> ${cmdStr}`)

    switch (command) {
      case 'help':
        print('AVAILABLE COMMANDS:')
        print('  help         - SHOW THIS MESSAGE')
        print('  clear        - CLEAR TERMINAL OUTPUT')
        print('  give_money   - ADD EUROS [amount]')
        print('  give_fame    - ADD FAME [amount]')
        print('  export_save  - EXPORT DATA TO JSON')
        print('  clear_data   - WIPE LOCAL SAVE')
        print('  godmode      - MAX HARMONY/STAMINA')
        print('  stats        - PRINT CURRENT STATE')
        break
      case 'clear':
        setHistory([
          'NEUROTOXIC // VOID TERMINAL v3.0',
          'TYPE "help" FOR COMMANDS.',
          '========================='
        ])
        break
      case 'give_money':
        {
          const amount = parseInt(args[1], 10) || 1000
          dispatch({ type: 'UPDATE_MONEY', payload: amount })
          print(`GRANTED ${amount} EUROS.`)
        }
        break
      case 'give_fame':
        {
          const amount = parseInt(args[1], 10) || 100
          dispatch({ type: 'UPDATE_FAME', payload: amount })
          print(`GRANTED ${amount} FAME.`)
        }
        break
      case 'export_save':
        {
          const saveData = localStorage.getItem('neurotoxic_save')
          if (!saveData) {
            print('ERROR: NO SAVE DATA FOUND')
            break
          }
          const blob = new Blob([saveData], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'neurotoxic_save_export.json'
          a.click()
          URL.revokeObjectURL(url)
          print('SAVE EXPORTED.')
        }
        break
      case 'clear_data':
        localStorage.removeItem('neurotoxic_save')
        print('LOCAL SAVE DATA WIPED.')
        break
      case 'godmode':
        dispatch({ type: 'MODIFY_BAND_HARMONY', payload: 100 })
        // Need to loop members to heal stamina, but we can do a hard state injection or use events
        print('GODMODE ENGAGED (HARMONY MAXED).')
        break
      case 'stats':
        print(`MONEY: ${state?.player?.money || 0}`)
        print(`FAME: ${state?.player?.fame || 0}`)
        print(`HARMONY: ${state?.band?.harmony || 0}`)
        break
      case '':
        break
      default:
        print(`COMMAND NOT RECOGNIZED: "${command}"`)
    }
  }, [dispatch, print, state])

  const handleSubmit = (e) => {
    e.preventDefault()
    executeCommand(input)
    setInput('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '-100%' }}
          animate={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="fixed top-0 left-0 w-full h-1/2 bg-black/90 border-b-2 border-toxic-green z-(--z-crt) text-toxic-green font-mono uppercase text-sm md:text-base shadow-[0_10px_30px_rgba(0,255,0,0.2)] flex flex-col"
          style={{ zIndex: 9999 }} // Make sure it sits above everything
        >
          {/* Scanline overlay effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-30 z-10" />

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-1 z-20 font-bold"
          >
            {history.map((line, i) => (
              <div key={i} className="break-words">{line}</div>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-toxic-green/30 flex items-center bg-black z-20"
          >
            <span className="mr-2 font-bold">{'>'}</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-toxic-green font-mono font-bold placeholder-toxic-green/50 uppercase"
              placeholder="ENTER COMMAND..."
              spellCheck="false"
              autoComplete="off"
            />
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
