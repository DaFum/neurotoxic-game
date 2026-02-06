import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { useGameState } from '../context/GameState'
import { getRandomChatter } from '../data/chatter'
import { motion, AnimatePresence } from 'framer-motion'

export const ChatterOverlay = ({ staticPosition = false }) => {
  const state = useGameState() // Get full state
  const stateRef = useRef(state) // Keep ref to latest state to avoid re-running effect
  const [chatter, setChatter] = useState(null)

  // Update ref whenever state changes
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Current Node Position Logic
  const currentNode = state.gameMap?.nodes[state.player.currentNodeId]
  const nodeY = currentNode?.y ?? 50
  const nodeX = currentNode?.x ?? 50

  // Dynamic Positioning
  const isTop = nodeY < 30
  const isLeftEdge = nodeX < 20
  const isRightEdge = nodeX > 80

  // Determine CSS classes using conditional logic instead of string manipulation
  const translateX = isLeftEdge
    ? 'translate-x-[-10%]'
    : isRightEdge
      ? 'translate-x-[-90%]'
      : '-translate-x-1/2'

  const translateY = isTop ? 'translate-y-[50%]' : '-translate-y-[150%]'
  const originClass = isTop ? 'origin-top' : 'origin-bottom'

  const positionClasses = staticPosition
    ? 'relative'
    : `absolute left-1/2 transform ${translateX} ${translateY}`

  const tailPosition = isLeftEdge
    ? 'left-4'
    : isRightEdge
      ? 'right-4'
      : 'right-1/2 translate-x-1/2'

  const tailDirection = isTop
    ? `-top-2 border-b-[10px] border-b-(--star-white)`
    : `-bottom-2 border-t-[10px] border-t-(--star-white)`

  const tailClass = `absolute ${tailDirection} ${tailPosition} w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent filter drop-shadow-xs`

  useEffect(() => {
    let timeoutId
    let hideTimeoutId
    let active = true

    const loop = () => {
      if (!active) return

      // Random delay: 8s to 25s
      const delay = Math.random() * 17000 + 8000

      timeoutId = setTimeout(() => {
        if (!active) return

        const currentState = stateRef.current
        const result = getRandomChatter(currentState)

        if (result) {
          const { text, speaker: fixedSpeaker } = result

          // Use fixed speaker if defined, else pick random member
          let speaker = fixedSpeaker
          if (!speaker && currentState.band && currentState.band.members) {
            const members = currentState.band.members.map(m => m.name)
            speaker = members[Math.floor(Math.random() * members.length)]
          }

          setChatter({ text, speaker: speaker || 'Band', id: Date.now() })

          // Hide after 5s
          hideTimeoutId = setTimeout(() => {
            if (active) setChatter(null)
          }, 5000)
        }

        // Schedule next
        loop()
      }, delay)
    }

    loop()

    return () => {
      active = false
      clearTimeout(timeoutId)
      clearTimeout(hideTimeoutId)
    }
  }, []) // Run once on mount

  return (
    <AnimatePresence>
      {chatter && (
        <motion.div
          key={chatter.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className={`${positionClasses} z-20 pointer-events-none ${!staticPosition ? originClass : ''} w-max max-w-[200px] md:max-w-xs ${!staticPosition ? 'top-1/2' : ''}`}
        >
          <div className='bg-(--star-white) text-(--void-black) p-3 rounded-tr-xl rounded-tl-xl rounded-bl-xl border-2 border-(--void-black) shadow-lg relative'>
            <div className='flex justify-between items-center mb-1'>
              <div className='text-[10px] font-bold text-(--ash-gray) uppercase tracking-widest'>
                {chatter.speaker}
              </div>
              <div className='w-2 h-2 rounded-full bg-(--toxic-green) animate-pulse' />
            </div>
            <div className='font-mono text-sm leading-tight whitespace-normal'>
              {chatter.text}
            </div>

            {/* Dynamic Tail */}
            {!staticPosition && <div className={tailClass} />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

ChatterOverlay.propTypes = {
  staticPosition: PropTypes.bool
}
