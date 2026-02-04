// Music Library
import rhythmSongs from '../assets/rhythm_songs.json' with { type: 'json' }

// Transform the JSON object into an array and map to the expected structure
export const SONGS_DB = Object.values(rhythmSongs).map(song => ({
  id: song.name, // Using name as ID for consistency with JSON keys
  name: song.name,
  duration: Math.ceil(song.durationMs / 1000), // Convert ms to seconds
  difficulty: song.difficultyRank,
  bpm: song.bpm,
  // Fake energy curve based on difficulty for now, as it's not in the JSON
  energy: { peak: Math.min(100, 60 + song.difficultyRank * 5) },
  // Raw data for the game engine
  notes: song.notes,
  tempoMap: song.tempoMap,
  tpb: song.tpb,
  sourceMid: song.sourceMid
}))
