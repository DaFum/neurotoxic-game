import { performance } from 'perf_hooks';

// Simulate data
const numAssets = 10000;
const assets = [];
const foreclosedAssetIds = new Set();
for (let i = 0; i < numAssets; i++) {
    const kind = `kind_${i % 100}`;
    const id = `asset_${i}`;
    assets.push({ id, kind });
    if (i % 2 === 0) {
        foreclosedAssetIds.add(id);
    }
}

function baseline(stateAssets) {
    const foreclosedKinds = [];
    for (const asset of stateAssets || []) {
        if (
            foreclosedAssetIds.has(asset.id) &&
            !foreclosedKinds.includes(asset.kind)
        ) {
            foreclosedKinds.push(asset.kind);
        }
    }
    return foreclosedKinds;
}

function optimized(stateAssets) {
    const foreclosedKindsSet = new Set();
    const foreclosedKinds = [];
    if (stateAssets) {
        for (let i = 0, len = stateAssets.length; i < len; i++) {
            const asset = stateAssets[i];
            if (asset && foreclosedAssetIds.has(asset.id) && !foreclosedKindsSet.has(asset.kind)) {
                foreclosedKindsSet.add(asset.kind);
                foreclosedKinds.push(asset.kind);
            }
        }
    }
    return foreclosedKinds;
}

// Warmup
for (let i=0; i<100; i++) {
    baseline(assets);
    optimized(assets);
}

const iters = 1000;
let start = performance.now();
for (let i=0; i<iters; i++) {
    baseline(assets);
}
const baselineTime = performance.now() - start;

start = performance.now();
for (let i=0; i<iters; i++) {
    optimized(assets);
}
const optimizedTime = performance.now() - start;

console.log(`Baseline ops/sec: ${Math.round(iters / (baselineTime / 1000))}`);
console.log(`Optimized ops/sec: ${Math.round(iters / (optimizedTime / 1000))}`);
