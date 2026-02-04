// Music Library
import rhythmSongs from '../assets/rhythm_songs.json' with { type: 'json' }

// Transform the JSON object into an array and map to the expected structure
export const SONGS_DB = Object.values(rhythmSongs).map(song => {
  // Calculate duration based on the last note tick to ensure the song doesn't end prematurely
  const lastNoteTick = song.notes.reduce((max, n) => Math.max(max, n.t), 0)
  const tpb = song.tpb || 480
  const bpm = song.bpm || 120
  // duration in seconds = (ticks / tpb) * (60 / bpm)
  const lastNoteTimeSeconds = (lastNoteTick / tpb) * (60 / bpm)

  // Use the max of defined duration or last note time, plus a 4s buffer for decay
  const duration = Math.ceil(Math.max(song.durationMs / 1000, lastNoteTimeSeconds + 4))

  return {
    id: song.name, // Using name as ID for consistency with JSON keys
    name: song.name,
    duration: duration,
    difficulty: song.difficultyRank,
    bpm: song.bpm,
    // Fake energy curve based on difficulty for now, as it's not in the JSON
    energy: { peak: Math.min(100, 60 + song.difficultyRank * 5) },
    // Raw data for the game engine
    notes: song.notes,
    tempoMap: song.tempoMap,
    tpb: song.tpb,
    sourceMid: song.sourceMid
  }
})
