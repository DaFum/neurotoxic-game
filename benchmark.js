const iterations = 10000;
const setlistSize = 100;

// Mock data
const setlist = Array.from({ length: setlistSize }, (_, i) => ({ id: `song-${i}` }));
const songsDict = {};
for (let i = 0; i < setlistSize; i++) {
  if (i % 2 === 0) {
    songsDict[`song-${i}`] = { name: `Song ${i}` };
  }
}

function getSongId(entry) {
  return entry.id;
}

function original() {
  return setlist
    .map(entry => {
      const songId = getSongId(entry)
      return songId ? songsDict[songId] : undefined
    })
    .filter((song) => Boolean(song))
}

function optimized() {
  const selectedSongs = [];
  for (const entry of setlist) {
    const songId = getSongId(entry);
    if (songId) {
      const song = songsDict[songId];
      if (song) {
        selectedSongs.push(song);
      }
    }
  }
  return selectedSongs;
}

// Warmup
for (let i = 0; i < 1000; i++) {
  original();
  optimized();
}

const start1 = performance.now();
for (let i = 0; i < iterations; i++) {
  original();
}
const end1 = performance.now();
const timeOriginal = end1 - start1;

const start2 = performance.now();
for (let i = 0; i < iterations; i++) {
  optimized();
}
const end2 = performance.now();
const timeOptimized = end2 - start2;

console.log(`Original: ${timeOriginal.toFixed(2)}ms`);
console.log(`Optimized: ${timeOptimized.toFixed(2)}ms`);
console.log(`Improvement: ${((timeOriginal - timeOptimized) / timeOriginal * 100).toFixed(2)}%`);
