import { trySpawnProjectile, processProjectiles } from './hecklerLogic'
import { buildGigStatsSnapshot } from './gigStats'

const NOTE_MISS_WINDOW_MS = 300

export const finalizeGig = (stateRef, setLastGigStats, endGig, stopAudio) => {
  if (stateRef.hasSubmittedResults) return
  stateRef.hasSubmittedResults = true
  setLastGigStats(
    buildGigStatsSnapshot(
      stateRef.score,
      stateRef.stats,
      stateRef.toxicTimeTotal,
      stateRef.songStats || []
    )
  )
  stopAudio()
  endGig()
}

export const processRhythmGameTick = ({
  stateRef,
  isTransportRunning,
  transportState,
  activeEvent,
  dimensionsRef,
  hecklerSessionRef,
  deltaMS,
  handleCollision,
  setIsToxicMode,
  handleMiss,
  finalizeGigCallback,
  getGigTimeMs,
  pauseAudio,
  resumeAudio
}) => {
  if (activeEvent || stateRef.isGameOver || stateRef.songTransitioning) {
    if (isTransportRunning && !stateRef.transportPausedByOverlay) {
      pauseAudio()
      stateRef.transportPausedByOverlay = true
    }
    return
  }

  if (stateRef.transportPausedByOverlay) {
    if (transportState === 'paused') {
      resumeAudio()
    }
    stateRef.transportPausedByOverlay = false
  }

  if (!isTransportRunning) {
    return
  }

  const now = getGigTimeMs()
  const duration = stateRef.totalDuration
  const rawProgress = duration > 0 ? Math.min(100, (now / duration) * 100) : 0
  stateRef.progress = Math.max(0, rawProgress)

  const currentInnerHeight = dimensionsRef.current.height
  const currentInnerWidth = dimensionsRef.current.width

  if (stateRef.projectiles.length > 0) {
    stateRef.projectiles = processProjectiles(
      hecklerSessionRef.current,
      stateRef.projectiles,
      deltaMS,
      currentInnerHeight,
      handleCollision
    )
  }

  const newProjectile = trySpawnProjectile(
    hecklerSessionRef.current,
    { health: stateRef.health, combo: stateRef.combo },
    stateRef.rng,
    currentInnerWidth
  )
  if (newProjectile) {
    stateRef.projectiles.push(newProjectile)
  }

  if (stateRef.isToxicMode) {
    if (now > stateRef.toxicModeEndTime) {
      const remaining = stateRef.toxicModeEndTime - (now - deltaMS)
      stateRef.toxicTimeTotal += Math.max(0, Math.min(deltaMS, remaining))
      setIsToxicMode(false)
      stateRef.isToxicMode = false
    } else {
      stateRef.toxicTimeTotal += deltaMS
    }
  }

  const isNearTrackEnd = duration <= 0 || now >= duration - NOTE_MISS_WINDOW_MS

  if (stateRef.setlistCompleted && isNearTrackEnd) {
    finalizeGigCallback(stateRef)
    return
  }

  let missCount = 0
  const notes = stateRef.notes
  let i = stateRef.nextMissCheckIndex

  while (i < notes.length) {
    const note = notes[i]

    if (note.time > now + NOTE_MISS_WINDOW_MS) {
      break
    }

    if (!note.visible || note.hit) {
      if (i === stateRef.nextMissCheckIndex) {
        stateRef.nextMissCheckIndex++
      }
      i++
      continue
    }

    if (now > note.time + NOTE_MISS_WINDOW_MS) {
      note.visible = false
      missCount++
      if (i === stateRef.nextMissCheckIndex) {
        stateRef.nextMissCheckIndex++
      }
    }

    i++
  }

  if (missCount > 0) {
    handleMiss(missCount, false)
  }
}
