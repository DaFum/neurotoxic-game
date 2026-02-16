
const RUNS = 10000;
const ARRAY_SIZE = 100;

// Current implementation
function biasedShuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

// Fisher-Yates implementation
function fisherYatesShuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const testArray = Array.from({ length: ARRAY_SIZE }, (_, i) => i);

console.log(`Running benchmark with array size ${ARRAY_SIZE} over ${RUNS} iterations...`);

// Benchmark Biased Shuffle
const startBiased = performance.now();
for (let i = 0; i < RUNS; i++) {
  biasedShuffle(testArray);
}
const endBiased = performance.now();
const timeBiased = endBiased - startBiased;

console.log(`Biased Shuffle Total time: ${timeBiased.toFixed(2)}ms`);
console.log(`Biased Shuffle Average time per run: ${(timeBiased / RUNS).toFixed(4)}ms`);

// Benchmark Fisher-Yates Shuffle
const startFisher = performance.now();
for (let i = 0; i < RUNS; i++) {
  fisherYatesShuffle(testArray);
}
const endFisher = performance.now();
const timeFisher = endFisher - startFisher;

console.log(`Fisher-Yates Shuffle Total time: ${timeFisher.toFixed(2)}ms`);
console.log(`Fisher-Yates Shuffle Average time per run: ${(timeFisher / RUNS).toFixed(4)}ms`);

const improvement = ((timeBiased - timeFisher) / timeBiased) * 100;
console.log(`Improvement: ${improvement.toFixed(2)}%`);
