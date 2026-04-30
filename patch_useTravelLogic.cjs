const fs = require('fs');

let useTravel = fs.readFileSync('src/hooks/useTravelLogic.ts', 'utf8');

// We need an independent boolean lock to track the sequence because `isTraveling` is React state.
// We rename the local ref from `isTravelingRef` to `travelLockRef` because `isTravelingRef` is already used (line 115) to track the state value.

useTravel = useTravel.replace(
  `  const travelCompletedRef = useRef(false)`,
  `  const travelLockRef = useRef(false)\n  const travelCompletedRef = useRef(false)`
);

// startTravelSequence lock
useTravel = useTravel.replace(
  `  const startTravelSequence = useCallback(
    node => {
      travelCompletedRef.current = false
      setTravelTarget(node)
      // setIsTraveling(true) // Disable local animation state
      setPendingTravelNode(null)
      pendingTravelNodeRef.current = null`,
  `  const startTravelSequence = useCallback(
    node => {
      if (travelLockRef.current) return
      travelLockRef.current = true
      setIsTraveling(true)

      travelCompletedRef.current = false
      setTravelTarget(node)
      setPendingTravelNode(null)
      pendingTravelNodeRef.current = null`
);

// unlock on success
useTravel = useTravel.replace(
  `      if (updates.nextBand) {
        updateBand(updates.nextBand)
      }

      setIsTraveling(false)
      setTravelTarget(null)`,
  `      if (updates.nextBand) {
        updateBand(updates.nextBand)
      }

      setIsTraveling(false)
      travelLockRef.current = false
      setTravelTarget(null)`
);

// unlock on errors/early returns inside travel completion
useTravel = useTravel.replace(
  `        )
        setIsTraveling(false)
        return
      }

      const node = target`,
  `        )
        setIsTraveling(false)
        travelLockRef.current = false
        return
      }

      const node = target`
);

useTravel = useTravel.replace(
  `          'error'
        )
        setIsTraveling(false)
        setTravelTarget(null)
        return
      }`,
  `          'error'
        )
        setIsTraveling(false)
        travelLockRef.current = false
        setTravelTarget(null)
        return
      }`
);

// fix audioManager promise chain in startTravelSequence
useTravel = useTravel.replace(
  `      audioManager
        .ensureAudioContext()
        .catch(e => console.warn('ensureAudioContext failed', e))
        .then(() => {
          try {
            audioManager.playSFX('travel')
          } catch (_e) {
            // Ignore audio errors
          }
        })`,
  `      audioManager
        .ensureAudioContext()
        .then(() => {
          try {
            audioManager.playSFX('travel')
          } catch (_e) {
            // Ignore audio errors
          }
        })
        .catch(e => console.warn('ensureAudioContext failed', e))`
);

fs.writeFileSync('src/hooks/useTravelLogic.ts', useTravel, 'utf8');
console.log('Patched useTravelLogic');
