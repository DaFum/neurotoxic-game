import React, { useState, useEffect, useRef } from 'react'
import { useGameState } from '../context/GameState'
import { getRandomChatter } from '../data/chatter'
import { motion, AnimatePresence } from 'framer-motion'

export const ChatterOverlay = () => {
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
  const isTop = nodeY < 30 // If near top, show below
  const isLeftEdge = nodeX < 20 // If near left edge, shift right
  const isRightEdge = nodeX > 80 // If near right edge, shift left

  // Base transformation: center horizontally, move up
  // We'll adjust based on position
  let positionClasses = 'absolute left-1/2 transform -translate-x-1/2 '
  let originClass = 'origin-bottom'
  let tailClass =
    'absolute -bottom-2 right-1/2 translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-(--star-white) border-r-[10px] border-r-transparent filter drop-shadow-xs'

  if (isTop) {
    // Show BELOW the van
    positionClasses += 'translate-y-[50%] ' // Move down
    originClass = 'origin-top'
    // Tail points up
    tailClass =
      'absolute -top-2 right-1/2 translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-b-[10px] border-b-(--star-white) border-r-[10px] border-r-transparent filter drop-shadow-xs'
  } else {
    // Show ABOVE the van (Default)
    positionClasses += '-translate-y-[150%] ' // Move up
  }

  // Horizontal Shifts
  if (isLeftEdge) {
    // Van is at left, bubble should shift right to stay in screen
    // Instead of centered translate-x-1/2, use translate-x-0 or similar
    // Or just offset via margin
    positionClasses = positionClasses.replace('-translate-x-1/2', 'translate-x-[-10%]')
    // Adjust tail to be on left side of bubble
    tailClass = tailClass.replace('right-1/2 translate-x-1/2', 'left-4')
  } else if (isRightEdge) {
    // Van is at right, bubble should shift left
    positionClasses = positionClasses.replace('-translate-x-1/2', 'translate-x-[-90%]')
     // Adjust tail to be on right side of bubble
     tailClass = tailClass.replace('right-1/2 translate-x-1/2', 'right-4')
  }

  useEffect(() => {
    let timeoutId
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
          setTimeout(() => {
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
          className={`${positionClasses} z-40 pointer-events-none ${originClass} w-max max-w-[200px] md:max-w-xs`}
          style={{ top: '50%' }} // Anchor to center of parent (van)
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
            <div className={tailClass} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
