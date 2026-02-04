// Music Library
import rhythmSongs from '../assets/rhythm_songs.json' with { type: 'json' }

// Transform the JSON object into an array and map to the expected structure
export const SONGS_DB = Object.entries(rhythmSongs).map(([key, song]) => {
  // Calculate duration based on the last note tick to ensure the song doesn't end prematurely
  const lastNoteTick = song.notes.reduce((max, n) => Math.max(max, n.t), 0)
  const tpb = song.tpb || 480
  const bpm = song.bpm || 120
  // duration in seconds = (ticks / tpb) * (60 / bpm)
  const lastNoteTimeSeconds = (lastNoteTick / tpb) * (60 / bpm)

  // Use the max of defined duration or last note time, plus a 4s buffer for decay
  const duration = Math.ceil(
    Math.max(song.durationMs / 1000, lastNoteTimeSeconds + 4)
  )

  return {
    id: key, // Use JSON key as ID for stability
    name: song.name,
    title: song.name, // Alias for UI consistency if needed
    duration: duration,
    difficulty: Math.max(1, Math.min(7, song.difficultyRank || 2)), // Clamp 1-7
    intensity:
      song.difficultyRank > 5
        ? 'EXTREME'
        : song.difficultyRank > 3
          ? 'HIGH'
          : 'MEDIUM',
    bpm: bpm,
    tags: song.tags || ['Metal', 'Instrumental'],
    notePattern: song.notePattern || 'standard',
    crowdAppeal:
      song.crowdAppeal || Math.min(10, Math.ceil(song.difficultyRank * 1.5)),
    staminaDrain: song.staminaDrain || 10 + song.difficultyRank * 2,

    // Fake energy curve based on difficulty for now, as it's not in the JSON
    energy: { peak: Math.min(100, 60 + (song.difficultyRank || 2) * 5) },

    // Raw data for the game engine
    notes: song.notes,
    tempoMap: song.tempoMap,
    tpb: tpb,
    sourceMid: song.sourceMid
  }
})
