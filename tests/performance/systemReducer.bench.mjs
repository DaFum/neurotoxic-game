import { performance } from 'node:perf_hooks';

const DEFAULT_BAND_STATE = {
  inventory: {
    stickers: 0,
    flyers: 0,
    demoTapes: 0,
    tShirts: 0,
    badges: 0,
    posters: 0,
    vipPasses: 0,
    hasStickers: false,
    hasFlyers: false,
    hasDemoTapes: false,
    hasTShirts: false,
    hasBadges: false,
    hasPosters: false,
    hasVipPasses: false,
  }
}

const sanitizeBandInventoryOriginal = (value) => {
  const sanitized = { ...DEFAULT_BAND_STATE.inventory }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return sanitized

  const defaultInventory = DEFAULT_BAND_STATE.inventory
  for (const key of Object.keys(defaultInventory)) {
    const fallback = defaultInventory[key]
    const raw = value[key]

    if (typeof fallback === 'number') {
      const numeric =
        typeof raw === 'number'
          ? raw
          : typeof raw === 'string' && raw.trim().length > 0
            ? Number(raw)
            : Number.NaN
      sanitized[key] = Number.isFinite(numeric) ? numeric : fallback
      continue
    }

    if (typeof fallback === 'boolean') {
      sanitized[key] = typeof raw === 'boolean' ? raw : fallback
      continue
    }

    sanitized[key] = fallback
  }

  return sanitized
}

const sanitizeBandInventoryOptimized = (value) => {
  const sanitized = { ...DEFAULT_BAND_STATE.inventory }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return sanitized

  const defaultInventory = DEFAULT_BAND_STATE.inventory
  for (const key in defaultInventory) {
    const fallback = defaultInventory[key]
    const raw = value[key]

    if (typeof fallback === 'number') {
      const numeric =
        typeof raw === 'number'
          ? raw
          : typeof raw === 'string' && raw.trim().length > 0
            ? Number(raw)
            : Number.NaN
      sanitized[key] = Number.isFinite(numeric) ? numeric : fallback
      continue
    }

    if (typeof fallback === 'boolean') {
      sanitized[key] = typeof raw === 'boolean' ? raw : fallback
      continue
    }

    sanitized[key] = fallback
  }

  return sanitized
}

const payload = {
  stickers: 10,
  flyers: '20',
  demoTapes: null,
  hasStickers: true,
  unknownKey: 'ignored'
}

function runBenchmark(fn, iterations) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn(payload);
  }
  const end = performance.now();
  return end - start;
}

// Warmup
runBenchmark(sanitizeBandInventoryOriginal, 100000);
runBenchmark(sanitizeBandInventoryOptimized, 100000);

const iterations = 5000000;
const originalTime = runBenchmark(sanitizeBandInventoryOriginal, iterations);
const optimizedTime = runBenchmark(sanitizeBandInventoryOptimized, iterations);

console.log(`Original Time (${iterations} iterations): ${originalTime.toFixed(2)}ms`);
console.log(`Optimized Time (${iterations} iterations): ${optimizedTime.toFixed(2)}ms`);
const diff = originalTime - optimizedTime;
const percentage = (diff / originalTime) * 100;
console.log(`Improvement: ${diff.toFixed(2)}ms (${percentage.toFixed(2)}% faster)`);
